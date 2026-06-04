import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users, Search, Phone, Mail, MessageCircle,
  Globe, UserCheck, TrendingUp, BookOpen,
  RefreshCw, ChevronDown, ChevronUp, Filter,
  ArrowRight, Award, ClipboardCheck, GraduationCap, Trash2
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
  quran_certifications: string | null;
  created_at: string;
  ijazah_status: string | null;
  assigned_reciter_id: string | null;
}

interface ReciterOption {
  user_id: string;
  full_name: string;
  preferred_track: string;
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

const IJAZAH_STATUSES = [
  { value: "pending_test", label: "بانتظار اختبار القبول", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: ClipboardCheck },
  { value: "assigned_to_reciter", label: "تم التحويل لمقرئ", color: "bg-blue-100 text-blue-800 border-blue-200", icon: UserCheck },
  { value: "recitation_completed", label: "انتهاء الإقراء", color: "bg-purple-100 text-purple-800 border-purple-200", icon: BookOpen },
  { value: "merit_test", label: "اختبار استحقاق", color: "bg-orange-100 text-orange-800 border-orange-200", icon: ClipboardCheck },
  { value: "ijazah_granted", label: "حصل على الإجازة", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: Award },
];

const getStatusInfo = (status: string | null) => {
  return IJAZAH_STATUSES.find(s => s.value === status) || IJAZAH_STATUSES[0];
};

const AdminIjazahStudents = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [reciters, setReciters] = useState<ReciterOption[]>([]);
  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
      const [studentsRes, recitersRes, achievementsRes] = await Promise.all([
        supabase.from("student_profiles").select("*")
          .eq("preferred_track", "الحصول على إجازة قرآنية")
          .order("created_at", { ascending: false }),
        supabase.from("reciter_profiles").select("user_id, full_name, preferred_track, gender")
          .eq("status", "approved"),
        supabase.from("student_achievements").select("*"),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      setStudents(studentsRes.data || []);
      setReciters(recitersRes.data || []);
      setAchievements(achievementsRes.data || []);
    } catch (error: any) {
      toast({ title: "خطأ في تحميل البيانات", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getAchievement = (studentId: string) =>
    achievements.find((a) => a.student_id === studentId);

  const getReciterName = (reciterId: string | null) => {
    if (!reciterId) return "غير مُسكَّن";
    return reciters.find(r => r.user_id === reciterId)?.full_name || "غير معروف";
  };

  const updateStudentStatus = async (studentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("student_profiles")
        .update({ ijazah_status: newStatus })
        .eq("id", studentId);
      if (error) throw error;
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ijazah_status: newStatus } : s));
      toast({ title: "تم تحديث الحالة بنجاح" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const assignReciter = async (studentId: string, reciterId: string) => {
    try {
      const { error } = await supabase
        .from("student_profiles")
        .update({ assigned_reciter_id: reciterId, ijazah_status: "assigned_to_reciter" })
        .eq("id", studentId);
      if (error) throw error;
      setStudents(prev => prev.map(s => s.id === studentId 
        ? { ...s, assigned_reciter_id: reciterId, ijazah_status: "assigned_to_reciter" } 
        : s
      ));
      toast({ title: "تم تسكين الطالب على المقرئ بنجاح" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    const total = students.length;
    const statusCounts: Record<string, number> = {};
    IJAZAH_STATUSES.forEach(s => { statusCounts[s.value] = 0; });
    students.forEach(s => {
      const st = s.ijazah_status || "pending_test";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });
    return { total, statusCounts };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = !searchQuery ||
        s.full_name.includes(searchQuery) ||
        s.email.includes(searchQuery) ||
        s.phone.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || (s.ijazah_status || "pending_test") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${cleaned.replace("+", "")}`, "_blank");
  };

  const openEmail = (email: string) => {
    window.open(`mailto:${email}`, "_blank");
  };

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
              <h1 className="text-lg font-bold text-foreground">طلاب الإجازات القرآنية</h1>
              <p className="text-xs text-muted-foreground">إدارة ومتابعة طلاب مسار الإجازة القرآنية</p>
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
              <Award className="w-7 h-7 text-gold" />
              <h2 className="text-2xl font-bold text-primary-foreground">طلاب الإجازات القرآنية</h2>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-2xl">
              متابعة مسار طلاب الإجازة: اختبار القبول، التسكين على المقرئ، الإقراء، اختبار الاستحقاق، ومنح الإجازة
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className="border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-2xl font-bold text-foreground">{loading ? <span className="inline-block w-8 h-6 rounded bg-muted animate-pulse" /> : stats.total}</span>
                <span className="text-sm font-medium text-foreground">إجمالي الطلاب</span>
              </CardContent>
            </Card>
          </motion.div>
          {IJAZAH_STATUSES.map((status, i) => (
            <motion.div key={status.value} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: (i + 1) * 0.08 }}>
              <Card className={`border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer ${statusFilter === status.value ? "ring-2 ring-primary" : ""}`}
                onClick={() => setStatusFilter(statusFilter === status.value ? "all" : status.value)}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                  <div className="w-11 h-11 rounded-2xl bg-gold/15 flex items-center justify-center shadow-sm">
                    <status.icon className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? <span className="inline-block w-8 h-6 rounded bg-muted animate-pulse" /> : stats.statusCounts[status.value] || 0}
                  </span>
                  <span className="text-[11px] font-medium text-foreground leading-tight">{status.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Students List */}
      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/30 bg-accent/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-primary" />
                  </div>
                  طلاب الإجازات
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
                    const statusInfo = getStatusInfo(student.ijazah_status);
                    return (
                      <motion.div
                        key={student.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div className={`rounded-xl border border-border/30 overflow-hidden transition-all duration-200 ${
                          isExpanded ? "bg-accent/30 shadow-sm" : "bg-accent/10 hover:bg-accent/20"
                        }`}>
                          {/* Main Row */}
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground">{student.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {student.preferred_riwaya || "غير محدد"} · {student.nationality}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`text-[10px] border ${statusInfo.color}`}>
                                {statusInfo.label}
                              </Badge>
                              <div className="hidden md:flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                  onClick={(e) => { e.stopPropagation(); openWhatsApp(student.phone); }}>
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                  onClick={(e) => { e.stopPropagation(); openEmail(student.email); }}>
                                  <Mail className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                  onClick={(e) => { e.stopPropagation(); window.open(`tel:${student.phone}`, "_self"); }}>
                                  <Phone className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(student); }}
                                  title="حذف الطالب">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
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
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Personal Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <Users className="w-3 h-3" /> البيانات الشخصية
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">البريد:</span><span className="font-medium text-foreground">{student.email}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجوال:</span><span className="font-medium text-foreground" dir="ltr">{student.phone}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجنسية:</span><span className="font-medium text-foreground">{student.nationality}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المؤهل:</span><span className="font-medium text-foreground">{student.education_level}</span></div>
                                      </div>
                                    </div>

                                    {/* Quranic Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-gold flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> بيانات الإجازة
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">الرواية:</span><span className="font-medium text-foreground">{student.preferred_riwaya || "غير محدد"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">إجازات سابقة:</span><span className="font-medium text-foreground">{student.quran_certifications || "لا يوجد"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المقرئ:</span><span className="font-medium text-foreground">{getReciterName(student.assigned_reciter_id)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">التسجيل:</span><span className="font-medium text-foreground">{new Date(student.created_at).toLocaleDateString("ar-SA")}</span></div>
                                      </div>
                                    </div>

                                    {/* Status Management */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <ClipboardCheck className="w-3 h-3" /> تغيير الحالة
                                      </h4>
                                      <Select
                                        value={student.ijazah_status || "pending_test"}
                                        onValueChange={(val) => updateStudentStatus(student.id, val)}
                                      >
                                        <SelectTrigger className="h-9 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {IJAZAH_STATUSES.map(s => (
                                            <SelectItem key={s.value} value={s.value} className="text-xs">
                                              {s.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>

                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1 mt-3">
                                        <UserCheck className="w-3 h-3" /> تسكين على مقرئ
                                      </h4>
                                      <Select
                                        value={student.assigned_reciter_id || ""}
                                        onValueChange={(val) => assignReciter(student.id, val)}
                                      >
                                        <SelectTrigger className="h-9 text-xs">
                                          <SelectValue placeholder="اختر المقرئ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {reciters.filter(r => (r as any).gender === student.gender).map(r => (
                                            <SelectItem key={r.user_id} value={r.user_id} className="text-xs">
                                              {r.full_name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Achievements */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> الأداء
                                      </h4>
                                      {ach ? (
                                        <div className="space-y-1.5 text-xs">
                                          <div className="flex justify-between"><span className="text-muted-foreground">الجلسات:</span><span className="font-medium text-foreground">{ach.sessions_count}</span></div>
                                          <div className="flex justify-between"><span className="text-muted-foreground">الدقائق:</span><span className="font-medium text-foreground">{Math.round(ach.total_minutes)}</span></div>
                                          <div className="flex justify-between"><span className="text-muted-foreground">الالتزام:</span><span className="font-medium text-foreground">{Math.round(Number(ach.commitment_rate))}%</span></div>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">لا توجد بيانات أداء</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Mobile Contact */}
                                  <div className="flex md:hidden items-center gap-2 mt-4 pt-3 border-t border-border/20">
                                    <Button variant="outline" size="sm" className="flex-1 gap-2 text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={() => openWhatsApp(student.phone)}>
                                      <MessageCircle className="w-4 h-4" /> واتساب
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                      onClick={() => openEmail(student.email)}>
                                      <Mail className="w-4 h-4" /> بريد
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-2 text-primary border-primary/20 hover:bg-primary/10"
                                      onClick={() => window.open(`tel:${student.phone}`, "_self")}>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الطالب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الطالب <span className="font-bold text-foreground">{deleteTarget?.full_name}</span>؟
              سيتم حذف جميع بياناته نهائياً من قاعدة البيانات (الجلسات، الإنجازات، الشهادات، الاشتراكات، والحساب). لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "جاري الحذف..." : "حذف نهائي"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminIjazahStudents;
