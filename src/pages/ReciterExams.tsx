import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight, Calendar, Clock, Users,
  Loader2, CheckCircle2, XCircle, GraduationCap,
} from "lucide-react";

type ExamType = "admission" | "eligibility";
type ExamStatus = "scheduled" | "completed" | "cancelled";
type ExamResult = "passed" | "failed" | null;

interface Exam {
  id: string;
  type: ExamType;
  student_id: string | null;
  student_name: string | null;
  date: string;
  time: string;
  committee_member_1: string | null;
  committee_member_1_name: string | null;
  committee_member_2: string | null;
  committee_member_2_name: string | null;
  committee_member_3: string | null;
  committee_member_3_name: string | null;
  notes: string | null;
  status: ExamStatus;
  result: ExamResult;
}

export default function ReciterExams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  const fetchExams = async () => {
    if (!user) return;
    setLoading(true);
    // Get reciter profile id, then only fetch exams where this reciter is a committee member
    const { data: profile } = await (supabase as any)
      .from("reciter_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) {
      setExams([]);
      setLoading(false);
      return;
    }
    const { data, error } = await (supabase as any)
      .from("exams")
      .select("*")
      .or(`committee_member_1.eq.${profile.id},committee_member_2.eq.${profile.id},committee_member_3.eq.${profile.id}`)
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (!error && data) setExams(data as Exam[]);
    setLoading(false);
  };


  useEffect(() => { fetchExams(); }, [user]);

  const upcoming = exams.filter((e) => e.status === "scheduled");
  const done = exams.filter((e) => e.status === "completed" || e.status === "cancelled");


  const renderCard = (exam: Exam, isUpcoming: boolean) => (
    <motion.div
      key={exam.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4 border-border/60">
        <div className="flex items-start justify-between gap-3">
          {!isUpcoming && exam.result && (
            <Badge
              variant={exam.result === "passed" ? "default" : "destructive"}
              className="gap-1 text-xs"
            >
              {exam.result === "passed" ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {exam.result === "passed" ? "ناجح" : "راسب"}
            </Badge>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <div className="text-right">
              <p className="font-bold text-sm text-foreground">
                اختبار {exam.type === "admission" ? "قبول" : "استحقاق"}
              </p>
              <p className="text-xs text-muted-foreground">
                {exam.student_name || "بدون طالب محدد"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{exam.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>{exam.date}</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 mb-1.5 justify-end">
            <span className="text-xs font-semibold text-foreground">أعضاء اللجنة</span>
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {[exam.committee_member_1_name, exam.committee_member_2_name, exam.committee_member_3_name]
              .filter(Boolean)
              .map((n, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                  {n}
                </Badge>
              ))}
          </div>
        </div>

        {exam.notes && (
          <p className="text-xs text-muted-foreground mt-3 bg-muted/30 rounded-lg p-2 text-right">
            {exam.notes}
          </p>
        )}


      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground text-right">اختبارات القبول والاستحقاق</h1>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>


      <div className="px-5" dir="rtl">
        <Tabs value={tab} onValueChange={setTab} dir="rtl">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upcoming">القادمة ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="done">المنجزة ({done.length})</TabsTrigger>
          </TabsList>


          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : upcoming.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground text-sm text-right">
                لا توجد اختبارات قادمة
              </Card>
            ) : (
              upcoming.map((e) => renderCard(e, true))
            )}
          </TabsContent>

          <TabsContent value="done" className="mt-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : done.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground text-sm text-right">
                لا توجد اختبارات منجزة
              </Card>
            ) : (
              done.map((e) => renderCard(e, false))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
