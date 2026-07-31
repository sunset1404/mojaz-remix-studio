import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCManager } from '@/lib/webrtc/WebRTCManager';
import { CallDiagnostics } from '@/lib/webrtc/CallDiagnostics';
import { SignalingService } from '@/lib/webrtc/SignalingService';
import { MediaWatchdog, probeFromPeerConnection, type StallReport } from '@/lib/webrtc/MediaWatchdog';
import {
    credentialsExpiringSoon,
    fetchTurnCredentials,
    mergeIceServers,
    type TurnFetchOutcome,
} from '@/lib/webrtc/iceServers';

import { CallSignalingState, CallState, VideoCallSession } from '@/types/video-call';
import { useToast } from '@/hooks/use-toast';

interface UseVideoCallOptions {
    roomId: string;
    role: 'caller' | 'callee';
    autoStart?: boolean;
    /** Reciters must always publish video; students may keep the camera off. */
    requireVideo?: boolean;
    /** Public call-link token, used to authorize TURN credentials without a session. */
    linkToken?: string | null;
}

const INITIAL_CALL_STATE: CallState = {
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    isMuted: false,
    isVideoEnabled: false,
    error: null,
    connectivityDegraded: false,
    cameraUnavailable: false,
    isRecoveringMedia: false,
};


/**
 * Owns the media connection and the durable Supabase-backed negotiation state.
 * Critical SDP is stored in Postgres; Realtime only accelerates state delivery.
 */
