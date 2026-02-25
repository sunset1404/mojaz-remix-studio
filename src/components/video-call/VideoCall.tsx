import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, WifiOff, User } from 'lucide-react';
import { useVideoCall } from '@/hooks/useVideoCall';

interface VideoCallProps {
    roomId: string;
    role: 'caller' | 'callee';
    otherUserName?: string;
    onEndCall?: () => void;
    autoStartCall?: boolean;
}

export function VideoCall({ roomId, role, otherUserName, onEndCall, autoStartCall = false }: VideoCallProps) {
    const {
        localStream,
        remoteStream,
        callState,
        toggleMute,
        toggleVideo,
        endCall,
        dbStatus,
    } = useVideoCall({ roomId, role, autoStart: true });

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [showEndedScreen, setShowEndedScreen] = useState(false);

    // When the other side ends the call via DB, show ended screen
    useEffect(() => {
        if (dbStatus === 'ended') {
            setShowEndedScreen(true);
        }
    }, [dbStatus]);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleEndCall = () => {
        endCall();
        onEndCall?.();
    };

    // Call ended by other party screen
    if (showEndedScreen) {
        return (
            <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center gap-6 px-6" dir="rtl">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                    <PhoneOff className="w-10 h-10 text-red-400" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-white">انتهت المكالمة</h2>
                    <p className="text-white/60 text-sm">تم إنهاء المكالمة من قبل الطرف الآخر</p>
                </div>
                <button
                    onClick={() => onEndCall?.()}
                    className="mt-4 px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                    العودة
                </button>
            </div>
        );
    }

    // Connection status indicator
    const renderStatusBadge = () => {
        if (callState.isReconnecting) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium safe-top"
                >
                    <WifiOff className="w-4 h-4 animate-pulse" />
                    جاري إعادة الاتصال...
                </motion.div>
            );
        }

        if (callState.isConnecting) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-primary/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium safe-top"
                >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الاتصال...
                </motion.div>
            );
        }

        if (callState.error) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-destructive/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium max-w-[90%] text-center safe-top"
                >
                    {callState.error}
                </motion.div>
            );
        }

        return null;
    };

    return (
        <div className="absolute inset-0 bg-black z-50 flex flex-col">
            {/* Status badge */}
            {renderStatusBadge()}

            {/* Remote video (full screen) */}
            <div className="flex-1 relative overflow-hidden">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-700/50 flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-white/70 text-lg font-medium" dir="rtl">
                            {otherUserName || 'في انتظار الطرف الآخر...'}
                        </p>
                        {!callState.isConnected && localStream && (
                            <div className="flex items-center gap-2 text-white/50 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                جاري الانتظار...
                            </div>
                        )}
                    </div>
                )}

                {/* Local video (PiP) */}
                {localStream && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-6 right-4 w-28 h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20"
                    >
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover mirror"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        {!callState.isVideoEnabled && (
                            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                <VideoOff className="w-6 h-6 text-gray-400" />
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Controls - fixed at bottom with safe area */}
            <div className="shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-center gap-6">
                {/* Mute button */}
                <motion.button
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${callState.isMuted
                        ? 'bg-red-500/90 text-white'
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                        }`}
                >
                    {callState.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>

                {/* End call button */}
                <motion.button
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
                >
                    <PhoneOff className="w-7 h-7" />
                </motion.button>

                {/* Video toggle button */}
                <motion.button
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!callState.isVideoEnabled
                        ? 'bg-red-500/90 text-white'
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                        }`}
                >
                    {callState.isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </motion.button>
            </div>
        </div>
    );
}
