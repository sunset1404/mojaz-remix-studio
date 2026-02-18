import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Award, GraduationCap, 
  FileText, Settings, UserCheck, Clock,
  TrendingUp, LogOut, LayoutDashboard, Gift,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import logoMojaz from "@/assets/logo-mojaz.webp";

interface DashboardStats {
  totalStudents: number;
  totalReciters: number;
  totalPartners: number;
  totalSessions: number;
  totalCertificates: number;
  totalGifts: number;
  recentStudents: any[];
  recentReciters: any[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalReciters: 0,
    totalPartners: 0,
    totalSessions: 0,
    totalCertificates: 0,
    totalGifts: 0,
    recentStudents: [],
    recentReciters: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { signOut, user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        studentsRes, recitersRes, partnersRes, sessionsRes,
        certificatesRes, giftsRes, recentStudentsRes, recentRecitersRes,
      ] = await Promise.all([
        supabase.from("student_profiles").select("id", { count: "exact", head: true }),
        supabase.from("reciter_profiles").select("id", { count: "exact", head: true }),
        supabase.from("partner_profiles").select("id", { count: "exact", head: true }),
        supabase.from("session_records").select("id", { count: "exact", head: true }),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        supabase.from("gift_subscriptions").select("id", { count: "exact", head: true }),
        supabase.from("student_profiles").select("full_name, nationality, created_at, preferred_track, gender, phone").order("created_at", { ascending: false }).limit(8),
        supabase.from("reciter_profiles").select("full_name, city, created_at, preferred_track, gender, phone").order("created_at", { ascending: false }).limit(8),
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalReciters: recitersRes.count || 0,
        totalPartners: partnersRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        totalCertificates: certificatesRes.count || 0,
        totalGifts: giftsRes.count || 0,
        recentStudents: recentStudentsRes.data || [],
        recentReciters: recentRecitersRes.data || [],
      });
    } catch (error: any) {
      toast({ title: "خطأ في تحميل البيانات", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "إجمالي الطلاب", value: stats.totalStudents, icon: Users, color: "primary", desc: "طالب مسجل في النظام" },
    { label: "المقرئين", value: stats.totalReciters, icon: GraduationCap, color: "primary", desc: "مقرئ ومقرئة معتمدين" },
    { label: "الشركاء", value: stats.totalPartners, icon: UserCheck, color: "gold", desc: "شريك داعم للبرنامج" },
    { label: "الجلسات", value: stats.totalSessions, icon: Clock, color: "primary", desc: "جلسة قراءة مسجلة" },
    { label: "الشهادات", value: stats.totalCertificates, icon: Award, color: "gold", desc: "شهادة وإجازة صادرة" },
    { label: "الإهداءات", value: stats.totalGifts, icon: Gift, color: "gold", desc: "اشتراك مُهدى" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoMojaz} alt="مجاز" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <h1 className="text-lg font-bold text-foreground">لوحة تحكم مجاز</h1>
              <p className="text-xs text-muted-foreground">نظام إدارة إقراء القرآن الكريم</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading} className="gap-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2 text-destructive hover:bg-destructive/10 border-destructive/30">
              <LogOut className="w-4 h-4" />
              خروج
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="gradient-primary px-6 py-12">
          <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-white/5 -translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-white/5 translate-x-16 translate-y-16" />
          <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-white/3 -translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="w-8 h-8 text-gold" />
              <h2 className="text-3xl font-bold text-primary-foreground">مرحباً بك في لوحة التحكم</h2>
            </div>
            <p className="text-primary-foreground/70 text-base max-w-2xl">
              إدارة شاملة للطلاب والمقرئين والاشتراكات والإجازات القرآنية
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="group border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-5 flex flex-col items-center text-center gap-2 relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                    stat.color === "gold" ? "bg-gold/15" : "bg-primary/10"
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === "gold" ? "text-gold" : "text-primary"
                    }`} />
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    {loading ? (
                      <span className="inline-block w-8 h-8 rounded bg-muted animate-pulse" />
                    ) : stat.value}
                  </span>
                  <span className="text-sm font-medium text-foreground">{stat.label}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">{stat.desc}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Students */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader className="border-b border-border/30 bg-accent/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  أحدث الطلاب المسجلين
                  <Badge variant="secondary" className="mr-auto text-xs">
                    {stats.totalStudents} طالب
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
                    ))}
                  </div>
                ) : stats.recentStudents.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">لا يوجد طلاب مسجلين بعد</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentStudents.map((student, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-border/20 hover:bg-accent/40 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.nationality} · {student.gender} · {student.preferred_track || "غير محدد"}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-[11px] text-muted-foreground block">
                            {new Date(student.created_at).toLocaleDateString("ar-SA")}
                          </span>
                          {student.phone && (
                            <span className="text-[10px] text-muted-foreground">{student.phone}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Reciters */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader className="border-b border-border/30 bg-accent/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-gold" />
                  </div>
                  أحدث المقرئين المسجلين
                  <Badge variant="secondary" className="mr-auto text-xs">
                    {stats.totalReciters} مقرئ
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
                    ))}
                  </div>
                ) : stats.recentReciters.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">لا يوجد مقرئين مسجلين بعد</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentReciters.map((reciter, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7 + i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-border/20 hover:bg-accent/40 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4 text-gold" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{reciter.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {reciter.city} · {reciter.gender} · {reciter.preferred_track || "غير محدد"}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-[11px] text-muted-foreground block">
                            {new Date(reciter.created_at).toLocaleDateString("ar-SA")}
                          </span>
                          {reciter.phone && (
                            <span className="text-[10px] text-muted-foreground">{reciter.phone}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
