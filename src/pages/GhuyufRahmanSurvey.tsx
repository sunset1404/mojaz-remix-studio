import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send, CheckCircle2, Loader2 } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/submit-ghuyuf-entry`;

const GhuyufRahmanSurvey = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    reciter_name: "",
    country: "",
    nationality: "",
    riwaya: "",
    students_count: 0,
    pages: 0,
    juz: 0,
    hours: 0,
    notes: "",
  });

  const submit = async () => {
    if (!form.reciter_name.trim()) {
      toast({ title: "اسم المقرئ مطلوب", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإرسال");
      setSubmitted(true);
    } catch (e) {
      toast({
        title: "خطأ في الإرسال",
        description: e instanceof Error ? e.message : "حاول مجدداً",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      reciter_name: "",
      country: "",
      nationality: "",
      riwaya: "",
      students_count: 0,
      pages: 0,
      juz: 0,
      hours: 0,
      notes: "",
    });
    setSubmitted(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-gold/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logoMojaz} alt="مجاز" className="h-16 w-16 rounded-2xl mx-auto mb-3 shadow-md" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            استبانة منجزات
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1">
            إقراء ضيوف الرحمن
          </h1>
          <p className="text-sm text-muted-foreground">
            عبّئ منجزاتك في إقراء حجاج ومعتمري بيت الله الحرام
          </p>
        </div>

        {submitted ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">تم الإرسال بنجاح</h2>
            <p className="text-sm text-muted-foreground">جزاك الله خيراً على جهودك في إقراء كتاب الله.</p>
            <Button onClick={resetForm} variant="outline">إرسال إدخال آخر</Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
            <div>
              <Label>اسم المقرئ *</Label>
              <Input value={form.reciter_name} onChange={(e) => setForm({ ...form, reciter_name: e.target.value })} placeholder="الاسم الكامل" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>الدولة (مكان الإقراء)</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="السعودية" />
              </div>
              <div>
                <Label>الجنسية</Label>
                <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="مصر، إندونيسيا..." />
              </div>
              <div>
                <Label>الرواية</Label>
                <Input value={form.riwaya} onChange={(e) => setForm({ ...form, riwaya: e.target.value })} placeholder="حفص عن عاصم" />
              </div>
              <div>
                <Label>عدد الطلاب</Label>
                <Input type="number" value={form.students_count} onChange={(e) => setForm({ ...form, students_count: +e.target.value })} />
              </div>
              <div>
                <Label>عدد الصفحات</Label>
                <Input type="number" value={form.pages} onChange={(e) => setForm({ ...form, pages: +e.target.value })} />
              </div>
              <div>
                <Label>عدد الأجزاء</Label>
                <Input type="number" value={form.juz} onChange={(e) => setForm({ ...form, juz: +e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>عدد الساعات</Label>
                <Input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: +e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>ملاحظات</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <Button onClick={submit} disabled={saving} className="w-full gap-2 h-12 text-base bg-gradient-to-l from-primary to-primary/80">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              إرسال المنجزات
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              تُعرض الإحصائيات لحظياً في لوحة الإدارة بعد الإرسال
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GhuyufRahmanSurvey;
