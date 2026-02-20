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
  Trophy, Search, Loader2, Save, Plus, RefreshCw,
  BookOpen, Clock, Target, Star, Award,
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
};

type EditableField = keyof Omit<AchievementRow, "id" | "student_id">;

const fields: { key: EditableField; label: string; suffix?: string }[] = [
  { key: "sessions_count", label: "الجلسات" },
  { key: "total_minutes", label: "الدقائق" },
  { key: "parts_memorized", label: "الأجزاء" },
  { key: "pages_memorized", label: "الصفحات" },
  { key: "commitment_rate", label: "الالتزام%", suffix: "%" },
  { key: "certificates_count", label: "الشهادات" },
  { key: "completions", label: "الختمات" },
];

const AdminAchievements = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, Partial<AchievementRow>>>({});

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

  const getValue = (student: StudentRow, field: EditableField): number => {
    const editVal = edits[student.user_id]?.[field];
    if (editVal !== undefined) return editVal as number;
    return (student.achievement?.[field] as number) ?? 0;
  };

  const handleEdit = (userId: string, field: EditableField, value: string) => {
    const num = parseFloat(value) || 0;
    setEdits((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: num },
    }));
  };

  const handleSave = async (student: StudentRow) => {
    const userId = student.user_id;
    setSaving((prev) => ({ ...prev, [userId]: true }));

    const currentEdits = edits[userId] || {};
    const base: AchievementRow = {
      student_id: userId,
      sessions_count: student.achievement?.sessions_count ?? 0,
      total_minutes: student.achievement?.total_minutes ?? 0,
      parts_memorized: student.achievement?.parts_memorized ?? 0,
      pages_memorized: student.achievement?.pages_memorized ?? 0,
      commitment_rate: student.achievement?.commitment_rate ?? 0,
      certificates_count: student.achievement?.certificates_count ?? 0,
      completions: student.achievement?.completions ?? 0,
    };
    const payload = { ...base, ...currentEdits };

    let error;
    if (student.achievement?.id) {
      // update
      ({ error } = await supabase
        .from("student_achievements")
        .update(payload)
        .eq("id", student.achievement.id));
    } else {
      // insert
      ({ error } = await supabase
        .from("student_achievements")
        .insert(payload));
    }

    if (error) {
      toast({ title: "خطأ في الحفظ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ تم الحفظ بنجاح" });
      setEdits((prev) => { const n = { ...prev }; delete n[userId]; return n; });
      fetchData();
    }
    setSaving((prev) => ({ ...prev, [userId]: false }));
  };

  const hasEdits = (userId: string) =>
    edits[userId] && Object.keys(edits[userId]).length > 0;

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const totalStudents = students.length;
  const withRecords = students.filter((s) => s.achievement).length;
  const totalSessions = students.reduce((sum, s) => sum + (s.achievement?.sessions_count ?? 0), 0);
  const totalHours = Math.round(students.reduce((sum, s) => sum + (s.achievement?.total_minutes ?? 0), 0) / 60);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة الإنجازات</h1>
            <p className="text-sm text-muted-foreground">تعديل بيانات إنجازات الطلاب مباشرةً</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب", value: totalStudents, icon: BookOpen, color: "text-blue-500" },
          { label: "لديهم سجلات", value: withRecords, icon: Award, color: "text-green-500" },
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
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">الطالب</TableHead>
                {fields.map((f) => (
                  <TableHead key={f.key} className="text-center font-bold text-xs">
                    {f.label}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold">حفظ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={fields.length + 2} className="text-center py-8 text-muted-foreground">
                    لا يوجد طلاب
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((student) => (
                  <TableRow
                    key={student.id}
                    className={hasEdits(student.user_id) ? "bg-primary/5" : ""}
                  >
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
                        {!student.achievement && (
                          <Badge variant="secondary" className="text-[10px]">جديد</Badge>
                        )}
                      </div>
                    </TableCell>
                    {fields.map((f) => (
                      <TableCell key={f.key} className="p-1">
                        <Input
                          type="number"
                          min={0}
                          value={getValue(student, f.key)}
                          onChange={(e) => handleEdit(student.user_id, f.key, e.target.value)}
                          className="h-8 w-20 text-center text-sm mx-auto"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant={hasEdits(student.user_id) ? "default" : "outline"}
                        onClick={() => handleSave(student)}
                        disabled={saving[student.user_id]}
                        className="h-8 px-3 gap-1"
                      >
                        {saving[student.user_id] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : student.achievement ? (
                          <Save className="w-3 h-3" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        <span className="text-xs">
                          {student.achievement ? "حفظ" : "إنشاء"}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminAchievements;
