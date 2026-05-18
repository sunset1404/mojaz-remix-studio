import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send, CheckCircle2, Loader2, LogIn } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

type Location = { id: string; name: string };

const todayISO = () => new Date().toISOString().slice(0, 10);

const GhuyufRahmanSurvey = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({
    reciter_name: "",
    entry_date: todayISO(),
    location: "",
    nationalities_count: 0,
    riwayat_count: 0,
    students_count: 0,
    pages: 0,
    juz: 0,
    hours: 0,
    notes: "",
  });

  // Prefill name from profile + load locations once authed
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: rp }, { data: sp }, { data: pr }, { data: locs }] = await Promise.all([
        supabase.from("reciter_profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("student_profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("ghuyuf_rahman_locations").select("id, name").order("name"),
      ]);
      const name =
        rp?.full_name ||
        sp?.full_name ||
        pr?.full_name ||
        (user.user_metadata as any)?.full_name ||
        user.email ||
        "";
      setForm((f) => ({ ...f, reciter_name: name }));
      setLocations((locs as Location[]) || []);
    })();
  }, [user]);

  const submit = async () => {
    if (!form.reciter_name.trim()) {
      toast({ title: "اسم المقرئ مطلوب", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      reciter_name: form.reciter_name.trim(),
      entry_date: form.entry_date || todayISO(),
      location: form.location || null,
      nationalities_count: Number(form.nationalities_count) || 0,
      riwayat_count: Number(form.riwayat_count) || 0,
      students_count: Number(form.students_count) || 0,
      pages: Number(form.pages) || 0,
      juz: Number(form.juz) || 0,
      hours: Number(form.hours) || 0,
      notes: form.notes || null,
      source: "survey",
    };
    const { error } = await supabase.from("ghuyuf_rahman_entries").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "خطأ في الإرسال", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  const resetForm = () => {
    setForm((f) => ({
      ...f,
      entry_date: todayISO(),
      location: "",
      nationalities_count: 0,
      riwayat_count: 0,
      students_count: 0,
      pages: 0,
      juz: 0,
      hours: 0,
      notes: "",
    }));
    setSubmitted(false);
  };

  // Auth gate
  if (authLoading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <InlineLogin />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-gold/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img src={logoMojaz} alt="مجاز" className="h-16 w-16 rounded-2xl mx-auto mb-3 shadow-md" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            استبانة منجزات
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1">إقراء ضيوف الرحمن</h1>
          <p className="text-sm text-muted-foreground">عبّئ منجزاتك في إقراء حجاج ومعتمري بيت الله الحرام</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {form.reciter_name && (
                <div className="md:col-span-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-2 text-sm">
                  <span className="text-muted-foreground">المقرئ: </span>
                  <span className="font-bold text-foreground">{form.reciter_name}</span>
                </div>
              )}
              <div>
                <Label>التاريخ</Label>
                <Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
              </div>
              <div>
                <Label>موقع الإقراء</Label>
                <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموقع" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">لا توجد مواقع</div>
                    ) : (
                      locations.map((l) => (
                        <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عدد الجنسيات</Label>
                <Input type="number" min={0} value={form.nationalities_count} onChange={(e) => setForm({ ...form, nationalities_count: +e.target.value })} />
              </div>
              <div>
                <Label>عدد الروايات / القراءات</Label>
                <Input type="number" min={0} value={form.riwayat_count} onChange={(e) => setForm({ ...form, riwayat_count: +e.target.value })} />
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
