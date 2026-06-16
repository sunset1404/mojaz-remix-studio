import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Users, Search, Phone, Mail, MessageCircle, Globe, UserCheck, TrendingUp, BookOpen,
  RefreshCw, ChevronDown, ChevronUp, Filter, ArrowRight, Trash2, Plus, Pencil,
  ShieldCheck, MailWarning, AlertCircle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ExamEvaluationsSection } from "@/components/exam-evaluation/ExamEvaluationsSection";

interface StudentProfile {
  id: string | null;
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
  quran_certifications?: string | null;
  id_number?: string;
  created_at: string;
  auth_email?: string | null;
  email_confirmed_at?: string | null;
  account_state?: string; // active | unconfirmed | incomplete
  is_orphan?: boolean;
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

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "مفعّل", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  unconfirmed: { label: "بريد غير مفعّل", color: "bg-amber-100 text-amber-800 border-amber-200" },
  incomplete: { label: "بيانات ناقصة", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

const emptyForm = {
  user_id: "", student_id: "" as string | null, email: "", password: "", full_name: "",
  phone: "", gender: "male", nationality: "السعودية", residence_country: "السعودية",
  education_level: "", profession: "", preferred_track: "حفظ القرآن الكريم",
  preferred_riwaya: "حفص عن عاصم", quran_certifications: "", id_number: "",
};

const AdminStudents = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const CACHE_KEY = "admin_students_cache_v1";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const p = JSON.parse(cached);
        if (p?.accounts) setStudents(p.accounts);
        if (p?.achievements) setAchievements(p.achievements);
        setLoading(false);
      } else setLoading(true);
    } catch { setLoading(true); }

    try {
      const [accRes, achRes] = await Promise.all([
        supabase.functions.invoke("list-student-accounts", { body: { track: "general" } }),
        supabase.from("student_achievements").select("*"),
      ]);
      if (accRes.error) throw accRes.error;
      const accounts = (accRes.data as any)?.accounts || [];
      const achs = achRes.data || [];
      setStudents(accounts);
      setAchievements(achs);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ accounts, achievements: achs })); } catch {}
    } catch (e: any) {
      toast({ title: "خطأ في تحميل البيانات", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-student", {
        body: { user_id: deleteTarget.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStudents(prev => prev.filter(s => s.user_id !== deleteTarget.user_id));
      toast({ title: "تم حذف الطالب بنجاح" });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: "فشل الحذف", description: err?.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const activateAccount = async (s: StudentProfile) => {
    setActivatingId(s.user_id);
    try {
      const { data, error } = await supabase.functions.invoke("update-student", {
        body: { action: "activate", user_id: s.user_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "تم تفعيل البريد ✅" });
      fetchData();
    } catch (e: any) {
      toast({ title: "تعذّر التفعيل", description: e.message, variant: "destructive" });
    } finally {
      setActivatingId(null);
    }
  };

  const openAdd = () => {
    setEditing(false);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = async (s: StudentProfile) => {
    setEditing(true);
    setForm({
      user_id: s.user_id,
      student_id: s.id,
      email: s.email || s.auth_email || "",
      password: "",
      full_name: s.full_name || "",
      phone: s.phone || "",
      gender: s.gender || "male",
      nationality: s.nationality || "السعودية",
      residence_country: s.residence_country || s.nationality || "السعودية",
      education_level: s.education_level || "",
      profession: s.profession || "",
      preferred_track: s.preferred_track || "حفظ القرآن الكريم",
      preferred_riwaya: s.preferred_riwaya || "حفص عن عاصم",
      quran_certifications: s.quran_certifications || "",
      id_number: s.id_number || "",
    });
    setDialogOpen(true);
  };

  const submitForm = async () => {
    const req = ["email", "full_name", "phone", "gender"];
    if (!editing) req.push("password");
    for (const k of req) {
      if (!String(form[k] || "").trim()) {
        toast({ title: "يرجى تعبئة الحقول المطلوبة", variant: "destructive" });
        return;
      }
    }
    if (!editing && form.password.length < 6) {
      toast({ title: "كلمة المرور قصيرة (6 أحرف على الأقل)", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const fn = editing ? "update-student" : "create-student";
      const { data, error } = await supabase.functions.invoke(fn, { body: form });
      if (error) {
        const r = (error as any)?.context;
        let msg = error.message;
        if (r?.clone) { try { const j = await r.clone().json(); if (j?.error) msg = j.error; } catch {} }
        throw new Error(msg);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: editing ? "تم تحديث بيانات الطالب ✅" : "تم إنشاء حساب الطالب ✅" });
      setDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: "تعذّر الحفظ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getAchievement = (uid: string) => achievements.find((a) => a.student_id === uid);

  const stats = useMemo(() => {
    const total = students.length;
    const males = students.filter((s) => s.gender === "male").length;
    const females = students.filter((s) => s.gender === "female").length;
    const active = students.filter((s) => s.account_state === "active").length;
    const unconfirmed = students.filter((s) => s.account_state === "unconfirmed").length;
    const incomplete = students.filter((s) => s.account_state === "incomplete").length;
    const nationalityMap: Record<string, number> = {};
    students.forEach((s) => { if (s.nationality) nationalityMap[s.nationality] = (nationalityMap[s.nationality] || 0) + 1; });
    const topNationalities = Object.entries(nationalityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const trackMap: Record<string, number> = {};
    students.forEach((s) => { if (s.preferred_track) trackMap[s.preferred_track] = (trackMap[s.preferred_track] || 0) + 1; });
    const totalSessions = achievements.reduce((sum, a) => sum + a.sessions_count, 0);
    const totalMinutes = achievements.reduce((sum, a) => sum + a.total_minutes, 0);
    const avgCommitment = achievements.length > 0
      ? achievements.reduce((sum, a) => sum + Number(a.commitment_rate), 0) / achievements.length : 0;
    return { total, males, females, active, unconfirmed, incomplete, topNationalities, trackMap, totalSessions, totalMinutes, avgCommitment };
  }, [students, achievements]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = !searchQuery ||
        (s.full_name || "").includes(searchQuery) ||
        (s.email || "").includes(searchQuery) ||
        (s.auth_email || "").includes(searchQuery) ||
        (s.phone || "").includes(searchQuery) ||
        (s.nationality || "").includes(searchQuery);
      const matchesGender = genderFilter === "all" || s.gender === genderFilter;
      const matchesState = stateFilter === "all" || (s.account_state || "active") === stateFilter;
      return matchesSearch && matchesGender && matchesState;
    });
  }, [students, searchQuery, genderFilter, stateFilter]);

  const openWhatsApp = (phone: string) => {
    const cleaned = (phone || "").replace(/[^0-9+]/g, "");
    if (cleaned) window.open(`https://wa.me/${cleaned.replace("+", "")}`, "_blank");
  };
  const openEmail = (email: string) => email && window.open(`mailto:${email}`, "_blank");

  const stateChips = [
    { v: "all", label: "الكل", count: stats.total },
    { v: "active", label: "مفعّل", count: stats.active },
    { v: "unconfirmed", label: "بريد غير مفعّل", count: stats.unconfirmed },
    { v: "incomplete", label: "بيانات ناقصة", count: stats.incomplete },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1 text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">طلاب الإقراء</h1>
              <p className="text-xs text-muted-foreground">إدارة كل حسابات طلاب الإقراء بكل التصنيفات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAdd} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> إضافة طالب
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
          </div>
        </div>
      </nav>

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
              متابعة شاملة لجميع حسابات الطلاب: المفعّلة، التي لم يُفعَّل بريدها، والبيانات الناقصة
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "إجمالي الطلاب", value: stats.total, icon: Users, color: "primary" },
            { label: "مفعّل", value: stats.active, icon: ShieldCheck, color: "primary" },
            { label: "بريد غير مفعّل", value: stats.unconfirmed, icon: MailWarning, color: "gold" },
            { label: "بيانات ناقصة", value: stats.incomplete, icon: AlertCircle, color: "gold" },
            { label: "ذكور", value: stats.males, icon: UserCheck, color: "primary" },
            { label: "إناث", value: stats.females, icon: UserCheck, color: "gold" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${stat.color === "gold" ? "bg-gold/15" : "bg-primary/10"}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color === "gold" ? "text-gold" : "text-primary"}`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? <span className="inline-block w-8 h-6 rounded bg-muted animate-pulse" /> : stat.value}
                  </span>
                  <span className="text-sm font-medium text-foreground">{stat.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/30 bg-accent/20">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  جميع الطلاب
                  <Badge variant="secondary" className="text-xs">{filteredStudents.length}</Badge>
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
                      <Button key={g} variant={genderFilter === g ? "default" : "outline"} size="sm"
                        onClick={() => setGenderFilter(g)} className="text-xs h-8 px-3">
                        {g === "all" ? "الكل" : g === "male" ? "ذكور" : "إناث"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {stateChips.map((c) => (
                  <Button key={c.v} variant={stateFilter === c.v ? "default" : "outline"} size="sm"
                    onClick={() => setStateFilter(c.v)} className="text-xs h-8 px-3 gap-1.5">
                    {c.label}
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{c.count}</Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}
              </div>
            ) : filteredStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">لا يوجد طلاب مطابقين</p>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student, i) => {
                  const ach = getAchievement(student.user_id);
                  const rowKey = student.id || student.user_id;
                  const isExpanded = expandedStudent === rowKey;
                  const stateInfo = STATE_LABELS[student.account_state || "active"] || STATE_LABELS.active;
                  return (
                    <motion.div key={rowKey} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      <div className={`rounded-xl border border-border/30 overflow-hidden ${isExpanded ? "bg-accent/30" : "bg-accent/10 hover:bg-accent/20"}`}>
                        <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedStudent(isExpanded ? null : rowKey)}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-foreground truncate">{student.full_name}</p>
                                <Badge className={`text-[10px] border ${stateInfo.color}`}>{stateInfo.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {student.auth_email || student.email || "—"} · {student.nationality || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {student.account_state === "unconfirmed" && (
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 text-xs"
                                disabled={activatingId === student.user_id}
                                onClick={(e) => { e.stopPropagation(); activateAccount(student); }}>
                                <ShieldCheck className="w-4 h-4" /> تفعيل
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden md:flex text-green-600 hover:bg-green-50"
                              onClick={(e) => { e.stopPropagation(); openWhatsApp(student.phone); }}>
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden md:flex text-blue-600 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); openEmail(student.auth_email || student.email); }}>
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50"
                              onClick={(e) => { e.stopPropagation(); openEdit(student); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(student); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-4 border-t border-border/20 pt-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1.5 text-xs">
                                    <h4 className="text-xs font-bold text-primary mb-1">البيانات</h4>
                                    <div className="flex justify-between"><span className="text-muted-foreground">البريد:</span><span className="text-foreground">{student.auth_email || student.email || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">الجوال:</span><span className="text-foreground" dir="ltr">{student.phone || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">الجنسية:</span><span className="text-foreground">{student.nationality || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">الإقامة:</span><span className="text-foreground">{student.residence_country || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">المؤهل:</span><span className="text-foreground">{student.education_level || "—"}</span></div>
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <h4 className="text-xs font-bold text-gold mb-1">التفضيلات</h4>
                                    <div className="flex justify-between"><span className="text-muted-foreground">المسار:</span><span className="text-foreground">{student.preferred_track || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">الرواية:</span><span className="text-foreground">{student.preferred_riwaya || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">التسجيل:</span><span className="text-foreground">{new Date(student.created_at).toLocaleDateString("ar-SA")}</span></div>
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <h4 className="text-xs font-bold text-primary mb-1">الأداء</h4>
                                    {ach ? (
                                      <>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجلسات:</span><span>{ach.sessions_count}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الدقائق:</span><span>{Math.round(ach.total_minutes)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الالتزام:</span><span>{Math.round(Number(ach.commitment_rate))}%</span></div>
                                      </>
                                    ) : <p className="text-muted-foreground">لا توجد بيانات أداء بعد</p>}
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border/20">
                                  <ExamEvaluationsSection studentId={student.user_id} />
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
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الطالب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف <span className="font-bold text-foreground">{deleteTarget?.full_name}</span>؟
              سيتم حذف الحساب وجميع البيانات المرتبطة نهائيًا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "جاري الحذف..." : "حذف نهائي"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</DialogTitle>
            <DialogDescription>{editing ? "حدّث البيانات ثم احفظ" : "أدخل بيانات الطالب لإنشاء حساب مفعّل مباشرة"}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>البريد الإلكتروني *</Label><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div>
              <Label>كلمة المرور {editing ? "(اتركها فارغة للإبقاء)" : "*"}</Label>
              <Input type="text" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div><Label>الجوال *</Label><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div>
              <Label>الجنس *</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>الجنسية</Label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
            <div><Label>دولة الإقامة</Label><Input value={form.residence_country} onChange={(e) => setForm({ ...form, residence_country: e.target.value })} /></div>
            <div><Label>المؤهل</Label><Input value={form.education_level} onChange={(e) => setForm({ ...form, education_level: e.target.value })} /></div>
            <div><Label>المهنة</Label><Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} /></div>
            <div><Label>رقم الهوية</Label><Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} /></div>
            <div>
              <Label>المسار</Label>
              <Select value={form.preferred_track} onValueChange={(v) => setForm({ ...form, preferred_track: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="حفظ القرآن الكريم">حفظ القرآن الكريم</SelectItem>
                  <SelectItem value="مراجعة">مراجعة</SelectItem>
                  <SelectItem value="تلاوة">تلاوة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>الرواية</Label><Input value={form.preferred_riwaya} onChange={(e) => setForm({ ...form, preferred_riwaya: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={submitForm} disabled={saving}>{saving ? "جاري الحفظ..." : (editing ? "حفظ" : "إنشاء الحساب")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
