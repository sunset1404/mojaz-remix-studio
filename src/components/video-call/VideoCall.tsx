import { useEffect, useRef } from 'react';
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
        startCall,
        toggleMute,
        toggleVideo,
        endCall,
        initialize,
        dbStatus,
    } = useVideoCall({ roomId, role, autoStart: true });

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

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

    // Connection status indicator
    const renderStatusBadge = () => {
        if (callState.isReconnecting) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium"
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
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-primary/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium"
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
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-destructive/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium max-w-[90%] text-center"
                >
                    {callState.error}
                </motion.div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Status badge */}
            {renderStatusBadge()}

            {/* Remote video (full screen) */}
            <div className="flex-1 relative">
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

            {/* Controls */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-t from-black/90 to-transparent px-6 py-8 flex items-center justify-center gap-6"
            >
                {/* Mute button */}
                <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${callState.isMuted
                        ? 'bg-red-500/90 text-white'
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                        }`}
                >
                    {callState.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* End call button */}
                <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
                >
                    <PhoneOff className="w-7 h-7" />
                </button>

                {/* Video toggle button */}
                <button
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!callState.isVideoEnabled
                        ? 'bg-red-500/90 text-white'
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                        }`}
                >
                    {callState.isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
            </motion.div>
        </div>
    );
}
