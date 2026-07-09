import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCManager } from '@/lib/webrtc/WebRTCManager';
import { SignalingService } from '@/lib/webrtc/SignalingService';
import { CallState, WebRTCSignal, VideoCallSession } from '@/types/video-call';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseVideoCallOptions {
    roomId: string;
    role: 'caller' | 'callee';
    autoStart?: boolean;
}

/**
 * useVideoCall - React hook for managing WebRTC video calls
 * Handles connection setup, media streams, call controls,
 * and automatic reconnection on disconnection.
 */
export function useVideoCall({ roomId, role, autoStart = false }: UseVideoCallOptions) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callState, setCallState] = useState<CallState>({
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        isMuted: false,
        isVideoEnabled: false,
        error: null,
    });
    const [dbStatus, setDbStatus] = useState<VideoCallSession['status']>('waiting');

    const webrtcManager = useRef<WebRTCManager | null>(null);
    const signalingService = useRef<SignalingService | null>(null);
    const dbChannel = useRef<RealtimeChannel | null>(null);
    const endedRef = useRef<boolean>(false);
    const initializedRef = useRef<boolean>(false);
    const { toast } = useToast();

    // Handle incoming WebRTC signals
    const handleSignal = useCallback(async (signal: WebRTCSignal) => {
        if (!webrtcManager.current) {
            console.error('WebRTC manager not initialized!');
            return;
        }

        try {
            switch (signal.type) {
                case 'ready':
                    if (role === 'caller') {
                        console.log('Received ready signal from callee. Sending offer...');
                        const offer = await webrtcManager.current.createOffer();
                        await signalingService.current?.sendSignal({ type: 'offer', data: offer });
                        toast({
                            title: 'جاري إنهاء الاتصال',
                            description: 'تم ربط الطرفين، جاري الاتصال...',
                        });
                    }
                    break;

                case 'offer':
                    console.log('Received offer. Creating answer...');
                    await webrtcManager.current.setRemoteDescription(signal.data as RTCSessionDescriptionInit);
                    const answer = await webrtcManager.current.createAnswer();
                    await signalingService.current?.sendSignal({ type: 'answer', data: answer });
                    break;

                case 'answer':
                    console.log('Received answer. Setting remote description...');
                    await webrtcManager.current.setRemoteDescription(signal.data as RTCSessionDescriptionInit);
                    break;

                case 'ice-candidate':
                    await webrtcManager.current.addIceCandidate(signal.data as RTCIceCandidateInit);
                    break;
            }
        } catch (error) {
            console.error('Error handling signal:', error);
            setCallState(prev => ({ ...prev, error: 'فشل في معالجة إشارة الاتصال' }));
        }
    }, []);

    // Initialize WebRTC and signaling
    const initialize = useCallback(async () => {
        try {
            setCallState(prev => ({ ...prev, isConnecting: true, error: null }));

            webrtcManager.current = new WebRTCManager(
                // On remote stream
                (stream) => {
                    console.log('Remote stream received');
                    setRemoteStream(stream);
                },
                // On ICE candidate
                async (candidate) => {
                    await signalingService.current?.sendSignal({
                        type: 'ice-candidate',
                        data: candidate.toJSON(),
                    });
                },
                // On connection state change
                (state) => {
                    console.log('Connection state:', state);

                    if (state === 'disconnected') {
                        setCallState(prev => ({
                            ...prev,
                            isReconnecting: true,
                            isConnected: false,
                            error: null,
                        }));
                        toast({
                            title: 'انقطع الاتصال',
                            description: 'جاري إعادة الاتصال تلقائياً...',
                        });
                    } else if (state === 'connected') {
                        setCallState(prev => ({
                            ...prev,
                            isConnected: true,
                            isConnecting: false,
                            isReconnecting: false,
                            error: null,
                        }));
                    } else if (state === 'failed') {
                        setCallState(prev => ({
                            ...prev,
                            isConnected: false,
                            isConnecting: false,
                            isReconnecting: false,
                            error: 'فشل الاتصال. يرجى المحاولة مرة أخرى',
                        }));
                    } else {
                        setCallState(prev => ({
                            ...prev,
                            isConnecting: state === 'connecting',
                        }));
                    }
                },
                // On needs re-offer (ICE restart)
                async (offer) => {
                    console.log('Sending ICE restart offer...');
                    try {
                        await signalingService.current?.sendSignal({ type: 'offer', data: offer });
                    } catch (error) {
                        console.error('Failed to send ICE restart offer:', error);
                    }
                }
            );

            await webrtcManager.current.initialize();

            // Get local media stream with fallback
            let stream: MediaStream | null = null;
            try {
                stream = await webrtcManager.current.startLocalStream();
            } catch (mediaError: any) {
                console.warn('Failed to get video+audio, trying audio only:', mediaError);
                try {
                    stream = await webrtcManager.current.startLocalStream({
                        video: false,
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                    });
                    setCallState(prev => ({ ...prev, isVideoEnabled: false }));
                    toast({
                        title: 'تنبيه',
                        description: 'لم يتم العثور على كاميرا، تم تفعيل الصوت فقط',
                    });
                } catch (audioError: any) {
                    console.warn('Failed to get any media, proceeding without local stream:', audioError);
                    setCallState(prev => ({ ...prev, isVideoEnabled: false, isMuted: true }));
                    toast({
                        title: 'تنبيه',
                        description: 'لم يتم العثور على كاميرا أو ميكروفون، يمكنك مشاهدة الطرف الآخر فقط',
                    });
                }
            }
            if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.enabled = false; // camera off by default
                    setCallState(prev => ({ ...prev, isVideoEnabled: false }));
                }
                setLocalStream(stream);
            }

            // Initialize signaling
            signalingService.current = new SignalingService(roomId, role, handleSignal);
            await signalingService.current.connect();

            if (role === 'callee') {
                console.log('We are the callee. Sending ready signal to trigger caller offer...');
                await signalingService.current.sendSignal({ type: 'ready' });
            }

            // Initialize DB Realtime Listener for true cross-device status sync
            dbChannel.current = supabase.channel(`session:${roomId}`);
            dbChannel.current.on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'video_call_sessions',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    const newStatus = payload.new.status as VideoCallSession['status'];
                    console.log('DB Session status updated via Realtime:', newStatus);
                    setDbStatus(newStatus);

                    if (newStatus === 'ended' || newStatus === 'failed') {
                        toast({
                            title: newStatus === 'failed' ? 'تم رفض المكالمة' : 'انتهت المكالمة',
                            description: newStatus === 'failed' ? 'تم رفض المكالمة من قبل الطرف الآخر' : 'تم إنهاء المكالمة من قبل الطرف الآخر',
                        });
                        endCall();
                    }
                }
            ).subscribe();

            setCallState(prev => ({ ...prev, isConnecting: false }));

            toast({
                title: 'جاهز للمكالمة',
                description: 'تم تفعيل الميكروفون. الكاميرا مغلقة افتراضياً',
            });
        } catch (error: any) {
            console.error('Error initializing video call:', error);

            let errorMessage = 'فشل في بدء المكالمة';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'يرجى السماح بالوصول إلى الكاميرا والميكروفون';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'لم يتم العثور على كاميرا أو ميكروفون';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'الكاميرا أو الميكروفون قيد الاستخدام من قبل تطبيق آخر';
            }

            setCallState(prev => ({ ...prev, isConnecting: false, error: errorMessage }));
            toast({
                title: 'خطأ',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    }, [roomId, role, handleSignal, toast]);

    // Start call (create offer) - typically called by the initiator
    const startCall = useCallback(async () => {
        if (!webrtcManager.current || !signalingService.current) {
            await initialize();
        }

        try {
            if (!webrtcManager.current) {
                throw new Error('WebRTC manager not initialized');
            }

            const offer = await webrtcManager.current.createOffer();
            await signalingService.current!.sendSignal({ type: 'offer', data: offer });

            toast({
                title: 'جاري الاتصال',
                description: 'في انتظار انضمام الطرف الآخر...',
            });
        } catch (error) {
            console.error('Error starting call:', error);
            toast({
                title: 'خطأ',
                description: 'فشل في بدء المكالمة',
                variant: 'destructive',
            });
        }
    }, [initialize, toast]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (webrtcManager.current) {
            const isMuted = webrtcManager.current.toggleMute();
            setCallState(prev => ({ ...prev, isMuted }));
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (webrtcManager.current) {
            const isVideoEnabled = webrtcManager.current.toggleVideo();
            setCallState(prev => ({ ...prev, isVideoEnabled }));
        }
    }, []);

    // Switch camera (front/back)
    const switchCamera = useCallback(async () => {
        if (webrtcManager.current) {
            await webrtcManager.current.switchCamera();
            const stream = (webrtcManager.current as any).localStream as MediaStream | null;
            if (stream) setLocalStream(new MediaStream(stream.getTracks()));
        }
    }, []);

    // End call
    const endCall = useCallback(async () => {
        webrtcManager.current?.cleanup();
        await signalingService.current?.disconnect();

        setLocalStream(null);
        setRemoteStream(null);
        setCallState({
            isConnected: false,
            isConnecting: false,
            isReconnecting: false,
            isMuted: false,
            isVideoEnabled: false,
            error: null,
        });

        if (dbChannel.current) {
            await supabase.removeChannel(dbChannel.current);
            dbChannel.current = null;
        }

        webrtcManager.current = null;
        signalingService.current = null;
    }, []);

    // Auto-start if enabled
    useEffect(() => {
        if (autoStart) {
            initialize();
        }

        return () => {
            endCall();
        };
    }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        localStream,
        remoteStream,
        callState,
        startCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        endCall,
        initialize,
        dbStatus,
    };
}
