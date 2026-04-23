import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, RefreshCw, Plus, Trash2, MessageCircle, Phone, Award } from "lucide-react";

interface MetaTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: any[];
  rejected_reason?: string;
}

interface ConnectionInfo {
  connected: boolean;
  phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  error?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  APPROVED: { label: "معتمد", color: "bg-green-500/15 text-green-700 border-green-500/30", icon: CheckCircle2 },
  PENDING: { label: "قيد المراجعة", color: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Clock },
  REJECTED: { label: "مرفوض", color: "bg-red-500/15 text-red-700 border-red-500/30", icon: XCircle },
  PAUSED: { label: "متوقف", color: "bg-gray-500/15 text-gray-700 border-gray-500/30", icon: Clock },
  DISABLED: { label: "معطل", color: "bg-gray-500/15 text-gray-700 border-gray-500/30", icon: XCircle },
};

const CATEGORIES = [
  { value: "UTILITY", label: "خدمي (Utility)" },
  { value: "MARKETING", label: "تسويقي (Marketing)" },
  { value: "AUTHENTICATION", label: "تحقق (Authentication)" },
];

const LANGUAGES = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "الإنجليزية" },
  { value: "en_US", label: "English (US)" },
];

const HEADER_TYPES = [
  { value: "NONE", label: "بدون رأس" },
  { value: "TEXT", label: "نص" },
  { value: "DOCUMENT", label: "ملف PDF" },
  { value: "IMAGE", label: "صورة" },
];

export default function AdminWhatsAppTemplates() {
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [templates, setTemplates] = useState<MetaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("UTILITY");
  const [language, setLanguage] = useState("ar");
  const [headerType, setHeaderType] = useState("DOCUMENT");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("مبارك عليك يا {{1}}! تم إصدار {{2}} باسمك. نسأل الله لك التوفيق والسداد.");
  const [footerText, setFooterText] = useState("منصة مجاز للقرآن الكريم");
  const [hasButton, setHasButton] = useState(false);
  const [buttonText, setButtonText] = useState("معاينة الشهادة");

  const callFunction = async (action: string, opts: { method?: string; body?: any; query?: string } = {}) => {
    try {
      const { method = "GET", body, query = "" } = opts;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { error: "انتهت الجلسة. سجّل الدخول مرة أخرى." };
      }

      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-templates?action=${action}${query}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok && !data.error) {
        return { error: `Request failed (${res.status})` };
      }

      return data;
    } catch (error) {
      console.error("whatsapp-templates call failed", error);
      return {
        error: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      };
    }
  };

  const getCreateErrorMessage = (result: { error?: string; reason?: string }) => {
    if (result.reason === "INVALID_META_APP_ID_OR_PERMISSIONS") {
      return "فشل إنشاء القالب: App ID في Meta غير صحيح أو لا يملك صلاحية WhatsApp Business.";
    }

    return "فشل إنشاء القالب: " + (result.error || "حدث خطأ غير متوقع");
  };
