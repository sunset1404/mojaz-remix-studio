import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2, AlertCircle, PhoneOff, Clock, FileText, ClipboardList } from "lucide-react";
import { VideoCall } from "@/components/video-call/VideoCall";
import { ReciterSessionPanel, SessionNoteData } from "@/components/video-call/ReciterSessionPanel";
import { ExamScoringPanel } from "@/components/video-call/ExamScoringPanel";
import { SessionConfirmDialog } from "@/components/video-call/SessionConfirmDialog";
import { StudentSessionPopup } from "@/components/video-call/StudentSessionPopup";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { computeTotalScore } from "@/data/examRubric";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type CallPageState = "creating" | "loading" | "in-call" | "ended" | "error";

const VideoCallPage = () => {
    const { roomId: routeRoomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    // State from navigation (new call flow)
    const navState = location.state as { reciterId?: string; reciterName?: string; studentId?: string; studentName?: string; examId?: string } | null;

    const [roomId, setRoomId] = useState<string | null>(routeRoomId || null);
    const [pageState, setPageState] = useState<CallPageState>(routeRoomId ? "loading" : "creating");
    const [error, setError] = useState<string>("");
    const [callRole, setCallRole] = useState<"caller" | "callee">("caller");
    const [otherUserName, setOtherUserName] = useState<string>(navState?.reciterName || "");
    const [isReciter, setIsReciter] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [callClosed, setCallClosed] = useState(false);

    // Return the user exactly where they came from (fallback to role home)
    const exitedRef = useRef(false);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);
    const exitCall = () => {
        if (exitedRef.current) return;
        exitedRef.current = true;
        const home = isReciter ? "/my-students" : "/";
        const before = window.location.pathname;
        try {
            navigate(-1);
        } catch {
            // ignore
        }
        // If history navigation didn't take us away, force a hard route change
        setTimeout(() => {
            if (mountedRef.current && window.location.pathname === before) {
                navigate(home, { replace: true });
            }
        }, 400);
        // Final safety net: never leave the user stuck on a spinner
        setTimeout(() => {
            if (mountedRef.current && window.location.pathname === before) {
                window.location.replace(home);
            }
        }, 1200);
    };

    const [showStudentPopup, setShowStudentPopup] = useState(false);
    const [sessionFeedback, setSessionFeedback] = useState<{ rating: number; notes: string }>({ rating: 0, notes: '' });
    const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
    const [noCreditsMessage, setNoCreditsMessage] = useState("");
    const [notesOpen, setNotesOpen] = useState(false);
    const [scoringOpen, setScoringOpen] = useState(false);
    const [examScores, setExamScores] = useState<Record<string, number>>({});
    const [examNotes, setExamNotes] = useState("");
    const [examId, setExamId] = useState<string | null>(navState?.examId || null);
    const sessionNoteRef = useRef<SessionNoteData>({ rating: 0, scores: {}, startSurah: '', startAyah: '', endSurah: '', endAyah: '', notes: '' });

    // ── New call creation flow ──
    useEffect(() => {
        if (pageState !== "creating" || !user) return;
        // Determine if this is a student→reciter or reciter→student call
        const isReciterCall = !!navState?.studentId;
        const isStudentCall = !!navState?.reciterId;
        if (!isReciterCall && !isStudentCall) return;

        const createSession = async () => {
            try {
                let data: any;
                let fnError: any;

                if (isReciterCall) {
                    if (navState!.examId) {
                        // Reciter calling student for an exam (admission/eligibility)
                        const result = await supabase.functions.invoke("exam-call", {
                            body: { exam_id: navState!.examId },
                        });
                        data = result.data;
                        fnError = result.error;
                    } else {
                        // Reciter calling student
                        const result = await supabase.functions.invoke("reciter-call", {
                            body: { student_id: navState!.studentId },
                        });
                        data = result.data;
                        fnError = result.error;
                    }
                } else {
                    // Student calling reciter
                    const result = await supabase.functions.invoke("request-call", {
                        body: { reciter_id: navState!.reciterId },
                    });
                    data = result.data;
                    fnError = result.error;
                }

                if (fnError) {
                    let parsed: any = {};
                    try { parsed = JSON.parse(fnError.message || "{}"); } catch {}
                    if (parsed?.error === "no_credits" || parsed?.error === "no_subscription") {
                        setNoCreditsMessage(parsed.message || "نفذ رصيد ساعاتك");
                        setShowNoCreditsDialog(true);
                        return;
                    }
                    throw fnError;
                }

                if (data?.error === "no_credits" || data?.error === "no_subscription") {
                    setNoCreditsMessage(data.message || "نفذ رصيد ساعاتك");
                    setShowNoCreditsDialog(true);
                    return;
                }

                if (data?.error) throw new Error(data.message || data.error);

                // Session created — set roomId and proceed
                setRoomId(data.room_id);
                setCallRole("caller");
                setIsReciter(isReciterCall);
                setOtherUserName(
                    isReciterCall
                        ? navState!.studentName || "الطالب"
                        : navState!.reciterName || "المقرئ"
                );
                setPageState("in-call");

                // Update URL without re-render
                window.history.replaceState(null, "", `/call/${data.room_id}?role=caller`);
            } catch (err: any) {
                console.error("Call creation error:", err);
                try {
                    const parsed = JSON.parse(err?.message || "{}");
                    if (parsed?.error === "no_credits" || parsed?.error === "no_subscription") {
                        setNoCreditsMessage(parsed.message || "نفذ رصيد ساعاتك");
                        setShowNoCreditsDialog(true);
                        return;
                    }
                } catch {}
                setError(err.message || "فشل بدء المكالمة");
                setPageState("error");
            }
        };

        createSession();
    }, [pageState, user, navState]);

    // ── Existing room flow ──
    useEffect(() => {
        if (pageState !== "loading" || !roomId || !user) return;

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
                if (session.exam_id) setExamId(session.exam_id);
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
                                .update({ reciter_joined_at: new Date().toISOString() })
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
                                .update({ reciter_joined_at: new Date().toISOString() })
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
    }, [pageState, roomId, user]);

    // When session is already ended on load
    useEffect(() => {
        if (pageState === "ended") {
            toast({ title: "انتهت المكالمة", description: "هذه الجلسة انتهت مسبقاً" });
            exitCall();
        }
    }, [pageState]);

    // ── Session end helpers ──
    const fetchSessionFeedback = async () => {
        if (!roomId) return { rating: 0, notes: '' };
        await new Promise(r => setTimeout(r, 800));
        const { data } = await (supabase as any)
            .from("video_call_sessions")
            .select("rating, notes")
            .eq("room_id", roomId)
            .maybeSingle();
        return { rating: data?.rating || 0, notes: data?.notes || '' };
    };

    const handleEndCall = async () => {
        setCallClosed(true);
        // The media layer is already closed by VideoCall before this callback runs.
        // Persist the ended state before opening any feedback/evaluation UI.
        await saveSessionAsEnded();
        if (isReciter) {
            setShowConfirm(true);
            return;
        }
        const feedback = await fetchSessionFeedback();
        setSessionFeedback(feedback);
        setShowStudentPopup(true);
    };

    const handleConfirmEnd = async (updatedData: SessionNoteData) => {
        sessionNoteRef.current = updatedData;
        setShowConfirm(false);
        await saveAndEnd();
    };

    const handleOtherPartyEnded = async () => {
        setCallClosed(true);
        if (!isReciter) {
            const feedback = await fetchSessionFeedback();
            setSessionFeedback(feedback);
            setShowStudentPopup(true);
        } else {
            // Reciter side: if it's an exam, force the scoring/confirm dialog so the evaluation is saved.
            if (examId) {
                setShowConfirm(true);
                return;
            }
            // Otherwise save whatever notes/rating were entered and exit
            await saveAndEnd();
            toast({ title: "انتهت المكالمة", description: "تم إنهاء الجلسة" });
            exitCall();
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
            const endedAt = new Date().toISOString();
            const updatePayload: any = { status: "ended", ended_at: endedAt };

            if (isReciter) {
                if (noteData.rating > 0) updatePayload.rating = noteData.rating;
                const noteParts: string[] = [];
                if (noteData.scores && Object.keys(noteData.scores).length > 0) {
                    const { rubricToNotesText } = await import('@/data/examRubric');
                    noteParts.push(rubricToNotesText(noteData.scores));
                }
                if (noteData.startSurah || noteData.startAyah) noteParts.push(`بدأ من: ${noteData.startSurah} آية ${noteData.startAyah}`);
                if (noteData.endSurah || noteData.endAyah) noteParts.push(`انتهى عند: ${noteData.endSurah} آية ${noteData.endAyah}`);
                if (noteData.notes) noteParts.push(`ملاحظات: ${noteData.notes}`);
                if (noteParts.length > 0) updatePayload.notes = noteParts.join('\n');
            }

            await (supabase as any)
                .from("video_call_sessions")
                .update(updatePayload)
                .eq("room_id", roomId);

            // Create session_record for the student to update achievements
            try {
                const { data: session } = await (supabase as any)
                    .from("video_call_sessions")
                    .select("student_id, reciter_id, started_at, student_name, created_at")
                    .eq("room_id", roomId)
                    .maybeSingle();

                if (session) {
                    const startTime = session.started_at || session.created_at || endedAt;
                    const durationMs = new Date(endedAt).getTime() - new Date(startTime).getTime();
                    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
                    const durationText = durationMinutes >= 60
                        ? `${Math.floor(durationMinutes / 60)} ساعة ${durationMinutes % 60 > 0 ? `و ${durationMinutes % 60} دقيقة` : ''}`
                        : `${durationMinutes} دقيقة`;

                    const now = new Date();
                    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                    // Get reciter name
                    let reciterName = "المقرئ";
                    const { data: reciterProfile } = await supabase
                        .from("reciter_profiles")
                        .select("full_name")
                        .eq("user_id", session.reciter_id)
                        .maybeSingle();
                    if (reciterProfile) reciterName = reciterProfile.full_name;

                    // Insert session record for the student
                    await (supabase as any)
                        .from("session_records")
                        .insert({
                            user_id: session.student_id,
                            date: dateStr,
                            time: timeStr,
                            duration: durationText,
                            other_user_name: reciterName,
                            rating: noteData.rating > 0 ? noteData.rating : null,
                            notes: updatePayload.notes || null,
                            status: "مكتملة",
                        });

                    // If this was an exam call and we have rubric scores, save evaluation
                    if (examId && noteData.scores && Object.keys(noteData.scores).length > 0) {
                        try {
                            const { computeTotalScore: _ct, RUBRIC_PASS } = await import('@/data/examRubric');
                            const total = _ct(noteData.scores);
                            const { data: examRow } = await (supabase as any)
                                .from('exams')
                                .select('type, student_name')
                                .eq('id', examId)
                                .maybeSingle();
                            await (supabase as any).from('exam_evaluations').insert({
                                exam_id: examId,
                                student_id: session.student_id,
                                student_name: examRow?.student_name || session.student_name,
                                reciter_id: session.reciter_id,
                                reciter_name: reciterName,
                                exam_type: examRow?.type || null,
                                scores: noteData.scores,
                                total_score: total,
                                passed: total >= RUBRIC_PASS,
                                start_surah: noteData.startSurah || null,
                                start_ayah: noteData.startAyah || null,
                                end_surah: noteData.endSurah || null,
                                end_ayah: noteData.endAyah || null,
                                notes: noteData.notes || null,
                            });
                            // Mark exam status as completed
                            await (supabase as any)
                                .from('exams')
                                .update({ status: 'completed', result: total >= RUBRIC_PASS ? 'passed' : 'failed' })
                                .eq('id', examId);
                        } catch (e) {
                            console.error('exam_evaluation insert error', e);
                        }
                    }
                }
            } catch (err) {
                console.error("Error creating session record:", err);
            }
        }
        toast({ title: "انتهت المكالمة", description: "تم إنهاء الجلسة بنجاح" });
        exitCall();
    };

    const handleStudentPopupClose = () => {
        setShowStudentPopup(false);
        toast({ title: "انتهت المكالمة", description: "تم إنهاء الجلسة بنجاح" });
        exitCall();
    };

    // ── Render ──
    if (pageState === "creating" || pageState === "loading") {
        return (
            <>
                <div
                    className="min-h-screen flex flex-col items-center justify-center gap-4"
                    dir="rtl"
                    style={{ background: "radial-gradient(circle at 50% 12%, hsl(var(--primary) / 0.25), hsl(var(--background)) 58%)" }}
                >
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-foreground font-semibold text-lg">
                        {pageState === "creating" ? "جاري بدء المكالمة..." : "جاري تحميل المكالمة..."}
                    </p>
                    {(navState?.reciterName || navState?.studentName) && (
                        <p className="text-muted-foreground text-sm">الاتصال بـ {navState?.reciterName || navState?.studentName}</p>
                    )}
                </div>
                {/* No credits dialog */}
                <AlertDialog open={showNoCreditsDialog} onOpenChange={(open) => { if (!open) navigate(-1); }}>
                    <AlertDialogContent className="rounded-2xl max-w-sm mx-auto" dir="rtl">
                        <AlertDialogHeader>
                            <div className="flex justify-center mb-3">
                                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <Clock className="w-8 h-8 text-destructive" />
                                </div>
                            </div>
                            <AlertDialogTitle className="text-center text-lg">نفذ رصيد الساعات</AlertDialogTitle>
                            <AlertDialogDescription className="text-center text-sm">
                                {noCreditsMessage || "لا يوجد لديك رصيد كافٍ لبدء مكالمة."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
                            <AlertDialogAction onClick={() => navigate("/subscription")} className="gradient-primary text-primary-foreground rounded-xl">
                                تجديد الاشتراك
                            </AlertDialogAction>
                            <AlertDialogCancel onClick={() => navigate(-1)} className="rounded-xl">إلغاء</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    if (pageState === "error") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6" dir="rtl">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-foreground font-semibold">{error}</p>
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary text-sm font-medium">
                    <ChevronRight className="w-4 h-4" />
                    العودة
                </button>
            </div>
        );
    }

    if (pageState === "ended") return null;

    return (
        <div
            className="relative w-full h-screen"
            dir="rtl"
            style={callClosed ? { background: "radial-gradient(circle at 50% 12%, hsl(var(--primary) / 0.25), hsl(var(--background)) 58%)" } : { background: "#000" }}
        >
            {callClosed && !showConfirm && !showStudentPopup && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!callClosed && (
            <VideoCall
                roomId={roomId!}
                role={callRole}
                otherUserName={otherUserName}
                onEndCall={handleEndCall}
                onOtherPartyEnded={handleOtherPartyEnded}
                autoStartCall={callRole === "caller"}
                confirmOnEnd
                extraControls={isReciter ? (
                    <>
                        {examId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setScoringOpen((v) => !v);
                                    setNotesOpen(false);
                                }}
                                aria-label="معايير التقييم"
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border ${scoringOpen ? 'bg-gold text-white border-gold/60' : 'bg-card/80 text-foreground border-border hover:bg-card'}`}
                            >
                                <ClipboardList className="w-5 h-5" />
                            </button>
                        )}
                        {!examId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setNotesOpen((v) => !v);
                                    setScoringOpen(false);
                                }}
                                aria-label="ملاحظات الجلسة"
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border ${notesOpen ? 'bg-primary text-primary-foreground border-primary/60' : 'bg-card/80 text-foreground border-border hover:bg-card'}`}
                            >
                                <FileText className="w-5 h-5" />
                            </button>
                        )}
                    </>
                ) : undefined}
            />
            )}
            {!callClosed && isReciter && !examId && (
                <ReciterSessionPanel
                    onDataChange={(data) => { sessionNoteRef.current = data; }}
                    scores={examScores}
                    isOpen={notesOpen}
                    onOpenChange={setNotesOpen}
                    hideToggle
                />
            )}
            {!callClosed && isReciter && examId && (
                <ExamScoringPanel
                    scores={examScores}
                    notes={examNotes}
                    onScoresChange={(scores) => {
                        setExamScores(scores);
                        const total = computeTotalScore(scores);
                        const rating = Math.max(0, Math.min(5, Math.round((total / 100) * 5)));
                        sessionNoteRef.current = { ...sessionNoteRef.current, scores, rating };
                    }}
                    onNotesChange={(notes) => {
                        setExamNotes(notes);
                        sessionNoteRef.current = { ...sessionNoteRef.current, notes };
                    }}
                    isOpen={scoringOpen}
                    onOpenChange={setScoringOpen}
                    hideToggle
                />
            )}
            <AnimatePresence>
                {showConfirm && isReciter && (
                    <SessionConfirmDialog
                        data={sessionNoteRef.current}
                        onConfirm={handleConfirmEnd}
                        onCancel={() => setShowConfirm(false)}
                        isExam={!!examId}
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
