import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2, AlertCircle, PhoneOff } from "lucide-react";
import { VideoCall } from "@/components/video-call/VideoCall";
import { ReciterSessionPanel, SessionNoteData } from "@/components/video-call/ReciterSessionPanel";
import { SessionConfirmDialog } from "@/components/video-call/SessionConfirmDialog";
import { StudentSessionPopup } from "@/components/video-call/StudentSessionPopup";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type CallPageState = "loading" | "ready" | "in-call" | "ended" | "error";

const VideoCallPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const { toast } = useToast();
    const [pageState, setPageState] = useState<CallPageState>("loading");
    const [error, setError] = useState<string>("");
    const [callRole, setCallRole] = useState<"caller" | "callee">("caller");
    const [otherUserName, setOtherUserName] = useState<string>("");
    const [isReciter, setIsReciter] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showStudentPopup, setShowStudentPopup] = useState(false);
    const [sessionFeedback, setSessionFeedback] = useState<{ rating: number; notes: string }>({ rating: 0, notes: '' });
    const sessionNoteRef = useRef<SessionNoteData>({ rating: 0, startSurah: '', startAyah: '', endSurah: '', endAyah: '', notes: '' });

    useEffect(() => {
        if (!roomId || !user) return;

        const loadSession = async () => {
            try {
                const { data: session, error: err } = await (supabase as any)
                    .from("video_call_sessions")
                    .select("*")
                    .eq("room_id", roomId)
                    .maybeSingle();

                if (err || !session) {
                    setError("لم يتم العثور على جلسة المكالمة");
                    setPageState("error");
                    return;
                }

                if (session.status === "ended") {
                    setPageState("ended");
                    return;
                }

                const isStudent = session.student_id === user.id;
                setIsReciter(!isStudent);
                const callerRole = session.caller_role || (isStudent ? "student" : "reciter");

                if (callerRole === "student") {
                    if (isStudent) {
                        setCallRole("caller");
                        setOtherUserName("المقرئ");
                    } else {
                        setCallRole("callee");
                        setOtherUserName(session.student_name || "الطالب");

                        if (!session.reciter_joined_at) {
                            await (supabase as any)
                                .from("video_call_sessions")
                                .update({
                                    reciter_joined_at: new Date().toISOString(),
                                    status: "active",
                                })
                                .eq("room_id", roomId);
                        }
                    }
                } else {
                    if (isStudent) {
                        setCallRole("callee");
                        setOtherUserName("المقرئ");
                    } else {
                        setCallRole("caller");
                        setOtherUserName(session.student_name || "الطالب");

                        if (!session.reciter_joined_at) {
                            await (supabase as any)
                                .from("video_call_sessions")
                                .update({
                                    reciter_joined_at: new Date().toISOString(),
                                })
                                .eq("room_id", roomId);
                        }
                    }
                }

                setPageState("in-call");
            } catch {
                setError("حدث خطأ في تحميل المكالمة");
                setPageState("error");
            }
        };

        loadSession();
    }, [roomId, user]);

    // When session is already ended on load, navigate back with toast
    useEffect(() => {
        if (pageState === "ended") {
            toast({
                title: "انتهت المكالمة",
                description: "هذه الجلسة انتهت مسبقاً",
            });
            navigate(-1);
        }
    }, [pageState]);

    // Fetch session feedback from DB for student popup
    const fetchSessionFeedback = async () => {
        if (!roomId) return { rating: 0, notes: '' };
        // Small delay to let the reciter's save propagate
        await new Promise(r => setTimeout(r, 800));
        const { data } = await (supabase as any)
            .from("video_call_sessions")
            .select("rating, notes")
            .eq("room_id", roomId)
            .maybeSingle();
        return { rating: data?.rating || 0, notes: data?.notes || '' };
    };

    const handleEndCall = async () => {
        if (isReciter) {
            if (!showConfirm) {
                setShowConfirm(true);
                return;
            }
        } else {
            // Student ending the call — show popup after saving
            await saveSessionAsEnded();
            const feedback = await fetchSessionFeedback();
            setSessionFeedback(feedback);
            setShowStudentPopup(true);
            return;
        }
        await saveAndEnd();
    };

    // Called when the other party ends the call (student side receives dbStatus=ended)
    const handleOtherPartyEnded = async () => {
        if (!isReciter) {
            // Student: fetch the reciter's feedback and show popup
            const feedback = await fetchSessionFeedback();
            setSessionFeedback(feedback);
            setShowStudentPopup(true);
        } else {
            // Reciter: just navigate back
            toast({ title: "انتهت المكالمة", description: "تم إنهاء الجلسة" });
            navigate(-1);
        }
    };

    const saveSessionAsEnded = async () => {
        if (!roomId) return;
        await (supabase as any)
            .from("video_call_sessions")
            .update({ status: "ended", ended_at: new Date().toISOString() })
            .eq("room_id", roomId);
    };

    const saveAndEnd = async () => {
        if (roomId) {
            const noteData = sessionNoteRef.current;
            const updatePayload: any = {
                status: "ended",
                ended_at: new Date().toISOString(),
            };

            if (isReciter) {
                if (noteData.rating > 0) updatePayload.rating = noteData.rating;
                const noteParts: string[] = [];
                if (noteData.startSurah || noteData.startAyah) {
                    noteParts.push(`بدأ من: ${noteData.startSurah} آية ${noteData.startAyah}`);
                }
                if (noteData.endSurah || noteData.endAyah) {
                    noteParts.push(`انتهى عند: ${noteData.endSurah} آية ${noteData.endAyah}`);
                }
                if (noteData.notes) {
                    noteParts.push(`ملاحظات: ${noteData.notes}`);
                }
                if (noteParts.length > 0) {
                    updatePayload.notes = noteParts.join('\n');
                }
            }

            await (supabase as any)
                .from("video_call_sessions")
                .update(updatePayload)
                .eq("room_id", roomId);
        }
        toast({
            title: "انتهت المكالمة",
            description: "تم إنهاء الجلسة بنجاح",
        });
        navigate(-1);
    };

    const handleStudentPopupClose = () => {
        setShowStudentPopup(false);
        toast({ title: "انتهت المكالمة", description: "تم إنهاء الجلسة بنجاح" });
        navigate(-1);
    };

    if (pageState === "loading") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" dir="rtl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground">جاري تحميل المكالمة...</p>
            </div>
        );
    }

    if (pageState === "error") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6" dir="rtl">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-foreground font-semibold">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-primary text-sm font-medium"
                >
                    <ChevronRight className="w-4 h-4" />
                    العودة
                </button>
            </div>
        );
    }

    if (pageState === "ended") {
        return null;
    }

    return (
        <div className="relative w-full h-screen">
            <VideoCall
                roomId={roomId!}
                role={callRole}
                otherUserName={otherUserName}
                onEndCall={isReciter ? handleEndCall : handleEndCall}
                onOtherPartyEnded={handleOtherPartyEnded}
                autoStartCall={callRole === "caller"}
            />
            {isReciter && (
                <ReciterSessionPanel
                    onDataChange={(data) => { sessionNoteRef.current = data; }}
                />
            )}
            <AnimatePresence>
                {showConfirm && isReciter && (
                    <SessionConfirmDialog
                        data={sessionNoteRef.current}
                        onConfirm={saveAndEnd}
                        onCancel={() => setShowConfirm(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showStudentPopup && (
                    <StudentSessionPopup
                        rating={sessionFeedback.rating}
                        notes={sessionFeedback.notes}
                        onClose={handleStudentPopupClose}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoCallPage;
