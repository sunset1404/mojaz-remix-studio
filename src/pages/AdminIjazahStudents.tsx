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
  Users, Search, Phone, Mail, MessageCircle, UserCheck, BookOpen, RefreshCw,
  ChevronDown, ChevronUp, ArrowRight, ClipboardCheck, GraduationCap, Award,
  Trash2, Plus, Pencil, ShieldCheck, MailWarning, AlertCircle, TrendingUp, Filter,
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
  quran_certifications: string | null;
  created_at: string;
  ijazah_status: string | null;
  assigned_reciter_id: string | null;
  id_number?: string;
  auth_email?: string | null;
  email_confirmed_at?: string | null;
  account_state?: string;
  is_orphan?: boolean;
}

interface ReciterOption { user_id: string; full_name: string; preferred_track: string; gender?: string; }
interface StudentAchievement {
  student_id: string; sessions_count: number; total_minutes: number;
  parts_memorized: number; pages_memorized: number; certificates_count: number;
  commitment_rate: number; completions: number;
}

const IJAZAH_TRACK = "الحصول على إجازة قرآنية";

const IJAZAH_STATUSES = [
  { value: "pending_test", label: "بانتظار اختبار القبول", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: ClipboardCheck },
  { value: "assigned_to_reciter", label: "تم التحويل لمقرئ", color: "bg-blue-100 text-blue-800 border-blue-200", icon: UserCheck },
  { value: "recitation_completed", label: "انتهاء الإقراء", color: "bg-purple-100 text-purple-800 border-purple-200", icon: BookOpen },
  { value: "merit_test", label: "اختبار استحقاق", color: "bg-orange-100 text-orange-800 border-orange-200", icon: ClipboardCheck },
  { value: "ijazah_granted", label: "حصل على الإجازة", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: Award },
];

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "مفعّل", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  unconfirmed: { label: "بريد غير مفعّل", color: "bg-amber-100 text-amber-800 border-amber-200" },
  incomplete: { label: "بيانات ناقصة", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

const getStatusInfo = (status: string | null) => IJAZAH_STATUSES.find(s => s.value === status) || IJAZAH_STATUSES[0];

const emptyForm = {
  user_id: "", student_id: "" as string | null, email: "", password: "", full_name: "",
  phone: "", gender: "male", nationality: "السعودية", residence_country: "السعودية",
  education_level: "", profession: "", preferred_track: IJAZAH_TRACK,
  preferred_riwaya: "حفص عن عاصم", quran_certifications: "", id_number: "",
  ijazah_status: "pending_test",
};

const AdminIjazahStudents = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [reciters, setReciters] = useState<ReciterOption[]>([]);
  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  const CACHE_KEY = "admin_ijazah_students_cache_v1";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const p = JSON.parse(cached);
        if (p?.accounts) setStudents(p.accounts);
        if (p?.reciters) setReciters(p.reciters);
        if (p?.achievements) setAchievements(p.achievements);
        setLoading(false);
      } else setLoading(true);
    } catch { setLoading(true); }

    try {
      const [accRes, recRes, achRes] = await Promise.all([
        supabase.functions.invoke("list-student-accounts", { body: { track: "ijazah" } }),
        supabase.from("reciter_profiles").select("user_id, full_name, preferred_track, gender").eq("status", "approved"),
        supabase.from("student_achievements").select("*"),
      ]);
      if (accRes.error) throw accRes.error;
      const accounts = (accRes.data as any)?.accounts || [];
      const recs = recRes.data || [];
      const achs = achRes.data || [];
      setStudents(accounts);
      setReciters(recs as any);
      setAchievements(achs);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ accounts, reciters: recs, achievements: achs })); } catch {}
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
      const { data, error } = await supabase.functions.invoke("delete-student", { body: { user_id: deleteTarget.user_id } });
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
      const { data, error } = await supabase.functions.invoke("update-student", { body: { action: "activate", user_id: s.user_id } });
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

  const openEdit = (s: StudentProfile) => {
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
      preferred_track: IJAZAH_TRACK,
      preferred_riwaya: s.preferred_riwaya || "حفص عن عاصم",
      quran_certifications: s.quran_certifications || "",
      id_number: s.id_number || "",
      ijazah_status: s.ijazah_status || "pending_test",
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
      const { data, error } = await supabase.functions.invoke(fn, { body: { ...form, preferred_track: IJAZAH_TRACK } });
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
  const getReciterName = (rid: string | null) => !rid ? "غير مُسكَّن" : reciters.find(r => r.user_id === rid)?.full_name || "غير معروف";

  const normGender = (g?: string | null) => {
    const v = (g || "").trim();
    if (["male", "ذكر", "رجل", "m"].includes(v)) return "male";
    if (["female", "أنثى", "انثى", "f"].includes(v)) return "female";
    return "";
  };
  const recitersFor = (studentGender?: string | null) => {
    const sg = normGender(studentGender);
    if (!sg) return reciters;
    return reciters.filter(r => normGender((r as any).gender) === sg);
  };

  const updateStudentStatus = async (studentId: string | null, newStatus: string) => {
    if (!studentId) return;
    try {
      const { error } = await supabase.from("student_profiles").update({ ijazah_status: newStatus }).eq("id", studentId);
      if (error) throw error;
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ijazah_status: newStatus } : s));
      toast({ title: "تم تحديث الحالة بنجاح" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const assignReciter = async (studentId: string | null, reciterId: string) => {
    if (!studentId) return;
    try {
      const { error } = await supabase.from("student_profiles")
        .update({ assigned_reciter_id: reciterId, ijazah_status: "assigned_to_reciter" }).eq("id", studentId);
      if (error) throw error;
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, assigned_reciter_id: reciterId, ijazah_status: "assigned_to_reciter" } : s));
      toast({ title: "تم تسكين الطالب بنجاح" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.account_state === "active").length;
    const unconfirmed = students.filter(s => s.account_state === "unconfirmed").length;
    const incomplete = students.filter(s => s.account_state === "incomplete").length;
    const statusCounts: Record<string, number> = {};
    IJAZAH_STATUSES.forEach(s => { statusCounts[s.value] = 0; });
    students.forEach(s => {
      if (s.is_orphan) return;
      const st = s.ijazah_status || "pending_test";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });
    return { total, active, unconfirmed, incomplete, statusCounts };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = !searchQuery ||
        (s.full_name || "").includes(searchQuery) ||
        (s.email || "").includes(searchQuery) ||
        (s.auth_email || "").includes(searchQuery) ||
        (s.phone || "").includes(searchQuery);
      const matchesStatus = statusFilter === "all" || (s.ijazah_status || "pending_test") === statusFilter;
      const matchesState = stateFilter === "all" || (s.account_state || "active") === stateFilter;
      return matchesSearch && matchesStatus && matchesState;
    });
  }, [students, searchQuery, statusFilter, stateFilter]);

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
              <h1 className="text-lg font-bold text-foreground">طلاب الإجازات القرآنية</h1>
              <p className="text-xs text-muted-foreground">إدارة كل حسابات طلاب الإجازة بكل التصنيفات</p>
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
              <Award className="w-7 h-7 text-gold" />
              <h2 className="text-2xl font-bold text-primary-foreground">طلاب الإجازات القرآنية</h2>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-2xl">
              متابعة مسار طلاب الإجازة مع تصنيفات الحساب (مفعّل، بريد غير مفعّل، بيانات ناقصة)
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {[
            { label: "إجمالي الطلاب", value: stats.total, icon: GraduationCap, color: "primary" },
            { label: "مفعّل", value: stats.active, icon: ShieldCheck, color: "primary" },
            { label: "بريد غير مفعّل", value: stats.unconfirmed, icon: MailWarning, color: "gold" },
            { label: "بيانات ناقصة", value: stats.incomplete, icon: AlertCircle, color: "gold" },
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

      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {IJAZAH_STATUSES.map((status) => (
            <Card key={status.value}
              className={`border-border/50 shadow-sm cursor-pointer transition-all ${statusFilter === status.value ? "ring-2 ring-primary" : ""}`}
              onClick={() => setStatusFilter(statusFilter === status.value ? "all" : status.value)}>
              <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                <status.icon className="w-4 h-4 text-gold" />
                <span className="text-lg font-bold">{stats.statusCounts[status.value] || 0}</span>
                <span className="text-[10px] font-medium leading-tight">{status.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/30 bg-accent/20">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> طلاب الإجازات
                  <Badge variant="secondary" className="text-xs">{filteredStudents.length}</Badge>
                </CardTitle>
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="بحث بالاسم أو البريد أو الجوال..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 bg-card border-border/50 text-sm" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
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
              <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}</div>
            ) : filteredStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">لا يوجد طلاب مطابقين</p>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student, i) => {
                  const ach = getAchievement(student.user_id);
                  const rowKey = student.id || student.user_id;
                  const isExpanded = expandedStudent === rowKey;
                  const statusInfo = getStatusInfo(student.ijazah_status);
                  const stateInfo = STATE_LABELS[student.account_state || "active"] || STATE_LABELS.active;
                  return (
                    <motion.div key={rowKey} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      <div className={`rounded-xl border border-border/30 overflow-hidden ${isExpanded ? "bg-accent/30" : "bg-accent/10 hover:bg-accent/20"}`}>
                        <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedStudent(isExpanded ? null : rowKey)}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <GraduationCap className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-foreground truncate">{student.full_name}</p>
                                <Badge className={`text-[10px] border ${stateInfo.color}`}>{stateInfo.label}</Badge>
                                {!student.is_orphan && (
                                  <Badge className={`text-[10px] border ${statusInfo.color}`}>{statusInfo.label}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {student.auth_email || student.email || "—"} · {student.preferred_riwaya || "—"}
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="space-y-1.5 text-xs">
                                    <h4 className="text-xs font-bold text-primary mb-1">البيانات</h4>
                                    <div className="flex justify-between"><span className="text-muted-foreground">البريد:</span><span className="text-foreground">{student.auth_email || student.email || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">الجوال:</span><span className="text-foreground" dir="ltr">{student.phone || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">الجنسية:</span><span className="text-foreground">{student.nationality || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">المؤهل:</span><span className="text-foreground">{student.education_level || "—"}</span></div>
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <h4 className="text-xs font-bold text-gold mb-1">بيانات الإجازة</h4>
                                    <div className="flex justify-between"><span className="text-muted-foreground">الرواية:</span><span className="text-foreground">{student.preferred_riwaya || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">إجازات سابقة:</span><span className="text-foreground">{student.quran_certifications || "لا يوجد"}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">المقرئ:</span><span className="text-foreground">{getReciterName(student.assigned_reciter_id)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">التسجيل:</span><span className="text-foreground">{new Date(student.created_at).toLocaleDateString("ar-SA")}</span></div>
                                  </div>
                                  {!student.is_orphan && student.id && (
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary">تغيير الحالة</h4>
                                      <Select value={student.ijazah_status || "pending_test"} onValueChange={(val) => updateStudentStatus(student.id, val)}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          {IJAZAH_STATUSES.map(s => (<SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>))}
                                        </SelectContent>
                                      </Select>
                                      <h4 className="text-xs font-bold text-primary mt-2">تسكين مقرئ</h4>
                                      <Select value={student.assigned_reciter_id || ""} onValueChange={(val) => assignReciter(student.id, val)}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="اختر المقرئ" /></SelectTrigger>
                                        <SelectContent className="z-[100] max-h-60">
                                          {recitersFor(student.gender).length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-muted-foreground">لا يوجد مقرئون معتمدون مطابقون لجنس الطالب</div>
                                          ) : recitersFor(student.gender).map(r => (
                                            <SelectItem key={r.user_id} value={r.user_id} className="text-xs">{r.full_name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  <div className="space-y-1.5 text-xs">
                                    <h4 className="text-xs font-bold text-primary mb-1">الأداء</h4>
                                    {ach ? (
                                      <>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجلسات:</span><span>{ach.sessions_count}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الدقائق:</span><span>{Math.round(ach.total_minutes)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الالتزام:</span><span>{Math.round(Number(ach.commitment_rate))}%</span></div>
                                      </>
                                    ) : <p className="text-muted-foreground">لا توجد بيانات</p>}
                                  </div>
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
              هل أنت متأكد من حذف <span className="font-bold text-foreground">{deleteTarget?.full_name}</span>؟ سيتم حذف كل بياناته نهائيًا.
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
            <DialogTitle>{editing ? "تعديل بيانات الطالب" : "إضافة طالب إجازة جديد"}</DialogTitle>
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
            <div><Label>الرواية</Label><Input value={form.preferred_riwaya} onChange={(e) => setForm({ ...form, preferred_riwaya: e.target.value })} /></div>
            <div><Label>إجازات سابقة</Label><Input value={form.quran_certifications} onChange={(e) => setForm({ ...form, quran_certifications: e.target.value })} /></div>
            <div className="md:col-span-2">
              <Label>حالة الإجازة</Label>
              <Select value={form.ijazah_status} onValueChange={(v) => setForm({ ...form, ijazah_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IJAZAH_STATUSES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
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

export default AdminIjazahStudents;
