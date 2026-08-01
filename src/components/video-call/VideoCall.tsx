import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, WifiOff, User, SwitchCamera, Volume2 } from 'lucide-react';
import { useVideoCall } from '@/hooks/useVideoCall';
import { useReciterAvailability } from '@/contexts/ReciterAvailabilityContext';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface VideoCallProps {
    roomId: string;
    role: 'caller' | 'callee';
    otherUserName?: string;
    onEndCall?: () => void;
    onOtherPartyEnded?: () => void;
    autoStartCall?: boolean;
    confirmOnEnd?: boolean;
    extraControls?: React.ReactNode;
    /** Reciters must publish video; students may stay audio-only. */
    requireVideo?: boolean;
    /** Public call-link token, forwarded so TURN credentials can be authorized. */
    linkToken?: string | null;
}

export function VideoCall({ roomId, role, otherUserName, onEndCall, onOtherPartyEnded, autoStartCall = false, confirmOnEnd = false, extraControls, requireVideo = false, linkToken = null }: VideoCallProps) {
    const { setCallBusy } = useReciterAvailability();
    const {
        localStream,
        remoteStream,
        callState,
        toggleMute,
        toggleVideo,
        switchCamera,
        retryCamera,
        manualReconnect,

        reportRemoteAudioPlayback,
        reportVideoPlayback,
        retryCall,
        endCall,
        dbStatus,
    } = useVideoCall({ roomId, role, autoStart: true, requireVideo, linkToken });


    const pipVideoRef = useRef<HTMLVideoElement>(null);
    const mainVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const [showEndedScreen, setShowEndedScreen] = useState(false);
    const [swapped, setSwapped] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);

    useEffect(() => {
        setCallBusy(true);
        return () => setCallBusy(false);
    }, [setCallBusy]);

    // When the other side ends the call via DB, show ended screen
    useEffect(() => {
        if (dbStatus === 'ended' || dbStatus === 'failed') {
            setShowEndedScreen(true);
        }
    }, [dbStatus]);

    // Attach streams based on swap state: main = remote by default, pip = local
    useEffect(() => {
        const mainStream = swapped ? localStream : remoteStream;
        const pipStream = swapped ? remoteStream : localStream;

        const assign = (el: HTMLVideoElement | null, s: MediaStream | null) => {
            if (!el) return;
            if (el.srcObject !== s) {
                el.srcObject = s || null;
            }
            if (s) {
                const source = s === remoteStream ? 'remote' : 'local';
                const p = el.play();
                if (p && typeof (p as Promise<void>).catch === 'function') {
                    (p as Promise<void>)
                        .then(() => reportVideoPlayback(source, 'started', {
                            paused: el.paused,
                            muted: el.muted,
                            readyState: el.readyState,
                            videoTracks: s.getVideoTracks().length,
                        }))
                        .catch((error) => {
                            console.warn('video.play() blocked:', error);
                            reportVideoPlayback(source, 'failed', {
                                errorName: error instanceof Error ? error.name : 'UnknownError',
                                errorMessage: error instanceof Error ? error.message : String(error),
                                paused: el.paused,
                                muted: el.muted,
                                readyState: el.readyState,
                                videoTracks: s.getVideoTracks().length,
                            });
                        });
                }
            }
        };

        assign(mainVideoRef.current, mainStream);
        assign(pipVideoRef.current, pipStream);

        // Re-assign / replay when remote adds a new track after initial srcObject was set
        if (!remoteStream) return;
        const onAddTrack = () => {
            assign(mainVideoRef.current, swapped ? localStream : remoteStream);
            assign(pipVideoRef.current, swapped ? remoteStream : localStream);
        };
        remoteStream.addEventListener('addtrack', onAddTrack);
        return () => remoteStream.removeEventListener('addtrack', onAddTrack);
    }, [localStream, remoteStream, swapped, reportVideoPlayback]);

    // Remote sound has its own element and never follows the video swap/mute state.
    // This prevents moving the student into PiP from muting the student's voice.
    useEffect(() => {
        const audio = remoteAudioRef.current;
        if (!audio) return;
        audio.srcObject = remoteStream;
        setAudioPlaybackBlocked(false);
        if (!remoteStream) return;

        const play = () => {
            if (remoteStream.getAudioTracks().length === 0) return;
            const result = audio.play();
            if (result && typeof result.catch === 'function') {
                result
                    .then(() => {
                        setAudioPlaybackBlocked(false);
                        reportRemoteAudioPlayback('started', {
                            paused: audio.paused,
                            muted: audio.muted,
                            volume: audio.volume,
                            readyState: audio.readyState,
                            remoteAudioTracks: remoteStream.getAudioTracks().length,
                        });
                    })
                    .catch((error) => {
                        console.warn('Remote audio playback blocked:', error);
                        const blocked = error instanceof Error && error.name === 'NotAllowedError';
                        setAudioPlaybackBlocked(blocked);
                        reportRemoteAudioPlayback(blocked ? 'blocked' : 'failed', {
                            errorName: error instanceof Error ? error.name : 'UnknownError',
                            errorMessage: error instanceof Error ? error.message : String(error),
                            paused: audio.paused,
                            muted: audio.muted,
                            volume: audio.volume,
                            readyState: audio.readyState,
                            remoteAudioTracks: remoteStream.getAudioTracks().length,
                        });
                    });
            }
        };
        const handleTrack = (event: MediaStreamTrackEvent) => {
            if (event.track.kind === 'audio') {
                event.track.addEventListener('unmute', play);
                play();
            }
        };

        remoteStream.addEventListener('addtrack', handleTrack);
        remoteStream.getAudioTracks().forEach(track => track.addEventListener('unmute', play));
        play();

        return () => {
            remoteStream.removeEventListener('addtrack', handleTrack);
            remoteStream.getAudioTracks().forEach(track => track.removeEventListener('unmute', play));
        };
    }, [remoteStream, reportRemoteAudioPlayback]);

    const enableRemoteAudio = () => {
        remoteAudioRef.current?.play()
            .then(() => {
                setAudioPlaybackBlocked(false);
                reportRemoteAudioPlayback('started', { source: 'user_gesture_retry' });
            })
            .catch(error => {
                console.warn('Remote audio remains blocked:', error);
                reportRemoteAudioPlayback('failed', {
                    source: 'user_gesture_retry',
                    errorName: error instanceof Error ? error.name : 'UnknownError',
                    errorMessage: error instanceof Error ? error.message : String(error),
                });
            });
    };

    // Ringback tone: play a phone-like ringing sound for the caller while waiting for the other party
    useEffect(() => {
        if (role !== 'caller') return;
        if (remoteStream || callState.isConnected || showEndedScreen) return;

        let ctx: AudioContext | null = null;
        let intervalId: number | null = null;
        let stopped = false;

        try {
            const audioWindow = window as Window & typeof globalThis & {
                webkitAudioContext?: typeof AudioContext;
            };
            const AC = window.AudioContext || audioWindow.webkitAudioContext;
            if (!AC) return;
            ctx = new AC();

            const playRing = () => {
                if (!ctx || stopped) return;
                const now = ctx.currentTime;
                // Two-tone ringback (similar to phone): 440Hz + 480Hz for 1.2s, then 4s silence
                [440, 480].forEach((freq) => {
                    const osc = ctx!.createOscillator();
                    const gain = ctx!.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
                    gain.gain.setValueAtTime(0.12, now + 1.15);
                    gain.gain.linearRampToValueAtTime(0, now + 1.2);
                    osc.connect(gain).connect(ctx!.destination);
                    osc.start(now);
                    osc.stop(now + 1.25);
                });
            };

            // Resume on iOS if suspended (autoplay may block — first user gesture already happened on call start)
            ctx.resume?.().catch(() => {});
            playRing();
            intervalId = window.setInterval(playRing, 5000);
        } catch (e) {
            console.warn('Ringback tone unavailable:', e);
        }

        return () => {
            stopped = true;
            if (intervalId) clearInterval(intervalId);
            try {
                ctx?.close();
            } catch (error) {
                console.warn('Could not close ringback audio context:', error);
            }
        };
    }, [role, remoteStream, callState.isConnected, showEndedScreen]);




    const handleEndCall = () => {
        endCall();
        onEndCall?.();
    };

    const handleEndCallClick = () => {
        if (confirmOnEnd) {
            setShowEndConfirm(true);
        } else {
            handleEndCall();
        }
    };

    // Call ended by other party — notify parent
    useEffect(() => {
        if (showEndedScreen) {
            if (onOtherPartyEnded) {
                onOtherPartyEnded();
            } else {
                onEndCall?.();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showEndedScreen]);

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
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-destructive/15 border border-destructive/30 backdrop-blur-sm text-foreground px-4 py-2 rounded-2xl text-sm font-medium max-w-[90%] text-center safe-top"
                >
                    <div>{callState.error}</div>
                    <button
                        type="button"
                        onClick={() => void retryCall()}
                        className="mt-2 rounded-full bg-card/90 px-4 py-1.5 text-xs text-foreground"
                    >
                        إعادة المحاولة
                    </button>
                </motion.div>
            );
        }

        if (callState.isRecoveringMedia) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 border border-gold/40 bg-gold/15 backdrop-blur-sm text-foreground px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium safe-top"
                >
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    جاري استعادة الصوت والصورة...
                </motion.div>
            );
        }

        if (callState.manualRetryRequired) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-destructive/15 border border-destructive/30 backdrop-blur-sm text-foreground px-4 py-2 rounded-2xl text-sm font-medium max-w-[90%] text-center safe-top"
                >
                    <div>تعذرت استعادة الاتصال تلقائيًا</div>
                    <button
                        type="button"
                        onClick={() => void manualReconnect()}
                        className="mt-2 rounded-full bg-card/90 px-4 py-1.5 text-xs text-foreground"
                    >
                        إعادة الاتصال الآن
                    </button>
                </motion.div>
            );
        }



        if (callState.cameraUnavailable) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-destructive/15 border border-destructive/30 backdrop-blur-sm text-foreground px-4 py-2 rounded-2xl text-sm font-medium max-w-[90%] text-center safe-top"
                >
                    <div>تعذر تشغيل الكاميرا</div>
                    <button
                        type="button"
                        onClick={() => void retryCamera()}
                        className="mt-2 rounded-full bg-card/90 px-4 py-1.5 text-xs text-foreground"
                    >
                        إعادة تشغيل الكاميرا
                    </button>
                </motion.div>
            );
        }

        if (callState.connectivityDegraded && !callState.isConnected) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 border border-gold/40 bg-gold/10 backdrop-blur-sm text-foreground px-4 py-2 rounded-full flex items-center gap-2 text-xs font-medium safe-top"
                >
                    <WifiOff className="w-4 h-4 text-gold" />
                    جودة الاتصال قد تتأثر على بعض الشبكات
                </motion.div>
            );
        }

        return null;
    };

    return (
        <div className="absolute inset-0 z-50 bg-black">

            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
            {renderStatusBadge()}

            {audioPlaybackBlocked && (
                <button
                    type="button"
                    onClick={enableRemoteAudio}
                    className="absolute top-20 left-1/2 -translate-x-1/2 z-40 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg flex items-center gap-2"
                    dir="rtl"
                >
                    <Volume2 className="w-4 h-4" />
                    اضغط لتفعيل الصوت
                </button>
            )}

            <div className="absolute inset-0 overflow-hidden">
                {(swapped ? localStream : remoteStream) ? (
                    <video
                        ref={mainVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={swapped ? { transform: 'scaleX(-1)' } : undefined}
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

                {(swapped ? remoteStream : localStream) && (
                    <motion.button
                        type="button"
                        onClick={() => setSwapped((s) => !s)}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="تبديل الكاميرا"
                        className="absolute top-6 right-4 w-28 h-40 rounded-2xl overflow-hidden shadow-2xl border border-primary/30 bg-card/40 z-20 cursor-pointer"
                    >
                        <video
                            ref={pipVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={!swapped ? { transform: 'scaleX(-1)' } : undefined}
                        />
                        {!swapped && !callState.isVideoEnabled && (
                            <div className="absolute inset-0 bg-card/90 flex items-center justify-center">
                                <VideoOff className="w-6 h-6 text-muted-foreground" />
                            </div>
                        )}
                    </motion.button>
                )}
            </div>


            <div
                className="absolute bottom-0 left-0 right-0 z-30 px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-4"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
                dir="rtl"
            >
                <div className="flex items-center gap-3">
                    <motion.button
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        onClick={toggleMute}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border ${callState.isMuted
                            ? 'bg-destructive text-destructive-foreground border-destructive/60'
                            : 'bg-card/80 text-foreground border-border hover:bg-card'
                            }`}
                    >
                        {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </motion.button>

                    <motion.button
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={toggleVideo}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border ${!callState.isVideoEnabled
                            ? 'bg-destructive text-destructive-foreground border-destructive/60'
                            : 'bg-card/80 text-foreground border-border hover:bg-card'
                            }`}
                    >
                        {callState.isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </motion.button>

                    <motion.button
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        onClick={switchCamera}
                        aria-label="تبديل الكاميرا"
                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all border bg-card/80 text-foreground border-border hover:bg-card"
                    >
                        <SwitchCamera className="w-5 h-5" />
                    </motion.button>

                    {extraControls}
                </div>

                <motion.button
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={handleEndCallClick}
                    className="w-11 h-11 rounded-full bg-destructive hover:brightness-95 text-destructive-foreground flex items-center justify-center transition-all shadow-lg shadow-destructive/30 border border-destructive/60"
                >
                    <PhoneOff className="w-5 h-5" />
                </motion.button>
            </div>

            <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
                <AlertDialogContent dir="rtl" className="text-right">
                    <AlertDialogHeader className="text-right sm:text-right">
                        <AlertDialogTitle className="text-right">إنهاء المكالمة</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            هل أنت متأكد من إنهاء المكالمة الآن؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:flex-row-reverse sm:justify-start gap-2">
                        <AlertDialogAction
                            onClick={() => { setShowEndConfirm(false); handleEndCall(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            نعم، إنهاء
                        </AlertDialogAction>
                        <AlertDialogCancel className="mt-0">تراجع</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
