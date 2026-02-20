import { motion } from "framer-motion";
import { Trophy, Star, BookOpen, Target, Award, Flame, Check, X, BookOpenCheck, Crown, Zap, Clock, CalendarCheck, Users, GraduationCap, Mic, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type Achievement = {
  id: number;
  title: string;
  desc: string;
  icon: React.ElementType;
  earned: boolean;
  date?: string;
  progress?: number;
  total?: number;
  category: "quran" | "performance";
};

// إنجازات الطالب
const studentAchievements: Achievement[] = [
  { id: 1, title: "الخطوة الأولى", desc: "أكمل أول جلسة إقراء", icon: BookOpen, earned: true, date: "15 يناير 2026", category: "quran" },
  { id: 3, title: "حافظ الجزء", desc: "أتم حفظ جزء كامل", icon: BookOpenCheck, earned: true, date: "5 فبراير 2026", category: "quran" },
  { id: 4, title: "نجم التجويد", desc: "احصل على تقييم ممتاز في التجويد", icon: Star, earned: true, date: "10 فبراير 2026", category: "quran" },
  { id: 6, title: "حافظ 5 أجزاء", desc: "أتم حفظ 5 أجزاء", icon: Trophy, earned: false, progress: 3, total: 5, category: "quran" },
  { id: 7, title: "المتقن", desc: "أتم مراجعة 10 سور بإتقان", icon: Target, earned: false, progress: 6, total: 10, category: "quran" },
  { id: 8, title: "الختمة", desc: "أتم ختم القرآن كاملاً", icon: Crown, earned: false, progress: 5, total: 30, category: "quran" },
  { id: 2, title: "قارئ منتظم", desc: "أكمل 7 أيام متتالية", icon: Flame, earned: true, date: "22 يناير 2026", category: "performance" },
  { id: 5, title: "المثابر", desc: "أكمل 30 يوماً متتالياً", icon: Zap, earned: false, progress: 14, total: 30, category: "performance" },
  { id: 9, title: "48 ساعة إقراء", desc: "أكمل 48 ساعة من جلسات الإقراء", icon: Clock, earned: false, progress: 32, total: 48, category: "performance" },
  { id: 10, title: "الملتزم", desc: "التزم بالخطة الأسبوعية لمدة شهر", icon: CalendarCheck, earned: false, progress: 2, total: 4, category: "performance" },
];

// إنجازات المقرئ
const reciterAchievements: Achievement[] = [
  { id: 1, title: "الخطوة الأولى", desc: "أكمل أول جلسة إقراء", icon: BookOpen, earned: true, date: "15 يناير 2026", category: "quran" },
  { id: 2, title: "معلم القرآن", desc: "أقرئ 10 طلاب مختلفين", icon: Users, earned: true, date: "28 يناير 2026", category: "quran" },
  { id: 3, title: "المجاز", desc: "أتمم إجازة طالب في الحفظ", icon: GraduationCap, earned: false, progress: 0, total: 1, category: "quran" },
  { id: 4, title: "شيخ الإقراء", desc: "أكمل 100 جلسة إقراء", icon: Mic, earned: false, progress: 48, total: 100, category: "quran" },
  { id: 5, title: "حلقة كاملة", desc: "أقرئ 5 طلاب في أسبوع واحد", icon: Crown, earned: true, date: "3 فبراير 2026", category: "quran" },
  { id: 6, title: "المرشد المتميز", desc: "احصل على تقييم 4.5+ من 20 طالب", icon: Star, earned: false, progress: 15, total: 20, category: "quran" },
  { id: 7, title: "مقرئ منتظم", desc: "أكمل 7 أيام متتالية من الإقراء", icon: Flame, earned: true, date: "22 يناير 2026", category: "performance" },
  { id: 8, title: "المثابر", desc: "أكمل 30 يوماً متتالياً من الإقراء", icon: Zap, earned: false, progress: 14, total: 30, category: "performance" },
  { id: 9, title: "100 ساعة إقراء", desc: "أكمل 100 ساعة من جلسات الإقراء", icon: Clock, earned: false, progress: 48, total: 100, category: "performance" },
  { id: 10, title: "الملتزم", desc: "التزم بالخطة الأسبوعية لمدة شهر", icon: CalendarCheck, earned: false, progress: 2, total: 4, category: "performance" },
];

const weekDays = [
  { key: "السبت", label: "س" },
  { key: "الأحد", label: "ح" },
  { key: "الاثنين", label: "ن" },
  { key: "الثلاثاء", label: "ث" },
  { key: "الأربعاء", label: "ر" },
  { key: "الخميس", label: "خ" },
  { key: "الجمعة", label: "ج" },
];

const Achievements = () => {
  const { role, user } = useAuth();
  const isReciter = role === "reciter";
  const [planDays, setPlanDays] = useState<string[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [missedDays, setMissedDays] = useState<string[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [achievementData, setAchievementData] = useState<{
    sessions_count: number;
    total_minutes: number;
    parts_memorized: number;
    pages_memorized: number;
    commitment_rate: number;
    certificates_count: number;
    completions: number;
  } | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
    if (!user) { setLoadingPlan(false); return; }

    // Fetch achievements data
    const { data: achData } = await supabase
      .from("student_achievements")
      .select("*")
      .eq("student_id", user.id)
      .maybeSingle();
    if (achData) setAchievementData(achData);

    const { data } = await supabase
        .from("weekly_plans")
        .select("days")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.days) {
        setPlanDays(data.days);

        const today = new Date();
        const dayIndex = today.getDay(); // 0=Sun
        const dayMap = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        const todayName = dayMap[dayIndex];
        const orderedDays = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
        const todayOrder = orderedDays.indexOf(todayName);

        // Get start of current week (Saturday)
        const satOffset = (dayIndex + 1) % 7; // days since last Saturday
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - satOffset);
        weekStart.setHours(0, 0, 0, 0);

        // Fetch session records for this week
        const { data: sessions } = await supabase
          .from("session_records")
          .select("date")
          .eq("user_id", user.id)
          .eq("status", "مكتملة");

        // Build a set of Arabic day names that have completed sessions this week
        const sessionDayNames = new Set<string>();
        if (sessions) {
          sessions.forEach((s) => {
            // date format could be "2026-02-15" or Arabic text - try parsing
            const parsed = new Date(s.date);
            if (!isNaN(parsed.getTime())) {
              // Check if it falls within this week (Saturday to Friday)
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 7);
              if (parsed >= weekStart && parsed < weekEnd) {
                const sDayIndex = parsed.getDay();
                sessionDayNames.add(dayMap[sDayIndex]);
              }
            }
          });
        }

        const done: string[] = [];
        const missed: string[] = [];
        data.days.forEach((d: string) => {
          const dOrder = orderedDays.indexOf(d);
          if (dOrder < todayOrder) {
            if (sessionDayNames.has(d)) done.push(d);
            else missed.push(d);
          }
        });
        setCompletedDays(done);
        setMissedDays(missed);
      }
      setLoadingPlan(false);
    };
    fetchPlan();
  }, [user]);

  const achievements = isReciter ? reciterAchievements : studentAchievements;
  const subtitle = isReciter
    ? "تابع مسيرتك وإنجازاتك في الإقراء"
    : "تابع مسيرتك وإنجازاتك القرآنية";

  // Build real stats from DB data
  const totalHours = achievementData ? Math.round(achievementData.total_minutes / 60) : 0;
  const totalSessions = achievementData?.sessions_count ?? 0;
  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalCount = achievements.length;

  const stats = [
    { label: "ساعات الإقراء", value: `${totalHours}`, icon: BookOpen },
    { label: "إنجازات مكتسبة", value: `${earnedCount}/${totalCount}`, icon: Trophy },
    { label: "الجلسات", value: `${totalSessions}`, icon: Flame },
    { label: "معدل الالتزام", value: `${achievementData?.commitment_rate ?? 0}%`, icon: Star },
  ];

  // Level calculation based on total_minutes
  const totalMinutes = achievementData?.total_minutes ?? 0;
  const level = Math.floor(totalMinutes / 300) + 1;
  const pointsInLevel = totalMinutes % 300;
  const pointsToNext = 300 - pointsInLevel;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-10 rounded-b-[2.5rem]">
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-primary-foreground mb-2 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6" />
            إنجازاتي
          </h1>
          <p className="text-primary-foreground/80 text-sm text-center">{subtitle}</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 -mt-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-3"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 + i * 0.03 }}
              className="flex items-center gap-3 p-2"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Weekly Plan Progress */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4" dir="rtl">
            <span className="font-bold text-foreground text-sm">تقدم الخطة الأسبوعية</span>
            <span className="text-xs text-primary font-semibold">
              {completedDays.length}/{planDays.length} أيام
            </span>
          </div>
          <div className="flex items-center justify-between gap-2" dir="rtl">
            {planDays.map((dayKey) => {
              const day = weekDays.find((d) => d.key === dayKey);
              const isDone = completedDays.includes(dayKey);
              const isMissed = missedDays.includes(dayKey);
              return (
                <div key={dayKey} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[10px] font-semibold text-foreground">{day?.label}</span>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isDone ? "bg-green-500 shadow-md" : isMissed ? "bg-red-400 shadow-md" : "bg-muted"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : isMissed ? (
                      <X className="w-4 h-4 text-white" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1 mt-3" dir="rtl">
            {planDays.map((dayKey) => {
              const isDone = completedDays.includes(dayKey);
              const isMissed = missedDays.includes(dayKey);
              return (
                <motion.div
                  key={dayKey}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className={`flex-1 h-2 rounded-full ${
                    isDone ? "bg-green-500" : isMissed ? "bg-red-400" : "bg-muted"
                  }`}
                />
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Level Progress */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              <span className="font-bold text-foreground">المستوى {level}</span>
            </div>
            <span className="text-sm text-primary font-bold">{pointsInLevel} / 300 دقيقة</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((pointsInLevel / 300) * 100, 100)}%` }}
              transition={{ delay: 0.15, duration: 0.8 }}
              className="h-full gradient-gold rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {pointsToNext} دقيقة للوصول إلى المستوى {level + 1} 🌟
          </p>
        </motion.div>
      </div>

      {/* Achievements List - Categorized */}
      <div className="px-5 mt-6">
        {/* إنجازات قرآنية */}
        <h2 className="text-lg font-bold text-foreground mb-3">📖 إنجازات قرآنية</h2>
        <div className="space-y-3 mb-6">
          {achievements
            .filter((a) => a.category === "quran")
            .map((ach, i) => {
              const AchIcon = ach.icon;
              return (
                <motion.div
                  key={ach.id}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                  className={`glass-card rounded-2xl p-4 flex items-center gap-4 ${!ach.earned ? "opacity-70" : ""}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.earned ? "bg-gold/20 shadow-md" : "bg-muted"
                    }`}
                  >
                    <AchIcon className={`w-5 h-5 ${ach.earned ? "text-gold" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">{ach.title}</h3>
                    <p className="text-xs text-muted-foreground">{ach.desc}</p>
                    {ach.earned ? (
                      <p className="text-xs text-primary mt-1">✓ مكتسب · {ach.date}</p>
                    ) : (
                      <div className="mt-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-gold rounded-full transition-all"
                            style={{ width: `${((ach.progress || 0) / (ach.total || 1)) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {ach.progress}/{ach.total}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>

        {/* إنجازات الأداء */}
        <h2 className="text-lg font-bold text-foreground mb-3">⚡ إنجازات الأداء</h2>
        <div className="space-y-3">
          {achievements
            .filter((a) => a.category === "performance")
            .map((ach, i) => {
              const AchIcon = ach.icon;
              return (
                <motion.div
                  key={ach.id}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.03 }}
                  className={`glass-card rounded-2xl p-4 flex items-center gap-4 ${!ach.earned ? "opacity-70" : ""}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.earned ? "bg-primary/10 shadow-md" : "bg-muted"
                    }`}
                  >
                    <AchIcon className={`w-5 h-5 ${ach.earned ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">{ach.title}</h3>
                    <p className="text-xs text-muted-foreground">{ach.desc}</p>
                    {ach.earned ? (
                      <p className="text-xs text-primary mt-1">✓ مكتسب · {ach.date}</p>
                    ) : (
                      <div className="mt-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full transition-all"
                            style={{ width: `${((ach.progress || 0) / (ach.total || 1)) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {ach.progress}/{ach.total}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
