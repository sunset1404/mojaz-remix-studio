import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Bell, Send, Users, GraduationCap, Globe, Filter,
  CheckCircle2, ChevronDown, ChevronUp, X, BookOpen, Award, Loader2, Wallet,
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Sparkles, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────
type TargetGroup = "all" | "students" | "reciters" | "partners";
type NotificationIcon = "bell" | "book" | "award" | "users";

interface FilterState {
  studentType: "all" | "ijazah" | "quran";
  countries: string[];
  ijazahStatus: "all" | "pending_test" | "in_progress" | "completed";
  gender: "all" | "male" | "female";
  riwaya: "all" | "hafs" | "warsh" | "other";
  reciterStatus: "all" | "approved" | "pending" | "suspended";
  reciterGender: "all" | "male" | "female";
}

type AutoNotification = {
  id: string;
  title: string;
  body: string;
  trigger_event: string;
  icon: string;
  notification_type: string;
  is_active: boolean;
  target_role: string;
  created_at: string;
};

type AutoFormData = Omit<AutoNotification, "id" | "created_at">;

const COUNTRIES = [
  "السعودية", "مصر", "الإمارات", "الكويت", "البحرين", "قطر",
  "عُمان", "الأردن", "المغرب", "الجزائر", "تونس", "ليبيا",
  "السودان", "اليمن", "العراق", "سوريا", "لبنان", "فلسطين"
];

const NOTIFICATION_TYPES = [
  { label: "إشعار عام", value: "bell", icon: Bell, color: "bg-primary/10 text-primary" },
  { label: "تعليمي", value: "book", icon: BookOpen, color: "bg-gold/15 text-gold" },
  { label: "إنجاز", value: "award", icon: Award, color: "bg-green-500/10 text-green-600" },
  { label: "مجتمعي", value: "users", icon: Users, color: "bg-blue-500/10 text-blue-600" },
];

const QUICK_TEMPLATES = [
  { label: "تذكير بالجلسة", title: "تذكير بموعد جلستك", body: "لا تنسَ جلستك القادمة! تأكد من الاستعداد الجيد." },
  { label: "تشجيع المراجعة", title: "وقت المراجعة", body: "خصص 15 دقيقة اليوم لمراجعة ما حفظته، والمداومة أساس الإتقان." },
  { label: "تهنئة بالإنجاز", title: "مبروك! 🎉", body: "نبارك لك هذا الإنجاز الرائع، واصل التميز في رحلتك القرآنية." },
  { label: "إعلان عام", title: "إعلان مهم من منصة مجاز", body: "نود إعلامكم بـ..." },
];

