import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Star, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type Period = "week" | "month" | "year" | "custom";

interface SessionRecord {
  other_user_name: string;
  duration: string;
  status: string;
  rating: number | null;
  created_at: string;
}

interface ChartData {
  label: string;
  sessions: number;
}

const periodOptions: { key: Period; label: string }[] = [
  { key: "week", label: "أسبوع" },
  { key: "month", label: "شهر" },
  { key: "year", label: "سنة" },
  { key: "custom", label: "مخصص" },
];

const getDateRange = (period: Period, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let start: Date;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
      end = customEnd ? new Date(customEnd + "T23:59:59") : end;
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start, end };
};

const ReciterMyStats = () => {
  const { user } = useAuth();
  const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("session_records")
      .select("other_user_name, duration, status, rating, created_at")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setAllSessions(data || []);
        setLoading(false);
      });
  }, [user]);

  const { start, end } = useMemo(() => getDateRange(period, customStart, customEnd), [period, customStart, customEnd]);

  const filtered = useMemo(() => {
    return allSessions.filter((s) => {
      const d = new Date(s.created_at);
      return d >= start && d <= end;
    });
  }, [allSessions, start, end]);

  const completed = useMemo(() => filtered.filter((s) => s.status === "مكتملة"), [filtered]);

  const stats = useMemo(() => {
    const totalMinutes = completed.reduce((acc, s) => {
      const nums = s.duration.replace(/[^0-9]/g, "");
      return acc + (parseInt(nums) || 0);
    }, 0);
    const uniqueStudents = new Set(completed.map((s) => s.other_user_name)).size;
    const ratings = completed.filter((s) => s.rating != null).map((s) => s.rating!);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    return {
      totalMinutes,
      completedSessions: completed.length,
      uniqueStudents,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  }, [completed]);

  const chartData = useMemo((): ChartData[] => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    if (period === "week" || (period === "custom" && (end.getTime() - start.getTime()) <= 8 * 86400000)) {
      // Day-by-day
      const result: ChartData[] = [];
      const d = new Date(start);
      while (d <= end) {
        const dayStr = d.toISOString().split("T")[0];
        const count = completed.filter((s) => s.created_at?.startsWith(dayStr)).length;
        result.push({ label: days[d.getDay()], sessions: count });
        d.setDate(d.getDate() + 1);
      }
      return result;
    }

    if (period === "year" || (period === "custom" && (end.getTime() - start.getTime()) > 90 * 86400000)) {
      // Month-by-month
      const result: ChartData[] = [];
      const d = new Date(start.getFullYear(), start.getMonth(), 1);
      while (d <= end) {
        const m = d.getMonth();
        const y = d.getFullYear();
        const count = completed.filter((s) => {
          const sd = new Date(s.created_at);
          return sd.getMonth() === m && sd.getFullYear() === y;
        }).length;
        result.push({ label: months[m], sessions: count });
        d.setMonth(d.getMonth() + 1);
      }
      return result;
    }

    // Month view or medium custom: week-by-week
    const result: ChartData[] = [];
    let weekNum = 1;
    const d = new Date(start);
    while (d <= end) {
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > end) weekEnd.setTime(end.getTime());
      const ws = d.toISOString().split("T")[0];
      const we = weekEnd.toISOString().split("T")[0];
      const count = completed.filter((s) => {
        const sd = s.created_at?.split("T")[0] || "";
        return sd >= ws && sd <= we;
      }).length;
      result.push({ label: `أسبوع ${weekNum}`, sessions: count });
      d.setDate(d.getDate() + 7);
      weekNum++;
    }
    return result;
  }, [completed, period, start, end]);

  const chartTitle = period === "week" ? "النشاط الأسبوعي" : period === "month" ? "النشاط الشهري" : period === "year" ? "النشاط السنوي" : "النشاط";

  const statCards = [
    { label: "إجمالي الدقائق", value: stats.totalMinutes, icon: Clock, color: "primary" },
    { label: "جلسات مكتملة", value: stats.completedSessions, icon: Calendar, color: "gold" },
    { label: "طلاب فريدون", value: stats.uniqueStudents, icon: Users, color: "primary" },
    { label: "متوسط التقييم", value: stats.avgRating || "-", icon: Star, color: "gold" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-[2.5rem]">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-primary-foreground mb-1 flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-6 h-6" />
          إحصائياتي
        </motion.h1>
        <p className="text-sm text-primary-foreground/80 text-center">ملخص أدائك في الإقراء</p>
      </div>

      {/* Period Selector */}
      <div className="px-5 mt-5 mb-4">
        <div className="flex gap-2 justify-center">
          {periodOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === opt.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="flex gap-3 mt-3 justify-center"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">من</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">إلى</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.color === "gold" ? "bg-gold/20" : "bg-primary/10"} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-5 h-5 ${stat.color === "gold" ? "text-gold" : "text-primary"}`} />
              </div>
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-base">{chartTitle}</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, direction: "rtl" }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value: number) => [`${value} جلسة`, "الجلسات"]}
              />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default ReciterMyStats;
