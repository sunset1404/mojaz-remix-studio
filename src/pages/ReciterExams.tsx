import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronRight, ClipboardList, Calendar, Clock, Users,
  Phone, Loader2, CheckCircle2, XCircle, GraduationCap,
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
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [resultDialog, setResultDialog] = useState<Exam | null>(null);
  const [resultValue, setResultValue] = useState<"passed" | "failed">("passed");
  const [resultNotes, setResultNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchExams = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("exams")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (!error && data) setExams(data as Exam[]);
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, [user]);

  const upcoming = exams.filter((e) => e.status === "scheduled");
  const done = exams.filter((e) => e.status === "completed" || e.status === "cancelled");

  const startCall = (exam: Exam) => {
    if (!exam.student_id) {
      toast({
        title: "لا يمكن بدء المكالمة",
        description: "لم يتم تحديد طالب لهذا الاختبار. يُرجى التواصل مع الإدارة.",
        variant: "destructive",
      });
      return;
    }
    navigate("/call/new", {
      state: {
        studentId: exam.student_id,
        studentName: exam.student_name || "الطالب",
        examId: exam.id,
      },
    });
  };

  const openResult = (exam: Exam) => {
    setResultValue("passed");
    setResultNotes(exam.notes || "");
    setResultDialog(exam);
  };

  const saveResult = async () => {
    if (!resultDialog) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("exams")
      .update({
        status: "completed",
        result: resultValue,
        notes: resultNotes || null,
      })
      .eq("id", resultDialog.id);
    setSaving(false);
    if (error) {
      toast({ title: "خطأ", description: "فشل حفظ النتيجة", variant: "destructive" });
      return;
    }
    toast({ title: "تم", description: "تم تسجيل نتيجة الاختبار" });
    setResultDialog(null);
    fetchExams();
  };

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

        {isUpcoming && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openResult(exam)}
              className="gap-2 flex-1"
            >
              <ClipboardList className="w-4 h-4" />
              تسجيل النتيجة
            </Button>
            <Button
              size="sm"
              onClick={() => startCall(exam)}
              className="gap-2 flex-1"
            >
              <Phone className="w-4 h-4" />
              اتصال بالطالب
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground text-right">اختبارات القبول والاستحقاق</h1>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
        </div>
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

      {/* Result dialog */}
      <Dialog open={!!resultDialog} onOpenChange={(o) => !o && setResultDialog(null)}>
        <DialogContent dir="rtl" className="max-w-sm text-right">
          <DialogHeader>
            <DialogTitle className="text-right">تسجيل نتيجة الاختبار</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>النتيجة</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResultValue("passed")}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    resultValue === "passed"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                      : "border-border"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ناجح
                </button>
                <button
                  type="button"
                  onClick={() => setResultValue("failed")}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    resultValue === "failed"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  راسب
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                rows={3}
                placeholder="ملاحظات حول أداء الطالب..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResultDialog(null)}>إلغاء</Button>
            <Button onClick={saveResult} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ النتيجة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