// ─── Trigger Events (same as popup messages) ─────────────────
type TriggerGroup = { label: string; events: { value: string; label: string }[] };
const TRIGGER_EVENT_GROUPS_BY_ROLE: Record<string, TriggerGroup[]> = {
  student: [
    {
      label: "أحداث التلاوة والحفظ",
      events: [
        { value: "session_complete", label: "إتمام جلسة تلاوة" },
        { value: "session_reminder", label: "تذكير بموعد الجلسة" },
        { value: "hatma_complete", label: "إتمام ختمة القرآن الكريم" },
        { value: "juz_memorized", label: "حفظ جزء جديد" },
        { value: "pages_memorized", label: "حفظ عدد من الصفحات" },
      ],
    },
    {
      label: "أحداث الإنجازات والشهادات",
      events: [
        { value: "ijaza_earned", label: "الحصول على إجازة" },
        { value: "certificate_earned", label: "الحصول على شهادة" },
        { value: "achievement_unlocked", label: "فتح إنجاز جديد" },
        { value: "weekly_plan_complete", label: "إتمام الخطة الأسبوعية" },
        { value: "streak_7_days", label: "7 أيام متتالية من الالتزام" },
        { value: "streak_30_days", label: "30 يوماً متتالية من الالتزام" },
      ],
    },
    {
      label: "أحداث الاشتراك والتطبيق",
      events: [
        { value: "first_open", label: "فتح التطبيق أول مرة (ترحيبي)" },
        { value: "subscription_expiry_3days", label: "قرب انتهاء الاشتراك (3 أيام)" },
        { value: "subscription_expiry_1day", label: "قرب انتهاء الاشتراك (يوم واحد)" },
        { value: "subscription_expired", label: "انتهاء الاشتراك" },
        { value: "subscription_renewed", label: "تجديد الاشتراك بنجاح" },
        { value: "special_offer", label: "عرض أو خصم خاص" },
        { value: "reciter_assigned", label: "تعيين مقرئ جديد للطالب" },
        { value: "exam_scheduled", label: "تحديد موعد اختبار" },
        { value: "exam_result", label: "صدور نتيجة الاختبار" },
      ],
    },
  ],
  reciter: [
    {
      label: "أحداث المقرئ",
      events: [
        { value: "reciter_first_open", label: "فتح التطبيق أول مرة (ترحيبي)" },
        { value: "reciter_student_assigned", label: "تعيين طالب جديد" },
        { value: "reciter_session_complete", label: "إتمام جلسة تسميع" },
        { value: "session_reminder", label: "تذكير بجلسة الإقراء" },
        { value: "session_rated", label: "تقييم جديد من طالب" },
        { value: "reciter_ijaza_granted", label: "منح إجازة لطالب" },
        { value: "reciter_certificate_issued", label: "إصدار شهادة لطالب" },
        { value: "reciter_weekly_plan_complete", label: "إتمام الخطة الأسبوعية" },
        { value: "reciter_streak_7_days", label: "7 أيام متتالية من الالتزام" },
        { value: "reciter_streak_30_days", label: "30 يوماً متتالية من الالتزام" },
        { value: "reciter_profile_approved", label: "اعتماد الملف الشخصي" },
      ],
    },
  ],
  partner: [
    {
      label: "أحداث الشريك الداعم",
      events: [
        { value: "partner_first_open", label: "فتح التطبيق أول مرة (ترحيبي)" },
        { value: "partner_student_assigned", label: "تسكين طالب جديد على دعمه" },
        { value: "partner_balance_low", label: "انخفاض الرصيد المتبقي" },
        { value: "partner_balance_depleted", label: "نفاد رصيد الدعم" },
        { value: "partner_student_achievement", label: "إنجاز طالب مدعوم" },
        { value: "partner_student_hatma", label: "طالب مدعوم أتم ختمة" },
        { value: "partner_monthly_report", label: "تقرير شهري عن الطلاب" },
      ],
    },
  ],
};

const ALL_TRIGGER_EVENTS = Object.values(TRIGGER_EVENT_GROUPS_BY_ROLE).flat().flatMap((g) => g.events);
const getTriggerLabel = (event: string) =>
  ALL_TRIGGER_EVENTS.find((t) => t.value === event)?.label ?? event;

const ROLE_TABS = [
  { value: "student", label: "الطلاب", icon: "📖" },
  { value: "reciter", label: "المقرئون", icon: "🎓" },
  { value: "partner", label: "الشركاء", icon: "💼" },
];

const ICON_OPTIONS = ["🔔", "📖", "🏆", "🎉", "⭐", "📢", "💡", "🎓", "💼", "📋"];

const EMPTY_AUTO_FORM: AutoFormData = {
  title: "",
  body: "",
  trigger_event: "session_complete",
  icon: "🔔",
  notification_type: "bell",
  is_active: true,
  target_role: "student",
};

