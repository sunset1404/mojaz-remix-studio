import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Star, Calendar, Trophy, ChevronLeft, CalendarDays, Users, Bell, Award, Headphones, Phone, Video, User, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useReciterAvailability } from "@/contexts/ReciterAvailabilityContext";
import { Switch } from "@/components/ui/switch";
import PullToRefresh from "@/components/PullToRefresh";
import reciter1 from "@/assets/reciters/reciter1.jpg";
import reciter2 from "@/assets/reciters/reciter2.jpg";
import reciter3 from "@/assets/reciters/reciter3.jpg";
import reciter4 from "@/assets/reciters/reciter4.jpg";
import reciter5 from "@/assets/reciters/reciter5.jpg";

// Students will be fetched from DB for ijazah reciters

const promoSlides = [
  { title: "إدارة الطلاب", desc: "تابع تقدم طلابك بسهولة", icon: Users, bg: "gradient-primary", iconBg: "bg-gold/20", iconColor: "text-gold" },
  { title: "جلسات الإقراء", desc: "نظّم مواعيد جلساتك", icon: CalendarDays, bg: "gradient-gold", iconBg: "bg-primary/20", iconColor: "text-primary" },
  { title: "شهادات الطلاب", desc: "امنح طلابك شهادات معتمدة", icon: Award, bg: "gradient-primary", iconBg: "bg-gold/20", iconColor: "text-gold" },
];

interface AssignedStudent {
  user_id: string;
  full_name: string;
  gender: string;
  preferred_track: string;
  preferred_riwaya: string | null;
  avatarUrl?: string | null;
}

// quickStats values are loaded from the DB per logged-in reciter


