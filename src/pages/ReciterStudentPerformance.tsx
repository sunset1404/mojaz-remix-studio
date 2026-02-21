import { motion } from "framer-motion";
import { BarChart3, Users, Clock, BookOpen, Star, TrendingUp, ChevronDown, ChevronUp, Award, Target, Flame, Search, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface StudentPerformance {
  student_id: string;
  full_name: string;
  sessions_count: number;
  total_minutes: number;
  parts_memorized: number;
  pages_memorized: number;
  commitment_rate: number;
  certificates_count: number;
  completions: number;
}

const ReciterStudentPerformance = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchStudentPerformance();
  }, [user]);

  const fetchStudentPerformance = async () => {
    if (!user) return;
    setLoading(true);

    // Get students assigned to this reciter
    const { data: assignedStudents } = await supabase
      .from("student_profiles")
      .select("user_id, full_name")
      .eq("assigned_reciter_id", user.id);

    if (!assignedStudents || assignedStudents.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const studentIds = assignedStudents.map(s => s.user_id);

    // Get achievements for all assigned students
    const { data: achievements } = await supabase
      .from("student_achievements")
      .select("*")
      .in("student_id", studentIds);

    const merged: StudentPerformance[] = assignedStudents.map(sp => {
      const ach = achievements?.find(a => a.student_id === sp.user_id);
      return {
        student_id: sp.user_id,
        full_name: sp.full_name,
        sessions_count: ach?.sessions_count ?? 0,
        total_minutes: Number(ach?.total_minutes ?? 0),
        parts_memorized: ach?.parts_memorized ?? 0,
        pages_memorized: ach?.pages_memorized ?? 0,
        commitment_rate: Number(ach?.commitment_rate ?? 0),
        certificates_count: ach?.certificates_count ?? 0,
        completions: ach?.completions ?? 0,
      };
    });

    setStudents(merged);
    setLoading(false);
  };

  const filtered = students.filter(s =>
    s.full_name.includes(search)
  );

  // Overall stats
  const totalStudents = students.length;
  const totalSessions = students.reduce((a, s) => a + s.sessions_count, 0);
  const totalMinutes = students.reduce((a, s) => a + s.total_minutes, 0);
  const totalParts = students.reduce((a, s) => a + s.parts_memorized, 0);
  const avgCommitment = totalStudents > 0
    ? Math.round(students.reduce((a, s) => a + s.commitment_rate, 0) / totalStudents)
    : 0;
  const totalCertificates = students.reduce((a, s) => a + s.certificates_count, 0);

  const getCommitmentColor = (rate: number) => {
    if (rate >= 80) return "text-green-500";
    if (rate >= 50) return "text-yellow-500";
    return "text-destructive";
  };

  const getCommitmentBg = (rate: number) => {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 50) return "bg-yellow-500";
    return "bg-destructive";
  };

  const getLevel = (minutes: number) => Math.floor(minutes / 300) + 1;

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-10 rounded-b-[2.5rem]">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">أداء الطلاب</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">متابعة شاملة لأداء جميع طلابك</p>
        </motion.div>

        {/* Overall Summary Cards */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { icon: Users, value: totalStudents, label: "طالب", color: "from-blue-500/20 to-blue-600/20" },
            { icon: Clock, value: Math.round(totalMinutes / 60), label: "ساعة تعليم", color: "from-emerald-500/20 to-emerald-600/20" },
            { icon: BookOpen, value: totalParts, label: "جزء محفوظ", color: "from-amber-500/20 to-amber-600/20" },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10`}>
              <stat.icon className="w-5 h-5 text-primary-foreground/80 mx-auto mb-1" />
              <div className="text-xl font-bold text-primary-foreground">{stat.value}</div>
              <div className="text-[10px] text-primary-foreground/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-5 -mt-5"
      >
        <div className="bg-card rounded-2xl shadow-lg border border-border p-4 flex items-center justify-around">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-lg font-bold text-foreground">{totalSessions}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">جلسة</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Target className={`w-4 h-4 ${getCommitmentColor(avgCommitment)}`} />
              <span className="text-lg font-bold text-foreground">{avgCommitment}%</span>
            </div>
            <span className="text-[10px] text-muted-foreground">متوسط الالتزام</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-foreground">{totalCertificates}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">شهادة</span>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="px-5 mt-5">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن طالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border pr-10 rounded-xl"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-16">
            <span className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "لا توجد نتائج" : "لا يوجد طلاب مسندين إليك حالياً"}
            </p>
          </div>
        ) : (
          filtered.map((student, i) => {
            const isExpanded = expandedId === student.student_id;
            const level = getLevel(student.total_minutes);
            const progressPercent = Math.min(100, (student.parts_memorized / 30) * 100);

            return (
              <motion.div
                key={student.student_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              >
                {/* Student Card Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : student.student_id)}
                  className="w-full p-4 flex items-center gap-3 text-right"
                >
                  {/* Avatar Circle with Level */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">
                        {student.full_name.charAt(0)}
                      </span>
                    </div>
                    <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                      <span className="text-[9px] font-bold text-primary">{level}</span>
                    </span>
                  </div>

                  {/* Name & Quick Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate text-sm">{student.full_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {student.parts_memorized}/30
                      </span>
                      <span className={`text-[11px] flex items-center gap-1 ${getCommitmentColor(student.commitment_rate)}`}>
                        <TrendingUp className="w-3 h-3" />
                        {student.commitment_rate}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="flex items-center gap-2">
                    <div className="text-left">
                      <div className="text-xs font-bold text-primary">{Math.round(progressPercent)}%</div>
                      <div className="text-[9px] text-muted-foreground">الإنجاز</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    {/* Progress Bar */}
                    <div className="px-4 pt-4 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">تقدم الحفظ</span>
                        <span className="text-xs font-bold text-primary">{student.parts_memorized} من 30 جزء</span>
                      </div>
                      <Progress value={progressPercent} className="h-2.5 rounded-full" />
                    </div>

                    {/* Stats Grid */}
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Flame className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-foreground">{student.sessions_count}</div>
                          <div className="text-[10px] text-muted-foreground">جلسة</div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-foreground">{Math.round(student.total_minutes)}</div>
                          <div className="text-[10px] text-muted-foreground">دقيقة</div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-foreground">{student.pages_memorized}</div>
                          <div className="text-[10px] text-muted-foreground">صفحة</div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className={`text-base font-bold ${getCommitmentColor(student.commitment_rate)}`}>
                            {student.commitment_rate}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">الالتزام</div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-foreground">{student.certificates_count}</div>
                          <div className="text-[10px] text-muted-foreground">شهادة</div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-foreground">{level}</div>
                          <div className="text-[10px] text-muted-foreground">المستوى</div>
                        </div>
                      </div>
                    </div>

                    {/* Commitment Bar */}
                    <div className="px-4 pb-4">
                      <div className="bg-muted/30 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-foreground">نسبة الالتزام</span>
                          <span className={`text-xs font-bold ${getCommitmentColor(student.commitment_rate)}`}>
                            {student.commitment_rate >= 80 ? "ممتاز" : student.commitment_rate >= 50 ? "جيد" : "يحتاج تحسين"}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getCommitmentBg(student.commitment_rate)}`}
                            style={{ width: `${Math.min(100, student.commitment_rate)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReciterStudentPerformance;
