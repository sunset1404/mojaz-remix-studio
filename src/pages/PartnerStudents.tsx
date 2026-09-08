import { motion } from "framer-motion";
import { ChevronRight, Users, User, Clock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StudentRow {
  student_id: string;
  assigned_at: string;
  firstName: string;
  secondName: string;
  country: string;
  hours: number;
}

const PartnerStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStudents = async () => {
      const { data: ps } = await supabase
        .from("partner_students")
        .select("student_id, assigned_at")
        .eq("partner_id", user.id)
        .eq("status", "active");

      if (!ps || ps.length === 0) return;

      const rows: StudentRow[] = [];
      for (const s of ps) {
        // Get student profile
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("full_name, nationality")
          .eq("user_id", s.student_id)
          .maybeSingle();

        // Get minutes used
        const { data: logs } = await supabase
          .from("partner_usage_logs")
          .select("minutes_used")
          .eq("partner_id", user.id)
          .eq("student_id", s.student_id);

        const totalMin = logs?.reduce((sum, l) => sum + Number(l.minutes_used), 0) || 0;
        const nameParts = (profile?.full_name || "").trim().split(/\s+/);

        rows.push({
          student_id: s.student_id,
          assigned_at: s.assigned_at,
          firstName: nameParts[0] || "طالب",
          secondName: nameParts[1] || "",
          country: profile?.nationality || "",
          hours: Number((totalMin / 60).toFixed(1)),
        });
      }
      setStudents(rows);
    };
    fetchStudents();
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-6 rounded-b-[2.5rem]">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-primary-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-primary-foreground">الطلاب المسكنين</h1>
        </div>
        <p className="text-sm text-primary-foreground/70 mt-2 mr-12">{students.length} طالب على دعمك</p>
      </div>

      {/* Students List */}
      <div className="px-5 mt-5 space-y-3">
        {students.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا يوجد طلاب مسكنين حالياً</p>
          </div>
        ) : (
          students.map((student, i) => (
            <motion.div
              key={student.student_id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                  {student.firstName || "—"}
                </span>
                {student.secondName ? (
                  <span className="text-sm font-bold text-foreground whitespace-nowrap">
                    {student.secondName}
                  </span>
                ) : null}
                <span className="h-4 w-px bg-border shrink-0" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {student.country || "—"}
                </span>
                <span className="h-4 w-px bg-border shrink-0" />
                <div className="flex items-center gap-1 text-gold whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-semibold">{student.hours} س</span>
                </div>
                <span className="h-4 w-px bg-border shrink-0" />
                <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    {new Date(student.assigned_at).toLocaleDateString("ar-SA")}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default PartnerStudents;
