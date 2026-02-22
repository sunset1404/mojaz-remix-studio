import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, AlertCircle, PhoneOff } from "lucide-react";
import { VideoCall } from "@/components/video-call/VideoCall";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type CallPageState = "loading" | "ready" | "in-call" | "ended" | "error";

const VideoCallPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const [pageState, setPageState] = useState<CallPageState>("loading");
    const [error, setError] = useState<string>("");
    const [callRole, setCallRole] = useState<"caller" | "callee">("caller");
    const [otherUserName, setOtherUserName] = useState<string>("");

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

                // Determine role
                if (session.caller_id === user.id) {
                    setCallRole("caller");
                    setOtherUserName(session.student_name || "");
                } else {
                    setCallRole("callee");
                    // Update callee_id and join time
                    await (supabase as any)
                        .from("video_call_sessions")
                        .update({
                            callee_id: user.id,
                            student_joined_at: new Date().toISOString(),
                            status: "active",
                        })
                        .eq("room_id", roomId);
                }

                setPageState("in-call");
            } catch {
                setError("حدث خطأ في تحميل المكالمة");
                setPageState("error");
            }
        };

        loadSession();
    }, [roomId, user]);

    const handleEndCall = async () => {
        if (roomId) {
            await (supabase as any)
                .from("video_call_sessions")
                .update({
                    status: "ended",
                    ended_at: new Date().toISOString(),
                })
                .eq("room_id", roomId);
        }
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
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6" dir="rtl">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <PhoneOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold">انتهت المكالمة</p>
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

    return (
        <VideoCall
            roomId={roomId!}
            role={callRole}
            otherUserName={otherUserName}
            onEndCall={handleEndCall}
            autoStartCall={callRole === "caller"}
        />
    );
};

export default VideoCallPage;
