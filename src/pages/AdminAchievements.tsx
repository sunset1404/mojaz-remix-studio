import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Trophy, Search, Loader2, RefreshCw,
  BookOpen, Clock, Target, Award, Zap,
  CheckCircle2, Info,
} from "lucide-react";

type StudentRow = {
  id: string;
  user_id: string;
  full_name: string;
  nationality: string;
  achievement?: AchievementRow | null;
};

type AchievementRow = {
  id?: string;
  student_id: string;
  sessions_count: number;
  total_minutes: number;
  parts_memorized: number;
  pages_memorized: number;
  commitment_rate: number;
  certificates_count: number;
  completions: number;
  updated_at?: string;
};

const AdminAchievements = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [recalculating, setRecalculating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: studentData, error } = await supabase
      .from("student_profiles")
      .select("id, user_id, full_name, nationality")
      .order("full_name");

    if (error) {
      toast({ title: "خطأ في جلب الطلاب", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: achievementsData } = await supabase
      .from("student_achievements")
      .select("*");

    const achievementsMap = new Map<string, AchievementRow>();
    achievementsData?.forEach((a) => achievementsMap.set(a.student_id, a as AchievementRow));

    const rows: StudentRow[] = (studentData || []).map((s) => ({
      id: s.id,
      user_id: s.user_id,
      full_name: s.full_name,
      nationality: s.nationality,
      achievement: achievementsMap.get(s.user_id) || null,
    }));

    setStudents(rows);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecalculate = async (userId: string) => {
    setRecalculating(userId);
    const { error } = await supabase.rpc("recalculate_student_achievements", { p_student_id: userId });
    if (error) {
      toast({ title: "خطأ في إعادة الحساب", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ تم إعادة الحساب بنجاح" });
      fetchData();
    }
    setRecalculating(null);
  };

  const handleRecalculateAll = async () => {
    setLoading(true);
    let errors = 0;
    for (const student of students) {
      const { error } = await supabase.rpc("recalculate_student_achievements", { p_student_id: student.user_id });
      if (error) errors++;
    }
    if (errors > 0) {
      toast({ title: `تم مع ${errors} أخطاء`, variant: "destructive" });
    } else {
      toast({ title: "✅ تم إعادة حساب جميع الطلاب" });
    }
    fetchData();
  };

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = students.length;
  const withRecords = students.filter((s) => s.achievement).length;
  const totalSessions = students.reduce((sum, s) => sum + (s.achievement?.sessions_count ?? 0), 0);
  const totalHours = Math.round(students.reduce((sum, s) => sum + (s.achievement?.total_minutes ?? 0), 0) / 60);

  const formatLastUpdated = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">إنجازات الطلاب</h1>
            <p className="text-sm text-muted-foreground">تُحسب تلقائياً من الجلسات والشهادات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button size="sm" onClick={handleRecalculateAll} disabled={loading} className="gap-2">
            <Zap className="w-4 h-4" />
            إعادة حساب الكل
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-foreground/80 space-y-1">
          <p className="font-semibold text-foreground">كيف تُحسب الإنجازات تلقائياً؟</p>
          <ul className="space-y-0.5 text-muted-foreground text-xs list-disc list-inside">
            <li>الجلسات والدقائق: تُجمع من كل جلسة مكتملة تلقائياً</li>
            <li>الأجزاء والصفحات: تُحدَّث حين يُدخل المقرئ رقم الجزء/الصفحة بعد كل جلسة</li>
            <li>الشهادات: تُحسب تلقائياً عند إصدار شهادة للطالب</li>
            <li>نسبة الالتزام: جلسات الأسبوع الحالي ÷ الأيام المجدولة في الخطة الأسبوعية</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب", value: totalStudents, icon: BookOpen, color: "text-blue-500" },
          { label: "لديهم سجلات", value: `${withRecords} / ${totalStudents}`, icon: CheckCircle2, color: "text-green-500" },
          { label: "إجمالي الجلسات", value: totalSessions, icon: Target, color: "text-primary" },
          { label: "إجمالي الساعات", value: totalHours, icon: Clock, color: "text-gold" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث باسم الطالب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">الطالب</TableHead>
                <TableHead className="text-center font-bold text-xs">الجلسات</TableHead>
                <TableHead className="text-center font-bold text-xs">الدقائق</TableHead>
                <TableHead className="text-center font-bold text-xs">الأجزاء</TableHead>
                <TableHead className="text-center font-bold text-xs">الصفحات</TableHead>
                <TableHead className="text-center font-bold text-xs">الالتزام%</TableHead>
                <TableHead className="text-center font-bold text-xs">الشهادات</TableHead>
                <TableHead className="text-center font-bold text-xs">الختمات</TableHead>
                <TableHead className="text-center font-bold text-xs">آخر تحديث</TableHead>
                <TableHead className="text-center font-bold text-xs">إعادة حساب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    لا يوجد طلاب
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((student) => {
                  const ach = student.achievement;
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {student.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{student.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">{student.nationality}</p>
                          </div>
                          {!ach && (
                            <Badge variant="secondary" className="text-[10px]">لا يوجد سجل</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-foreground">{ach?.sessions_count ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-foreground">{ach?.total_minutes ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-foreground">{ach?.parts_memorized ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-foreground">{ach?.pages_memorized ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold text-sm ${
                          (ach?.commitment_rate ?? 0) >= 80 ? "text-green-600" :
                          (ach?.commitment_rate ?? 0) >= 50 ? "text-yellow-600" : "text-destructive"
                        }`}>
                          {ach?.commitment_rate ?? 0}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-foreground">{ach?.certificates_count ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-gold">{ach?.completions ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[10px] text-muted-foreground">
                          {ach?.updated_at ? formatLastUpdated(ach.updated_at) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRecalculate(student.user_id)}
                          disabled={recalculating === student.user_id}
                          className="h-7 px-2 gap-1 text-primary hover:text-primary"
                        >
                          {recalculating === student.user_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminAchievements;
