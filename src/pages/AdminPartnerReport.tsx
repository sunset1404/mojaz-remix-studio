import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ArrowRight, BarChart3, Clock, Users, BookOpen, Award, FileSpreadsheet, Loader2, RefreshCw, Trash2, UserMinus, UserCheck } from "lucide-react";

type Grouping = "month" | "week" | "day";

interface SessionRow {
  user_id: string;
  date: string;
  status: string;
  duration: string;
  pages_reached: number | null;
  parts_reached: number | null;
}

const parseMinutes = (duration: string): number => {
  if (!duration) return 0;
  const hours = duration.match(/(\d+)\s*ساعة/);
  const mins = duration.match(/(\d+)\s*دقيقة/);
  let total = 0;
  if (hours) total += parseInt(hours[1]) * 60;
  if (mins) total += parseInt(mins[1]);
  if (!hours && !mins) {
    const n = parseInt(duration);
    if (!isNaN(n)) total = n;
  }
  return total;
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [partner, setPartner] = useState<{ full_name: string; organization_name: string | null; cost_per_minute: number; total_support_amount: number } | null>(null);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [usage, setUsage] = useState<{ student_id: string; minutes_used: number; session_date: string }[]>([]);
  const [certificates, setCertificates] = useState<{ user_id: string; created_at: string }[]>([]);

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
      const [pRes, psRes] = await Promise.all([
        supabase.from("partner_profiles").select("full_name, organization_name, cost_per_minute, total_support_amount").eq("user_id", partnerId!).maybeSingle(),
        supabase.from("partner_students").select("student_id, status").eq("partner_id", partnerId!),
      ]);
      if (pRes.error) throw pRes.error;
      setPartner(pRes.data as any);

      const studentIds = (psRes.data || []).filter(s => s.status === "active").map(s => s.student_id);
      if (studentIds.length === 0) {
        setStudents([]); setSessions([]); setUsage([]); setCertificates([]);
        return;
      }

      const [profRes, sesRes, usageRes, certRes] = await Promise.all([
        supabase.from("student_profiles").select("user_id, full_name").in("user_id", studentIds),
        supabase.from("session_records").select("user_id, date, status, duration, pages_reached, parts_reached").in("user_id", studentIds),
        supabase.from("partner_usage_logs").select("student_id, minutes_used, session_date").eq("partner_id", partnerId!),
        supabase.from("certificates").select("user_id, created_at").in("user_id", studentIds),
      ]);

      setStudents((profRes.data || []).map(p => ({ id: p.user_id, name: p.full_name })));
      setSessions((sesRes.data || []) as SessionRow[]);
      setUsage((usageRes.data || []).map(u => ({ ...u, minutes_used: Number(u.minutes_used) })));
      setCertificates(certRes.data || []);
    } catch (error: any) {
      toast({ title: "خطأ في تحميل التقرير", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inRange = (iso: string) => !!iso && iso >= from && iso <= to;
  const matchStudent = (id: string) => studentFilter === "all" || studentFilter === id;

  const filteredSessions = useMemo(
    () => sessions.filter(s => inRange(s.date) && matchStudent(s.user_id)),
    [sessions, from, to, studentFilter]
  );
  const filteredUsage = useMemo(
    () => usage.filter(u => inRange(u.session_date) && matchStudent(u.student_id)),
    [usage, from, to, studentFilter]
  );
  const filteredCerts = useMemo(
    () => certificates.filter(c => inRange(c.created_at.slice(0, 10)) && matchStudent(c.user_id)),
    [certificates, from, to, studentFilter]
  );

  const summary = useMemo(() => {
    const minutes = filteredSessions.reduce((s, r) => s + parseMinutes(r.duration), 0);
    const usageMinutes = filteredUsage.reduce((s, r) => s + r.minutes_used, 0);
    const pages = filteredSessions.reduce((s, r) => s + (r.pages_reached || 0), 0);
    const parts = filteredSessions.reduce((s, r) => s + (r.parts_reached || 0), 0);
    const completed = filteredSessions.filter(r => r.status === "مكتملة").length;
    const activeStudents = new Set(filteredSessions.map(r => r.user_id)).size;
    const cost = usageMinutes * Number(partner?.cost_per_minute || 0);
    return { minutes, usageMinutes, pages, parts, completed, sessions: filteredSessions.length, activeStudents, certs: filteredCerts.length, cost };
  }, [filteredSessions, filteredUsage, filteredCerts, partner]);

  const byPeriod = useMemo(() => {
    const map = new Map<string, { sessions: number; completed: number; minutes: number; pages: number; parts: number; certs: number; students: Set<string> }>();
    const ensure = (k: string) => {
      if (!map.has(k)) map.set(k, { sessions: 0, completed: 0, minutes: 0, pages: 0, parts: 0, certs: 0, students: new Set() });
      return map.get(k)!;
    };
    filteredSessions.forEach(s => {
      const e = ensure(periodKey(s.date, grouping));
      e.sessions++;
      if (s.status === "مكتملة") e.completed++;
      e.minutes += parseMinutes(s.duration);
      e.pages += s.pages_reached || 0;
      e.parts += s.parts_reached || 0;
      e.students.add(s.user_id);
    });
    filteredCerts.forEach(c => { ensure(periodKey(c.created_at.slice(0, 10), grouping)).certs++; });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, v]) => ({ key, label: periodLabel(key, grouping), ...v, students: v.students.size }));
  }, [filteredSessions, filteredCerts, grouping]);

  const byStudent = useMemo(() => {
    const map = new Map<string, { sessions: number; completed: number; minutes: number; pages: number; parts: number; certs: number }>();
    const ensure = (k: string) => {
      if (!map.has(k)) map.set(k, { sessions: 0, completed: 0, minutes: 0, pages: 0, parts: 0, certs: 0 });
      return map.get(k)!;
    };
    filteredSessions.forEach(s => {
      const e = ensure(s.user_id);
      e.sessions++;
      if (s.status === "مكتملة") e.completed++;
      e.minutes += parseMinutes(s.duration);
      e.pages += s.pages_reached || 0;
      e.parts += s.parts_reached || 0;
    });
    filteredCerts.forEach(c => { ensure(c.user_id).certs++; });
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, name: students.find(s => s.id === id)?.name || "طالب", ...v }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [filteredSessions, filteredCerts, students]);

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
        ["دقائق الجلسات", Math.round(summary.minutes)],
        ["الدقائق المحسوبة على الدعم", Math.round(summary.usageMinutes)],
        ["الصفحات", summary.pages],
        ["الأجزاء", summary.parts],
        ["الشهادات", summary.certs],
        ["الطلاب النشطون", summary.activeStudents],
        ["التكلفة (ريال)", Math.round(summary.cost)],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(info), "الملخص");

      const periodsSheet = [
        ["الفترة", "الجلسات", "المكتملة", "الدقائق", "الصفحات", "الأجزاء", "الشهادات", "الطلاب"],
        ...byPeriod.map(p => [p.label, p.sessions, p.completed, Math.round(p.minutes), p.pages, p.parts, p.certs, p.students]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(periodsSheet), "حسب الفترة");

      const studentsSheet = [
        ["الطالب", "الجلسات", "المكتملة", "الدقائق", "الصفحات", "الأجزاء", "الشهادات"],
        ...byStudent.map(s => [s.name, s.sessions, s.completed, Math.round(s.minutes), s.pages, s.parts, s.certs]),
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
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/admin/partners")}>
          <ArrowRight className="w-4 h-4" /> رجوع
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold truncate flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            تقرير منجزات: {partner?.full_name}
          </h1>
          {partner?.organization_name && (
            <p className="text-xs text-muted-foreground truncate">{partner.organization_name}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">تصفية البيانات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">من</Label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">إلى</Label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">التصنيف</Label>
              <Select value={grouping} onValueChange={(v) => setGrouping(v as Grouping)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">شهري</SelectItem>
                  <SelectItem value="week">أسبوعي</SelectItem>
                  <SelectItem value="day">يومي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">الطالب</Label>
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          { label: "الجلسات", value: summary.sessions.toLocaleString(), sub: `${summary.completed} مكتملة`, icon: BookOpen },
          { label: "الدقائق", value: Math.round(summary.minutes).toLocaleString(), sub: `${Math.round(summary.usageMinutes).toLocaleString()} على الدعم`, icon: Clock },
          { label: "الطلاب النشطون", value: summary.activeStudents.toLocaleString(), sub: `${students.length} مسكّن`, icon: Users },
          { label: "الشهادات", value: summary.certs.toLocaleString(), sub: `${summary.pages} صفحة · ${summary.parts} جزء`, icon: Award },
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
        <CardContent className="overflow-x-auto">
          {byPeriod.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات في هذه الفترة</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border/40">
                  <th className="text-right py-2">الفترة</th>
                  <th className="text-right py-2">الجلسات</th>
                  <th className="text-right py-2">المكتملة</th>
                  <th className="text-right py-2">الدقائق</th>
                  <th className="text-right py-2">الصفحات</th>
                  <th className="text-right py-2">الأجزاء</th>
                  <th className="text-right py-2">الشهادات</th>
                  <th className="text-right py-2">الطلاب</th>
                </tr>
              </thead>
              <tbody>
                {byPeriod.map(p => (
                  <tr key={p.key} className="border-b border-border/20">
                    <td className="py-2 font-medium">{p.label}</td>
                    <td className="py-2">{p.sessions}</td>
                    <td className="py-2">{p.completed}</td>
                    <td className="py-2">{Math.round(p.minutes)}</td>
                    <td className="py-2">{p.pages}</td>
                    <td className="py-2">{p.parts}</td>
                    <td className="py-2">{p.certs}</td>
                    <td className="py-2">{p.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            المنجزات حسب الطالب
            <Badge variant="secondary">{byStudent.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {byStudent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات في هذه الفترة</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border/40">
                  <th className="text-right py-2">الطالب</th>
                  <th className="text-right py-2">الجلسات</th>
                  <th className="text-right py-2">المكتملة</th>
                  <th className="text-right py-2">الدقائق</th>
                  <th className="text-right py-2">الصفحات</th>
                  <th className="text-right py-2">الأجزاء</th>
                  <th className="text-right py-2">الشهادات</th>
                </tr>
              </thead>
              <tbody>
                {byStudent.map(s => (
                  <tr key={s.id} className="border-b border-border/20">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2">{s.sessions}</td>
                    <td className="py-2">{s.completed}</td>
                    <td className="py-2">{Math.round(s.minutes)}</td>
                    <td className="py-2">{s.pages}</td>
                    <td className="py-2">{s.parts}</td>
                    <td className="py-2">{s.certs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPartnerReport;
