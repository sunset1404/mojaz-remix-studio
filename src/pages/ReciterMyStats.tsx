import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Star, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface WeeklyData {
  day: string;
  sessions: number;
}

const ReciterMyStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMinutes: 0,
    completedSessions: 0,
    uniqueStudents: 0,
    avgRating: 0,
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("session_records")
      .select("other_user_name, duration, status, rating, created_at")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }

        const completed = data.filter((s) => s.status === "مكتملة");
        const totalMinutes = completed.reduce((acc, s) => {
          const nums = s.duration.replace(/[^0-9]/g, "");
          return acc + (parseInt(nums) || 0);
        }, 0);

        const uniqueStudents = new Set(completed.map((s) => s.other_user_name)).size;

        const ratings = completed.filter((s) => s.rating != null).map((s) => s.rating!);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

        setStats({
          totalMinutes,
          completedSessions: completed.length,
          uniqueStudents,
          avgRating: Math.round(avgRating * 10) / 10,
        });

        // Weekly chart - last 7 days
        const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        const now = new Date();
        const weekly: WeeklyData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split("T")[0];
          const count = completed.filter((s) => s.created_at?.startsWith(dayStr)).length;
          weekly.push({ day: days[d.getDay()], sessions: count });
        }
        setWeeklyData(weekly);
        setLoading(false);
      });
  }, [user]);

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

      {/* Stats Grid */}
      <div className="px-5 mt-5 mb-5">
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

      {/* Weekly Chart */}
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
            <h2 className="font-bold text-foreground text-base">النشاط الأسبوعي</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
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
