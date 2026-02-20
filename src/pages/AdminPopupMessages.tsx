import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, MessageSquare,
  Sparkles, BookOpen, Award, Gift, Calendar, Star, Trophy, Loader2, X, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";

type PopupMessage = {
  id: string;
  title: string;
  message: string;
  trigger_event: string;
  icon: string;
  color_scheme: string;
  is_active: boolean;
  created_at: string;
};

type FormData = Omit<PopupMessage, "id" | "created_at">;

const TRIGGER_EVENT_GROUPS = [
  {
    label: "أحداث التلاوة والحفظ",
    events: [
      { value: "session_complete", label: "إتمام جلسة تلاوة" },
      { value: "hatma_complete", label: "إتمام ختمة القرآن الكريم" },
      { value: "juz_memorized", label: "حفظ جزء جديد" },
      { value: "pages_memorized", label: "حفظ عدد من الصفحات" },
    ],
  },
  {
    label: "أحداث الإنجازات والشهادات",
    events: [
      { value: "ijaza_earned", label: "الحصول على إجازة" },
      { value: "certificate_earned", label: "الحصول على شهادة" },
      { value: "achievement_unlocked", label: "فتح إنجاز جديد" },
      { value: "weekly_plan_complete", label: "إتمام الخطة الأسبوعية" },
      { value: "streak_7_days", label: "7 أيام متتالية من الالتزام" },
      { value: "streak_30_days", label: "30 يوماً متتالية من الالتزام" },
    ],
  },
  {
    label: "أحداث الاشتراك والتطبيق",
    events: [
      { value: "first_open", label: "فتح التطبيق أول مرة (ترحيبي)" },
      { value: "subscription_expiry_3days", label: "قرب انتهاء الاشتراك (3 أيام)" },
      { value: "subscription_expiry_1day", label: "قرب انتهاء الاشتراك (يوم واحد)" },
      { value: "subscription_expired", label: "انتهاء الاشتراك" },
      { value: "subscription_renewed", label: "تجديد الاشتراك بنجاح" },
      { value: "special_offer", label: "عرض أو خصم خاص" },
      { value: "reciter_assigned", label: "تعيين مقرئ جديد للطالب" },
      { value: "exam_scheduled", label: "تحديد موعد اختبار" },
      { value: "exam_result", label: "صدور نتيجة الاختبار" },
    ],
  },
];

// Flat list for lookups
const TRIGGER_EVENTS = TRIGGER_EVENT_GROUPS.flatMap((g) => g.events);

const COLOR_SCHEMES = [
  { value: "gold", label: "ذهبي", bg: "from-yellow-400 to-amber-500" },
  { value: "green", label: "أخضر", bg: "from-emerald-400 to-green-600" },
  { value: "blue", label: "أزرق", bg: "from-blue-400 to-indigo-600" },
  { value: "purple", label: "بنفسجي", bg: "from-purple-400 to-violet-600" },
  { value: "teal", label: "تركواز", bg: "from-teal-400 to-cyan-600" },
];

const getColorGradient = (scheme: string) =>
  COLOR_SCHEMES.find((c) => c.value === scheme)?.bg ?? "from-yellow-400 to-amber-500";

const getTriggerLabel = (event: string) =>
  TRIGGER_EVENTS.find((t) => t.value === event)?.label ?? event;

const EMPTY_FORM: FormData = {
  title: "",
  message: "",
  trigger_event: "session_complete",
  icon: "🎉",
  color_scheme: "gold",
  is_active: true,
};

