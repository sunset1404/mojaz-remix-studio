import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Clock, Users, BookOpen, Award, FileSpreadsheet, Loader2, RefreshCw, Trash2, UserMinus, UserCheck } from "lucide-react";

type Grouping = "month" | "week" | "day";

interface CallRow {
  id: string;
  student_id: string;
  reciter_id: string;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string | null;
}

interface AchievementRow {
  student_id: string;
  pages_memorized: number;
  parts_memorized: number;
  sessions_count: number;
  total_minutes: number;
  certificates_count: number;
}

const callDate = (call: CallRow) => (call.started_at || call.created_at || "").slice(0, 10);

const callMinutes = (call: CallRow) => {
  if (!call.started_at || !call.ended_at) return 0;
  const started = new Date(call.started_at).getTime();
  const ended = new Date(call.ended_at).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended <= started) return 0;
  return (ended - started) / 60000;
};

const isStartedCall = (call: CallRow) => Boolean(call.started_at);
const isCompletedCall = (call: CallRow) =>
  Boolean(call.started_at && call.ended_at && new Date(call.ended_at).getTime() >= new Date(call.started_at).getTime());

const metricNumber = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatMetric = (value: unknown, round = false) => {
  const numeric = metricNumber(value);
  return (round ? Math.round(numeric) : numeric).toLocaleString("en-US");
};

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const startOfWeek = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sunday
  d.setUTCDate(d.getUTCDate() - day);
  return toISO(d);
};

const periodKey = (iso: string, grouping: Grouping) => {
  if (grouping === "month") return iso.slice(0, 7);
  if (grouping === "week") return startOfWeek(iso);
  return iso;
};

const periodLabel = (key: string, grouping: Grouping) => {
  if (grouping === "month") return key;
  if (grouping === "week") return `أسبوع ${key}`;
  return key;
};