...
  const handleCreate = async () => {
    if (!name.match(/^[a-z0-9_]+$/)) {
      toast.error("اسم القالب يجب أن يكون حروف صغيرة وأرقام و _ فقط");
      return;
    }
    if (!bodyText.trim()) {
      toast.error("نص الرسالة مطلوب");
      return;
    }

    const components: any[] = [];

    if (headerType === "TEXT" && headerText) {
      components.push({ type: "HEADER", format: "TEXT", text: headerText });
    } else if (headerType === "DOCUMENT") {
      components.push({ type: "HEADER", format: "DOCUMENT" });
    } else if (headerType === "IMAGE") {
      components.push({ type: "HEADER", format: "IMAGE" });
    }

    components.push({ type: "BODY", text: bodyText });

    if (footerText) {
      components.push({ type: "FOOTER", text: footerText });
    }

    if (hasButton && buttonText) {
      components.push({
        type: "BUTTONS",
        buttons: [{ type: "URL", text: buttonText, url: "https://mojaz-remix-studio.lovable.app/verify/{{1}}", example: ["https://mojaz-remix-studio.lovable.app/verify/abc123"] }],
      });
    }

    setCreating(true);
    try {
      const result = await callFunction("create", { method: "POST", body: { name, category, language, components } });

      if (result.error) {
        toast.error(getCreateErrorMessage(result));
        return;
      }

      toast.success("تم إرسال القالب لاعتماد ميتا. الحالة: قيد المراجعة");
      setDialogOpen(false);
      setName("");
      loadAll();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (templateName: string) => {
    const result = await callFunction("delete", { method: "DELETE", query: `&name=${encodeURIComponent(templateName)}` });
    if (result.error) {
      toast.error("فشل الحذف: " + result.error);
      return;
    }
    toast.success("تم حذف القالب");
    loadAll();
  };

  const handleCreatePreset = async () => {
    const presetName = "certificate_notification";
    const exists = templates.find(t => t.name === presetName);
    if (exists) {
      toast.info(`القالب "${presetName}" موجود بالفعل (الحالة: ${STATUS_CONFIG[exists.status]?.label || exists.status})`);
      return;
    }
    const components = [
      { type: "HEADER", format: "DOCUMENT" },
      {
        type: "BODY",
        text: "🎉 مبارك عليك يا {{1}}!\n\nيسرّنا في منصة مجاز للقرآن الكريم أن نهنئك بحصولك على {{2}}، تجدها مرفقة في هذه الرسالة.\n\nنسأل الله لك دوام التوفيق والسداد، وأن يجعل القرآن ربيع قلبك ونور صدرك.",
        example: { body_text: [["محمد أحمد", "إجازة في القرآن الكريم برواية حفص"]] },
      },
      { type: "FOOTER", text: "منصة مجاز للقرآن الكريم" },
    ];

    setCreating(true);
    try {
      const result = await callFunction("create", {
        method: "POST",
        body: { name: presetName, category: "UTILITY", language: "ar", components },
      });

      if (result.error) {
        toast.error(getCreateErrorMessage(result));
        return;
      }

      toast.success("تم إرسال قالب الشهادات لاعتماد ميتا. الحالة: قيد المراجعة");
      loadAll();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border/50 px-6 py-4 flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-xl font-bold">قوالب واتساب (Meta)</h1>
          <p className="text-xs text-muted-foreground">إدارة قوالب الرسائل المرتبطة بحساب Meta WhatsApp Business</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Connection status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              حالة الربط بـ Meta WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !connection ? (
              <p className="text-sm text-muted-foreground">جاري التحقق...</p>
            ) : connection?.connected ? (
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="bg-green-500/15 text-green-700 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 ml-1" /> متصل
                </Badge>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{connection.phone_number}</span>
                </div>
                {connection.verified_name && (
                  <span className="text-sm text-muted-foreground">• {connection.verified_name}</span>
                )}
                {connection.quality_rating && (
                  <Badge variant="outline">جودة: {connection.quality_rating}</Badge>
                )}
              </div>
            ) : (
              <div className="text-sm">
                <Badge className="bg-red-500/15 text-red-700 border-red-500/30 mb-2">
                  <XCircle className="w-3 h-3 ml-1" /> غير متصل
                </Badge>
                {connection?.error && <p className="text-red-600">{connection.error}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">القوالب ({templates.length})</h2>
            <p className="text-xs text-muted-foreground">القوالب المسجلة في حسابك على Meta</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreatePreset} disabled={creating || !connection?.connected}>
              <Award className="w-4 h-4" />
              قالب الشهادات والإجازات الجاهز
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4" />
                  إنشاء قالب جديد
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء قالب واتساب جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم القالب (إنجليزي فقط)</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase())}
                      placeholder="certificate_notification"
                      dir="ltr"
                    />
                    <p className="text-[11px] text-muted-foreground">حروف صغيرة وأرقام و _ فقط</p>
                  </div>
                  <div className="space-y-2">
                    <Label>التصنيف</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اللغة</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع الرأس (Header)</Label>
                    <Select value={headerType} onValueChange={setHeaderType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HEADER_TYPES.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {headerType === "TEXT" && (
                  <div className="space-y-2">
                    <Label>نص الرأس</Label>
                    <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="تهنئة بمناسبة الإجازة" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>نص الرسالة (Body)</Label>
                  <Textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={4}
                    placeholder="استخدم {{1}}, {{2}} للمتغيرات"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    المتغيرات: <code>{"{{1}}"}</code> اسم الطالب، <code>{"{{2}}"}</code> نوع الوثيقة (شهادة/إجازة)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>التذييل (Footer) - اختياري</Label>
                  <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="has-button" checked={hasButton} onChange={(e) => setHasButton(e.target.checked)} />
                  <Label htmlFor="has-button" className="cursor-pointer">إضافة زر معاينة (URL ديناميكي)</Label>
                </div>

                {hasButton && (
                  <div className="space-y-2">
                    <Label>نص الزر</Label>
                    <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? "جاري الإرسال..." : "إرسال للاعتماد"}
                </Button>
              </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                لا توجد قوالب. ابدأ بإنشاء قالب جديد.
              </CardContent>
            </Card>
          ) : (
            templates.map((tpl) => {
              const cfg = STATUS_CONFIG[tpl.status] || STATUS_CONFIG.PENDING;
              const Icon = cfg.icon;
              return (
                <Card key={tpl.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-bold text-foreground">{tpl.name}</code>
                          <Badge variant="outline" className="text-[10px]">{tpl.language}</Badge>
                          <Badge variant="outline" className="text-[10px]">{tpl.category}</Badge>
                        </div>
                        {tpl.rejected_reason && (
                          <p className="text-xs text-red-600 mt-1">سبب الرفض: {tpl.rejected_reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cfg.color}>
                          <Icon className="w-3 h-3 ml-1" /> {cfg.label}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف القالب</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف القالب "{tpl.name}" من Meta؟ لا يمكن التراجع.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(tpl.name)} className="bg-destructive">
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                      {tpl.components?.map((c: any, i: number) => (
                        <div key={i} className="text-xs">
                          <span className="font-semibold text-muted-foreground">{c.type}:</span>{" "}
                          <span className="text-foreground">
                            {c.text || c.format || (c.buttons ? c.buttons.map((b: any) => b.text).join(" | ") : "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
