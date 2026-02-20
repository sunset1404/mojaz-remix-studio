import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Bell, Send, Users, GraduationCap, Globe, Filter,
  CheckCircle2, ChevronDown, ChevronUp, X, BookOpen, Award, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────
type TargetGroup = "all" | "students" | "reciters";
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
  const [targetGroup, setTargetGroup] = useState<TargetGroup>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notifType, setNotifType] = useState<NotificationIcon>("bell");
  const [showFilters, setShowFilters] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<{ count: number } | null>(null);

  // Real stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, reciters: 0, totalNotifications: 0, countries: 0 });

  const [filters, setFilters] = useState<FilterState>({
    studentType: "all",
    countries: [],
    ijazahStatus: "all",
    gender: "all",
    riwaya: "all",
    reciterStatus: "all",
    reciterGender: "all",
  });

  // Targeted user IDs (computed on filter change)
  const [targetedUsers, setTargetedUsers] = useState<string[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { computeTargets(); }, [targetGroup, filters]);

  const fetchStats = async () => {
    setStatsLoading(true);
    const [studentsRes, recitersRes, notifsRes, countriesRes] = await Promise.all([
      supabase.from("student_profiles").select("id", { count: "exact", head: true }),
      supabase.from("reciter_profiles").select("id", { count: "exact", head: true }),
      supabase.from("notifications").select("id", { count: "exact", head: true }),
      supabase.from("student_profiles").select("residence_country"),
    ]);
    const uniqueCountries = new Set((countriesRes.data || []).map((s: any) => s.residence_country).filter(Boolean));
    setStats({
      students: studentsRes.count || 0,
      reciters: recitersRes.count || 0,
      totalNotifications: notifsRes.count || 0,
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
      if (filters.gender !== "all") query = query.eq("gender", filters.gender === "male" ? "male" : "female");
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
      if (filters.reciterGender !== "all") query = query.eq("gender", filters.reciterGender === "male" ? "male" : "female");
      const { data } = await query;
      userIds = [...userIds, ...(data || []).map((r: any) => r.user_id)];
    }

    // De-duplicate
    setTargetedUsers([...new Set(userIds)]);
    setLoadingTargets(false);
  };

  const toggleCountry = (c: string) =>
    setFilters((f) => ({
      ...f,
      countries: f.countries.includes(c) ? f.countries.filter((x) => x !== c) : [...f.countries, c],
    }));

  const applyTemplate = (t: (typeof QUICK_TEMPLATES)[number]) => {
    setTitle(t.title);
    setBody(t.body);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("يرجى إدخال عنوان ونص الإشعار");
      return;
    }
    if (targetedUsers.length === 0) {
      toast.error("لا يوجد مستخدمون يطابقون الفلاتر المحددة");
      return;
    }
    setSending(true);
    setSentResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = targetedUsers.map((uid) => ({
        user_id: uid,
        title: title.trim(),
        body: body.trim(),
        type: notifType,
        sent_by: user?.id,
      }));

      const { error } = await supabase.from("notifications").insert(rows);
      if (error) throw error;

      setSentResult({ count: targetedUsers.length });
      toast.success(`✅ تم الإرسال إلى ${targetedUsers.length} مستخدم`);
      setTitle("");
      setBody("");
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setSending(false);
    }
  };

  const selectedType = NOTIFICATION_TYPES.find((t) => t.value === notifType)!;
  const TypeIcon = selectedType.icon;

  const getTargetLabel = () => {
    if (loadingTargets) return "جاري الحساب...";
    const parts = [];
    if (targetGroup === "students") parts.push("الطلاب");
    else if (targetGroup === "reciters") parts.push("المقرئون");
    else parts.push("الجميع");
    if (filters.studentType === "ijazah" && targetGroup !== "reciters") parts.push("إجازة");
    if (filters.studentType === "quran" && targetGroup !== "reciters") parts.push("حفظ القرآن");
    if (filters.gender !== "all" && targetGroup !== "reciters") parts.push(filters.gender === "male" ? "ذكور" : "إناث");
    if (filters.reciterStatus !== "all" && targetGroup !== "students") {
      const m: Record<string, string> = { approved: "معتمدين", pending: "قيد الانتظار", suspended: "موقوفين" };
      parts.push(m[filters.reciterStatus]);
    }
    if (filters.countries.length > 0) parts.push(`${filters.countries.length} دول`);
    return parts.join(" · ");
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <div className="bg-card border-b border-border/50 px-6 py-4 flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground font-cairo">إدارة الإشعارات</h1>
            <p className="text-xs text-muted-foreground">أرسل إشعارات مخصصة للمستخدمين</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Real Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Bell} label="إشعارات أُرسلت" value={stats.totalNotifications} color="bg-primary/10 text-primary" loading={statsLoading} />
          <StatCard icon={Users} label="إجمالي الطلاب" value={stats.students} color="bg-gold/15 text-gold" loading={statsLoading} />
          <StatCard icon={GraduationCap} label="المقرئون" value={stats.reciters} color="bg-primary/10 text-primary" loading={statsLoading} />
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
                  { value: "all", label: "الجميع", icon: Users, sub: "طلاب + مقرئون" },
                  { value: "students", label: "الطلاب فقط", icon: BookOpen, sub: "جميع الطلاب المسجلين" },
                  { value: "reciters", label: "المقرئون فقط", icon: GraduationCap, sub: "جميع المقرئين" },
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
    </div>
  );
};

export default AdminNotifications;
