import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Users, Search, Phone, Mail, MessageCircle,
  Globe, UserCheck, TrendingUp, BookOpen,
  RefreshCw, ChevronDown, ChevronUp, Filter,
  ArrowRight, Trash2
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  nationality: string;
  residence_country: string;
  education_level: string;
  profession: string;
  preferred_track: string;
  preferred_riwaya: string;
  created_at: string;
}

interface StudentAchievement {
  student_id: string;
  sessions_count: number;
  total_minutes: number;
  parts_memorized: number;
  pages_memorized: number;
  certificates_count: number;
  commitment_rate: number;
  completions: number;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-student", {
        body: { user_id: deleteTarget.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
      toast({ title: "تم حذف الطالب بنجاح" });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: "فشل الحذف", description: err?.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, achievementsRes] = await Promise.all([
        supabase.from("student_profiles").select("*").neq("preferred_track", "الحصول على إجازة قرآنية").order("created_at", { ascending: false }),
        supabase.from("student_achievements").select("*"),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      setStudents(studentsRes.data || []);
      setAchievements(achievementsRes.data || []);
    } catch (error: any) {
      toast({ title: "خطأ في تحميل البيانات", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getAchievement = (studentId: string) =>
    achievements.find((a) => a.student_id === studentId);

  // Stats calculations
  const stats = useMemo(() => {
    const total = students.length;
    const males = students.filter((s) => s.gender === "male").length;
    const females = students.filter((s) => s.gender === "female").length;
    const nationalityMap: Record<string, number> = {};
    students.forEach((s) => {
      nationalityMap[s.nationality] = (nationalityMap[s.nationality] || 0) + 1;
    });
    const topNationalities = Object.entries(nationalityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const trackMap: Record<string, number> = {};
    students.forEach((s) => {
      if (s.preferred_track) trackMap[s.preferred_track] = (trackMap[s.preferred_track] || 0) + 1;
    });

    const totalSessions = achievements.reduce((sum, a) => sum + a.sessions_count, 0);
    const totalMinutes = achievements.reduce((sum, a) => sum + a.total_minutes, 0);
    const avgCommitment = achievements.length > 0
      ? achievements.reduce((sum, a) => sum + Number(a.commitment_rate), 0) / achievements.length
      : 0;

    return { total, males, females, topNationalities, trackMap, totalSessions, totalMinutes, avgCommitment };
  }, [students, achievements]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = !searchQuery ||
        s.full_name.includes(searchQuery) ||
        s.email.includes(searchQuery) ||
        s.phone.includes(searchQuery) ||
        s.nationality.includes(searchQuery);
      const matchesGender = genderFilter === "all" || s.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [students, searchQuery, genderFilter]);

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${cleaned.replace("+", "")}`, "_blank");
  };

  const openEmail = (email: string) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const statCards = [
    { label: "إجمالي الطلاب", value: stats.total, icon: Users, color: "primary", desc: "طالب مسجل" },
    { label: "الذكور", value: stats.males, icon: UserCheck, color: "primary", desc: "طالب" },
    { label: "الإناث", value: stats.females, icon: UserCheck, color: "gold", desc: "طالبة" },
    { label: "الجلسات", value: stats.totalSessions, icon: BookOpen, color: "primary", desc: "جلسة مكتملة" },
    { label: "إجمالي الدقائق", value: Math.round(stats.totalMinutes), icon: TrendingUp, color: "gold", desc: "دقيقة تعلم" },
    { label: "معدل الالتزام", value: `${Math.round(stats.avgCommitment)}%`, icon: TrendingUp, color: "primary", desc: "متوسط الأداء" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1 text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">طلاب الإقراء</h1>
              <p className="text-xs text-muted-foreground">عرض وإدارة طلاب مسارات الإقراء (حفظ، تلاوة، مراجعة)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="gradient-primary px-6 py-10">
          <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-white/5 -translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-white/5 translate-x-16 translate-y-16" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-7 h-7 text-gold" />
              <h2 className="text-2xl font-bold text-primary-foreground">لوحة إدارة طلاب الإقراء</h2>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-2xl">
              متابعة شاملة للطلاب المسجلين وأدائهم وإنجازاتهم في برنامج إقراء القرآن الكريم
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="group border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1.5 relative">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
                    stat.color === "gold" ? "bg-gold/15" : "bg-primary/10"
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === "gold" ? "text-gold" : "text-primary"
                    }`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? <span className="inline-block w-8 h-6 rounded bg-muted animate-pulse" /> : stat.value}
                  </span>
                  <span className="text-sm font-medium text-foreground">{stat.label}</span>
                  <span className="text-[11px] text-muted-foreground">{stat.desc}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Insights Row */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Nationalities */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                  </div>
                  أكثر الجنسيات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded-lg bg-muted/50 animate-pulse" />)}</div>
                ) : stats.topNationalities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topNationalities.map(([nat, count], i) => (
                      <div key={nat} className="flex items-center justify-between p-2 rounded-lg bg-accent/20">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm font-medium text-foreground">{nat}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{count} طالب</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tracks Distribution */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-gold" />
                  </div>
                  المسارات القرآنية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded-lg bg-muted/50 animate-pulse" />)}</div>
                ) : Object.keys(stats.trackMap).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.trackMap).map(([track, count]) => (
                      <div key={track} className="flex items-center justify-between p-2 rounded-lg bg-accent/20">
                        <span className="text-sm font-medium text-foreground">{track || "غير محدد"}</span>
                        <Badge variant="secondary" className="text-xs">{count} طالب</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Students List */}
      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/30 bg-accent/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  جميع الطلاب المسجلين
                  <Badge variant="secondary" className="text-xs">{filteredStudents.length} طالب</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث بالاسم أو البريد أو الجوال..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9 bg-card border-border/50 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    {["all", "male", "female"].map((g) => (
                      <Button
                        key={g}
                        variant={genderFilter === g ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGenderFilter(g)}
                        className="text-xs h-8 px-3"
                      >
                        {g === "all" ? "الكل" : g === "male" ? "ذكور" : "إناث"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-12">لا يوجد طلاب مطابقين للبحث</p>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student, i) => {
                    const ach = getAchievement(student.user_id);
                    const isExpanded = expandedStudent === student.id;
                    return (
                      <motion.div
                        key={student.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div
                          className={`rounded-xl border border-border/30 overflow-hidden transition-all duration-200 ${
                            isExpanded ? "bg-accent/30 shadow-sm" : "bg-accent/10 hover:bg-accent/20"
                          }`}
                        >
                          {/* Main Row */}
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground">{student.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {student.nationality} · {student.gender === "male" ? "ذكر" : "أنثى"} · {student.preferred_track || "غير محدد"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Quick contact buttons */}
                              <div className="hidden md:flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                  onClick={(e) => { e.stopPropagation(); openWhatsApp(student.phone); }}
                                  title="واتساب"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                  onClick={(e) => { e.stopPropagation(); openEmail(student.email); }}
                                  title="بريد إلكتروني"
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                  onClick={(e) => { e.stopPropagation(); window.open(`tel:${student.phone}`, "_self"); }}
                                  title="اتصال"
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="text-left hidden sm:block">
                                <span className="text-[11px] text-muted-foreground block">
                                  {new Date(student.created_at).toLocaleDateString("ar-SA")}
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 border-t border-border/20 pt-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Personal Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <Users className="w-3 h-3" /> البيانات الشخصية
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">البريد:</span><span className="font-medium text-foreground">{student.email}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجوال:</span><span className="font-medium text-foreground" dir="ltr">{student.phone}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجنسية:</span><span className="font-medium text-foreground">{student.nationality}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الإقامة:</span><span className="font-medium text-foreground">{student.residence_country}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المؤهل:</span><span className="font-medium text-foreground">{student.education_level}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المهنة:</span><span className="font-medium text-foreground">{student.profession}</span></div>
                                      </div>
                                    </div>

                                    {/* Quranic Preferences */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-gold flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> التفضيلات القرآنية
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">المسار:</span><span className="font-medium text-foreground">{student.preferred_track || "غير محدد"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الرواية:</span><span className="font-medium text-foreground">{student.preferred_riwaya || "غير محدد"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">التسجيل:</span><span className="font-medium text-foreground">{new Date(student.created_at).toLocaleDateString("ar-SA")}</span></div>
                                      </div>
                                    </div>

                                    {/* Achievements */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> الأداء والإنجازات
                                      </h4>
                                      {ach ? (
                                        <div className="space-y-1.5 text-xs">
                                          <div className="flex justify-between"><span className="text-muted-foreground">الجلسات:</span><span className="font-medium text-foreground">{ach.sessions_count}</span></div>
                                          <div className="flex justify-between"><span className="text-muted-foreground">الدقائق:</span><span className="font-medium text-foreground">{Math.round(ach.total_minutes)}</span></div>
                                          <div className="flex justify-between"><span className="text-muted-foreground">الأجزاء:</span><span className="font-medium text-foreground">{ach.parts_memorized}</span></div>
                                          <div className="flex justify-between"><span className="text-muted-foreground">الصفحات:</span><span className="font-medium text-foreground">{ach.pages_memorized}</span></div>
                                          <div className="flex justify-between"><span className="text-muted-foreground">الالتزام:</span><span className="font-medium text-foreground">{Math.round(Number(ach.commitment_rate))}%</span></div>
                                          <div className="flex justify-between"><span className="text-muted-foreground">الشهادات:</span><span className="font-medium text-foreground">{ach.certificates_count}</span></div>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">لا توجد بيانات أداء بعد</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Mobile Contact Buttons */}
                                  <div className="flex md:hidden items-center gap-2 mt-4 pt-3 border-t border-border/20">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 gap-2 text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={() => openWhatsApp(student.phone)}
                                    >
                                      <MessageCircle className="w-4 h-4" /> واتساب
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                      onClick={() => openEmail(student.email)}
                                    >
                                      <Mail className="w-4 h-4" /> بريد
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 gap-2 text-primary border-primary/20 hover:bg-primary/10"
                                      onClick={() => window.open(`tel:${student.phone}`, "_self")}
                                    >
                                      <Phone className="w-4 h-4" /> اتصال
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminStudents;