export function useVideoCall({
    roomId,
    role,
    autoStart = false,
    requireVideo = false,
    linkToken = null,
}: UseVideoCallOptions) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callState, setCallState] = useState<CallState>(INITIAL_CALL_STATE);
    const [dbStatus, setDbStatus] = useState<VideoCallSession['status']>('waiting');

    const webrtcManager = useRef<WebRTCManager | null>(null);
    const signalingService = useRef<SignalingService | null>(null);
    const diagnostics = useRef<CallDiagnostics | null>(null);
    const watchdog = useRef<MediaWatchdog | null>(null);

    const endedRef = useRef(false);
    const initializedRef = useRef(false);
    const localMediaReadyRef = useRef(false);
    const latestGenerationRef = useRef(0);
    const offerPublishingGenerationRef = useRef(0);
    const offerAppliedGenerationRef = useRef(0);
    const answerAppliedGenerationRef = useRef(0);
    const answerPublishingGenerationRef = useRef(0);
    const processingRef = useRef<Promise<void>>(Promise.resolve());
    const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const endCallRef = useRef<() => Promise<void>>(async () => {});
    const turnExpiresAtRef = useRef<string | null>(null);
    const playbackBlockedRef = useRef(false);
    const requireVideoRef = useRef(requireVideo);
    requireVideoRef.current = requireVideo;
    const { toast } = useToast();

    /**
     * TURN is best-effort: a failure never blocks the call, it only marks the
     * connection as degraded and records why in diagnostics.
     */
    const loadIceServers = useCallback(async (reason: 'initial' | 'ice_restart'): Promise<RTCIceServer[]> => {
        let outcome: TurnFetchOutcome;
        try {
            outcome = await fetchTurnCredentials({ roomId, linkToken });
        } catch {
            turnExpiresAtRef.current = null;
            void diagnostics.current?.record('turn_credentials_unavailable', 'warning', { reason }, true);
            return mergeIceServers([]);
        }

        turnExpiresAtRef.current = outcome.expiresAt;
        void diagnostics.current?.record(
            outcome.turnAvailable ? 'turn_credentials_obtained' : 'turn_credentials_unavailable',
            outcome.turnAvailable ? 'info' : 'warning',
            {
                reason,
                errorCode: outcome.errorCode,
                latencyMs: outcome.latencyMs,
                urlCount: outcome.urlCount,
                protocols: outcome.protocols,
                expiresAt: outcome.expiresAt,
            },
            true,
        );
        setCallState(prev => ({ ...prev, connectivityDegraded: !outcome.turnAvailable }));
        return outcome.iceServers;
    }, [linkToken, roomId]);


    const clearConnectionTimeout = useCallback(() => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
    }, []);

    const ensureConnectionTimeout = useCallback(() => {
        if (connectionTimeoutRef.current) return;
        connectionTimeoutRef.current = setTimeout(() => {
            if (webrtcManager.current?.getConnectionState() !== 'connected') {
                setCallState(prev => ({
                    ...prev,
                    isConnecting: false,
                    isReconnecting: false,
                    error: 'تعذر إكمال الاتصال. تحقق من الشبكة ثم أعد المحاولة',
                }));
            }
        }, 30_000);
    }, []);

    const processSignalingState = useCallback(async (snapshot: CallSignalingState) => {
        setDbStatus(snapshot.status);

        if ((snapshot.status === 'ended' || snapshot.status === 'failed') && !endedRef.current) {
            toast({
                title: snapshot.status === 'failed' ? 'تم رفض المكالمة' : 'انتهت المكالمة',
                description: snapshot.status === 'failed'
                    ? 'تم رفض المكالمة أو تعذر إكمالها'
                    : 'تم إنهاء المكالمة من الطرف الآخر',
            });
            await endCallRef.current();
            return;
        }

        if (!localMediaReadyRef.current || !webrtcManager.current || !signalingService.current) return;
        if (snapshot.signaling_generation < latestGenerationRef.current) return;
        latestGenerationRef.current = snapshot.signaling_generation;

        const bothReady = Boolean(snapshot.caller_ready_at && snapshot.callee_ready_at);
        if (!bothReady) return;
        ensureConnectionTimeout();

        const generation = snapshot.signaling_generation;
        if (role === 'caller') {
            const hasCurrentOffer = snapshot.offer_generation === generation && Boolean(snapshot.offer_sdp);
            if (!hasCurrentOffer && offerPublishingGenerationRef.current < generation) {
                offerPublishingGenerationRef.current = generation;
                console.log(`Creating durable offer for generation ${generation}`);
                const offer = await webrtcManager.current.createOffer();
                await signalingService.current.publishOffer(offer, generation);
                return;
            }

            // A durable offer exists but this browser instance did not create it
            // (for example after a caller page reload). A new peer connection
            // cannot safely reuse the previous instance's local SDP, so start a
            // new generation and let the callee answer it.
            if (hasCurrentOffer && offerPublishingGenerationRef.current < generation) {
                offerPublishingGenerationRef.current = generation + 1;
                console.log(`Replacing stale local offer from generation ${generation}`);
                const replacementOffer = await webrtcManager.current.createOffer();
                await signalingService.current.publishRestartOffer(replacementOffer);
                return;
            }

            const hasCurrentAnswer = snapshot.answer_generation === generation && Boolean(snapshot.answer_sdp);
            if (hasCurrentAnswer && answerAppliedGenerationRef.current < generation) {
                console.log(`Applying durable answer for generation ${generation}`);
                await webrtcManager.current.setRemoteDescription(snapshot.answer_sdp!);
                answerAppliedGenerationRef.current = generation;
            }
            return;
        }

        const hasCurrentOffer = snapshot.offer_generation === generation && Boolean(snapshot.offer_sdp);
        if (hasCurrentOffer && offerAppliedGenerationRef.current < generation) {
            offerAppliedGenerationRef.current = generation;
            console.log(`Applying durable offer for generation ${generation}`);
            await webrtcManager.current.setRemoteDescription(snapshot.offer_sdp!);

            if (answerPublishingGenerationRef.current < generation) {
                answerPublishingGenerationRef.current = generation;
                const answer = await webrtcManager.current.createAnswer();
                await signalingService.current.publishAnswer(answer, generation);
            }
        }
    }, [ensureConnectionTimeout, role, toast]);

    const enqueueSignalingState = useCallback((snapshot: CallSignalingState) => {
        processingRef.current = processingRef.current
            .catch(error => console.error('Previous signaling operation failed:', error))
            .then(() => processSignalingState(snapshot))
            .catch(error => {
                console.error('Durable signaling failed:', error);
                void diagnostics.current?.recordFailure('signaling_operation_failed', error, {
                    signalingGeneration: snapshot.signaling_generation,
                    sessionStatus: snapshot.status,
                });
                setCallState(prev => ({
                    ...prev,
                    isConnecting: false,
                    isReconnecting: false,
                    error: 'فشل في التفاوض على الاتصال. يرجى إعادة المحاولة',
                }));
                void signalingService.current?.updateConnectionState('failed', 'signaling_failed');
            });
    }, [processSignalingState]);

    const initialize = useCallback(async () => {
        if (initializedRef.current) return;
        initializedRef.current = true;
        endedRef.current = false;
        let initializationStage = 'turn_credentials';

        try {
            setCallState(prev => ({ ...prev, isConnecting: true, error: null }));

            // Diagnostics exist before the peer connection so TURN acquisition
            // problems are recorded even when the call never starts.
            diagnostics.current = new CallDiagnostics(
                () => webrtcManager.current?.getPeerConnection() ?? null,
                roomId,
                role,
            );
            const iceServers = await loadIceServers('initial');

            initializationStage = 'peer_connection';
            webrtcManager.current = new WebRTCManager(

                (stream) => {
                    console.log('Remote stream received:', stream.getTracks().map(track => track.kind));
                    setRemoteStream(stream);
                    void diagnostics.current?.recordRemoteMedia(stream);
                },
                (state) => {
                    console.log('Peer connection state:', state);
                    if (state === 'connected') {
                        clearConnectionTimeout();
                        setCallState(prev => ({
                            ...prev,
                            isConnected: true,
                            isConnecting: false,
                            isReconnecting: false,
                            error: null,
                        }));
                    } else if (state === 'disconnected') {
                        setCallState(prev => ({
                            ...prev,
                            isConnected: false,
                            isReconnecting: true,
                            error: null,
                        }));
                    } else if (state === 'failed') {
                        setCallState(prev => ({
                            ...prev,
                            isConnected: false,
                            isConnecting: false,
                            isReconnecting: role === 'caller',
                            error: role === 'caller' ? null : 'فشل الاتصال. في انتظار إعادة المحاولة',
                        }));
                    } else {
                        setCallState(prev => ({
                            ...prev,
                            isConnecting: state === 'connecting' || state === 'new',
                        }));
                    }
                    if (state === 'failed' || state === 'disconnected') {
                        void diagnostics.current?.flush(state);
                    }
                    const failureCode = state === 'failed'
                        ? (diagnostics.current?.getLastSnapshot()?.verdict ?? 'ice_failed')
                        : undefined;
                    void signalingService.current
                        ?.updateConnectionState(state, failureCode)
                        .catch(error => console.warn('Failed to persist connection state:', error));

                },
                async (offer) => {
                    if (role !== 'caller') return;
                    try {
                        console.log('Publishing durable ICE restart offer');
                        offerPublishingGenerationRef.current = Math.max(
                            offerPublishingGenerationRef.current,
                            latestGenerationRef.current + 1,
                        );
                        await signalingService.current?.publishRestartOffer(offer);
                    } catch (error) {
                        console.error('Failed to publish restart offer:', error);
                        setCallState(prev => ({ ...prev, isReconnecting: false, error: 'فشلت إعادة الاتصال' }));
                    }
                },
                role === 'caller',
                iceServers,
                // Refresh short-lived TURN credentials right before re-gathering.
                async () => {
                    if (!credentialsExpiringSoon(turnExpiresAtRef.current)) return null;
                    return await loadIceServers('ice_restart');
                },
            );
            await webrtcManager.current.initialize();

            // Capture the real reason a call degrades (one-way audio, blocked RTP,
            // ICE failure) instead of guessing that a TURN server is required.
            diagnostics.current.start();




            // Subscribe before media permission prompts. Durable state plus a post-subscribe
            // read means accepting quickly can no longer lose the handshake.
            initializationStage = 'signaling_connect';
            signalingService.current = new SignalingService(roomId, role, enqueueSignalingState);
            const initialSnapshot = await signalingService.current.connect();
            enqueueSignalingState(initialSnapshot);

            initializationStage = 'media_capture';
            let stream: MediaStream;
            let captureMode: 'audio_video' | 'audio_only_fallback' = 'audio_video';
            try {
                stream = await webrtcManager.current.startLocalStream();
            } catch (mediaError) {
                console.warn('Video + audio unavailable; trying audio only:', mediaError);
                void diagnostics.current?.recordMediaCaptureFailure(mediaError, 'audio_video');
                captureMode = 'audio_only_fallback';
                try {
                    stream = await webrtcManager.current.startLocalStream({
                        video: false,
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                    });
                } catch (audioError) {
                    await diagnostics.current?.recordMediaCaptureFailure(audioError, 'audio_only_fallback');
                    throw audioError;
                }
                toast({ title: 'تنبيه', description: 'تعذر تشغيل الكاميرا، وتم تفعيل الصوت فقط' });
            }
            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack || audioTrack.readyState !== 'live') {
                stream.getTracks().forEach(track => track.stop());
                throw new DOMException('A working microphone is required', 'NotFoundError');
            }
            audioTrack.enabled = true;
            audioTrack.addEventListener('ended', () => {
                setCallState(prev => ({ ...prev, isMuted: true, error: 'توقف الميكروفون. أعد الانضمام للمكالمة' }));
            });
            audioTrack.addEventListener('mute', () => {
                console.warn('Local microphone track muted by device/browser');
            });
            audioTrack.addEventListener('unmute', () => {
                console.log('Local microphone track unmuted');
            });

            // Reciters must be visible; students keep the camera off until they choose.
            const videoTrack = stream.getVideoTracks()[0];
            const videoOn = requireVideo && Boolean(videoTrack);
            if (videoTrack) videoTrack.enabled = videoOn;
            setLocalStream(stream);
            setCallState(prev => ({
                ...prev,
                isVideoEnabled: videoOn,
                isMuted: false,
                cameraUnavailable: requireVideo && !videoTrack,
            }));
            if (requireVideo && !videoTrack) {
                void diagnostics.current?.record('camera_required_but_unavailable', 'critical', {
                    captureMode,
                }, true);
            }
            void diagnostics.current?.recordLocalMedia(stream, captureMode);
            localMediaReadyRef.current = true;
            startWatchdog();


            initializationStage = 'mark_ready';
            const readySnapshot = await signalingService.current.markReady();
            enqueueSignalingState(readySnapshot);
            initializationStage = 'complete';
            toast({
                title: 'جاهز للمكالمة',
                description: 'الميكروفون يعمل. في انتظار اكتمال اتصال الطرف الآخر',
            });
        } catch (error: unknown) {
            console.error('Error initializing video call:', error);
            initializedRef.current = false;
            localMediaReadyRef.current = false;
            await diagnostics.current?.recordFailure('call_initialization_failed', error, {
                stage: initializationStage,
            });
            diagnostics.current?.stop();
            diagnostics.current = null;
            webrtcManager.current?.cleanup();
            await signalingService.current?.disconnect().catch(disconnectError => {
                console.warn('Failed to clean up signaling after initialization error:', disconnectError);
            });
            webrtcManager.current = null;
            signalingService.current = null;
            setLocalStream(null);
            setRemoteStream(null);

            let errorMessage = 'فشل في بدء المكالمة';
            const errorName = error instanceof Error || error instanceof DOMException ? error.name : '';
            if (errorName === 'NotAllowedError') {
                errorMessage = 'يرجى السماح بالوصول إلى الميكروفون والكاميرا';
            } else if (errorName === 'NotFoundError') {
                errorMessage = 'لم يتم العثور على ميكروفون يعمل';
            } else if (errorName === 'NotReadableError') {
                errorMessage = 'الميكروفون أو الكاميرا مستخدم في تطبيق آخر';
            }
            setCallState(prev => ({ ...prev, isConnecting: false, error: errorMessage }));
            toast({ title: 'خطأ', description: errorMessage, variant: 'destructive' });
        }
    }, [clearConnectionTimeout, enqueueSignalingState, role, roomId, toast]);

    const retryCall = useCallback(async () => {
        if (!initializedRef.current || !webrtcManager.current || !signalingService.current) {
            await initialize();
            return;
        }
        setCallState(prev => ({ ...prev, isConnecting: true, isReconnecting: true, error: null }));
        clearConnectionTimeout();
        ensureConnectionTimeout();
        if (role === 'caller') {
            await webrtcManager.current?.restartIce();
        } else {
            const snapshot = await signalingService.current?.refresh();
            if (snapshot) enqueueSignalingState(snapshot);
        }
    }, [clearConnectionTimeout, enqueueSignalingState, ensureConnectionTimeout, initialize, role]);

    const toggleMute = useCallback(() => {
        if (!webrtcManager.current) return;
        const isMuted = webrtcManager.current.toggleMute();
        setCallState(prev => ({ ...prev, isMuted }));
    }, []);

    const toggleVideo = useCallback(() => {
        if (!webrtcManager.current) return;
        const isVideoEnabled = webrtcManager.current.toggleVideo();
        setCallState(prev => ({ ...prev, isVideoEnabled }));
    }, []);

    const switchCamera = useCallback(async () => {
        if (!webrtcManager.current) return;
        await webrtcManager.current.switchCamera();
        const stream = webrtcManager.current.getCurrentLocalStream();
        if (stream) setLocalStream(new MediaStream(stream.getTracks()));
    }, []);

    const reportRemoteAudioPlayback = useCallback((
        state: 'started' | 'blocked' | 'failed',
        details: Record<string, unknown> = {},
    ) => {
        void diagnostics.current?.recordPlayback(state, details);
    }, []);

    const reportVideoPlayback = useCallback((
        source: 'local' | 'remote',
        state: 'started' | 'failed',
        details: Record<string, unknown> = {},
    ) => {
        void diagnostics.current?.recordVideoPlayback(source, state, details);
    }, []);

    const endCall = useCallback(async () => {
        if (endedRef.current) return;
        endedRef.current = true;
        initializedRef.current = false;
        localMediaReadyRef.current = false;
        clearConnectionTimeout();

        await diagnostics.current?.flush('call_ended').catch(() => {});
        diagnostics.current?.stop();
        diagnostics.current = null;

        webrtcManager.current?.cleanup();
        await signalingService.current?.disconnect();
        webrtcManager.current = null;
        signalingService.current = null;


        setLocalStream(null);
        setRemoteStream(null);
        setCallState(INITIAL_CALL_STATE);
    }, [clearConnectionTimeout]);
    endCallRef.current = endCall;

    useEffect(() => {
        const handleOnline = () => {
            if (role === 'caller') void retryCall();
        };
        const handleOffline = () => {
            setCallState(prev => ({ ...prev, isConnected: false, isReconnecting: true }));
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [retryCall, role]);

    useEffect(() => {
        if (autoStart) void initialize();
        return () => { void endCall(); };
    }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        localStream,
        remoteStream,
        callState,
        startCall: initialize,
        retryCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        reportRemoteAudioPlayback,
        reportVideoPlayback,
        endCall,
        initialize,
        dbStatus,
    };
}