const AdminPartnerReport = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [partner, setPartner] = useState<{ full_name: string; organization_name: string | null; cost_per_minute: number; total_support_amount: number } | null>(null);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [certificates, setCertificates] = useState<{ user_id: string; created_at: string }[]>([]);
  const [assignments, setAssignments] = useState<{ id: string; student_id: string; status: string; assigned_at: string; name: string; phone: string | null; track: string | null; program_name: string | null }[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);


  const today = toISO(new Date());
  const yearAgo = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return toISO(d); })();
  const [from, setFrom] = useState(yearAgo);
  const [to, setTo] = useState(today);
  const [grouping, setGrouping] = useState<Grouping>("month");
  const [studentFilter, setStudentFilter] = useState<string>("all");

  useEffect(() => { if (partnerId) fetchData(); }, [partnerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, psRes, progRes] = await Promise.all([
        supabase.from("partner_profiles").select("full_name, organization_name, cost_per_minute, total_support_amount").eq("user_id", partnerId!).maybeSingle(),
        supabase.from("partner_students").select("id, student_id, status, assigned_at").eq("partner_id", partnerId!).order("assigned_at", { ascending: false }),
        supabase.from("programs").select("id, name"),
      ]);
      if (pRes.error) throw pRes.error;
      setPartner(pRes.data as any);

      const allIds = (psRes.data || []).map(s => s.student_id);
      const allProfRes = allIds.length
        ? await supabase.from("student_profiles").select("user_id, full_name, phone, preferred_track, program_id").in("user_id", allIds)
        : { data: [] as any[] };
      const programMap = new Map((progRes.data || []).map(p => [p.id, p.name]));
      const profMap = new Map((allProfRes.data || []).map((p: any) => [p.user_id, p]));
      setAssignments((psRes.data || []).map(a => {
        const p: any = profMap.get(a.student_id);
        return {
          id: a.id,
          student_id: a.student_id,
          status: a.status,
          assigned_at: a.assigned_at,
          name: p?.full_name || "طالب",
          phone: p?.phone || null,
          track: p?.preferred_track || null,
          program_name: p?.program_id ? (programMap.get(p.program_id) || null) : null,
        };
      }));

      const studentIds = (psRes.data || []).filter(s => s.status === "active").map(s => s.student_id);
      if (studentIds.length === 0) {
        setStudents([]); setCalls([]); setAchievements([]); setCertificates([]);
        return;
      }

      const [profRes, callRes, achievementRes, certRes] = await Promise.all([
        supabase.from("student_profiles").select("user_id, full_name").in("user_id", studentIds),
        supabase
          .from("video_call_sessions")
          .select("id, student_id, reciter_id, status, started_at, ended_at, created_at")
          .in("student_id", studentIds),
        supabase
          .from("student_achievements")
          .select("student_id, pages_memorized, parts_memorized, sessions_count, total_minutes, certificates_count")
          .in("student_id", studentIds),
        supabase.from("certificates").select("user_id, created_at").in("user_id", studentIds),
      ]);

      if (callRes.error) throw callRes.error;
      if (achievementRes.error) throw achievementRes.error;

      setStudents((profRes.data || []).map(p => ({ id: p.user_id, name: p.full_name })));
      setCalls((callRes.data || []) as CallRow[]);
      setAchievements((achievementRes.data || []) as AchievementRow[]);
      setCertificates(certRes.data || []);
    } catch (error: any) {
      toast({ title: "خطأ في تحميل التقرير", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignment = async (id: string, current: string) => {
    const next = current === "active" ? "inactive" : "active";
    try {
      setSavingId(id);
      const { error } = await supabase.from("partner_students").update({ status: next }).eq("id", id);
      if (error) throw error;
      toast({ title: next === "active" ? "تم تفعيل التسكين" : "تم إيقاف التسكين" });
      await fetchData();
    } catch (error: any) {
      toast({ title: "تعذر تحديث التسكين", description: error.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const removeAssignment = async (id: string, name: string) => {
    if (!window.confirm(`حذف تسكين الطالب "${name}" من هذا الداعم؟`)) return;
    try {
      setSavingId(id);
      const { error } = await supabase.from("partner_students").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "تم حذف التسكين" });
      await fetchData();
    } catch (error: any) {
      toast({ title: "تعذر حذف التسكين", description: error.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };


  const inRange = (iso: string) => !!iso && iso >= from && iso <= to;
  const matchStudent = (id: string) => studentFilter === "all" || studentFilter === id;

  const filteredCalls = useMemo(
    () => calls.filter(call => isStartedCall(call) && inRange(callDate(call)) && matchStudent(call.student_id)),
    [calls, from, to, studentFilter]
  );
  const filteredCerts = useMemo(
    () => certificates.filter(c => inRange(c.created_at.slice(0, 10)) && matchStudent(c.user_id)),
    [certificates, from, to, studentFilter]
  );

  const achievementMap = useMemo(
    () => new Map(achievements.map(item => [item.student_id, item])),
    [achievements]
  );

  const selectedStudents = useMemo(
    () => students.filter(student => matchStudent(student.id)),
    [students, studentFilter]
  );

  const summary = useMemo(() => {
    const completedCalls = filteredCalls.filter(isCompletedCall);
    const minutes = completedCalls.reduce((sum, call) => sum + callMinutes(call), 0);
    const pages = selectedStudents.reduce((sum, student) => sum + metricNumber(achievementMap.get(student.id)?.pages_memorized), 0);
    const parts = selectedStudents.reduce((sum, student) => sum + metricNumber(achievementMap.get(student.id)?.parts_memorized), 0);
    const activeStudents = new Set(filteredCalls.map(call => call.student_id)).size;
    const cost = minutes * Number(partner?.cost_per_minute || 0);
    return {
      minutes,
      pages,
      parts,
      completed: completedCalls.length,
      sessions: filteredCalls.length,
      activeStudents,
      certs: filteredCerts.length,
      cost,
    };
  }, [filteredCalls, filteredCerts, selectedStudents, achievementMap, partner]);

  const byPeriod = useMemo(() => {
    const map = new Map<string, { sessions: number; completed: number; minutes: number; certs: number; students: Set<string> }>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { sessions: 0, completed: 0, minutes: 0, certs: 0, students: new Set() });
      return map.get(key)!;
    };

    filteredCalls.forEach(call => {
      const date = callDate(call);
      if (!date) return;
      const entry = ensure(periodKey(date, grouping));
      entry.sessions += 1;
      if (isCompletedCall(call)) {
        entry.completed += 1;
        entry.minutes += callMinutes(call);
      }
      entry.students.add(call.student_id);
    });

    filteredCerts.forEach(cert => {
      ensure(periodKey(cert.created_at.slice(0, 10), grouping)).certs += 1;
    });

    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, value]) => ({
        key,
        label: periodLabel(key, grouping),
        ...value,
        students: value.students.size,
      }));
  }, [filteredCalls, filteredCerts, grouping]);

  const byStudent = useMemo(() => {
    const map = new Map<string, {
      sessions: number;
      completed: number;
      minutes: number;
      pages: number;
      parts: number;
      certs: number;
    }>();

    const ensure = (studentId: string) => {
      if (!map.has(studentId)) {
        const achievement = achievementMap.get(studentId);
        map.set(studentId, {
          sessions: 0,
          completed: 0,
          minutes: 0,
          pages: metricNumber(achievement?.pages_memorized),
          parts: metricNumber(achievement?.parts_memorized),
          certs: 0,
        });
      }
      return map.get(studentId)!;
    };

    selectedStudents.forEach(student => ensure(student.id));

    filteredCalls.forEach(call => {
      const entry = ensure(call.student_id);
      entry.sessions += 1;
      if (isCompletedCall(call)) {
        entry.completed += 1;
        entry.minutes += callMinutes(call);
      }
    });

    filteredCerts.forEach(cert => {
      ensure(cert.user_id).certs += 1;
    });

    return Array.from(map.entries())
      .map(([id, value]) => ({
        id,
        name: students.find(student => student.id === id)?.name || "طالب",
        ...value,
      }))
      .sort((a, b) => b.minutes - a.minutes || b.completed - a.completed);
  }, [filteredCalls, filteredCerts, selectedStudents, achievementMap, students]);

  const applyPreset = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    setFrom(toISO(d));
    setTo(toISO(new Date()));
  };

  const exportExcel = async () => {
    try {
      setExporting(true);
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const info = [
        ["تقرير منجزات الداعم"],
        ["الداعم", partner?.full_name || ""],
        ["الجهة", partner?.organization_name || "-"],
        ["الفترة", `${from} إلى ${to}`],
        ["التصنيف", grouping === "month" ? "شهري" : grouping === "week" ? "أسبوعي" : "يومي"],
        [],
        ["إجمالي الجلسات", summary.sessions],
        ["الجلسات المكتملة", summary.completed],
        ["دقائق الاتصال الفعلية", Number(summary.minutes.toFixed(1))],
        ["الصفحات المنجزة التراكمية", summary.pages],
        ["الأجزاء المكتملة التراكمية", summary.parts],
        ["الشهادات", summary.certs],
        ["الطلاب النشطون", summary.activeStudents],
        ["التكلفة (ريال)", Math.round(summary.cost)],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(info), "الملخص");

      const periodsSheet = [
        ["الفترة", "الجلسات", "المكتملة", "الدقائق الفعلية", "الشهادات", "الطلاب"],
        ...byPeriod.map(p => [p.label, p.sessions, p.completed, Number(p.minutes.toFixed(1)), p.certs, p.students]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(periodsSheet), "حسب الفترة");

      const studentsSheet = [
        ["الطالب", "الجلسات", "المكتملة", "الدقائق", "الصفحات", "الأجزاء", "الشهادات"],
        ...byStudent.map(s => [s.name, s.sessions, s.completed, Number(s.minutes.toFixed(1)), s.pages, s.parts, s.certs]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(studentsSheet), "حسب الطالب");

      XLSX.writeFile(wb, `تقرير-${partner?.full_name || "الداعم"}-${from}_${to}.xlsx`);
      toast({ title: "تم تصدير التقرير" });
    } catch (error: any) {
      toast({ title: "فشل التصدير", description: error.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      <div className="flex items-center gap-3 flex-row-reverse">
        <SidebarTrigger />
        <div className="flex-1 min-w-0 text-right">
          <h1 className="text-lg md:text-xl font-bold truncate flex items-center justify-end gap-2">
            تقرير منجزات: {partner?.full_name}
            <BarChart3 className="w-5 h-5 text-primary" />
          </h1>
          {partner?.organization_name && (
            <p className="text-xs text-muted-foreground truncate">{partner.organization_name}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="report" className="space-y-5">
        <TabsList>
          <TabsTrigger value="report">تقرير المنجزات</TabsTrigger>
          <TabsTrigger value="students">الطلاب المسكّنون ({assignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 flex-row-reverse justify-end">
                <Users className="w-4 h-4 text-primary" />
                الطلاب المسكّنون على الداعم
                <Badge variant="secondary">{assignments.filter(a => a.status === "active").length} نشط</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">لا يوجد طلاب مسكّنون على هذا الداعم</p>
              ) : (
                assignments.map(a => (
                  <div key={a.id} className="flex flex-row-reverse items-center gap-3 p-3 rounded-lg border border-border/40 bg-card">
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{a.name}</p>
                        <Badge variant={a.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {a.status === "active" ? "نشط" : "موقوف"}
                        </Badge>
                        {a.program_name && <Badge variant="outline" className="text-[10px]">{a.program_name}</Badge>}
                        {a.track && <Badge variant="outline" className="text-[10px]">{a.track}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        تاريخ التسكين: {a.assigned_at?.slice(0, 10)}{a.phone ? ` · ${a.phone}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={savingId === a.id}
                      onClick={() => removeAssignment(a.id, a.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={savingId === a.id}
                      onClick={() => toggleAssignment(a.id, a.status)}
                    >
                      {savingId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : a.status === "active" ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      {a.status === "active" ? "إيقاف" : "تفعيل"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-right">تصفية البيانات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
            <div className="space-y-1">
              <Label className="text-xs block text-right">من</Label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="text-right" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs block text-right">إلى</Label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="text-right" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs block text-right">التصنيف</Label>
              <Select value={grouping} onValueChange={(v) => setGrouping(v as Grouping)}>
                <SelectTrigger className="text-right"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">شهري</SelectItem>
                  <SelectItem value="week">أسبوعي</SelectItem>
                  <SelectItem value="day">يومي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs block text-right">الطالب</Label>
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="text-right"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الطلاب</SelectItem>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => applyPreset(12)}>سنة</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(6)}>6 أشهر</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(3)}>3 أشهر</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(1)}>شهر</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); setFrom(toISO(d)); setTo(toISO(new Date())); }}
            >
              أسبوع
            </Button>
            <Button size="sm" className="gap-2 ms-auto" onClick={exportExcel} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              تصدير Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "الجلسات", value: formatMetric(summary.sessions), sub: `${formatMetric(summary.completed)} مكتملة`, icon: BookOpen },
          { label: "الدقائق", value: summary.minutes.toLocaleString("en-US", { maximumFractionDigits: 1 }), sub: "من وقت الاتصال الفعلي", icon: Clock },
          { label: "الطلاب النشطون", value: formatMetric(summary.activeStudents), sub: `${formatMetric(students.length)} مسكّن`, icon: Users },
          { label: "الشهادات", value: formatMetric(summary.certs), sub: `${formatMetric(summary.pages)} صفحة · ${formatMetric(summary.parts)} جزء`, icon: Award },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            المنجزات حسب الفترة
            <Badge variant="secondary">{byPeriod.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {byPeriod.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات في هذه الفترة</p>
          ) : (
            <div className="w-full overflow-x-auto" dir="rtl">
              <table dir="rtl" className="w-full min-w-[820px] table-auto text-sm text-right">
                <thead className="bg-muted/25">
                  <tr className="border-b border-border/60 text-foreground">
                    <th className="min-w-[150px] whitespace-nowrap px-4 py-3 text-right font-bold">الفترة</th>
                    <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-center font-bold">الجلسات</th>
                    <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-center font-bold">المكتملة</th>
                    <th className="min-w-[95px] whitespace-nowrap px-3 py-3 text-center font-bold">الدقائق</th>
                    <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-center font-bold">الشهادات</th>
                    <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-center font-bold">الطلاب</th>
                  </tr>
                </thead>
                <tbody>
                  {byPeriod.map(p => (
                    <tr key={p.key} className="border-b border-border/30 last:border-0 hover:bg-muted/15">
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">{p.label}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(p.sessions)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(p.completed)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{p.minutes.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(p.certs)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(p.students)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            المنجزات حسب الطالب
            <Badge variant="secondary">{byStudent.length}</Badge>
          </CardTitle>
          <p className="text-[11px] leading-5 text-muted-foreground">
            الجلسات والمكتملة والدقائق والشهادات حسب الفترة المحددة. الصفحات والأجزاء هي إجمالي الإنجاز التراكمي الحقيقي للطالب حتى الآن.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {byStudent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات في هذه الفترة</p>
          ) : (
            <div className="w-full overflow-x-auto" dir="rtl">
              <table dir="rtl" className="w-full min-w-[760px] table-auto text-sm text-right">
                <thead className="bg-muted/25">
                  <tr className="border-b border-border/60 text-foreground">
                    <th className="sticky right-0 z-10 min-w-[190px] whitespace-nowrap bg-muted/95 px-4 py-3 text-right font-bold">الطالب</th>
                    <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-center font-bold">الجلسات</th>
                    <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-center font-bold">المكتملة</th>
                    <th className="min-w-[100px] whitespace-nowrap px-3 py-3 text-center font-bold">الدقائق</th>
                    <th className="min-w-[100px] whitespace-nowrap px-3 py-3 text-center font-bold">الصفحات</th>
                    <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-center font-bold">الأجزاء</th>
                    <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-center font-bold">الشهادات</th>
                  </tr>
                </thead>
                <tbody>
                  {byStudent.map(s => (
                    <tr key={s.id} className="border-b border-border/30 last:border-0 hover:bg-muted/15">
                      <td className="sticky right-0 z-[1] whitespace-nowrap bg-card px-4 py-3 text-right font-bold text-foreground">{s.name}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(s.sessions)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(s.completed)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{s.minutes.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(s.pages)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(s.parts)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold tabular-nums text-foreground">{formatMetric(s.certs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPartnerReport;
