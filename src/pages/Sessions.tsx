import { motion } from "framer-motion";
import { Calendar, Clock, User, Video, Phone, ChevronLeft, Star, BookOpen, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CallLinkModal } from "@/components/video-call/CallLinkModal";
import reciter1 from "@/assets/reciters/reciter1.jpg";
import reciter2 from "@/assets/reciters/reciter2.jpg";
import reciter3 from "@/assets/reciters/reciter3.jpg";
import reciter4 from "@/assets/reciters/reciter4.jpg";
import reciter5 from "@/assets/reciters/reciter5.jpg";

type SessionStatus = "upcoming" | "completed" | "cancelled";
type FilterType = "all" | "upcoming" | "completed" | "cancelled";

interface SessionItem {
  id: number;
  studentName: string;
  avatar: string;
  date: string;
  time: string;
  duration: string;
  track: string;
  surah: string;
  status: SessionStatus;
  rating?: number;
  notes?: string;
}

const sessionsData: SessionItem[] = [
  { id: 1, studentName: "عبدالله محمد", avatar: reciter1, date: "اليوم", time: "04:00 م", duration: "30 دقيقة", track: "حفص عن عاصم", surah: "سورة البقرة - الجزء 3", status: "upcoming" },
  { id: 2, studentName: "أحمد خالد", avatar: reciter2, date: "اليوم", time: "05:30 م", duration: "45 دقيقة", track: "حفص عن عاصم", surah: "سورة آل عمران - الجزء 4", status: "upcoming" },
  { id: 3, studentName: "يوسف عمر", avatar: reciter4, date: "اليوم", time: "07:00 م", duration: "30 دقيقة", track: "قالون عن نافع", surah: "سورة النساء - الجزء 5", status: "upcoming" },
  { id: 4, studentName: "محمد سعيد", avatar: reciter3, date: "أمس", time: "04:00 م", duration: "30 دقيقة", track: "ورش عن نافع", surah: "سورة المائدة - الجزء 6", status: "completed", rating: 5, notes: "أداء ممتاز، أتقن التجويد" },
  { id: 5, studentName: "سلطان فهد", avatar: reciter5, date: "أمس", time: "06:00 م", duration: "45 دقيقة", track: "حفص عن عاصم", surah: "سورة الأنعام - الجزء 7", status: "completed", rating: 4, notes: "جيد، يحتاج مراجعة المد المتصل" },
  { id: 6, studentName: "عبدالله محمد", avatar: reciter1, date: "قبل يومين", time: "05:00 م", duration: "30 دقيقة", track: "حفص عن عاصم", surah: "سورة البقرة - الجزء 2", status: "cancelled" },
];

const statusConfig: Record<SessionStatus, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  upcoming: { label: "قادمة", icon: AlertCircle, color: "text-primary", bg: "bg-primary/10" },
  completed: { label: "مكتملة", icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10" },
  cancelled: { label: "ملغاة", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const tabs: { key: FilterType; label: string }[] = [
  { key: "all", label: "الجميع" },
  { key: "upcoming", label: "القادمة" },
  { key: "completed", label: "المكتملة" },
  { key: "cancelled", label: "الملغاة" },
];

const Sessions = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callLink, setCallLink] = useState("");
  const [callRoomId, setCallRoomId] = useState("");
  const [callStudentName, setCallStudentName] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const filtered = sessionsData.filter((s) => filter === "all" || s.status === filter);

  const todayCount = sessionsData.filter((s) => s.date === "اليوم" && s.status === "upcoming").length;
  const completedCount = sessionsData.filter((s) => s.status === "completed").length;

  const handleStartSession = async (studentName: string) => {
    if (!user) return;

    try {
      const roomId = crypto.randomUUID();
      const accessToken = crypto.randomUUID();

      const { error } = await (supabase as any)
        .from("video_call_sessions")
        .insert({
          room_id: roomId,
          reciter_id: user.id,
          access_token: accessToken,
          student_name: studentName,
          status: "waiting",
          reciter_joined_at: new Date().toISOString(),
        });

      if (error) throw error;

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/call/join/${accessToken}`;

      setCallRoomId(roomId);
      setCallLink(link);
      setCallStudentName(studentName);
      setCallModalOpen(true);
    } catch (err) {
      console.error("Error creating call session:", err);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء جلسة المكالمة",
        variant: "destructive",
      });
    }
  };

  const handleStartCall = () => {
    navigate(`/call/${callRoomId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-[2.5rem]">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-primary-foreground mb-4 flex items-center justify-center gap-2"
        >
          <Calendar className="w-6 h-6" />
          الجلسات
        </motion.h1>

        {/* Stats */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3"
        >
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-foreground">{todayCount}</p>
            <p className="text-[10px] text-primary-foreground/70">جلسات اليوم</p>
          </div>
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-foreground">{completedCount}</p>
            <p className="text-[10px] text-primary-foreground/70">مكتملة</p>
          </div>
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-foreground">{sessionsData.length}</p>
            <p className="text-[10px] text-primary-foreground/70">إجمالي</p>
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${filter === tab.key
              ? "gradient-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="px-5 mt-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">لا توجد جلسات</div>
        )}
        {filtered.map((session, i) => {
          const config = statusConfig[session.status];
          const isExpanded = expandedId === session.id;

          return (
            <motion.div
              key={session.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className="w-full p-4 flex items-center gap-3 text-right"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <img src={session.avatar} alt={session.studentName} className="w-full h-full object-cover" />
                  {session.status === "upcoming" && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm truncate">{session.studentName}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{session.surah}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar className="w-3 h-3" /> {session.date}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" /> {session.time}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {session.duration}
                    </span>
                  </div>
                </div>

                <ChevronLeft className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>المسار: {session.track}</span>
                  </div>

                  {session.rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">التقييم:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= session.rating! ? "text-gold fill-current" : "text-muted"}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  {session.notes && (
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">ملاحظات المقرئ:</p>
                      <p className="text-xs text-foreground">{session.notes}</p>
                    </div>
                  )}

                  {session.status === "upcoming" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleStartSession(session.studentName)}
                        className="flex-1 h-10 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4" /> بدء الجلسة
                      </button>
                      <button className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Call Link Modal */}
      <CallLinkModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        callLink={callLink}
        calleeName={callStudentName}
        onStartCall={handleStartCall}
      />
    </div>
  );
};

export default Sessions;
