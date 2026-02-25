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
        if (dbStatus === 'ended' || dbStatus === 'failed') {
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
            <div
                className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 px-6"
                dir="rtl"
                style={{ background: "radial-gradient(circle at 50% 15%, hsl(var(--primary) / 0.3), hsl(var(--background)) 65%)" }}
            >
                <div className="w-20 h-20 rounded-full bg-card/60 border border-border flex items-center justify-center">
                    <PhoneOff className="w-10 h-10 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-foreground">
                        {dbStatus === 'failed' ? 'تم رفض المكالمة' : 'انتهت المكالمة'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {dbStatus === 'failed' ? 'تم رفض المكالمة من قبل الطرف الآخر' : 'تم إنهاء المكالمة من قبل الطرف الآخر'}
                    </p>
                </div>
                <button
                    onClick={() => onEndCall?.()}
                    className="mt-4 px-8 py-3 rounded-2xl border border-primary/20 bg-card/70 hover:bg-card text-foreground font-semibold transition-colors"
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
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 border border-gold/40 bg-gold/15 backdrop-blur-sm text-foreground px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium safe-top"
                >
                    <WifiOff className="w-4 h-4 text-gold animate-pulse" />
                    جاري إعادة الاتصال...
                </motion.div>
            );
        }

        if (callState.isConnecting) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 border border-primary/30 bg-card/80 backdrop-blur-sm text-foreground px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium safe-top"
                >
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    جاري الاتصال...
                </motion.div>
            );
        }

        if (callState.error) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-destructive/15 border border-destructive/30 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-sm font-medium max-w-[90%] text-center safe-top"
                >
                    {callState.error}
                </motion.div>
            );
        }

        return null;
    };

    return (
        <div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: "radial-gradient(circle at 50% 12%, hsl(var(--primary) / 0.25), hsl(var(--background)) 58%)" }}
        >
            {renderStatusBadge()}

            <div className="flex-1 relative overflow-hidden">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,hsl(var(--primary)/0.18),hsl(var(--background)))]">
                        <div className="w-24 h-24 rounded-full bg-card/70 border border-border flex items-center justify-center shadow-lg">
                            <User className="w-12 h-12 text-primary" />
                        </div>
                        <p className="text-foreground/90 text-lg font-semibold" dir="rtl">
                            {otherUserName || 'في انتظار الطرف الآخر...'}
                        </p>
                        {!callState.isConnected && localStream && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                جاري الانتظار...
                            </div>
                        )}
                    </div>
                )}

                {localStream && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-6 right-4 w-28 h-40 rounded-2xl overflow-hidden shadow-2xl border border-primary/30 bg-card/40 z-20"
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
                            <div className="absolute inset-0 bg-card/90 flex items-center justify-center">
                                <VideoOff className="w-6 h-6 text-muted-foreground" />
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            <div className="shrink-0 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-center gap-6 bg-[linear-gradient(180deg,transparent,hsl(var(--background)/0.86)_35%,hsl(var(--background)))] backdrop-blur-sm">
                <motion.button
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${callState.isMuted
                        ? 'bg-destructive text-destructive-foreground border-destructive/60'
                        : 'bg-card/80 text-foreground border-border hover:bg-card'
                        }`}
                >
                    {callState.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>

                <motion.button
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-destructive hover:brightness-95 text-destructive-foreground flex items-center justify-center transition-all shadow-lg shadow-destructive/30"
                >
                    <PhoneOff className="w-7 h-7" />
                </motion.button>

                <motion.button
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${!callState.isVideoEnabled
                        ? 'bg-destructive text-destructive-foreground border-destructive/60'
                        : 'bg-card/80 text-foreground border-border hover:bg-card'
                        }`}
                >
                    {callState.isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </motion.button>
            </div>
        </div>
    );
}
