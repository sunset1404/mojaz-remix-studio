import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, BookOpen, Award, GraduationCap, 
  TrendingUp, FileText, ArrowLeft, Settings,
  UserCheck, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        studentsRes,
        recitersRes,
        partnersRes,
        sessionsRes,
        certificatesRes,
        giftsRes,
        recentStudentsRes,
        recentRecitersRes,
      ] = await Promise.all([
        supabase.from("student_profiles").select("id", { count: "exact", head: true }),
        supabase.from("reciter_profiles").select("id", { count: "exact", head: true }),
        supabase.from("partner_profiles").select("id", { count: "exact", head: true }),
        supabase.from("session_records").select("id", { count: "exact", head: true }),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        supabase.from("gift_subscriptions").select("id", { count: "exact", head: true }),
        supabase.from("student_profiles").select("full_name, nationality, created_at, preferred_track").order("created_at", { ascending: false }).limit(5),
        supabase.from("reciter_profiles").select("full_name, city, created_at, preferred_track").order("created_at", { ascending: false }).limit(5),
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
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "الطلاب", value: stats.totalStudents, icon: Users, color: "primary" },
    { label: "المقرئين", value: stats.totalReciters, icon: GraduationCap, color: "primary" },
    { label: "الشركاء", value: stats.totalPartners, icon: UserCheck, color: "gold" },
    { label: "الجلسات", value: stats.totalSessions, icon: Clock, color: "primary" },
    { label: "الشهادات", value: stats.totalCertificates, icon: Award, color: "gold" },
    { label: "الإهداءات", value: stats.totalGifts, icon: FileText, color: "primary" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">لوحة التحكم</h1>
          <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
        <p className="text-primary-foreground/70 text-sm text-center">إدارة نظام إقراء القرآن الكريم</p>
      </div>

      {/* Stats Grid */}
      <div className="px-5 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    stat.color === "gold" ? "bg-gold/20" : "bg-primary/10"
                  }`}>
                    <stat.icon className={`w-4 h-4 ${
                      stat.color === "gold" ? "text-gold" : "text-primary"
                    }`} />
                  </div>
                  <span className="text-xl font-bold text-foreground">
                    {loading ? "..." : stat.value}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Students */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                أحدث الطلاب المسجلين
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <p className="text-muted-foreground text-sm text-center py-4">جارٍ التحميل...</p>
              ) : stats.recentStudents.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">لا يوجد طلاب بعد</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentStudents.map((student, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border/30">
                      <div>
                        <p className="font-medium text-sm text-foreground">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.nationality} · {student.preferred_track || "غير محدد"}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(student.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Reciters */}
      <div className="px-5 mt-4 mb-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                أحدث المقرئين المسجلين
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <p className="text-muted-foreground text-sm text-center py-4">جارٍ التحميل...</p>
              ) : stats.recentReciters.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">لا يوجد مقرئين بعد</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentReciters.map((reciter, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border/30">
                      <div>
                        <p className="font-medium text-sm text-foreground">{reciter.full_name}</p>
                        <p className="text-xs text-muted-foreground">{reciter.city} · {reciter.preferred_track || "غير محدد"}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(reciter.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
