import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  User, BookOpen, Clock, Trophy, Award,
  Star, Calendar, Phone, MapPin, GraduationCap,
  Target, TrendingUp, ChevronDown, Pencil, Plus
} from "lucide-react";
import { ExamEvaluationsSection } from "@/components/exam-evaluation/ExamEvaluationsSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SurahSelect } from "@/components/video-call/SurahSelect";
import { AyahSelect } from "@/components/video-call/AyahSelect";
import { buildUnifiedStudentMetrics, emptyStudentMetrics, quranPositionToProgress, type UnifiedVideoCall } from "@/lib/studentAchievementMetrics";

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [calls, setCalls] = useState<UnifiedVideoCall[]>([]);
  const [certificates, setCertificates] = useState<{ user_id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editSession, setEditSession] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [reciterName, setReciterName] = useState("المقرئ");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualStartMax, setManualStartMax] = useState(0);
  const [manualEndMax, setManualEndMax] = useState(0);
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    durationMinutes: "",
    startSurah: "",
    startAyah: "",
    endSurah: "",
    endAyah: "",
    notes: "",
    rating: "",
  });
  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "",
    notes: "",
    rating: "",
    parts_reached: "",
    pages_reached: "",
  });
  const { toast } = useToast();

  const openEdit = (session: any) => {
    setEditSession(session);
    setForm({
      date: session.date || "",
      time: session.time || "",
      duration: session.duration || "",
      notes: session.notes || "",
      rating: session.rating ? String(session.rating) : "",
      parts_reached: session.parts_reached != null ? String(session.parts_reached) : "",
      pages_reached: session.pages_reached != null ? String(session.pages_reached) : "",
    });
  };

  const saveEdit = async () => {
    if (!editSession) return;
    setSaving(true);
    const payload = {
      date: form.date,
      time: form.time,
      duration: form.duration,
      notes: form.notes || null,
      rating: form.rating ? Number(form.rating) : null,
      parts_reached: form.parts_reached ? Number(form.parts_reached) : null,
      pages_reached: form.pages_reached ? Number(form.pages_reached) : null,
    };
    const { error } = await supabase
      .from("session_records")
      .update(payload)
      .eq("id", editSession.id);
    setSaving(false);
    if (error) {
      toast({ title: "خطأ", description: "لم يتم حفظ التعديلات", variant: "destructive" });
      return;
    }
    setSessions((prev) => prev.map((s) => (s.id === editSession.id ? { ...s, ...payload } : s)));
    setEditSession(null);
    toast({ title: "تم الحفظ", description: "تم تحديث سجل الجلسة" });
  };

  const resetManualForm = () => {
    setManualForm({
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      durationMinutes: "",
      startSurah: "",
      startAyah: "",
      endSurah: "",
      endAyah: "",
      notes: "",
      rating: "",
    });
    setManualStartMax(0);
    setManualEndMax(0);
  };

  const saveManualAchievement = async () => {
    if (!studentId || !user) return;
    if (!manualForm.startSurah || !manualForm.startAyah || !manualForm.endSurah || !manualForm.endAyah) {
      toast({ title: "أكمل نطاق التلاوة", description: "حدد السورة والآية من وإلى.", variant: "destructive" });
      return;
    }

    const durationMinutes = Number(manualForm.durationMinutes || 0);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 0 || durationMinutes > 480) {
      toast({ title: "مدة غير صحيحة", description: "أدخل مدة الجلسة بالدقائق من 0 إلى 480.", variant: "destructive" });
      return;
    }

    setManualSaving(true);
    const noteLines = [
      `بدأ من: ${manualForm.startSurah} آية ${manualForm.startAyah}`,
      `انتهى عند: ${manualForm.endSurah} آية ${manualForm.endAyah}`,
      "نوع الجلسة: خارج التطبيق / إدخال يدوي",
      manualForm.notes.trim() ? `ملاحظات: ${manualForm.notes.trim()}` : "",
    ].filter(Boolean);

    const progress = quranPositionToProgress(manualForm.endSurah, manualForm.endAyah);
    const payload = {
      user_id: studentId,
      other_user_name: reciterName || "المقرئ",
      date: manualForm.date,
      time: manualForm.time,
      duration: `${Math.round(durationMinutes)} دقيقة`,
      status: "مكتملة",
      rating: manualForm.rating ? Number(manualForm.rating) : null,
      notes: noteLines.join("\n"),
      parts_reached: progress.parts,
      pages_reached: progress.pages,
    };

    const { data, error } = await supabase
      .from("session_records")
      .insert(payload)
      .select("*")
      .single();

    setManualSaving(false);

    if (error) {
      toast({ title: "تعذر حفظ المنجز", description: error.message, variant: "destructive" });
      return;
    }

    setSessions((prev) => [data, ...prev]);
    setManualOpen(false);
    resetManualForm();
    toast({
      title: "تم تسجيل المنجز",
      description: "حُسب هذا الإدخال كجلسة مكتملة مستقلة، حتى لو تمت الجلسة خارج التطبيق.",
    });
  };

  useEffect(() => {
    if (!user || !studentId) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", studentId)
        .eq("assigned_reciter_id", user.id)
        .maybeSingle(),
      supabase
        .from("student_achievements")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("session_records")
        .select("*")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("video_call_sessions")
        .select("id, student_id, status, started_at, ended_at, created_at")
        .eq("student_id", studentId),
      supabase
        .from("certificates")
        .select("user_id, created_at")
        .eq("user_id", studentId),
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", studentId)
        .maybeSingle(),
      supabase
        .from("reciter_profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([profileRes, achRes, sessionsRes, callsRes, certsRes, avatarRes, reciterRes]) => {
      setStudent(profileRes.data);
      setAchievements(achRes.data);
      setSessions(sessionsRes.data || []);
      setCalls(callsRes.error ? [] : ((callsRes.data || []) as UnifiedVideoCall[]));
      setCertificates(certsRes.error ? [] : (certsRes.data || []));
      setReciterName(reciterRes.data?.full_name || user.user_metadata?.full_name || "المقرئ");
      const path = avatarRes.data?.avatar_url;
      if (path) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        setAvatarUrl(urlData?.publicUrl || null);
      } else {
        setAvatarUrl(null);
      }
      setLoading(false);
    });
  }, [user, studentId]);

  const metric = useMemo(() => {
    if (!studentId) return emptyStudentMetrics("");
    const map = buildUnifiedStudentMetrics(
      sessions,
      calls,
      certificates,
    );
    return map.get(studentId) || emptyStudentMetrics(studentId);
  }, [sessions, calls, certificates, studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground">لم يتم العثور على بيانات الطالب</p>
        <button onClick={() => navigate(-1)} className="text-primary font-semibold">العودة</button>
      </div>
    );
  }

  const level = Math.floor(metric.minutes / 300) + 1;

  const statsCards = [
    { label: "الجلسات", value: metric.sessions, icon: Calendar, color: "primary" },
    { label: "الدقائق", value: Math.round(metric.minutes), icon: Clock, color: "gold" },
    { label: "الأجزاء", value: `${metric.parts}/30`, icon: BookOpen, color: "primary" },
    { label: "الصفحات", value: metric.pages, icon: Target, color: "gold" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-10 rounded-b-[2.5rem] relative">

        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center pt-4"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 overflow-hidden flex items-center justify-center mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={student.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary-foreground" />
            )}
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">{student.full_name}</h1>
          <p className="text-sm text-primary-foreground/75 mt-1">
            {student.preferred_riwaya || student.preferred_track}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 text-gold fill-current" />
            <span className="text-sm font-bold text-primary-foreground">المستوى {level}</span>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 -mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-4 gap-2"
        >
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${stat.color === "gold" ? "bg-gold/20" : "bg-primary/10"
                }`}>
                <stat.icon className={`w-5 h-5 ${stat.color === "gold" ? "text-gold" : "text-primary"
                  }`} />
              </div>
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Personal Info */}
      <div className="px-5 mt-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            البيانات الشخصية
          </h2>
          <div className="space-y-3">
            {[
              { label: "الجنسية", value: student.nationality, icon: MapPin },
              { label: "بلد الإقامة", value: student.residence_country, icon: MapPin },
              { label: "المستوى التعليمي", value: student.education_level, icon: GraduationCap },
              { label: "المهنة", value: student.profession, icon: Target },
              { label: "الرواية المفضلة", value: student.preferred_riwaya, icon: BookOpen },
              { label: "المسار", value: student.preferred_track, icon: TrendingUp },
            ].filter(item => item.value).map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            المنجزات
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-primary">{achievements?.completions || 0}</span>
              <p className="text-[10px] text-muted-foreground mt-1">ختمات</p>
            </div>
            <div className="bg-gold/10 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-gold">{metric.certificates}</span>
              <p className="text-[10px] text-muted-foreground mt-1">شهادات</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-primary">{achievements?.commitment_rate || 0}%</span>
              <p className="text-[10px] text-muted-foreground mt-1">نسبة الالتزام</p>
            </div>
            <div className="bg-gold/10 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-gold">{level}</span>
              <p className="text-[10px] text-muted-foreground mt-1">المستوى</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sessions Log */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              سجل الجلسات
            </h2>
            <Button
              size="sm"
              onClick={() => {
                resetManualForm();
                setManualOpen(true);
              }}
              className="gap-1.5 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              إضافة منجز
            </Button>
          </div>
          <p className="mb-3 text-[11px] leading-5 text-muted-foreground">
            أي منجز تضيفه هنا يُسجل كجلسة مكتملة مستقلة، سواء تمت عبر Google Meet أو أي وسيلة خارج التطبيق.
          </p>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">لا توجد جلسات مسجلة</p>
          ) : (
            <div className="h-[21rem] overflow-y-auto overscroll-contain space-y-2 pr-1">
              {sessions.map((session) => {
                const expanded = expandedId === session.id;
                return (
                  <div key={session.id} className="bg-muted/30 rounded-xl overflow-hidden">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setExpandedId(expanded ? null : session.id)}
                      className="w-full h-auto flex items-center justify-between p-3 text-right hover:bg-transparent"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{session.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.time ? `${session.time} • ` : ""}{session.duration} • {session.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-left">
                          {session.parts_reached && (
                            <p className="text-xs text-primary">جزء {session.parts_reached}</p>
                          )}
                          {session.rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: session.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-gold fill-current" />
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </Button>

                    {expanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" /> التاريخ
                            <span className="text-foreground font-semibold">{session.date || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" /> الوقت
                            <span className="text-foreground font-semibold">{session.time || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" /> مدة الاتصال
                            <span className="text-foreground font-semibold">{session.duration || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <BookOpen className="w-3.5 h-3.5" /> الأجزاء / الصفحات
                            <span className="text-foreground font-semibold">
                              {session.parts_reached || 0} / {session.pages_reached || 0}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">التقييم</p>
                          <div className="flex items-center gap-1">
                            {session.rating ? (
                              Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < session.rating ? "text-gold fill-current" : "text-muted-foreground/40"}`}
                                />
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">لا يوجد تقييم</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">ملاحظات المقرئ</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {session.notes || "لا توجد ملاحظات"}
                          </p>
                        </div>

                        <button
                          onClick={() => openEdit(session)}
                          className="w-full bg-primary/10 text-primary py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          تعديل السجل
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Manual / external achievement session dialog */}
      <Dialog open={manualOpen} onOpenChange={(open) => {
        setManualOpen(open);
        if (!open) resetManualForm();
      }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة منجز / جلسة خارج التطبيق</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-6 text-muted-foreground">
              كل حفظ لهذا النموذج يُحسب كجلسة مكتملة مستقلة للطالب، حتى لو كان اللقاء عبر Google Meet أو اتصال خارجي.
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">التاريخ</Label>
                <Input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">الوقت</Label>
                <Input
                  type="time"
                  value={manualForm.time}
                  onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">مدة الجلسة بالدقائق</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={480}
                value={manualForm.durationMinutes}
                onChange={(e) => setManualForm({ ...manualForm, durationMinutes: e.target.value.replace(/[^0-9]/g, "") })}
                placeholder="مثال: 30"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">بدأ من</Label>
              <div className="flex gap-2">
                <SurahSelect
                  value={manualForm.startSurah}
                  onChange={(name, maxAyahs) => {
                    setManualStartMax(maxAyahs);
                    setManualForm({ ...manualForm, startSurah: name, startAyah: "" });
                  }}
                />
                <AyahSelect
                  value={manualForm.startAyah}
                  max={manualStartMax}
                  onChange={(ayah) => setManualForm({ ...manualForm, startAyah: ayah })}
                  disabled={!manualForm.startSurah}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">انتهى عند</Label>
              <div className="flex gap-2">
                <SurahSelect
                  value={manualForm.endSurah}
                  onChange={(name, maxAyahs) => {
                    setManualEndMax(maxAyahs);
                    setManualForm({ ...manualForm, endSurah: name, endAyah: "" });
                  }}
                />
                <AyahSelect
                  value={manualForm.endAyah}
                  max={manualEndMax}
                  onChange={(ayah) => setManualForm({ ...manualForm, endAyah: ayah })}
                  disabled={!manualForm.endSurah}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">التقييم</Label>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setManualForm({ ...manualForm, rating: String(i + 1) })}
                    className="h-8 w-8"
                  >
                    <Star
                      className={`w-6 h-6 ${i < Number(manualForm.rating || 0) ? "text-gold fill-current" : "text-muted-foreground/40"}`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">ملاحظات إضافية</Label>
              <Textarea
                rows={3}
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder="أي ملاحظات على التلاوة أو الحفظ"
              />
            </div>

            <Button
              onClick={saveManualAchievement}
              disabled={manualSaving}
              className="w-full gradient-primary text-primary-foreground"
            >
              {manualSaving ? "جاري الحفظ..." : "حفظ المنجز واحتسابه جلسة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit session dialog */}
      <Dialog open={!!editSession} onOpenChange={(o) => !o && setEditSession(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل سجل الجلسة</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
            هذا الخيار لتصحيح جلسة موجودة فقط ولا يزيد عدد الجلسات. إذا كانت جلسة جديدة أو لقاءً خارجيًا فاستخدم «إضافة منجز».
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">التاريخ</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">الوقت</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">مدة الاتصال</Label>
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">الأجزاء</Label>
                <Input
                  type="number"
                  value={form.parts_reached}
                  onChange={(e) => setForm({ ...form, parts_reached: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">الصفحات</Label>
                <Input
                  type="number"
                  value={form.pages_reached}
                  onChange={(e) => setForm({ ...form, pages_reached: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">التقييم</Label>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`التقييم ${i + 1} من 5`}
                    onClick={() => setForm({ ...form, rating: String(i + 1) })}
                    className="h-8 w-8"
                  >
                    <Star
                      className={`w-6 h-6 ${i < Number(form.rating || 0) ? "text-gold fill-current" : "text-muted-foreground/40"}`}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">الملاحظات</Label>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات المقرئ على الجلسة"
              />
            </div>
            <Button
              onClick={saveEdit}
              disabled={saving}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold"
            >
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Exam Evaluations */}
      <div className="px-5 mt-4">
        <ExamEvaluationsSection studentId={student.user_id} />
      </div>



      {/* Contact Actions */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={async () => {
              if (!user || !student?.user_id || isCalling) return;
              setIsCalling(true);
              try {
                const { data, error } = await supabase.functions.invoke("reciter-call", {
                  body: { student_id: student.user_id },
                });

                if (error) throw error;
                if (data?.error) throw new Error(data.error);

                navigate(`/call/${data.room_id}`);
              } catch (err: any) {
                toast({
                  title: "خطأ",
                  description: err?.message || "فشل في بدء المكالمة",
                  variant: "destructive",
                });
              } finally {
                setIsCalling(false);
              }
            }}
            disabled={isCalling}
            className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Phone className="w-5 h-5" />
            {isCalling ? "جاري الاتصال..." : "اتصال"}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDetail;
