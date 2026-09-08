import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  BookMarked, Users, Clock, Award, TrendingUp, ArrowRight, RefreshCw, Search, Plus, X, BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Program {
  id: string;
  name: string;
  description: string | null;
  track_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  max_students: number | null;
  notes: string | null;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  nationality: string;
  preferred_track: string;
  preferred_riwaya: string;
  created_at: string;
}

interface Achievement {
  student_id: string;
  sessions_count: number;
  total_minutes: number;
  pages_memorized: number;
  parts_memorized: number;
  certificates_count: number;
  commitment_rate: number;
  completions: number;
}

const TRACK_LABELS: Record<string, string> = { general: "إقراء عام", ijazah: "إجازات", mutoon: "حفظ متون الإقراء", mixed: "مشترك" };

const AdminProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [program, setProgram] = useState<Program | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [others, setOthers] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  useEffect(() => { if (id) fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const db = supabase as any;
      const [pRes, sRes, oRes] = await Promise.all([
        db.from("programs").select("*").eq("id", id!).maybeSingle(),
        db.from("student_profiles").select("*").eq("program_id", id!),
        db.from("student_profiles").select("*").is("program_id", null),
      ]);
      if (pRes.error) throw pRes.error;
      setProgram(pRes.data as any);
      const list = ((sRes.data as any[]) || []) as Student[];
      setStudents(list);
      setOthers(((oRes.data as any[]) || []) as Student[]);
      if (list.length) {
        const { data: achs } = await supabase
          .from("student_achievements").select("*")
          .in("student_id", list.map((s) => s.user_id));
        setAchievements(((achs as any[]) || []) as Achievement[]);
      } else setAchievements([]);
    } catch (e: any) {
      toast({ title: "خطأ في تحميل التقرير", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const setProgramFor = async (userId: string, programId: string | null) => {
    try {
      const { error } = await supabase
        .from("student_profiles").update({ program_id: programId } as any).eq("user_id", userId);
      if (error) throw error;
      toast({ title: programId ? "تم تسكين الطالب ✅" : "تم إخراج الطالب من البرنامج" });
      fetchAll();
    } catch (e: any) {
      toast({ title: "تعذّر التنفيذ", description: e.message, variant: "destructive" });
    }
  };

  const getAch = (uid: string) => achievements.find((a) => a.student_id === uid);

  const stats = useMemo(() => {
    const sum = (f: (a: Achievement) => number) => achievements.reduce((t, a) => t + Number(f(a) || 0), 0);
    return {
      students: students.length,
      males: students.filter((s) => s.gender === "male").length,
      females: students.filter((s) => s.gender === "female").length,
      sessions: sum((a) => a.sessions_count),
      minutes: Math.round(sum((a) => a.total_minutes)),
      pages: sum((a) => a.pages_memorized),
      parts: sum((a) => a.parts_memorized),
      certificates: sum((a) => a.certificates_count),
      completions: sum((a) => a.completions),
      commitment: achievements.length ? Math.round(sum((a) => a.commitment_rate) / achievements.length) : 0,
    };
  }, [students, achievements]);

  const nationalities = useMemo(() => {
    const m: Record<string, number> = {};
    students.forEach((s) => { if (s.nationality) m[s.nationality] = (m[s.nationality] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [students]);

  const addCandidates = useMemo(
    () => others.filter((s) => !addSearch || (s.full_name || "").includes(addSearch) || (s.email || "").includes(addSearch)).slice(0, 50),
    [others, addSearch]
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/programs")} className="gap-1 text-muted-foreground">
              <ArrowRight className="w-4 h-4" /> البرامج
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{program?.name || "تقرير البرنامج"}</h1>
              <p className="text-xs text-muted-foreground">التقرير الكامل للبرنامج وطلابه</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" /> تسكين طالب
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchAll} disabled={loading} className="gap-2 text-muted-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث
            </Button>
          </div>
        </div>
      </nav>

      <div className="gradient-primary px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookMarked className="w-7 h-7 text-gold" />
            <h2 className="text-2xl font-bold text-primary-foreground">{program?.name || "—"}</h2>
            {program && (
              <Badge className={`text-[10px] ${program.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                {program.status === "active" ? "نشط" : "مؤرشف"}
              </Badge>
            )}
          </div>
          <p className="text-primary-foreground/70 text-sm max-w-2xl">{program?.description || "لا يوجد وصف"}</p>
          <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-primary-foreground/80">
            <span className="px-2 py-0.5 rounded-full bg-white/10">{TRACK_LABELS[program?.track_type || ""] || program?.track_type || "—"}</span>
            {program?.start_date && <span className="px-2 py-0.5 rounded-full bg-white/10">البداية: {program.start_date}</span>}
            {program?.end_date && <span className="px-2 py-0.5 rounded-full bg-white/10">النهاية: {program.end_date}</span>}
            {program?.max_students && <span className="px-2 py-0.5 rounded-full bg-white/10">الحد الأقصى: {program.max_students}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "الطلاب", value: stats.students, icon: Users, color: "primary" },
            { label: "الجلسات", value: stats.sessions, icon: Clock, color: "gold" },
            { label: "الدقائق", value: stats.minutes, icon: Clock, color: "primary" },
            { label: "الصفحات", value: stats.pages, icon: BookOpen, color: "gold" },
            { label: "الأجزاء", value: stats.parts, icon: BookOpen, color: "primary" },
            { label: "الشهادات", value: stats.certificates, icon: Award, color: "gold" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${s.color === "gold" ? "bg-gold/15" : "bg-primary/10"}`}>
                    <s.icon className={`w-5 h-5 ${s.color === "gold" ? "text-gold" : "text-primary"}`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{s.value}</span>
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> مؤشرات عامة</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">متوسط الالتزام</span><span>{stats.commitment}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الختمات</span><span>{stats.completions}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ذكور / إناث</span><span>{stats.males} / {stats.females}</span></div>
          </CardContent>
        </Card>
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-gold" /> أعلى الجنسيات</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {nationalities.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد بيانات</p> :
              nationalities.map(([n, c]) => (
                <span key={n} className="px-3 py-1 rounded-full bg-accent/40 text-xs">{n}: {c}</span>
              ))}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/30 bg-accent/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              طلاب البرنامج
              <Badge variant="secondary" className="text-xs">{students.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />)}</div>
            ) : students.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-10">لا يوجد طلاب مسكّنون على هذا البرنامج</p>
            ) : (
              <div className="space-y-2">
                {students.map((s) => {
                  const a = getAch(s.user_id);
                  return (
                    <div key={s.user_id} className="rounded-xl border border-border/30 bg-accent/10 p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{s.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.email || "—"} · {s.nationality || "—"} · {s.preferred_track || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                          <span>الجلسات: <span className="text-foreground font-semibold">{a?.sessions_count ?? 0}</span></span>
                          <span>الدقائق: <span className="text-foreground font-semibold">{Math.round(a?.total_minutes ?? 0)}</span></span>
                          <span>الالتزام: <span className="text-foreground font-semibold">{Math.round(Number(a?.commitment_rate ?? 0))}%</span></span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive text-xs gap-1"
                          onClick={() => setProgramFor(s.user_id, null)}>
                          <X className="w-4 h-4" /> إخراج
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تسكين طالب على البرنامج</DialogTitle>
            <DialogDescription>الطلاب غير المسكّنين على أي برنامج</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو البريد..." value={addSearch} onChange={(e) => setAddSearch(e.target.value)} className="pr-9" />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 mt-2">
            {addCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا يوجد طلاب متاحون</p>
            ) : addCandidates.map((s) => (
              <div key={s.user_id} className="flex items-center justify-between gap-2 rounded-lg border border-border/30 p-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email || "—"} · {s.preferred_track || "—"}</p>
                </div>
                <Button size="sm" className="h-8 text-xs" onClick={() => setProgramFor(s.user_id, id!)}>تسكين</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProgramDetail;
