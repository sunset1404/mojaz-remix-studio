import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MessageCircle, Send, Users, GraduationCap, Globe, Filter,
  CheckCircle2, ChevronDown, ChevronUp, X, BookOpen, Plus,
  Loader2, Zap, Edit3, Trash2, Check, Phone, Bot, Hand
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────
type TargetGroup = "all" | "students" | "reciters";

interface FilterState {
  studentType: "all" | "ijazah" | "quran";
  countries: string[];
  ijazahStatus: "all" | "pending_test" | "in_progress" | "completed";
  gender: "all" | "male" | "female";
  riwaya: "all" | "hafs" | "warsh" | "other";
  reciterStatus: "all" | "approved" | "pending" | "suspended";
  reciterGender: "all" | "male" | "female";
}

interface AutoMessage {
  id: string;
  trigger_event: string;
  title: string;
  message: string;
  is_active: boolean;
  icon: string;
  color_scheme: string;
  created_at: string;
}

const COUNTRIES = [
  "السعودية", "مصر", "الإمارات", "الكويت", "البحرين", "قطر",
  "عُمان", "الأردن", "المغرب", "الجزائر", "تونس", "ليبيا",
  "السودان", "اليمن", "العراق", "سوريا", "لبنان", "فلسطين"
];

const QUICK_TEMPLATES = [
  { label: "تذكير بالجلسة", text: "السلام عليكم 🌟\nتذكيرٌ بموعد جلستك القادمة على منصة مجاز. تأكد من الاستعداد الجيد والحضور في الوقت المحدد." },
  { label: "تشجيع المراجعة", text: "السلام عليكم 📖\nوقت المراجعة! خصص 15 دقيقة اليوم لمراجعة ما حفظته. المداومة هي أساس الإتقان. وفقك الله!" },
  { label: "تهنئة بإنجاز", text: "السلام عليكم 🎉\nمبارك لك هذا الإنجاز الرائع! نسأل الله أن يبارك في مسيرتك القرآنية ويزيدك توفيقاً." },
  { label: "تجديد الاشتراك", text: "السلام عليكم 💫\nاشتراكك في منصة مجاز قارب على الانتهاء. جدّده الآن لتواصل رحلتك القرآنية بلا انقطاع." },
];

const TRIGGER_EVENT_GROUPS = [
  {
    label: "أحداث التلاوة والحفظ",
    events: [
      { value: "session_complete", label: "إتمام جلسة تلاوة" },
      { value: "hatma_complete", label: "إتمام ختمة قرآنية" },
      { value: "juz_memorized", label: "حفظ جزء جديد" },
      { value: "pages_memorized", label: "حفظ 10 صفحات" },
      { value: "weekly_plan_complete", label: "إتمام الخطة الأسبوعية" },
    ],
  },
  {
    label: "أحداث الإنجازات",
    events: [
      { value: "ijaza_earned", label: "الحصول على إجازة" },
      { value: "certificate_earned", label: "الحصول على شهادة" },
      { value: "streak_7_days", label: "سلسلة 7 أيام متواصلة" },
      { value: "streak_30_days", label: "سلسلة 30 يوم متواصلة" },
      { value: "achievement_unlocked", label: "فتح إنجاز جديد" },
    ],
  },
  {
    label: "أحداث الاشتراك والتطبيق",
    events: [
      { value: "first_open", label: "فتح التطبيق أول مرة" },
      { value: "subscription_expiry_3days", label: "قرب انتهاء الاشتراك (3 أيام)" },
      { value: "subscription_expiry_1day", label: "قرب انتهاء الاشتراك (يوم)" },
      { value: "subscription_expired", label: "انتهاء الاشتراك" },
      { value: "subscription_renewed", label: "تجديد الاشتراك" },
      { value: "reciter_assigned", label: "تعيين مقرئ جديد" },
      { value: "exam_scheduled", label: "جدولة اختبار" },
      { value: "exam_result", label: "نتيجة الاختبار" },
    ],
  },
];

