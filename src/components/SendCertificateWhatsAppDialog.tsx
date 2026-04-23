import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, RefreshCw, AlertCircle } from "lucide-react";

interface MetaTemplate {
  name: string;
  status: string;
  language: string;
  category: string;
  components: any[];
}

interface SendCertificateWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultPhone?: string;
  defaultName?: string;       // student name for {{1}}
  certificateLabel?: string;  // e.g., "إجازة في ورش عن نافع" for {{2}}
  pdfUrl?: string;            // public URL of uploaded certificate PDF
  pdfFilename?: string;
}

const HEADER_FORMATS_NEEDING_MEDIA = ["IMAGE", "DOCUMENT", "VIDEO"] as const;

export default function SendCertificateWhatsAppDialog({
  open,
  onOpenChange,
  defaultPhone = "",
  defaultName = "",
  certificateLabel = "",
  pdfUrl,
  pdfFilename = "certificate.pdf",
}: SendCertificateWhatsAppDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<MetaTemplate[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [phone, setPhone] = useState(defaultPhone);
  const [vars, setVars] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setPhone(defaultPhone);
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("انتهت الجلسة");
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-templates?action=list`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const approved = (data.templates || []).filter((t: MetaTemplate) => t.status === "APPROVED");
      setTemplates(approved);
      if (approved.length > 0 && !selectedName) {
        setSelectedName(approved[0].name);
      }
    } catch (e: any) {
      toast({ title: "تعذر جلب القوالب", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = useMemo(
    () => templates.find(t => t.name === selectedName),
    [templates, selectedName]
  );

  // Compute body variable count from selected template
  const bodyVarCount = useMemo(() => {
    if (!selectedTemplate) return 0;
    const body = selectedTemplate.components?.find((c: any) => c.type === "BODY");
    if (!body?.text) return 0;
    const matches = String(body.text).match(/\{\{(\d+)\}\}/g) || [];
    return new Set(matches.map(m => m.replace(/[^0-9]/g, ""))).size;
  }, [selectedTemplate]);

  // Header info
  const headerInfo = useMemo(() => {
    if (!selectedTemplate) return null;
    const h = selectedTemplate.components?.find((c: any) => c.type === "HEADER");
    if (!h) return null;
    return { format: h.format as string };
  }, [selectedTemplate]);

  // Auto-fill default vars when template changes
  useEffect(() => {
    if (bodyVarCount === 0) {
      setVars([]);
      return;
    }
    const defaults = Array.from({ length: bodyVarCount }, (_, i) => {
      if (i === 0) return defaultName || "";
      if (i === 1) return certificateLabel || "";
      return "";
    });
    setVars(defaults);
  }, [bodyVarCount, defaultName, certificateLabel]);

  const updateVar = (i: number, v: string) => {
    setVars(prev => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const headerNeedsMedia = headerInfo && HEADER_FORMATS_NEEDING_MEDIA.includes(headerInfo.format as any);
  const headerMediaType = headerInfo?.format === "DOCUMENT" ? "document"
    : headerInfo?.format === "IMAGE" ? "image"
    : headerInfo?.format === "VIDEO" ? "video" : undefined;

  const handleSend = async () => {
    if (!phone.trim()) {
      toast({ title: "أدخل رقم الواتساب", variant: "destructive" });
      return;
    }
    if (!selectedTemplate) {
      toast({ title: "اختر قالباً معتمداً", variant: "destructive" });
      return;
    }
    if (headerNeedsMedia && !pdfUrl) {
      toast({ title: "يحتاج هذا القالب لمرفق ولم يُرفع ملف الشهادة", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp-template", {
        body: {
          to: phone.trim(),
          template_name: selectedTemplate.name,
          language: selectedTemplate.language,
          variables: vars,
          ...(headerNeedsMedia && pdfUrl ? {
            header_media_url: pdfUrl,
            header_media_type: headerMediaType,
            header_filename: pdfFilename,
          } : {}),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "تم إرسال الشهادة عبر واتساب ✅" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </div>
            إرسال الشهادة عبر واتساب
          </DialogTitle>
          <DialogDescription>
            اختر قالباً معتمداً من Meta لإرسال الشهادة للطالب
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">رقم الواتساب</Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="05xxxxxxxxx"
              dir="ltr"
              className="bg-card border-border/50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">القالب المعتمد</Label>
              <Button variant="ghost" size="sm" onClick={loadTemplates} disabled={loading} className="h-7 gap-1 text-xs">
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>
            {loading ? (
              <div className="h-10 rounded-md bg-muted animate-pulse" />
            ) : templates.length === 0 ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                لا توجد قوالب معتمدة. اذهب إلى صفحة قوالب واتساب لإنشاء قالب واعتماده من Meta أولاً.
              </div>
            ) : (
              <Select value={selectedName} onValueChange={setSelectedName}>
                <SelectTrigger className="bg-card border-border/50">
                  <SelectValue placeholder="اختر قالباً" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={`${t.name}-${t.language}`} value={t.name}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{t.language}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedTemplate && (
            <>
              {headerNeedsMedia && (
                <div className={`rounded-lg border p-3 text-xs ${pdfUrl ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-300 text-amber-800"}`}>
                  {pdfUrl
                    ? `سيتم إرفاق ملف الشهادة (${headerInfo?.format}) في رأس الرسالة.`
                    : `هذا القالب يتطلب مرفق ${headerInfo?.format} في الرأس. سيتم رفع PDF تلقائياً عند الإرسال.`}
                </div>
              )}

              {bodyVarCount > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">المتغيرات</Label>
                  {Array.from({ length: bodyVarCount }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12 shrink-0">{`{{${i + 1}}}`}</span>
                      <Input
                        value={vars[i] || ""}
                        onChange={e => updateVar(i, e.target.value)}
                        placeholder={`قيمة المتغير ${i + 1}`}
                        className="bg-card border-border/50"
                      />
                    </div>
                  ))}
                </div>
              )}

              {(() => {
                const body = selectedTemplate.components?.find((c: any) => c.type === "BODY");
                return body?.text ? (
                  <div className="rounded-lg border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                    {body.text}
                  </div>
                ) : null;
              })()}
            </>
          )}

          <Button
            onClick={handleSend}
            disabled={sending || !selectedTemplate || templates.length === 0}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            إرسال الآن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
