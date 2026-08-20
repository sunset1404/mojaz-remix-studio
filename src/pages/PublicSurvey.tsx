import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, Send, ClipboardList } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

type QuestionType = "text" | "textarea" | "select" | "radio" | "checkbox" | "number" | "date" | "info";

type Question = {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  placeholder: string | null;
  is_required: boolean;
};

type Survey = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  completion_message: string | null;
  inactive_message: string | null;
};

const PublicSurvey = () => {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: s } = await supabase
        .from("surveys")
        .select("id, title, description, is_active, completion_message, inactive_message")
        .eq("external_link_code", code)
        .maybeSingle();
      if (!s) {
        setLoading(false);
        return;
      }
      setSurvey(s as Survey);
      const { data: qs } = await supabase
        .from("survey_questions")
        .select("id, question_text, question_type, options, placeholder, is_required")
        .eq("survey_id", s.id)
        .order("order_index");
      setQuestions(
        ((qs as unknown[]) || []).map((q) => {
          const row = q as Question & { options: unknown };
          return { ...row, options: Array.isArray(row.options) ? (row.options as string[]) : [] };
        })
      );
      setLoading(false);
    })();
  }, [code]);

  const setAnswer = (id: string, value: string | string[]) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const toggleCheckbox = (id: string, option: string) => {
    const current = Array.isArray(answers[id]) ? (answers[id] as string[]) : [];
    setAnswer(id, current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  };

  const submit = async () => {
    for (const q of questions) {
      if (q.question_type === "info") continue;
      const v = answers[q.id];
      const empty = Array.isArray(v) ? v.length === 0 : !String(v || "").trim();
      if (q.is_required && empty) {
        toast({ title: "حقل مطلوب", description: q.question_text, variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("submit-survey", {
      body: { code, answers },
    });
    setSubmitting(false);
    if (error || !(data as { success?: boolean } | null)?.success) {
      toast({ title: "فشل الإرسال", description: "يرجى المحاولة مرة أخرى", variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  const renderQuestion = (q: Question) => {
    const value = answers[q.id];
    switch (q.question_type) {
      case "info":
        return (
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3 whitespace-pre-line">
            {q.question_text}
          </p>
        );
      case "textarea":
        return (
          <Textarea
            rows={4}
            placeholder={q.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          />
        );
      case "select":
        return (
          <Select value={(value as string) || ""} onValueChange={(v) => setAnswer(q.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder={q.placeholder || "اختر"} />
            </SelectTrigger>
            <SelectContent>
              {q.options.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <RadioGroup value={(value as string) || ""} onValueChange={(v) => setAnswer(q.id, v)} className="space-y-2">
            {q.options.map((o) => (
              <div key={o} className="flex items-center gap-2">
                <RadioGroupItem value={o} id={`${q.id}-${o}`} />
                <Label htmlFor={`${q.id}-${o}`} className="font-normal cursor-pointer">{o}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {q.options.map((o) => (
              <div key={o} className="flex items-center gap-2">
                <Checkbox
                  id={`${q.id}-${o}`}
                  checked={Array.isArray(value) && value.includes(o)}
                  onCheckedChange={() => toggleCheckbox(q.id, o)}
                />
                <Label htmlFor={`${q.id}-${o}`} className="font-normal cursor-pointer">{o}</Label>
              </div>
            ))}
          </div>
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={q.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          />
        );
      case "date":
        return (
          <Input type="date" value={(value as string) || ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
        );
      default:
        return (
          <Input
            placeholder={q.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-2">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">هذه الاستبانة غير متاحة</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-gold/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img src={logoMojaz} alt="مجاز" className="h-16 w-16 rounded-2xl mx-auto mb-3 shadow-md" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1">{survey.title}</h1>
          {survey.description && <p className="text-sm text-muted-foreground">{survey.description}</p>}
        </div>

        {!survey.is_active ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-lg">
            {survey.inactive_message || "هذه الاستبانة غير متاحة حالياً."}
          </div>
        ) : submitted ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">تم الإرسال بنجاح</h2>
            <p className="text-sm text-muted-foreground">
              {survey.completion_message || "شكراً لكم على تعبئة الاستبانة."}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-5">
            {questions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">لا توجد أسئلة في هذه الاستبانة</p>
            ) : (
              <>
                {questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    {q.question_type !== "info" && (
                      <Label className="font-semibold">
                        {q.question_text}
                        {q.is_required && <span className="text-destructive"> *</span>}
                      </Label>
                    )}
                    {renderQuestion(q)}
                  </div>
                ))}
                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full gap-2 h-12 text-base bg-gradient-to-l from-primary to-primary/80"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  إرسال
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSurvey;
