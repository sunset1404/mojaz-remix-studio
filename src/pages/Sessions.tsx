import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Clock, User, Video, Phone, Timer, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CallLinkModal } from "@/components/video-call/CallLinkModal";

interface QueueItem {
  id: string;
  room_id: string;
  student_id: string;
  student_name: string | null;
  created_at: string | null;
  caller_role: string;
}

const Sessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callLink, setCallLink] = useState("");
  const [callRoomId, setCallRoomId] = useState("");
  const [callStudentName, setCallStudentName] = useState("");

  const fetchQueue = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("video_call_sessions")
      .select("id, room_id, student_id, student_name, created_at, caller_role")
      .eq("reciter_id", user.id)
      .eq("status", "waiting")
      .order("created_at", { ascending: true });

    if (!error) setQueue(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();

    // Realtime subscription for live queue updates
    const channel = supabase
      .channel("reciter-queue")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_call_sessions",
          filter: `reciter_id=eq.${user?.id}`,
        },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const estimatedWaitMinutes = (index: number) => {
    // Assume ~15 minutes per session ahead in queue
    return index * 15;
  };

  const formatWaitTime = (minutes: number) => {
    if (minutes === 0) return "التالي";
    if (minutes < 60) return `${minutes} دقيقة`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs} ساعة و ${mins} دقيقة` : `${hrs} ساعة`;
  };

  const getTimeSinceBooking = (createdAt: string | null) => {
    if (!createdAt) return "";
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff < 1) return "الآن";
    if (diff < 60) return `منذ ${diff} دقيقة`;
    const hrs = Math.floor(diff / 60);
    return `منذ ${hrs} ساعة`;
  };

  const handleAcceptStudent = (item: QueueItem) => {
    navigate(`/call/${item.room_id}`);
  };

  const handleRejectStudent = async (item: QueueItem) => {
    const { error } = await supabase
      .from("video_call_sessions")
      .update({ status: "rejected" })
      .eq("id", item.id);

    if (error) {
      toast({ title: "خطأ", description: "فشل في رفض الطلب", variant: "destructive" });
    } else {
      toast({ title: "تم", description: `تم رفض طلب ${item.student_name || "الطالب"}` });
      fetchQueue();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-[2.5rem]">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-primary-foreground mb-1 flex items-center justify-center gap-2"
        >
          <Users className="w-6 h-6" />
          الطابور الإلكتروني
        </motion.h1>
        <p className="text-sm text-primary-foreground/80 text-center">حجز الجلسات - الطلاب المنتظرون</p>

        {/* Stats */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mt-4"
        >
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-foreground">{queue.length}</p>
            <p className="text-[10px] text-primary-foreground/70">في الانتظار</p>
          </div>
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-foreground">
              {queue.length > 0 ? formatWaitTime(estimatedWaitMinutes(queue.length)) : "0"}
            </p>
            <p className="text-[10px] text-primary-foreground/70">الوقت المتوقع</p>
          </div>
        </motion.div>
      </div>

      {/* Queue List */}
      <div className="px-5 mt-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">لا يوجد طلاب في الانتظار حالياً</p>
            <p className="text-muted-foreground/60 text-xs mt-1">سيظهر الطلاب هنا عند طلبهم جلسة</p>
          </div>
        ) : (
          queue.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.06 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                {/* Queue position */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${
                  index === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {index + 1}
                </div>

                {/* Student info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm truncate">
                      {item.student_name || "طالب"}
                    </h3>
                    {index === 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        التالي
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {getTimeSinceBooking(item.created_at)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Timer className="w-3 h-3" />
                      الانتظار: {formatWaitTime(estimatedWaitMinutes(index))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAcceptStudent(item)}
                  className="flex-1 h-10 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" /> بدء الجلسة
                </button>
                <button
                  onClick={() => handleRejectStudent(item)}
                  className="h-10 px-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium"
                >
                  رفض
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Call Link Modal */}
      <CallLinkModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        callLink={callLink}
        calleeName={callStudentName}
        onStartCall={() => navigate(`/call/${callRoomId}`)}
      />
    </div>
  );
};

export default Sessions;
