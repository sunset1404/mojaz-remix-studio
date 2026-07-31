import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, AlertCircle, Loader2, CheckCircle, PhoneOff } from "lucide-react";
import { VideoCall } from "@/components/video-call/VideoCall";
import { supabase } from "@/integrations/supabase/client";

type PageState = "loading" | "ready" | "in-call" | "ended" | "error";

interface CallSession {
    id: string;
    room_id: string;
    student_name: string;
    status: "waiting" | "active" | "ended" | "failed";
    link_used: boolean;
}

const PublicVideoCall = () => {
    const { token } = useParams<{ token: string }>();
    const [pageState, setPageState] = useState<PageState>("loading");
    const [session, setSession] = useState<CallSession | null>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!token) return;
        validateAndFetchCall();
    }, [token]);

    const validateAndFetchCall = async () => {
        try {
            const { data: resp, error: err } = await (supabase as any).functions.invoke("validate-call-link", {
                body: { token },
            });

            const data = (resp as any)?.session;
            if (err || !data) {
                setError("رابط المكالمة غير صالح أو منتهي الصلاحية");
                setPageState("error");
                return;
            }

            if (data.link_used) {
                setError("تم استخدام هذا الرابط مسبقاً");
                setPageState("error");
                return;
            }

            if (data.status === "ended") {
                setPageState("ended");
                return;
            }

            setSession(data);
            setPageState("ready");
        } catch {
            setError("حدث خطأ في تحميل المكالمة");
            setPageState("error");
        }
    };

    const handleJoinCall = async () => {
        if (!session) return;

        try {
            // Mark link as used and update join time
            await (supabase as any)
                .from("video_call_sessions")
                .update({
                    link_used: true,
                    student_joined_at: new Date().toISOString(),
                    status: "active",
                })
                .eq("id", session.id);

            setPageState("in-call");
        } catch {
            setError("فشل في الانضمام للمكالمة");
            setPageState("error");
        }
    };

    const handleEndCall = async () => {
        if (session) {
            await (supabase as any)
                .from("video_call_sessions")
                .update({
                    status: "ended",
                    ended_at: new Date().toISOString(),
                })
                .eq("id", session.id);
        }
        setPageState("ended");
    };

    if (pageState === "loading") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" dir="rtl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground">جاري التحقق من الرابط...</p>
            </div>
        );
    }

    if (pageState === "error") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6" dir="rtl">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-bold text-foreground">تعذر الانضمام</h1>
                    <p className="text-muted-foreground text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (pageState === "ended") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6" dir="rtl">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <PhoneOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-bold text-foreground">انتهت المكالمة</h1>
                    <p className="text-muted-foreground text-sm">شكراً لك، يمكنك إغلاق هذه الصفحة</p>
                </div>
            </div>
        );
    }

    if (pageState === "ready" && session) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 px-6" dir="rtl">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                        <Video className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">مكالمة مرئية</h1>
                    <p className="text-muted-foreground">
                        مرحباً {session.student_name || ""}، أنت على وشك الانضمام لمكالمة مرئية
                    </p>
                </motion.div>

                <div className="w-full max-w-xs space-y-3">
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-foreground">سيتم تفعيل الكاميرا والميكروفون</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-foreground">الاتصال مشفر ومؤمن</span>
                        </div>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleJoinCall}
                        className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                    >
                        <Video className="w-6 h-6" />
                        انضمام للمكالمة
                    </motion.button>
                </div>
            </div>
        );
    }

    // In-call state
    return (
        <div className="relative w-full h-screen">
            <VideoCall
                roomId={session!.room_id}
                role="caller"
                onEndCall={handleEndCall}
                confirmOnEnd
                requireVideo
                linkToken={token ?? null}
            />
        </div>
    );
};

export default PublicVideoCall;