const ReciterHome = () => {
  const { user, avatarUrl, reciterType } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userName, setUserName] = useState("");
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [stats, setStats] = useState({ students: 0, todaySessions: 0, hours: 0, certificates: 0 });
  const [hasExams, setHasExams] = useState(false);
  const {
    manualEnabled,
    isAvailable,
    isBusy,
    isSyncing,
    setManualEnabled,
  } = useReciterAvailability();

  const fetchData = useCallback(async () => {
    if (!user) return;
    supabase.from("reciter_profiles").select("id, full_name").eq("user_id", user.id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        const parts = data.full_name.trim().split(/\s+/);
        setUserName(parts.slice(0, 2).join(" "));
        // Check if reciter is on any exam committee
        const { count } = await supabase
          .from("exams")
          .select("id", { count: "exact", head: true })
          .or(`committee_member_1.eq.${data.id},committee_member_2.eq.${data.id},committee_member_3.eq.${data.id}`);
        setHasExams((count || 0) > 0);
      });


    if (reciterType === "ijazah") {
      supabase
        .from("student_profiles")
        .select("user_id, full_name, gender, preferred_track, preferred_riwaya")
        .eq("assigned_reciter_id", user.id)
        .then(async ({ data }) => {
          if (data && data.length > 0) {
            const userIds = data.map(s => s.user_id);
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, avatar_url")
              .in("user_id", userIds);
            const avatarMap: Record<string, string | null> = {};
            profiles?.forEach(p => {
              if (p.avatar_url) {
                const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(p.avatar_url);
                avatarMap[p.user_id] = urlData?.publicUrl || null;
              }
            });
            setAssignedStudents(data.map(s => ({ ...s, avatarUrl: avatarMap[s.user_id] || null })));
          } else {
            setAssignedStudents(data || []);
          }
        });
    }
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(({ count }) => { setUnreadCount(count || 0); });

    supabase
      .from("video_call_sessions")
      .select("id", { count: "exact", head: true })
      .eq("reciter_id", user.id)
      .eq("status", "waiting")
      .eq("caller_role", "student")
      .then(({ count }) => { setQueueCount(count || 0); });

    // Real stats for reciter
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayIso = todayStart.toISOString();

    // Today sessions
    supabase
      .from("video_call_sessions")
      .select("id", { count: "exact", head: true })
      .eq("reciter_id", user.id)
      .gte("started_at", todayIso)
      .then(({ count }) => {
        setStats(s => ({ ...s, todaySessions: count || 0 }));
      });

    // Students count: assigned (ijazah) or distinct from sessions (general)
    if (reciterType === "ijazah") {
      supabase
        .from("student_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("assigned_reciter_id", user.id)
        .then(({ count }) => setStats(s => ({ ...s, students: count || 0 })));
    } else {
      supabase
        .from("video_call_sessions")
        .select("student_id")
        .eq("reciter_id", user.id)
        .not("student_id", "is", null)
        .then(({ data }) => {
          const uniq = new Set((data || []).map((row) => row.student_id));
          setStats(s => ({ ...s, students: uniq.size }));
        });
    }

    // Total hours from completed call durations
    supabase
      .from("video_call_sessions")
      .select("started_at, ended_at")
      .eq("reciter_id", user.id)
      .not("ended_at", "is", null)
      .then(({ data }) => {
        const totalMs = (data || []).reduce((acc, row) => {
          if (!row.started_at || !row.ended_at) return acc;
          const diff = new Date(row.ended_at).getTime() - new Date(row.started_at).getTime();
          return acc + Math.max(0, diff);
        }, 0);
        setStats(s => ({ ...s, hours: Math.floor(totalMs / 3600000) }));
      });

    // Certificates issued by this reciter
    supabase
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("reciter_id", user.id)
      .then(({ count }) => setStats(s => ({ ...s, certificates: count || 0 })));
  }, [user, reciterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => { fetchData(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    window.addEventListener("home-refresh", handler);
    return () => window.removeEventListener("home-refresh", handler);
  }, [fetchData]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <PullToRefresh onRefresh={fetchData}>
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="px-6 pt-10 pb-3">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 shrink-0">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-primary/20 bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="صورة المستخدم" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${isAvailable ? 'bg-emerald-500' : isBusy ? 'bg-gold' : 'bg-muted-foreground/50'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-cairo">
                أهلاً {userName || "أيها المقرئ"} 👋
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isSyncing && manualEnabled ? (
                  <>
                    <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                    <span className="text-xs font-medium text-muted-foreground">جاري تفعيل التوفر...</span>
                  </>
                ) : isBusy ? (
                  <>
                    <WifiOff className="w-3 h-3 text-gold" />
                    <span className="text-xs font-medium text-gold">مشغول بمكالمة</span>
                  </>
                ) : isAvailable ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-500">متصل - ظاهر للطلاب</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">غير متاح للطلاب</span>
                  </>
                )}
                <Switch
                  checked={manualEnabled}
                  disabled={isSyncing}
                  onCheckedChange={(checked) => { void setManualEnabled(checked); }}
                  aria-label="تحديد التوفر للطلاب"
                  className="mr-2 scale-75 data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative"
          >
            <Bell className="w-5 h-5 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gold rounded-full border-2 border-background" />
            )}
          </button>
        </motion.div>
      </div>

      {/* Promo Carousel */}
      <div className="px-5 mb-2">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl"
          style={{ height: '150px' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 30 }}
              className={`absolute inset-0 ${promoSlides[currentSlide].bg} rounded-2xl p-6 flex items-center gap-5`}
            >
              <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-white/5 -translate-x-10 -translate-y-10" />
              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-white/5 translate-x-8 translate-y-8" />
              <div className="relative z-10 flex items-center gap-5 w-full">
                <div className={`w-16 h-16 rounded-2xl ${promoSlides[currentSlide].iconBg} flex items-center justify-center shrink-0 shadow-lg`}>
                  {(() => {
                    const Icon = promoSlides[currentSlide].icon;
                    return <Icon className={`w-8 h-8 ${promoSlides[currentSlide].iconColor}`} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-primary-foreground leading-tight">{promoSlides[currentSlide].title}</h3>
                  <p className="text-sm mt-1 text-primary-foreground/80">{promoSlides[currentSlide].desc}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {promoSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "bg-primary-foreground w-6" : "bg-primary-foreground/40 w-2"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 -mt-5 py-[19px]">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-4 gap-2"
        >
          {[
            { label: "عدد الطلاب", value: String(stats.students), icon: Users, color: "primary" },
            { label: "جلسات اليوم", value: String(stats.todaySessions), icon: CalendarDays, color: "gold" },
            { label: "ساعات الإقراء", value: String(stats.hours), icon: BookOpen, color: "primary" },
            { label: "إنجازات", value: String(stats.certificates), icon: Trophy, color: "gold" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${
                stat.color === "gold" ? "bg-gold/20" : "bg-primary/10"
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === "gold" ? "text-gold" : "text-primary"
                }`} />
              </div>
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Sessions Card */}
      <div className="px-5 mt-3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link to="/sessions" className="block">
            <div className="relative rounded-2xl overflow-hidden gradient-primary p-5 shadow-lg">
              <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-primary-foreground">
                    {reciterType === "ijazah" ? "جلساتي القادمة" : "الطابور الإلكتروني"}
                  </h3>
                  <p className="text-sm text-primary-foreground/75 mt-0.5">
                    {reciterType === "ijazah"
                      ? `${queueCount} جلسة منتظرة`
                      : queueCount > 0
                        ? `${queueCount} طالب في الانتظار`
                        : "لا يوجد طلاب في الانتظار حالياً"}
                  </p>
                </div>
                <ChevronLeft className="w-5 h-5 text-primary-foreground/60 shrink-0" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Exams Card — only for reciters who have any exams as committee members */}
      {hasExams && (
        <div className="px-5 mt-3">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.62 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to="/reciter-exams" className="block">
              <div className="relative rounded-2xl overflow-hidden bg-card border border-border/60 p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-foreground">
                      اختبارات القبول والاستحقاق
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      اطّلع على اختباراتك واتصل بالطلاب لإجرائها
                    </p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      )}


      {/* Students Section (Ijazah) or Recent Sessions (General) */}
      {reciterType === "ijazah" ? (
        <div className="px-5 mt-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="glass-card rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-bold text-foreground text-base">طلابي</h2>
              </div>
              <Link to="/my-students" className="flex items-center gap-1 text-xs text-primary font-semibold">
                المزيد <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
            {assignedStudents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                لا يوجد طلاب مسكّنين عليك حالياً
              </div>
            ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {assignedStudents.map((student, i) => (
                <motion.div
                  key={student.user_id}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="flex flex-col items-center gap-2.5 w-[130px] bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
                    <Link to="/my-students" className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div className="w-[72px] h-[72px] rounded-full overflow-hidden ring-2 ring-primary/20 shadow-md bg-muted flex items-center justify-center">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-foreground text-center leading-tight line-clamp-1">
                        {student.full_name}
                      </span>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-gold fill-current" />
                      <span className="text-[10px] font-bold text-foreground">{student.preferred_riwaya || student.preferred_track}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate("/call/new", { state: { studentId: student.user_id, studentName: student.full_name } });
                        }}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all"
                      >
                        <Video className="w-4.5 h-4.5 text-primary" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate("/call/new", { state: { studentId: student.user_id, studentName: student.full_name } });
                        }}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all"
                      >
                        <Phone className="w-4.5 h-4.5 text-primary" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="px-5 mt-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="space-y-3"
          >
            <Link to="/reciter-session-log" className="block">
              <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm">سجل الجلسات</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">جميع جلساتك مع الطلاب</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/reciter-my-stats" className="block">
              <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm">إحصائياتي</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">ملخص أدائك في الإقراء</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </motion.div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
};

export default ReciterHome;