const ALL_TRIGGERS = TRIGGER_EVENT_GROUPS.flatMap((g) => g.events);

const getTriggerLabel = (value: string) =>
  ALL_TRIGGERS.find((t) => t.value === value)?.label ?? value;

const COLOR_SCHEMES = [
  { value: "gold", label: "ذهبي", bg: "from-yellow-400 to-amber-500" },
  { value: "teal", label: "تركواز", bg: "from-teal-400 to-teal-600" },
  { value: "teal-gold", label: "تركواز ذهبي", bg: "from-teal-500 to-amber-400" },
  { value: "green", label: "أخضر", bg: "from-emerald-400 to-emerald-600" },
  { value: "warm", label: "دافئ", bg: "from-amber-400 to-orange-500" },
];

// ─── Sub-components ──────────────────────────────────────────
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
const AdminWhatsApp = () => {
  const [tab, setTab] = useState("auto");

  // --- Auto Messages State ---
  const [autoMessages, setAutoMessages] = useState<AutoMessage[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);
  const [showAutoForm, setShowAutoForm] = useState(false);
  const [autoForm, setAutoForm] = useState({
    trigger_event: "",
    title: "",
    message: "",
    icon: "📱",
    color_scheme: "teal",
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingAuto, setSavingAuto] = useState(false);

  // --- Manual Messages State ---
  const [targetGroup, setTargetGroup] = useState<TargetGroup>("all");
  const [message, setMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<{ count: number } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    studentType: "all", countries: [], ijazahStatus: "all",
    gender: "all", riwaya: "all", reciterStatus: "all", reciterGender: "all",
  });
  const [targetedUsers, setTargetedUsers] = useState<{ user_id: string; phone: string }[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => { fetchAutoMessages(); }, []);
  useEffect(() => { computeTargets(); }, [targetGroup, filters]);

  // ── Auto Messages ──
  const fetchAutoMessages = async () => {
    setAutoLoading(true);
    const { data } = await supabase
      .from("whatsapp_auto_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setAutoMessages((data as AutoMessage[]) || []);
    setAutoLoading(false);
  };

  const resetAutoForm = () => {
    setAutoForm({ trigger_event: "", title: "", message: "", icon: "📱", color_scheme: "teal", is_active: true });
    setEditingId(null);
    setShowAutoForm(false);
  };

  const handleSaveAuto = async () => {
    if (!autoForm.trigger_event || !autoForm.title || !autoForm.message) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setSavingAuto(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("whatsapp_auto_messages")
          .update({ ...autoForm })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("تم تحديث الرسالة");
      } else {
        const { error } = await supabase
          .from("whatsapp_auto_messages")
          .insert([autoForm]);
        if (error) throw error;
        toast.success("تمت إضافة الرسالة التلقائية");
      }
      resetAutoForm();
      fetchAutoMessages();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ");
    } finally {
      setSavingAuto(false);
    }
  };

  const handleEditAuto = (msg: AutoMessage) => {
    setAutoForm({
      trigger_event: msg.trigger_event,
      title: msg.title,
      message: msg.message,
      icon: msg.icon,
      color_scheme: msg.color_scheme,
      is_active: msg.is_active,
    });
    setEditingId(msg.id);
    setShowAutoForm(true);
  };

  const handleDeleteAuto = async (id: string) => {
    const { error } = await supabase.from("whatsapp_auto_messages").delete().eq("id", id);
    if (error) { toast.error("حدث خطأ"); return; }
    toast.success("تم الحذف");
    setAutoMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleAuto = async (id: string, current: boolean) => {
    await supabase.from("whatsapp_auto_messages").update({ is_active: !current }).eq("id", id);
    setAutoMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_active: !current } : m));
  };

  // ── Manual Targeting ──
  const computeTargets = async () => {
    setLoadingTargets(true);
    let users: { user_id: string; phone: string }[] = [];

    if (targetGroup === "all" || targetGroup === "students") {
      let query = supabase.from("student_profiles").select("user_id, phone");
      if (filters.studentType === "ijazah") query = query.eq("preferred_track", "الحصول على إجازة قرآنية");
      if (filters.studentType === "quran") query = query.eq("preferred_track", "حفظ القرآن الكريم");
      if (filters.ijazahStatus !== "all") query = query.eq("ijazah_status", filters.ijazahStatus);
      if (filters.gender !== "all") query = query.eq("gender", filters.gender === "male" ? "male" : "female");
      if (filters.riwaya !== "all" && filters.riwaya !== "other") {
        const riwayaMap: Record<string, string> = { hafs: "حفص عن عاصم", warsh: "ورش عن نافع" };
        query = query.eq("preferred_riwaya", riwayaMap[filters.riwaya]);
      }
      if (filters.countries.length > 0) query = query.in("residence_country", filters.countries);
      const { data } = await query;
      users = [...users, ...(data || []).map((s: any) => ({ user_id: s.user_id, phone: s.phone }))];
    }

    if (targetGroup === "all" || targetGroup === "reciters") {
      let query = supabase.from("reciter_profiles").select("user_id, phone");
      if (filters.reciterStatus !== "all") query = query.eq("status", filters.reciterStatus);
      if (filters.reciterGender !== "all") query = query.eq("gender", filters.reciterGender === "male" ? "male" : "female");
      const { data } = await query;
      users = [...users, ...(data || []).map((r: any) => ({ user_id: r.user_id, phone: r.phone }))];
    }

    // De-duplicate by user_id
    const seen = new Set<string>();
    const unique = users.filter((u) => { if (seen.has(u.user_id)) return false; seen.add(u.user_id); return true; });
    setTargetedUsers(unique);
    setLoadingTargets(false);
  };

  const toggleCountry = (c: string) =>
    setFilters((f) => ({
      ...f,
      countries: f.countries.includes(c) ? f.countries.filter((x) => x !== c) : [...f.countries, c],
    }));

  const handleSendManual = async () => {
    if (!message.trim()) { toast.error("يرجى كتابة نص الرسالة"); return; }
    if (targetedUsers.length === 0) { toast.error("لا يوجد مستخدمون يطابقون الفلاتر"); return; }
    setSending(true);
    setSentResult(null);
    try {
      // Insert into whatsapp_manual_logs for tracking
      const { error } = await supabase.from("whatsapp_manual_logs").insert([{
        message: message.trim(),
        target_group: targetGroup,
        filters: filters,
        recipients_count: targetedUsers.length,
        phone_numbers: targetedUsers.map((u) => u.phone).filter(Boolean),
      }]);
      if (error) throw error;
      setSentResult({ count: targetedUsers.length });
      toast.success(`✅ تم تسجيل الرسالة لـ ${targetedUsers.length} مستخدم`);
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setSending(false);
    }
  };

  const getTargetLabel = () => {
    if (loadingTargets) return "جاري الحساب...";
    const parts: string[] = [];
    if (targetGroup === "students") parts.push("الطلاب");
    else if (targetGroup === "reciters") parts.push("المقرئون");
    else parts.push("الجميع");
    if (filters.countries.length > 0) parts.push(`${filters.countries.length} دول`);
    return parts.join(" · ");
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <div className="bg-card border-b border-border/50 px-6 py-4 flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground font-cairo">رسائل واتساب</h1>
            <p className="text-xs text-muted-foreground">إدارة الرسائل التلقائية واليدوية</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full max-w-sm mb-6 bg-muted/50 p-1 rounded-2xl h-auto">
            <TabsTrigger value="auto" className="flex-1 flex items-center gap-2 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm py-2.5">
              <Bot className="w-4 h-4" />
              <span className="font-semibold text-sm">رسائل تلقائية</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 flex items-center gap-2 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm py-2.5">
              <Hand className="w-4 h-4" />
              <span className="font-semibold text-sm">رسائل يدوية</span>
            </TabsTrigger>
          </TabsList>

          {/* ══════════════ AUTO TAB ══════════════ */}
          <TabsContent value="auto" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">الرسائل التلقائية</p>
                <p className="text-xs text-muted-foreground mt-0.5">تُرسل تلقائياً عند حدوث حدث معيّن</p>
              </div>
              <Button
                onClick={() => { resetAutoForm(); setShowAutoForm(true); }}
                className="gradient-primary text-primary-foreground rounded-xl gap-2 h-9"
              >
                <Plus className="w-4 h-4" />
                إضافة رسالة
              </Button>
            </div>

            {/* Auto Form */}
            {showAutoForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-primary/20 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    {editingId ? "تعديل الرسالة التلقائية" : "رسالة تلقائية جديدة"}
                  </p>
                  <button onClick={resetAutoForm} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trigger Event */}
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1.5 block">حدث الإطلاق</label>
                    <select
                      value={autoForm.trigger_event}
                      onChange={(e) => setAutoForm((f) => ({ ...f, trigger_event: e.target.value }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">-- اختر حدث الإطلاق --</option>
                      {TRIGGER_EVENT_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.events.map((e) => (
                            <option key={e.value} value={e.value}>{e.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">عنوان الرسالة</label>
                    <Input
                      value={autoForm.title}
                      onChange={(e) => setAutoForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="مثال: تذكير بالجلسة"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">الإيموجي</label>
                    <Input
                      value={autoForm.icon}
                      onChange={(e) => setAutoForm((f) => ({ ...f, icon: e.target.value }))}
                      placeholder="📱"
                      className="rounded-xl"
                      maxLength={4}
                    />
                  </div>

                  {/* Message */}
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1.5 block">نص الرسالة</label>
                    <Textarea
                      value={autoForm.message}
                      onChange={(e) => setAutoForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="اكتب نص رسالة الواتساب هنا..."
                      className="rounded-xl min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-[11px] text-muted-foreground/60 mt-1 text-left">{autoForm.message.length}/500</p>
                  </div>

                  {/* Color Scheme */}
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-2 block">نظام الألوان</label>
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_SCHEMES.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setAutoForm((f) => ({ ...f, color_scheme: c.value }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm ${
                            autoForm.color_scheme === c.value
                              ? "border-primary bg-primary/5 font-semibold"
                              : "border-border hover:border-border/80"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${c.bg} shrink-0`} />
                          {c.label}
                          {autoForm.color_scheme === c.value && <Check className="w-3 h-3 text-primary mr-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {autoForm.message && (
                  <div className="rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 p-4">
                    <p className="text-[10px] text-green-600 dark:text-green-400 mb-2 font-semibold uppercase tracking-wide flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> معاينة واتساب
                    </p>
                    <div className="bg-white dark:bg-card rounded-xl p-3 shadow-sm max-w-xs">
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                        {autoForm.icon} <span className="font-bold">{autoForm.title || "عنوان الرسالة"}</span>
                        {"\n"}{autoForm.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-left">الآن ✓✓</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveAuto}
                    disabled={savingAuto}
                    className="gradient-primary text-primary-foreground rounded-xl flex-1"
                  >
                    {savingAuto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingId ? "حفظ التعديلات" : "إضافة الرسالة"}
                  </Button>
                  <Button variant="outline" onClick={resetAutoForm} className="rounded-xl">
                    إلغاء
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Auto Messages List */}
            {autoLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : autoMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-green-500/40" />
                </div>
                <p className="text-foreground font-bold mb-1">لا توجد رسائل تلقائية</p>
                <p className="text-muted-foreground text-sm">أضف رسالة تلقائية تُرسل عند حدث معيّن</p>
              </div>
            ) : (
              <div className="space-y-3">
                {autoMessages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-card rounded-2xl border p-4 flex items-start gap-4 ${
                      msg.is_active ? "border-green-500/20" : "border-border/50 opacity-60"
                    }`}
                  >
                    <div className="text-2xl shrink-0 mt-0.5">{msg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="font-bold text-sm text-foreground">{msg.title}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {getTriggerLabel(msg.trigger_event)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggleAuto(msg.id, msg.is_active)}
                        className={`w-10 h-6 rounded-full transition-all duration-300 relative ${
                          msg.is_active ? "bg-green-500" : "bg-muted"
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                          msg.is_active ? "right-1" : "right-5"
                        }`} />
                      </button>
                      <button
                        onClick={() => handleEditAuto(msg)}
                        className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteAuto(msg.id)}
                        className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ══════════════ MANUAL TAB ══════════════ */}
          <TabsContent value="manual" className="space-y-5">
            <div>
              <p className="font-bold text-foreground">رسائل يدوية</p>
              <p className="text-xs text-muted-foreground mt-0.5">أرسل رسائل واتساب مخصصة لمجموعة مستهدفة</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* ─ Compose ─ */}
              <div className="lg:col-span-3 space-y-4">

                {/* Quick Templates */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    قوالب سريعة
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => setMessage(t.text)}
                        className="text-xs px-3 py-1.5 rounded-full bg-green-500/8 text-green-700 dark:text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-all"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Compose */}
                <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    نص الرسالة
                  </p>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={"السلام عليكم،\nاكتب رسالتك هنا..."}
                    className="rounded-xl min-h-[140px] resize-none font-sans"
                    maxLength={500}
                  />
                  <p className="text-[11px] text-muted-foreground/60 text-left">{message.length}/500</p>

                  {/* WhatsApp Preview */}
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 p-4"
                    >
                      <p className="text-[10px] text-green-600 dark:text-green-400 mb-2 font-semibold uppercase tracking-wide flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> معاينة واتساب
                      </p>
                      <div className="bg-white dark:bg-card rounded-xl p-3 shadow-sm max-w-xs">
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{message}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-left">الآن ✓✓</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* ─ Targeting ─ */}
              <div className="lg:col-span-2 space-y-4">

                {/* Target Group */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    الجمهور المستهدف
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "الجميع", icon: Users, sub: "طلاب + مقرئون" },
                      { value: "students", label: "الطلاب فقط", icon: BookOpen, sub: "جميع الطلاب المسجلين" },
                      { value: "reciters", label: "المقرئون فقط", icon: GraduationCap, sub: "جميع المقرئين" },
                    ].map((g) => {
                      const GIcon = g.icon;
                      return (
                        <button key={g.value}
                          onClick={() => { setTargetGroup(g.value as TargetGroup); setShowFilters(false); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
                            targetGroup === g.value ? "border-green-500 bg-green-500/8" : "border-border hover:border-green-500/30"
                          }`}>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            targetGroup === g.value ? "bg-green-500/15" : "bg-muted/50"
                          }`}>
                            <GIcon className={`w-4 h-4 ${targetGroup === g.value ? "text-green-600" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${targetGroup === g.value ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>{g.label}</p>
                            <p className="text-[11px] text-muted-foreground">{g.sub}</p>
                          </div>
                          {targetGroup === g.value && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filters */}
                {targetGroup !== "all" && (
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
                <div className="bg-card rounded-2xl border border-green-500/20 p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">سيُرسَل إلى</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{getTargetLabel()}</p>
                      <p className={`text-xs mt-0.5 font-semibold ${targetedUsers.length === 0 ? "text-destructive" : "text-green-600"}`}>
                        {loadingTargets ? "جاري حساب العدد..." : `${targetedUsers.length} مستخدم`}
                      </p>
                    </div>
                  </div>

                  {sentResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 p-3 bg-green-500/8 rounded-xl border border-green-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                        سُجِّلت الرسالة لـ {sentResult.count} مستخدم
                      </p>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleSendManual}
                    disabled={sending || !message.trim() || loadingTargets || targetedUsers.length === 0}
                    className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-11 font-bold gap-2"
                  >
                    {sending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />جاري التسجيل...</>
                    ) : (
                      <><Send className="w-4 h-4" />إرسال عبر واتساب</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminWhatsApp;