// ─── Sub-components ─────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, loading }: {
  icon: React.ElementType; label: string; value: string | number; color: string; loading?: boolean
}) => (
  <div className="flex items-center gap-3 p-4 rounded-2xl border bg-card">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-lg font-bold text-foreground">{loading ? "..." : value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
      active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"
    }`}
  >
    {label}
  </button>
);

// ─── Main Component ──────────────────────────────────────────
const AdminNotifications = () => {
  const queryClient = useQueryClient();
  // View mode: "auto" for auto notifications list, "manual" for manual send
  const [viewMode, setViewMode] = useState<"auto" | "manual">("auto");
  const [activeTab, setActiveTab] = useState("student");

  // Auto notification dialog
  const [autoDialogOpen, setAutoDialogOpen] = useState(false);
  const [editingAuto, setEditingAuto] = useState<AutoNotification | null>(null);
  const [autoForm, setAutoForm] = useState<AutoFormData>(EMPTY_AUTO_FORM);

  // Manual send state
  const [targetGroup, setTargetGroup] = useState<TargetGroup>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notifType, setNotifType] = useState<NotificationIcon>("bell");
  const [showFilters, setShowFilters] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<{ count: number } | null>(null);

  // Real stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, reciters: 0, partners: 0, totalNotifications: 0, countries: 0 });

  const [filters, setFilters] = useState<FilterState>({
    studentType: "all", countries: [], ijazahStatus: "all", gender: "all",
    riwaya: "all", reciterStatus: "all", reciterGender: "all",
  });

  const [targetedUsers, setTargetedUsers] = useState<string[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  // ─── Auto notifications query ───────────────────────────────
  const { data: autoNotifications = [], isLoading: autoLoading } = useQuery({
    queryKey: ["auto_notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auto_notifications" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as AutoNotification[];
    },
  });

  const saveAutoMutation = useMutation({
    mutationFn: async (payload: AutoFormData & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("auto_notifications" as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("auto_notifications" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto_notifications"] });
      toast.success(editingAuto ? "تم تحديث الإشعار بنجاح" : "تمت إضافة الإشعار بنجاح");
      setAutoDialogOpen(false);
      setEditingAuto(null);
      setAutoForm(EMPTY_AUTO_FORM);
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  const toggleAutoMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("auto_notifications" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auto_notifications"] }),
    onError: () => toast.error("حدث خطأ"),
  });

  const deleteAutoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("auto_notifications" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto_notifications"] });
      toast.success("تم حذف الإشعار");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  const openNewAuto = () => {
    setEditingAuto(null);
    const defaultEvent = TRIGGER_EVENT_GROUPS_BY_ROLE[activeTab]?.[0]?.events?.[0]?.value || "session_complete";
    setAutoForm({ ...EMPTY_AUTO_FORM, target_role: activeTab, trigger_event: defaultEvent });
    setAutoDialogOpen(true);
  };

  const openEditAuto = (n: AutoNotification) => {
    setEditingAuto(n);
    setAutoForm({
      title: n.title, body: n.body, trigger_event: n.trigger_event,
      icon: n.icon, notification_type: n.notification_type,
      is_active: n.is_active, target_role: n.target_role || "student",
    });
    setAutoDialogOpen(true);
  };

  const handleAutoSubmit = () => {
    if (!autoForm.title.trim() || !autoForm.body.trim()) {
      toast.error("العنوان والنص مطلوبان");
      return;
    }
    saveAutoMutation.mutate(editingAuto ? { ...autoForm, id: editingAuto.id } : autoForm);
  };

  const filteredAutoNotifications = autoNotifications.filter((n) => (n.target_role || "student") === activeTab);
  const activeAutoCount = filteredAutoNotifications.filter((n) => n.is_active).length;

  // ─── Stats & targeting for manual send ──────────────────────
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (viewMode === "manual") computeTargets(); }, [targetGroup, filters, viewMode]);

  const fetchStats = async () => {
    setStatsLoading(true);
    const [studentsRes, recitersRes, partnersRes, notifsRes, countriesRes] = await Promise.all([
      supabase.from("student_profiles").select("id", { count: "exact", head: true }),
      supabase.from("reciter_profiles").select("id", { count: "exact", head: true }),
      supabase.from("partner_profiles").select("id", { count: "exact", head: true }),
      supabase.from("notifications").select("id", { count: "exact", head: true }),
      supabase.from("student_profiles").select("residence_country"),
    ]);
    const uniqueCountries = new Set((countriesRes.data || []).map((s: any) => s.residence_country).filter(Boolean));
    setStats({
      students: studentsRes.count || 0, reciters: recitersRes.count || 0,
      partners: partnersRes.count || 0, totalNotifications: notifsRes.count || 0,
      countries: uniqueCountries.size,
    });
    setStatsLoading(false);
  };

  const computeTargets = async () => {
    setLoadingTargets(true);
    let userIds: string[] = [];
    if (targetGroup === "all" || targetGroup === "students") {
      let query = supabase.from("student_profiles").select("user_id");
      if (filters.studentType === "ijazah") query = query.eq("preferred_track", "الحصول على إجازة قرآنية");
      if (filters.studentType === "quran") query = query.eq("preferred_track", "حفظ القرآن الكريم");
      if (filters.ijazahStatus !== "all") query = query.eq("ijazah_status", filters.ijazahStatus);
      if (filters.gender !== "all") query = query.eq("gender", filters.gender);
      if (filters.riwaya !== "all") {
        const riwayaMap: Record<string, string> = { hafs: "حفص عن عاصم", warsh: "ورش عن نافع", other: "" };
        if (filters.riwaya !== "other") query = query.eq("preferred_riwaya", riwayaMap[filters.riwaya]);
      }
      if (filters.countries.length > 0) query = query.in("residence_country", filters.countries);
      const { data } = await query;
      userIds = [...userIds, ...(data || []).map((s: any) => s.user_id)];
    }
    if (targetGroup === "all" || targetGroup === "reciters") {
      let query = supabase.from("reciter_profiles").select("user_id");
      if (filters.reciterStatus !== "all") query = query.eq("status", filters.reciterStatus);
      if (filters.reciterGender !== "all") query = query.eq("gender", filters.reciterGender);
      const { data } = await query;
      userIds = [...userIds, ...(data || []).map((r: any) => r.user_id)];
    }
    if (targetGroup === "all" || targetGroup === "partners") {
      const { data } = await supabase.from("partner_profiles").select("user_id");
      userIds = [...userIds, ...(data || []).map((p: any) => p.user_id)];
    }
    setTargetedUsers([...new Set(userIds)]);
    setLoadingTargets(false);
  };

  const toggleCountry = (c: string) =>
    setFilters((f) => ({
      ...f, countries: f.countries.includes(c) ? f.countries.filter((x) => x !== c) : [...f.countries, c],
    }));

  const applyTemplate = (t: (typeof QUICK_TEMPLATES)[number]) => { setTitle(t.title); setBody(t.body); };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error("يرجى إدخال عنوان ونص الإشعار"); return; }
    if (targetedUsers.length === 0) { toast.error("لا يوجد مستخدمون يطابقون الفلاتر المحددة"); return; }
    setSending(true); setSentResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = targetedUsers.map((uid) => ({
        user_id: uid, title: title.trim(), body: body.trim(), type: notifType, sent_by: user?.id,
      }));
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) throw error;
      setSentResult({ count: targetedUsers.length });
      toast.success(`✅ تم الإرسال إلى ${targetedUsers.length} مستخدم`);
      setTitle(""); setBody(""); fetchStats();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الإرسال");
    } finally { setSending(false); }
  };

  const selectedType = NOTIFICATION_TYPES.find((t) => t.value === notifType)!;
  const TypeIcon = selectedType.icon;

  const getTargetLabel = () => {
    if (loadingTargets) return "جاري الحساب...";
    const parts = [];
    if (targetGroup === "students") parts.push("الطلاب");
    else if (targetGroup === "reciters") parts.push("المقرئون");
    else if (targetGroup === "partners") parts.push("الشركاء");
    else parts.push("الجميع");
    if (filters.studentType === "ijazah" && targetGroup === "students") parts.push("إجازة");
    if (filters.studentType === "quran" && targetGroup === "students") parts.push("حفظ القرآن");
    if (filters.gender !== "all" && targetGroup === "students") parts.push(filters.gender === "male" ? "ذكور" : "إناث");
    if (filters.reciterStatus !== "all" && targetGroup === "reciters") {
      const m: Record<string, string> = { approved: "معتمدين", pending: "قيد الانتظار", suspended: "موقوفين" };
      parts.push(m[filters.reciterStatus]);
    }
    if (filters.countries.length > 0) parts.push(`${filters.countries.length} دول`);
    return parts.join(" · ");
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 px-6 py-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-cairo">إدارة الإشعارات</h1>
              <p className="text-xs text-muted-foreground">إشعارات تلقائية وإرسال يدوي</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "manual" ? "default" : "outline"}
              onClick={() => setViewMode("manual")}
              className="gap-2 rounded-xl"
            >
              <Send className="w-4 h-4" />
              إرسال إشعار
            </Button>
            {viewMode === "auto" && (
              <Button onClick={openNewAuto} className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" />
                إشعار تلقائي جديد
              </Button>
            )}
          </div>
        </div>
      </div>

      {viewMode === "auto" ? (
        /* ─── Auto Notifications View ─── */
        <div className="p-6 space-y-6">
          {/* Role Tabs */}
          <div className="flex gap-2">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  activeTab === tab.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.value ? "bg-primary/20" : "bg-muted"
                }`}>
                  {autoNotifications.filter((n) => (n.target_role || "student") === tab.value).length}
                </span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "إجمالي الإشعارات التلقائية", value: filteredAutoNotifications.length, color: "text-foreground" },
              { label: "نشطة", value: activeAutoCount, color: "text-emerald-500" },
              { label: "متوقفة", value: filteredAutoNotifications.length - activeAutoCount, color: "text-muted-foreground" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-2xl border border-border/50 p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Auto notifications list */}
          {autoLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredAutoNotifications.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد إشعارات تلقائية لهذا الدور بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAutoNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`bg-card rounded-2xl border border-border/50 overflow-hidden transition-all ${!notif.is_active ? "opacity-60" : ""}`}
                >
                  {/* Color bar */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/50" />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{notif.icon}</span>
                        <div>
                          <p className="font-bold text-foreground">{notif.title}</p>
                          <Badge variant="secondary" className="text-[10px] mt-1 rounded-full">
                            {getTriggerLabel(notif.trigger_event)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditAuto(notif)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleAutoMutation.mutate({ id: notif.id, is_active: !notif.is_active })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                        >
                          {notif.is_active
                            ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                            : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteAutoMutation.mutate(notif.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{notif.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── Manual Send View ─── */
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Back button */}
          <Button variant="ghost" onClick={() => setViewMode("auto")} className="gap-2 rounded-xl">
            <ChevronDown className="w-4 h-4 rotate-90" />
            العودة للإشعارات التلقائية
          </Button>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon={Bell} label="إشعارات أُرسلت" value={stats.totalNotifications} color="bg-primary/10 text-primary" loading={statsLoading} />
            <StatCard icon={Users} label="إجمالي الطلاب" value={stats.students} color="bg-gold/15 text-gold" loading={statsLoading} />
            <StatCard icon={GraduationCap} label="المقرئون" value={stats.reciters} color="bg-primary/10 text-primary" loading={statsLoading} />
            <StatCard icon={Wallet} label="الشركاء" value={stats.partners} color="bg-purple-500/10 text-purple-600" loading={statsLoading} />
            <StatCard icon={Globe} label="دول مختلفة" value={stats.countries} color="bg-blue-500/10 text-blue-600" loading={statsLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ─── Left: Compose ─── */}
            <div className="lg:col-span-3 space-y-5">
              {/* Quick Templates */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-sm font-bold text-foreground mb-3">📝 قوالب سريعة</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((t) => (
                    <button key={t.label} onClick={() => applyTemplate(t)}
                      className="text-xs px-3 py-1.5 rounded-full bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-all">
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compose */}
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <p className="text-sm font-bold text-foreground">✉️ إنشاء الإشعار</p>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">نوع الإشعار</p>
                  <div className="flex gap-2 flex-wrap">
                    {NOTIFICATION_TYPES.map((t) => {
                      const TIcon = t.icon;
                      return (
                        <button key={t.value} onClick={() => setNotifType(t.value as NotificationIcon)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                            notifType === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                          }`}>
                          <TIcon className="w-3.5 h-3.5" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">عنوان الإشعار</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: تذكير بموعد جلستك" className="rounded-xl" maxLength={80} />
                  <p className="text-[11px] text-muted-foreground/60 mt-1 text-left">{title.length}/80</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">نص الإشعار</label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)}
                    placeholder="اكتب نص الإشعار هنا..." className="rounded-xl min-h-[100px] resize-none" maxLength={300} />
                  <p className="text-[11px] text-muted-foreground/60 mt-1 text-left">{body.length}/300</p>
                </div>

                {(title || body) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border/60 p-4 bg-background">
                    <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">معاينة</p>
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedType.color}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{title || "عنوان الإشعار"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body || "نص الإشعار..."}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">الآن</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ─── Right: Targeting ─── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Target Group */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-sm font-bold text-foreground mb-3">🎯 الجمهور المستهدف</p>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "الجميع", icon: Users, sub: "طلاب + مقرئون + شركاء" },
                    { value: "students", label: "الطلاب فقط", icon: BookOpen, sub: "جميع الطلاب المسجلين" },
                    { value: "reciters", label: "المقرئون فقط", icon: GraduationCap, sub: "جميع المقرئين" },
                    { value: "partners", label: "الشركاء فقط", icon: Wallet, sub: "جميع الشركاء الداعمين" },
                  ].map((g) => {
                    const GIcon = g.icon;
                    return (
                      <button key={g.value}
                        onClick={() => { setTargetGroup(g.value as TargetGroup); setShowFilters(false); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
                          targetGroup === g.value ? "border-primary bg-primary/8" : "border-border hover:border-primary/30"
                        }`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          targetGroup === g.value ? "bg-primary/15" : "bg-muted/50"
                        }`}>
                          <GIcon className={`w-4 h-4 ${targetGroup === g.value ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${targetGroup === g.value ? "text-primary" : "text-foreground"}`}>{g.label}</p>
                          <p className="text-[11px] text-muted-foreground">{g.sub}</p>
                        </div>
                        {targetGroup === g.value && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Filters */}
              {(targetGroup === "students" || targetGroup === "reciters") && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-primary" />
                      <p className="text-sm font-bold text-foreground">فلاتر متقدمة</p>
                    </div>
                    {showFilters ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {showFilters && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-4">
                      {targetGroup === "students" && (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">نوع البرنامج</p>
                            <div className="flex gap-2 flex-wrap">
                              {[{ v: "all", l: "الكل" }, { v: "ijazah", l: "إجازة" }, { v: "quran", l: "حفظ القرآن" }].map((o) => (
                                <FilterChip key={o.v} label={o.l} active={filters.studentType === o.v}
                                  onClick={() => setFilters((f) => ({ ...f, studentType: o.v as FilterState["studentType"] }))} />
                              ))}
                            </div>
                          </div>
                          {filters.studentType === "ijazah" && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2 font-semibold">حالة الإجازة</p>
                              <div className="flex gap-2 flex-wrap">
                                {[{ v: "all", l: "الكل" }, { v: "pending_test", l: "ينتظر الاختبار" }, { v: "in_progress", l: "قيد التقدم" }, { v: "completed", l: "مكتمل" }].map((o) => (
                                  <FilterChip key={o.v} label={o.l} active={filters.ijazahStatus === o.v}
                                    onClick={() => setFilters((f) => ({ ...f, ijazahStatus: o.v as FilterState["ijazahStatus"] }))} />
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">الجنس</p>
                            <div className="flex gap-2">
                              {[{ v: "all", l: "الكل" }, { v: "male", l: "ذكور" }, { v: "female", l: "إناث" }].map((o) => (
                                <FilterChip key={o.v} label={o.l} active={filters.gender === o.v}
                                  onClick={() => setFilters((f) => ({ ...f, gender: o.v as FilterState["gender"] }))} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">الرواية</p>
                            <div className="flex gap-2 flex-wrap">
                              {[{ v: "all", l: "الكل" }, { v: "hafs", l: "حفص" }, { v: "warsh", l: "ورش" }, { v: "other", l: "أخرى" }].map((o) => (
                                <FilterChip key={o.v} label={o.l} active={filters.riwaya === o.v}
                                  onClick={() => setFilters((f) => ({ ...f, riwaya: o.v as FilterState["riwaya"] }))} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 font-semibold flex items-center gap-2">
                              الدول
                              {filters.countries.length > 0 && (
                                <button onClick={() => setFilters((f) => ({ ...f, countries: [] }))}
                                  className="text-destructive text-[11px] flex items-center gap-0.5">
                                  <X className="w-3 h-3" /> مسح
                                </button>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                              {COUNTRIES.map((c) => (
                                <FilterChip key={c} label={c} active={filters.countries.includes(c)} onClick={() => toggleCountry(c)} />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {targetGroup === "reciters" && (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">حالة المقرئ</p>
                            <div className="flex gap-2 flex-wrap">
                              {[{ v: "all", l: "الكل" }, { v: "approved", l: "معتمد" }, { v: "pending", l: "قيد الانتظار" }, { v: "suspended", l: "موقوف" }].map((o) => (
                                <FilterChip key={o.v} label={o.l} active={filters.reciterStatus === o.v}
                                  onClick={() => setFilters((f) => ({ ...f, reciterStatus: o.v as FilterState["reciterStatus"] }))} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 font-semibold">الجنس</p>
                            <div className="flex gap-2">
                              {[{ v: "all", l: "الكل" }, { v: "male", l: "ذكور" }, { v: "female", l: "إناث" }].map((o) => (
                                <FilterChip key={o.v} label={o.l} active={filters.reciterGender === o.v}
                                  onClick={() => setFilters((f) => ({ ...f, reciterGender: o.v as FilterState["reciterGender"] }))} />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Summary + Send */}
              <div className="bg-card rounded-2xl border border-primary/20 p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">سيُرسَل إلى</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{getTargetLabel()}</p>
                    <p className={`text-xs mt-0.5 font-semibold ${targetedUsers.length === 0 ? "text-destructive" : "text-primary"}`}>
                      {loadingTargets ? "جاري حساب العدد..." : `${targetedUsers.length} مستخدم`}
                    </p>
                  </div>
                </div>

                {sentResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-3 bg-primary/8 rounded-xl border border-primary/20">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <p className="text-sm text-primary font-semibold">أُرسل بنجاح إلى {sentResult.count} مستخدم</p>
                  </motion.div>
                )}

                <Button onClick={handleSend}
                  disabled={sending || !title.trim() || !body.trim() || loadingTargets || targetedUsers.length === 0}
                  className="w-full gradient-primary text-primary-foreground rounded-xl h-11 font-bold">
                  {sending ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />جاري الإرسال...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Send className="w-4 h-4" />إرسال الإشعار</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Auto Notification Dialog */}
      <Dialog open={autoDialogOpen} onOpenChange={(v) => { setAutoDialogOpen(v); if (!v) { setEditingAuto(null); setAutoForm(EMPTY_AUTO_FORM); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingAuto ? "تعديل الإشعار التلقائي" : "إضافة إشعار تلقائي جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Target role */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الحساب المستهدف</label>
              <div className="flex gap-2">
                {ROLE_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      const defaultEvent = TRIGGER_EVENT_GROUPS_BY_ROLE[tab.value]?.[0]?.events?.[0]?.value || "session_complete";
                      setAutoForm((f) => ({ ...f, target_role: tab.value, trigger_event: defaultEvent }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      autoForm.target_role === tab.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger event */}
            <div className="space-y-2">
              <label className="text-sm font-medium">حدث الإطلاق</label>
              <Select value={autoForm.trigger_event} onValueChange={(v) => setAutoForm((f) => ({ ...f, trigger_event: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {(TRIGGER_EVENT_GROUPS_BY_ROLE[autoForm.target_role] || []).map((group) => (
                    <div key={group.label}>
                      <p className="text-xs text-muted-foreground px-2 py-1 font-semibold">{group.label}</p>
                      {group.events.map((ev) => (
                        <SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الأيقونة</label>
              <div className="flex gap-2 flex-wrap">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setAutoForm((f) => ({ ...f, icon }))}
                    className={`w-10 h-10 rounded-xl border text-xl flex items-center justify-center transition-all ${
                      autoForm.icon === icon ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/30"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع الإشعار</label>
              <div className="flex gap-2 flex-wrap">
                {NOTIFICATION_TYPES.map((t) => {
                  const TIcon = t.icon;
                  return (
                    <button key={t.value} onClick={() => setAutoForm((f) => ({ ...f, notification_type: t.value }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        autoForm.notification_type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      }`}>
                      <TIcon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان الإشعار</label>
              <Input
                value={autoForm.title}
                onChange={(e) => setAutoForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثال: مبروك على إنجازك!"
                className="rounded-xl"
                maxLength={80}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نص الإشعار</label>
              <Textarea
                value={autoForm.body}
                onChange={(e) => setAutoForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="اكتب نص الإشعار هنا..."
                className="rounded-xl min-h-[80px] resize-none"
                maxLength={300}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAutoDialogOpen(false)} className="rounded-xl">
              إلغاء
            </Button>
            <Button onClick={handleAutoSubmit} disabled={saveAutoMutation.isPending} className="rounded-xl gap-2">
              {saveAutoMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingAuto ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
