import { motion } from "framer-motion";
import { Wallet, Users, Clock, Bell, ChevronLeft, TrendingDown, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const PartnerHome = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: p } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (p) setProfile(p);

      const { count } = await supabase
        .from("partner_students")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", user.id)
        .eq("status", "active");
      setStudentsCount(count || 0);

      const { data: logs } = await supabase
        .from("partner_usage_logs")
        .select("minutes_used")
        .eq("partner_id", user.id);
      const total = logs?.reduce((s, l) => s + Number(l.minutes_used), 0) || 0;
      setTotalMinutes(total);
    };
    fetchData();
  }, [user]);

  const costPerMinute = profile?.cost_per_minute || 0.82;
  const totalSupport = Number(profile?.total_support_amount || 0);
  const consumed = totalMinutes * costPerMinute;
  const remaining = Math.max(totalSupport - consumed, 0);
  const usagePercent = totalSupport > 0 ? Math.min((consumed / totalSupport) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="px-6 pt-10 pb-3">
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground font-cairo">
            أهلاً {profile?.full_name || "أيها الشريك"} 👋
          </h1>
          <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-primary" />
          </button>
        </motion.div>
        <p className="text-sm text-muted-foreground mt-1">شريك داعم · {profile?.organization_name || ""}</p>
      </div>

      {/* Balance Card */}
      <div className="px-5 mt-2">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="relative rounded-2xl overflow-hidden gradient-primary p-5 shadow-lg">
            <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-gold" />
                </div>
                <span className="font-bold text-primary-foreground text-lg">رصيد الدعم</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-[10px] text-primary-foreground/60">المبلغ الأصلي</p>
                  <p className="text-lg font-bold text-primary-foreground">{totalSupport.toLocaleString()}</p>
                  <p className="text-[10px] text-primary-foreground/60">ريال</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-primary-foreground/60">المستهلك</p>
                  <p className="text-lg font-bold text-gold">{consumed.toFixed(0)}</p>
                  <p className="text-[10px] text-primary-foreground/60">ريال</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-primary-foreground/60">المتبقي</p>
                  <p className="text-lg font-bold text-primary-foreground">{remaining.toFixed(0)}</p>
                  <p className="text-[10px] text-primary-foreground/60">ريال</p>
                </div>
              </div>

              <Progress value={usagePercent} className="h-2 bg-white/20" />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-primary-foreground/60">نسبة الاستهلاك {usagePercent.toFixed(0)}%</span>
                <span className="text-[10px] text-primary-foreground/60">تكلفة الدقيقة: {costPerMinute} ريال</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 mt-5">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{studentsCount}</p>
              <p className="text-[10px] text-muted-foreground">طلاب مسكنين</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gold/5">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{totalMinutes.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">دقيقة مستهلكة</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <div className="px-5 mt-5 space-y-3">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} whileTap={{ scale: 0.98 }}>
          <Link to="/partner-dashboard" className="block">
            <div className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">منجزات الطلاب</h3>
                <p className="text-xs text-muted-foreground">لوحة إحصائيات شاملة</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} whileTap={{ scale: 0.98 }}>
          <Link to="/partner-students" className="block">
            <div className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">الطلاب المسكنين</h3>
                <p className="text-xs text-muted-foreground">قائمة الطلاب على دعمك</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default PartnerHome;