const AdminPopupMessages = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PopupMessage | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [preview, setPreview] = useState<PopupMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["popup_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popup_messages" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as PopupMessage[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: FormData & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("popup_messages" as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("popup_messages" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popup_messages"] });
      toast.success(editing ? "تم تحديث الرسالة بنجاح" : "تمت إضافة الرسالة بنجاح");
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("popup_messages" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["popup_messages"] }),
    onError: () => toast.error("حدث خطأ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("popup_messages" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popup_messages"] });
      toast.success("تم حذف الرسالة");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (msg: PopupMessage) => {
    setEditing(msg);
    setForm({ title: msg.title, message: msg.message, trigger_event: msg.trigger_event, icon: msg.icon, color_scheme: msg.color_scheme, is_active: msg.is_active });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("العنوان والرسالة مطلوبان");
      return;
    }
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  const activeCount = messages.filter((m) => m.is_active).length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 px-6 py-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">الرسائل المنبثقة</h1>
              <p className="text-xs text-muted-foreground">إدارة البطاقات العائمة داخل التطبيق</p>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            رسالة جديدة
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إجمالي الرسائل", value: messages.length, color: "text-foreground" },
            { label: "نشطة", value: activeCount, color: "text-emerald-500" },
            { label: "متوقفة", value: messages.length - activeCount, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border/50 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Messages list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد رسائل بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-card rounded-2xl border border-border/50 overflow-hidden transition-all ${!msg.is_active ? "opacity-60" : ""}`}
              >
                {/* Color bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${getColorGradient(msg.color_scheme)}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{msg.icon}</span>
                      <div>
                        <p className="font-bold text-foreground">{msg.title}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1 rounded-full">
                          {getTriggerLabel(msg.trigger_event)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreview(msg)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                        title="معاينة"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(msg)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: msg.id, is_active: !msg.is_active })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                      >
                        {msg.is_active
                          ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                          : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(msg.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editing ? "تعديل الرسالة" : "إضافة رسالة جديدة"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Trigger event */}
            <div className="space-y-2">
              <label className="text-sm font-medium">حدث الإطلاق</label>
              <Select value={form.trigger_event} onValueChange={(v) => setForm((f) => ({ ...f, trigger_event: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Icon + Title row */}
            <div className="flex gap-3">
              <div className="space-y-2 w-24">
                <label className="text-sm font-medium">الأيقونة</label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="rounded-xl text-center text-xl"
                  maxLength={4}
                  placeholder="🎉"
                />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">العنوان</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="rounded-xl"
                  placeholder="أحسنت! 🎊"
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نص الرسالة</label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="rounded-xl resize-none"
                rows={3}
                placeholder="اكتب نص الرسالة التي ستظهر للمستخدم..."
              />
            </div>

            {/* Color scheme */}
            <div className="space-y-2">
              <label className="text-sm font-medium">لون البطاقة</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_SCHEMES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setForm((f) => ({ ...f, color_scheme: c.value }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm ${
                      form.color_scheme === c.value ? "border-primary" : "border-border"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${c.bg}`} />
                    {c.label}
                    {form.color_scheme === c.value && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">معاينة البطاقة</label>
              <div className={`bg-gradient-to-br ${getColorGradient(form.color_scheme)} p-0.5 rounded-2xl shadow-lg`}>
                <div className="bg-card rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{form.icon || "🎉"}</span>
                    <p className="font-bold text-foreground">{form.title || "عنوان الرسالة"}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{form.message || "نص الرسالة سيظهر هنا..."}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-row-reverse">
            <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="rounded-xl">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "حفظ التعديلات" : "إضافة الرسالة"}
            </Button>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Popup Overlay */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 px-4 bg-black/40 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div
            className="w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-br ${getColorGradient(preview.color_scheme)} p-0.5 rounded-3xl shadow-2xl`}>
              <div className="bg-card rounded-3xl p-5 relative">
                <button
                  onClick={() => setPreview(null)}
                  className="absolute left-4 top-4 w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
                <div className="text-center pt-2">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getColorGradient(preview.color_scheme)} flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg`}>
                    {preview.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{preview.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{preview.message}</p>
                  <button
                    onClick={() => setPreview(null)}
                    className={`mt-5 w-full py-3 rounded-2xl bg-gradient-to-r ${getColorGradient(preview.color_scheme)} text-white font-bold text-sm shadow-lg`}
                  >
                    رائع! شكراً
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPopupMessages;
