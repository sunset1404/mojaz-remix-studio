import { motion } from "framer-motion";
import { BookOpen, Layers, Award, Globe, Clock, GraduationCap, CalendarDays, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pages: 0, parts: 0, completions: 0,
    nationalities: 0, minutes: 0, certificates: 0,
    sessions: 0, commitment: 0,
  });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      // Get partner's students
      const { data: ps } = await supabase
        .from("partner_students")
        .select("student_id")
        .eq("partner_id", user.id)
        .eq("status", "active");

      if (!ps || ps.length === 0) return;
      const studentIds = ps.map(s => s.student_id);

      // Get achievements for those students
      const { data: achievements } = await supabase
        .from("student_achievements")
        .select("*")
        .in("student_id", studentIds);

      if (achievements && achievements.length > 0) {
        const nationalities = new Set(achievements.map(a => a.nationality).filter(Boolean));
        setStats({
          pages: achievements.reduce((s, a) => s + a.pages_memorized, 0),
          parts: achievements.reduce((s, a) => s + a.parts_memorized, 0),
          completions: achievements.reduce((s, a) => s + a.completions, 0),
          nationalities: nationalities.size,
          minutes: achievements.reduce((s, a) => s + Number(a.total_minutes), 0),
          certificates: achievements.reduce((s, a) => s + a.certificates_count, 0),
          sessions: achievements.reduce((s, a) => s + a.sessions_count, 0),
          commitment: achievements.length > 0
            ? achievements.reduce((s, a) => s + Number(a.commitment_rate), 0) / achievements.length
            : 0,
        });
      }
    };
    fetchStats();
  }, [user]);

  const cards = [
    { label: "صفحات محفوظة", value: stats.pages, icon: BookOpen, color: "primary" },
    { label: "أجزاء محفوظة", value: stats.parts, icon: Layers, color: "gold" },
    { label: "ختمات", value: stats.completions, icon: Award, color: "primary" },
    { label: "جنسيات", value: stats.nationalities, icon: Globe, color: "gold" },
    { label: "دقائق مستهلكة", value: stats.minutes, icon: Clock, color: "primary" },
    { label: "إجازات وشهادات", value: stats.certificates, icon: GraduationCap, color: "gold" },
    { label: "جلسات منعقدة", value: stats.sessions, icon: CalendarDays, color: "primary" },
    { label: "معدل الالتزام", value: `${stats.commitment.toFixed(0)}%`, icon: TrendingUp, color: "gold" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-6 rounded-b-[2.5rem]">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-primary-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-primary-foreground">منجزات الطلاب</h1>
        </div>
        <p className="text-sm text-primary-foreground/70 mt-2 mr-12">إحصائيات شاملة لجميع الطلاب المسكنين على دعمك</p>
      </div>

      {/* Stats Grid */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-4 flex flex-col items-center text-center"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
              card.color === "gold" ? "bg-gold/10" : "bg-primary/10"
            }`}>
              <card.icon className={`w-6 h-6 ${
                card.color === "gold" ? "text-gold" : "text-primary"
              }`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PartnerDashboard;
