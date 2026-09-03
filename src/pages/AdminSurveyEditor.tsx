import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowRight, Plus, Pencil, Trash2, Save, Loader2, ChevronUp, ChevronDown,
  Copy, ExternalLink, Download,
} from "lucide-react";

type QuestionType = "text" | "textarea" | "select" | "radio" | "checkbox" | "number" | "date" | "info";

type Question = {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  placeholder: string | null;
  is_required: boolean;
  order_index: number;
};

type Survey = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  external_link_code: string;
  completion_message: string | null;
  inactive_message: string | null;
};

type Submission = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

const typeLabels: Record<QuestionType, string> = {
  text: "نص قصير",
  textarea: "نص طويل",
  select: "قائمة منسدلة",
  radio: "اختيار واحد",
  checkbox: "اختيار متعدد",
  number: "رقم",
  date: "تاريخ",
  info: "نص توضيحي",
};

const hasOptions = (t: QuestionType) => t === "select" || t === "radio" || t === "checkbox";

const emptyQuestion = {
  question_text: "",
  question_type: "text" as QuestionType,
  options: "",
  placeholder: "",
  is_required: false,
};

const AdminSurveyEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qForm, setQForm] = useState(emptyQuestion);
  const [savingQ, setSavingQ] = useState(false);

  const publicUrl = survey ? `${window.location.origin}/survey/${survey.external_link_code}` : "";

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: s }, { data: qs }, { data: subs }, { data: resps }] = await Promise.all([
      supabase.from("surveys").select("*").eq("id", id).maybeSingle(),
      supabase.from("survey_questions").select("*").eq("survey_id", id).order("order_index"),
      supabase.from("survey_submissions").select("*").eq("survey_id", id).order("created_at", { ascending: false }),
      supabase.from("survey_responses").select("submission_id, question_id, answer_text"),
    ]);
    setSurvey((s as Survey) || null);
    setQuestions(
      ((qs as unknown[]) || []).map((q) => {
        const row = q as Question & { options: unknown };
        return { ...row, options: Array.isArray(row.options) ? (row.options as string[]) : [] };
      })
    );
    setSubmissions((subs as Submission[]) || []);
    const map: Record<string, Record<string, string>> = {};
    ((resps as { submission_id: string; question_id: string; answer_text: string | null }[]) || []).forEach((r) => {
      map[r.submission_id] = map[r.submission_id] || {};
      map[r.submission_id][r.question_id] = r.answer_text || "";
    });
    setAnswers(map);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveMeta = async () => {
    if (!survey) return;
    setSavingMeta(true);
    const { error } = await supabase
      .from("surveys")
      .update({
        title: survey.title,
        description: survey.description,
        is_active: survey.is_active,
        completion_message: survey.completion_message,
        inactive_message: survey.inactive_message,
      })
      .eq("id", survey.id);
    setSavingMeta(false);
    toast(
      error
        ? { title: "فشل الحفظ", description: error.message, variant: "destructive" }
        : { title: "تم حفظ إعدادات الاستبانة" }
    );
  };

  const openNew = () => {
    setEditingId(null);
    setQForm(emptyQuestion);
    setDialogOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setQForm({
      question_text: q.question_text,
      question_type: q.question_type,
      options: (q.options || []).join("\n"),
      placeholder: q.placeholder || "",
      is_required: q.is_required,
    });
    setDialogOpen(true);
  };

  const saveQuestion = async () => {
    if (!id) return;
    if (!qForm.question_text.trim()) {
      toast({ title: "نص السؤال مطلوب", variant: "destructive" });
      return;
    }
    const options = hasOptions(qForm.question_type)
      ? qForm.options.split("\n").map((o) => o.trim()).filter(Boolean)
      : [];
    if (hasOptions(qForm.question_type) && options.length === 0) {
      toast({ title: "أضف خيارًا واحدًا على الأقل", variant: "destructive" });
      return;
    }
    setSavingQ(true);
    const payload = {
      survey_id: id,
      question_text: qForm.question_text.trim(),
      question_type: qForm.question_type,
      options,
      placeholder: qForm.placeholder.trim() || null,
      is_required: qForm.question_type === "info" ? false : qForm.is_required,
    };
    const { error } = editingId
      ? await supabase.from("survey_questions").update(payload).eq("id", editingId)
      : await supabase.from("survey_questions").insert({ ...payload, order_index: questions.length });
    setSavingQ(false);
    if (error) {
      toast({ title: "فشل الحفظ", description: error.message, variant: "destructive" });
      return;
    }
    setDialogOpen(false);
    fetchAll();
  };

  const deleteQuestion = async (qid: string) => {
    const { error } = await supabase.from("survey_questions").delete().eq("id", qid);
    if (error) {
      toast({ title: "فشل الحذف", description: error.message, variant: "destructive" });
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== qid));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
    await Promise.all(
      next.map((q, i) => supabase.from("survey_questions").update({ order_index: i }).eq("id", q.id))
    );
  };

  const exportCsv = () => {
    const headers = ["التاريخ", "الاسم", "البريد", "الجوال", ...questions.filter((q) => q.question_type !== "info").map((q) => q.question_text)];
    const rows = submissions.map((s) => [
      new Date(s.created_at).toLocaleString("ar-SA"),
      s.full_name || "",
      s.email || "",
      s.phone || "",
      ...questions.filter((q) => q.question_type !== "info").map((q) => answers[s.id]?.[q.id] || ""),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${survey?.title || "survey"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const answerQuestions = useMemo(() => questions.filter((q) => q.question_type !== "info"), [questions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div dir="rtl" className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">الاستبانة غير موجودة</p>
        <Button onClick={() => navigate("/admin/surveys")}>رجوع</Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{survey.title}</h1>
            <p className="text-xs text-muted-foreground">{publicUrl}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast({ title: "تم نسخ الرابط" });
            }}
          >
            <Copy className="w-4 h-4" /> نسخ الرابط
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.open(publicUrl, "_blank", "noopener")}>
            <ExternalLink className="w-4 h-4" /> فتح
          </Button>
        </div>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">الأسئلة ({questions.length})</TabsTrigger>
          <TabsTrigger value="responses">المشاركات ({submissions.length})</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button onClick={openNew} className="gap-2">
              <Plus className="w-4 h-4" /> إضافة سؤال
            </Button>
          </div>
          {questions.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
              لا توجد أسئلة بعد
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={q.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, -1)}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, 1)}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{q.question_text}</span>
                      <Badge variant="secondary">{typeLabels[q.question_type]}</Badge>
                      {q.is_required && <Badge variant="outline" className="text-destructive">إلزامي</Badge>}
                    </div>
                    {q.options?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{q.options.join(" • ")}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(q)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteQuestion(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="responses" className="pt-4 space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={submissions.length === 0}>
              <Download className="w-4 h-4" /> تصدير CSV
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-x-auto">
            {submissions.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">لا توجد مشاركات بعد</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right whitespace-nowrap">التاريخ</TableHead>
                    <TableHead className="text-right whitespace-nowrap">الاسم</TableHead>
                    {answerQuestions.map((q) => (
                      <TableHead key={q.id} className="text-right whitespace-nowrap">{q.question_text}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(s.created_at).toLocaleString("ar-SA")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{s.full_name || "—"}</TableCell>
                      {answerQuestions.map((q) => (
                        <TableCell key={q.id} className="text-sm max-w-[240px]">
                          {answers[s.id]?.[q.id] || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="pt-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 max-w-2xl">
            <div>
              <Label>العنوان</Label>
              <Input value={survey.title} onChange={(e) => setSurvey({ ...survey, title: e.target.value })} />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea rows={3} value={survey.description || ""} onChange={(e) => setSurvey({ ...survey, description: e.target.value })} />
            </div>
            <div>
              <Label>رسالة الشكر بعد الإرسال</Label>
              <Textarea rows={2} value={survey.completion_message || ""} onChange={(e) => setSurvey({ ...survey, completion_message: e.target.value })} />
            </div>
            <div>
              <Label>رسالة عند تعطيل الاستبانة</Label>
              <Textarea rows={2} value={survey.inactive_message || ""} onChange={(e) => setSurvey({ ...survey, inactive_message: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
              <div>
                <p className="font-semibold text-sm">تفعيل الاستبانة</p>
                <p className="text-xs text-muted-foreground">عند التعطيل لا يمكن للزوار تعبئتها</p>
              </div>
              <Switch checked={survey.is_active} onCheckedChange={(v) => setSurvey({ ...survey, is_active: v })} />
            </div>
            <Button onClick={saveMeta} disabled={savingMeta} className="gap-2">
              {savingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? "تحرير السؤال" : "سؤال جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>نص السؤال</Label>
              <Textarea rows={2} value={qForm.question_text} onChange={(e) => setQForm({ ...qForm, question_text: e.target.value })} />
            </div>
            <div>
              <Label>نوع السؤال</Label>
              <Select value={qForm.question_type} onValueChange={(v) => setQForm({ ...qForm, question_type: v as QuestionType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(typeLabels) as QuestionType[]).map((t) => (
                    <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasOptions(qForm.question_type) && (
              <div>
                <Label>الخيارات (خيار في كل سطر)</Label>
                <Textarea rows={4} value={qForm.options} onChange={(e) => setQForm({ ...qForm, options: e.target.value })} />
              </div>
            )}
            {qForm.question_type !== "info" && (
              <>
                <div>
                  <Label>نص توضيحي داخل الحقل (اختياري)</Label>
                  <Input value={qForm.placeholder} onChange={(e) => setQForm({ ...qForm, placeholder: e.target.value })} />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                  <p className="text-sm font-semibold">سؤال إلزامي</p>
                  <Switch checked={qForm.is_required} onCheckedChange={(v) => setQForm({ ...qForm, is_required: v })} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveQuestion} disabled={savingQ} className="gap-2">
              {savingQ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSurveyEditor;
