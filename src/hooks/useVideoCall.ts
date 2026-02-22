import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCManager } from '@/lib/webrtc/WebRTCManager';
import { SignalingService } from '@/lib/webrtc/SignalingService';
import { CallState, WebRTCSignal } from '@/types/video-call';
import { useToast } from '@/hooks/use-toast';

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
        isVideoEnabled: true,
        error: null,
    });

    const webrtcManager = useRef<WebRTCManager | null>(null);
    const signalingService = useRef<SignalingService | null>(null);
    const { toast } = useToast();

    // Handle incoming WebRTC signals
    const handleSignal = useCallback(async (signal: WebRTCSignal) => {
        if (!webrtcManager.current) {
            console.error('WebRTC manager not initialized!');
            return;
        }

        try {
            switch (signal.type) {
                case 'offer':
                    await webrtcManager.current.setRemoteDescription(signal.data as RTCSessionDescriptionInit);
                    const answer = await webrtcManager.current.createAnswer();
                    await signalingService.current?.sendSignal({ type: 'answer', data: answer });
                    break;

                case 'answer':
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

            // Get local media stream
            const stream = await webrtcManager.current.startLocalStream();
            setLocalStream(stream);

            // Initialize signaling
            signalingService.current = new SignalingService(roomId, role, handleSignal);
            await signalingService.current.connect();

            setCallState(prev => ({ ...prev, isConnecting: false }));

            toast({
                title: 'جاهز للمكالمة',
                description: 'تم تفعيل الكاميرا والميكروفون بنجاح',
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
            isVideoEnabled: true,
            error: null,
        });

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
        endCall,
        initialize,
    };
}
