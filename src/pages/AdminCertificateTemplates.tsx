import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  ArrowRight, RefreshCw, Plus, Eye, Trash2, CheckCircle,
  Upload, Image, Palette, Type, GraduationCap, Award,
  Save, FileImage, QrCode, Stamp, PenTool, User, Calendar,
  FileText, Loader2, Settings2, Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logoMojaz from "@/assets/logo-mojaz.webp";

// Field definitions
const TEMPLATE_FIELDS = [
  { key: "studentName", label: "اسم الطالب", icon: User, isImage: false, defaultText: "محمد بن أحمد العمري" },
  { key: "certText", label: "نص الإجازة/الشهادة", icon: FileText, isImage: false, defaultText: "يُجيز الشيخ الطالب المذكور في رواية حفص عن عاصم بالسند المتصل..." },
  { key: "reciterName", label: "اسم المقرئ", icon: GraduationCap, isImage: false, defaultText: "الشيخ أحمد بن محمد العجمي" },
  { key: "date", label: "التاريخ", icon: Calendar, isImage: false, defaultText: "١٤٤٦/٠٦/١٥ هـ" },
  { key: "stamp", label: "الختم", icon: Stamp, isImage: true, defaultText: "" },
  { key: "signature", label: "التوقيع", icon: PenTool, isImage: true, defaultText: "" },
  { key: "logo", label: "شعار المنصة", icon: Image, isImage: true, defaultText: "" },
  { key: "qrCode", label: "رمز التحقق QR", icon: QrCode, isImage: true, defaultText: "" },
] as const;

type FieldKey = typeof TEMPLATE_FIELDS[number]["key"];

interface FieldConfig {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: string;
  visible: boolean;
  width: number;
  height: number;
  customText?: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  background_image_url: string | null;
  background_color: string;
  field_config: Record<string, FieldConfig>;
  is_active: boolean;
  logo_url: string | null;
  width: number;
  height: number;
  created_at: string;
}

const defaultFieldConfig = (key: FieldKey): FieldConfig => {
  const configs: Record<string, Partial<FieldConfig>> = {
    studentName: { x: 50, y: 35, fontSize: 28, width: 500, height: 40 },
    certText: { x: 50, y: 50, fontSize: 15, width: 780, height: 140, textAlign: "center" },
    reciterName: { x: 50, y: 72, fontSize: 20, width: 320, height: 30 },
    date: { x: 75, y: 85, fontSize: 14, width: 200, height: 25 },
    stamp: { x: 20, y: 78, fontSize: 14, width: 90, height: 90 },
    signature: { x: 50, y: 80, fontSize: 14, width: 140, height: 55 },
    logo: { x: 50, y: 8, fontSize: 14, width: 110, height: 75 },
    qrCode: { x: 87, y: 82, fontSize: 14, width: 75, height: 75 },
  };
  return {
    x: 50, y: 50, fontSize: 18, fontFamily: "Amiri", color: "#2c1810",
    textAlign: "center", visible: true, width: 200, height: 30,
    customText: "",
    ...configs[key],
  };
};

// Default beautiful certificate template config
const defaultCertificateFieldConfig = (): Record<string, FieldConfig> => ({
  logo: { x: 50, y: 10, fontSize: 14, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 100, height: 70, customText: "" },
  studentName: { x: 50, y: 40, fontSize: 32, fontFamily: "Amiri", color: "#1a5c3a", textAlign: "center", visible: true, width: 500, height: 45, customText: "محمد بن أحمد العمري" },
  certText: { x: 50, y: 57, fontSize: 14, fontFamily: "Amiri", color: "#3d2b1f", textAlign: "center", visible: true, width: 750, height: 60, customText: "أتمّ حفظ كتاب الله العزيز كاملاً على يد شيخه، وذلك بعد مجاهدة وصبر وإتقان، فشهدنا له بذلك وأجزنا له روايته." },
  reciterName: { x: 25, y: 80, fontSize: 18, fontFamily: "Amiri", color: "#1a5c3a", textAlign: "center", visible: true, width: 280, height: 28, customText: "الشيخ أحمد بن محمد العجمي" },
  date: { x: 75, y: 86, fontSize: 13, fontFamily: "Cairo", color: "#5a4a3a", textAlign: "center", visible: true, width: 180, height: 22, customText: "١٤٤٦/٠٦/١٥ هـ" },
  stamp: { x: 22, y: 85, fontSize: 14, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 80, height: 80, customText: "" },
  signature: { x: 25, y: 90, fontSize: 14, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 130, height: 45, customText: "" },
  qrCode: { x: 88, y: 84, fontSize: 14, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 70, height: 70, customText: "" },
});

// Default beautiful ijaza template config (taller text area for long Arabic text)
const defaultIjazaFieldConfig = (): Record<string, FieldConfig> => ({
  logo: { x: 50, y: 7, fontSize: 14, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 90, height: 60, customText: "" },
  studentName: { x: 50, y: 30, fontSize: 28, fontFamily: "Amiri", color: "#7c4b03", textAlign: "center", visible: true, width: 480, height: 40, customText: "محمد بن أحمد العمري" },
  certText: {
    x: 50, y: 55, fontSize: 13, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 800, height: 200,
    customText: "الحمد لله رب العالمين، والصلاة والسلام على سيد المرسلين، وعلى آله وصحبه أجمعين.\n\nأما بعد: فإنني أُجيز الطالب المذكور أعلاه رواية حفص عن عاصم من طريق الشاطبية، بالسند المتصل إلى سيدنا جبريل عليه السلام، ثم إلى رسول الله ﷺ، بشرط الأمانة في الأداء والتحلي بآداب حملة القرآن الكريم.\n\nوكتبه المجيز سائلاً الله التوفيق والقبول."
  },
  reciterName: { x: 25, y: 87, fontSize: 16, fontFamily: "Amiri", color: "#7c4b03", textAlign: "center", visible: true, width: 260, height: 24, customText: "الشيخ أحمد بن محمد العجمي" },
  date: { x: 75, y: 91, fontSize: 12, fontFamily: "Cairo", color: "#5a4a3a", textAlign: "center", visible: true, width: 170, height: 20, customText: "١٤٤٦/٠٦/١٥ هـ" },
  stamp: { x: 20, y: 90, fontSize: 14, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 75, height: 75, customText: "" },
  signature: { x: 25, y: 93, fontSize: 14, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 120, height: 40, customText: "" },
  qrCode: { x: 88, y: 90, fontSize: 14, fontFamily: "Amiri", color: "#2c1810", textAlign: "center", visible: true, width: 65, height: 65, customText: "" },
});

const FONTS = [
  { value: "Amiri", label: "أميري" },
  { value: "Cairo", label: "القاهرة" },
  { value: "Tajawal", label: "تجوال" },
  { value: "Noto Naskh Arabic", label: "نسخ عربي" },
  { value: "serif", label: "Serif" },
];

// Beautiful certificate background (creamy gold)
const CERTIFICATE_BG = "linear-gradient(135deg, #fdf8ee 0%, #f7edcf 40%, #fdf1d4 60%, #faf0e6 100%)";
// Beautiful ijaza background (warm parchment)
const IJAZA_BG = "linear-gradient(135deg, #fef9f0 0%, #f9edd8 30%, #fdf4e3 60%, #fef8ee 100%)";

const AdminCertificateTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingDefault, setCreatingDefault] = useState(false);
  const [activeTab, setActiveTab] = useState("ijaza");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState("ijaza");
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#faf8f0");
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfig>>({});
  const [selectedField, setSelectedField] = useState<FieldKey | null>("studentName");
  const [uploadingBg, setUploadingBg] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates((data || []) as unknown as Template[]);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplates = async () => {
    setCreatingDefault(true);
    try {
      // Delete existing defaults first
      await supabase.from("certificate_templates").delete().in("name", ["القالب الافتراضي للإجازة", "القالب الافتراضي للشهادة"]);

      const defaults = [
        {
          name: "القالب الافتراضي للإجازة",
          type: "ijaza",
          background_color: "#fef9f0",
          background_image_url: null,
          field_config: defaultIjazaFieldConfig() as any,
          is_active: true,
          logo_url: null,
          width: 1200,
          height: 1000,
          created_by: user?.id,
        },
        {
          name: "القالب الافتراضي للشهادة",
          type: "certificate",
          background_color: "#fdf8ee",
          background_image_url: null,
          field_config: defaultCertificateFieldConfig() as any,
          is_active: true,
          logo_url: null,
          width: 1200,
          height: 850,
          created_by: user?.id,
        },
      ];

      const { error } = await supabase.from("certificate_templates").insert(defaults);
      if (error) throw error;
      toast({ title: "تم إنشاء القوالب الافتراضية ✅", description: "قالب الإجازة وقالب الشهادة جاهزان" });
      fetchTemplates();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setCreatingDefault(false);
    }
  };

  const initNewTemplate = (type: string) => {
    setEditingTemplate(null);
    setTemplateName(type === "ijaza" ? "قالب إجازة جديد" : "قالب شهادة جديد");
    setTemplateType(type);
    setBgImageUrl(null);
    setBgColor(type === "ijaza" ? "#fef9f0" : "#fdf8ee");
    const configs: Record<string, FieldConfig> = {};
    TEMPLATE_FIELDS.forEach(f => { configs[f.key] = defaultFieldConfig(f.key); });
    setFieldConfigs(configs);
    setSelectedField("studentName");
    setPreviewMode(false);
    setEditorOpen(true);
  };

  const openEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateType(template.type);
    setBgImageUrl(template.background_image_url);
    setBgColor(template.background_color || "#faf8f0");
    const configs: Record<string, FieldConfig> = {};
    TEMPLATE_FIELDS.forEach(f => {
      configs[f.key] = {
        ...defaultFieldConfig(f.key),
        ...(template.field_config?.[f.key] || {}),
      };
    });
    setFieldConfigs(configs);
    setSelectedField("studentName");
    setPreviewMode(false);
    setEditorOpen(true);
  };

  const uploadBackground = async (file: File) => {
    setUploadingBg(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `templates/bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("reciter-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("reciter-assets").getPublicUrl(path);
      setBgImageUrl(publicUrl);
      toast({ title: "تم رفع خلفية القالب ✅" });
    } catch (e: any) {
      toast({ title: "خطأ في رفع الصورة", description: e.message, variant: "destructive" });
    } finally {
      setUploadingBg(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: "يرجى إدخال اسم القالب", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: templateName,
        type: templateType,
        background_image_url: bgImageUrl,
        background_color: bgColor,
        field_config: fieldConfigs as any,
        logo_url: null,
        width: 1200,
        height: templateType === "ijaza" ? 1000 : 850,
        created_by: user?.id,
      };

      if (editingTemplate) {
        const { error } = await supabase.from("certificate_templates").update(payload).eq("id", editingTemplate.id);
        if (error) throw error;
        toast({ title: "تم تحديث القالب بنجاح ✅" });
      } else {
        const { error } = await supabase.from("certificate_templates").insert(payload);
        if (error) throw error;
        toast({ title: "تم إنشاء القالب بنجاح ✅" });
      }
      setEditorOpen(false);
      fetchTemplates();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (template: Template) => {
    try {
      await supabase.from("certificate_templates").update({ is_active: false }).eq("type", template.type);
      const { error } = await supabase.from("certificate_templates").update({ is_active: !template.is_active }).eq("id", template.id);
      if (error) throw error;
      toast({ title: template.is_active ? "تم إلغاء تفعيل القالب" : "تم تفعيل القالب ✅" });
      fetchTemplates();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from("certificate_templates").delete().eq("id", id);
      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: "تم حذف القالب" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const updateFieldConfig = (key: string, updates: Partial<FieldConfig>) => {
    setFieldConfigs(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const getFieldDisplayText = (field: typeof TEMPLATE_FIELDS[number]): string => {
    const config = fieldConfigs[field.key];
    if (config?.customText && config.customText.trim()) return config.customText;
    return field.defaultText;
  };

  const filteredTemplates = templates.filter(t => t.type === activeTab);
  const selectedFieldDef = TEMPLATE_FIELDS.find(f => f.key === selectedField);
  const isImageField = selectedField ? ["stamp", "signature", "logo", "qrCode"].includes(selectedField) : false;

  // Canvas aspect ratio based on type
  const canvasRatio = templateType === "ijaza" ? "1200/1000" : "1200/850";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1 text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">تصميم القوالب</h1>
              <p className="text-xs text-muted-foreground">إدارة قوالب الشهادات والإجازات</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchTemplates} disabled={loading} className="gap-2 text-muted-foreground">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <div className="gradient-primary px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-7 h-7 text-gold" />
            <div>
              <h2 className="text-xl font-bold text-primary-foreground">مصمم قوالب الشهادات والإجازات</h2>
              <p className="text-primary-foreground/70 text-sm">أنشئ قوالب احترافية مع معاينة مباشرة وتحرير كامل للنصوص</p>
            </div>
          </div>
          <Button
            onClick={createDefaultTemplates}
            disabled={creatingDefault}
            className="gap-2 bg-gold hover:bg-gold/90 text-primary-foreground rounded-xl shadow-md"
          >
            {creatingDefault ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            إنشاء القوالب الافتراضية
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-accent/30">
              <TabsTrigger value="ijaza" className="gap-1.5 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <GraduationCap className="w-4 h-4" /> قوالب الإجازات
              </TabsTrigger>
              <TabsTrigger value="certificate" className="gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Award className="w-4 h-4" /> قوالب الشهادات
              </TabsTrigger>
            </TabsList>
            <Button onClick={() => initNewTemplate(activeTab)} className="gap-2 bg-gold hover:bg-gold/90 text-primary-foreground rounded-xl">
              <Plus className="w-4 h-4" /> قالب جديد
            </Button>
          </div>

          {["ijaza", "certificate"].map(type => (
            <TabsContent key={type} value={type}>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-16 text-center">
                    <FileImage className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-1">لا توجد قوالب {type === "ijaza" ? "إجازات" : "شهادات"} بعد</p>
                    <p className="text-muted-foreground/60 text-xs mb-4">اضغط "إنشاء القوالب الافتراضية" لإنشاء قالب جاهز بهوية التطبيق</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={createDefaultTemplates} variant="default" className="gap-2 bg-gold hover:bg-gold/90 text-primary-foreground">
                        <Wand2 className="w-4 h-4" /> إنشاء القوالب الافتراضية
                      </Button>
                      <Button onClick={() => initNewTemplate(type)} variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" /> قالب مخصص
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => (
                    <motion.div key={template.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                      <Card className={`border-border/50 overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${template.is_active ? "ring-2 ring-primary" : ""}`}>
                        {/* Preview thumbnail */}
                        <div
                          className="relative overflow-hidden"
                          style={{
                            height: template.type === "ijaza" ? "220px" : "170px",
                            backgroundColor: template.background_color || "#faf8f0",
                            backgroundImage: template.background_image_url ? `url(${template.background_image_url})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          {/* Decorative borders */}
                          <div className="absolute inset-2 border border-yellow-600/30 rounded pointer-events-none" />
                          <div className="absolute inset-3 border border-yellow-600/20 rounded pointer-events-none" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4">
                            <img src={logoMojaz} alt="شعار" className="w-8 h-6 object-contain opacity-70 mb-1" />
                            <p className="text-[11px] font-bold text-center" style={{ color: "#1a5c3a", fontFamily: "Amiri" }}>
                              {(template.field_config?.studentName as FieldConfig)?.customText || "محمد بن أحمد العمري"}
                            </p>
                            <p className="text-[7px] text-center leading-tight max-w-[180px] opacity-70" style={{ color: "#3d2b1f", fontFamily: "Amiri" }}>
                              {((template.field_config?.certText as FieldConfig)?.customText || "نص الإجازة أو الشهادة...").slice(0, 80)}...
                            </p>
                          </div>
                          {template.is_active && (
                            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                              <CheckCircle className="w-3 h-3 ml-1" /> مفعّل
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-sm text-foreground">{template.name}</h3>
                              <p className="text-[11px] text-muted-foreground">{new Date(template.created_at).toLocaleDateString("ar-SA")}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                onClick={() => openEditTemplate(template)}>
                                <Settings2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10"
                                onClick={() => toggleActive(template)}>
                                <CheckCircle className={`w-3.5 h-3.5 ${template.is_active ? "text-primary" : "text-muted-foreground"}`} />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => deleteTemplate(template.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[96vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b border-border/30 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-gold" />
              {editingTemplate ? "تعديل القالب" : "إنشاء قالب جديد"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {templateType === "ijaza" ? "تصميم قالب الإجازة القرآنية" : "تصميم قالب الشهادة"} — اضغط على أي عنصر في المعاينة لتحريره
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-border/30 flex-1 min-h-0 overflow-hidden">
            {/* Left Panel: Controls */}
            <div className="w-full lg:w-80 shrink-0 p-4 space-y-4 overflow-y-auto">
              {/* Template Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">اسم القالب</Label>
                <Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="text-sm" />
              </div>

              {/* Background */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Image className="w-3 h-3" /> الخلفية
                </Label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) uploadBackground(f);
                    }} />
                    <div className="rounded-xl border-2 border-dashed border-border/50 p-3 text-center hover:border-primary/50 transition-all">
                      {uploadingBg ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" /> : (
                        <>
                          <Upload className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground">{bgImageUrl ? "تغيير الخلفية" : "رفع خلفية"}</span>
                        </>
                      )}
                    </div>
                  </label>
                  <div className="space-y-1">
                    <Label className="text-[10px]">أو لون</Label>
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer" />
                  </div>
                </div>
                {bgImageUrl && (
                  <Button variant="outline" size="sm" className="text-xs w-full text-destructive" onClick={() => setBgImageUrl(null)}>
                    <Trash2 className="w-3 h-3 ml-1" /> إزالة الخلفية
                  </Button>
                )}
              </div>

              {/* Fields List */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Type className="w-3 h-3" /> عناصر القالب
                </Label>
                <div className="space-y-1">
                  {TEMPLATE_FIELDS.map(field => {
                    const config = fieldConfigs[field.key];
                    return (
                      <div
                        key={field.key}
                        onClick={() => setSelectedField(field.key)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-xs ${
                          selectedField === field.key
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "hover:bg-accent/30 text-foreground"
                        }`}
                      >
                        <field.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="flex-1">{field.label}</span>
                        <Switch
                          checked={config?.visible ?? true}
                          onCheckedChange={v => updateFieldConfig(field.key, { visible: v })}
                          className="scale-75"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Field Properties */}
              {selectedField && fieldConfigs[selectedField] && (
                <div className="space-y-3 p-3 rounded-xl bg-accent/20 border border-border/30">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                    {selectedFieldDef && <selectedFieldDef.icon className="w-3.5 h-3.5" />}
                    خصائص: {selectedFieldDef?.label}
                  </h4>

                  {/* Custom Text (for non-image fields) */}
                  {!isImageField && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">نص العنصر</Label>
                      {selectedField === "certText" ? (
                        <Textarea
                          value={fieldConfigs[selectedField].customText ?? selectedFieldDef?.defaultText ?? ""}
                          onChange={e => updateFieldConfig(selectedField, { customText: e.target.value })}
                          className="text-xs min-h-[80px] resize-none"
                          placeholder={selectedFieldDef?.defaultText}
                          dir="rtl"
                        />
                      ) : (
                        <Input
                          value={fieldConfigs[selectedField].customText ?? selectedFieldDef?.defaultText ?? ""}
                          onChange={e => updateFieldConfig(selectedField, { customText: e.target.value })}
                          className="text-xs"
                          placeholder={selectedFieldDef?.defaultText}
                          dir="rtl"
                        />
                      )}
                    </div>
                  )}

                  {/* Position X */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">الموقع الأفقي (X): {fieldConfigs[selectedField].x}%</Label>
                    <Slider value={[fieldConfigs[selectedField].x]} min={0} max={100} step={1}
                      onValueChange={v => updateFieldConfig(selectedField, { x: v[0] })} />
                  </div>
                  {/* Position Y */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">الموقع الرأسي (Y): {fieldConfigs[selectedField].y}%</Label>
                    <Slider value={[fieldConfigs[selectedField].y]} min={0} max={100} step={1}
                      onValueChange={v => updateFieldConfig(selectedField, { y: v[0] })} />
                  </div>
                  {/* Width */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">العرض: {fieldConfigs[selectedField].width}px</Label>
                    <Slider value={[fieldConfigs[selectedField].width]} min={50} max={1000} step={10}
                      onValueChange={v => updateFieldConfig(selectedField, { width: v[0] })} />
                  </div>

                  {/* Text-specific properties */}
                  {!isImageField && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[10px]">حجم الخط: {fieldConfigs[selectedField].fontSize}px</Label>
                        <Slider value={[fieldConfigs[selectedField].fontSize]} min={8} max={60} step={1}
                          onValueChange={v => updateFieldConfig(selectedField, { fontSize: v[0] })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">نوع الخط</Label>
                        <Select value={fieldConfigs[selectedField].fontFamily} onValueChange={v => updateFieldConfig(selectedField, { fontFamily: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONTS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px]">اللون</Label>
                        <input type="color" value={fieldConfigs[selectedField].color}
                          onChange={e => updateFieldConfig(selectedField, { color: e.target.value })}
                          className="w-7 h-7 rounded border cursor-pointer" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">محاذاة النص</Label>
                        <div className="flex gap-1">
                          {["right", "center", "left"].map(a => (
                            <Button key={a} variant={fieldConfigs[selectedField].textAlign === a ? "default" : "outline"}
                              size="sm" className="flex-1 h-7 text-[10px]"
                              onClick={() => updateFieldConfig(selectedField, { textAlign: a })}>
                              {a === "right" ? "يمين" : a === "center" ? "وسط" : "يسار"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Image field size */}
                  {isImageField && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">الارتفاع: {fieldConfigs[selectedField].height}px</Label>
                      <Slider value={[fieldConfigs[selectedField].height]} min={30} max={200} step={5}
                        onValueChange={v => updateFieldConfig(selectedField, { height: v[0] })} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel: Preview Canvas */}
            <div className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">المعاينة المباشرة</span>
                  <Badge variant="outline" className="text-[10px]">
                    {templateType === "ijaza" ? "إجازة قرآنية" : "شهادة"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setPreviewMode(!previewMode)}>
                  <Eye className="w-3.5 h-3.5" />
                  {previewMode ? "وضع التحرير" : "معاينة كاملة"}
                </Button>
              </div>

              {/* Scrollable canvas area */}
              <div className="flex-1 overflow-auto">
                <div className="relative border border-border/50 rounded-xl overflow-hidden shadow-lg mx-auto"
                  style={{
                    aspectRatio: canvasRatio,
                    maxWidth: "100%",
                    minHeight: "400px",
                  }}
                >
                  {/* Beautiful decorative frame */}
                  <div
                    ref={canvasRef}
                    className="w-full h-full relative"
                    style={{
                      backgroundColor: bgColor,
                      backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* Decorative borders for certificate feel */}
                    {!bgImageUrl && (
                      <>
                        <div className="absolute inset-3 border-2 pointer-events-none rounded" style={{ borderColor: "rgba(180,130,30,0.4)" }} />
                        <div className="absolute inset-5 border pointer-events-none rounded" style={{ borderColor: "rgba(180,130,30,0.2)" }} />
                        {/* Corner ornaments */}
                        {[
                          { top: "8px", right: "8px" },
                          { top: "8px", left: "8px" },
                          { bottom: "8px", right: "8px" },
                          { bottom: "8px", left: "8px" },
                        ].map((pos, i) => (
                          <div key={i} className="absolute w-8 h-8 pointer-events-none" style={pos}>
                            <svg viewBox="0 0 30 30" className="w-full h-full" style={{ opacity: 0.4 }}>
                              <path d="M2,2 L12,2 M2,2 L2,12" stroke="#b4821e" strokeWidth="2" fill="none" />
                            </svg>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Render fields */}
                    {TEMPLATE_FIELDS.map(field => {
                      const config = fieldConfigs[field.key];
                      if (!config?.visible) return null;
                      const isImg = field.isImage;
                      const displayText = getFieldDisplayText(field);

                      return (
                        <div
                          key={field.key}
                          onClick={() => !previewMode && setSelectedField(field.key)}
                          className={`absolute transition-all ${!previewMode ? "cursor-pointer" : ""} ${
                            !previewMode && selectedField === field.key ? "ring-2 ring-primary ring-offset-1 rounded" : ""
                          }`}
                          style={{
                            left: `${config.x}%`,
                            top: `${config.y}%`,
                            transform: "translate(-50%, -50%)",
                            width: `${config.width}px`,
                            maxWidth: "90%",
                          }}
                        >
                          {isImg ? (
                            <div className="flex items-center justify-center rounded-lg"
                              style={{ width: config.width, height: config.height }}>
                              {field.key === "logo" ? (
                                <img src={logoMojaz} alt="شعار" className="max-w-full max-h-full object-contain" />
                              ) : field.key === "qrCode" ? (
                                <div className="w-full h-full border border-dashed rounded-lg flex items-center justify-center"
                                  style={{ borderColor: "rgba(100,80,30,0.3)", backgroundColor: "rgba(255,255,255,0.3)" }}>
                                  <QrCode className="w-8 h-8" style={{ color: "rgba(100,80,30,0.5)" }} />
                                </div>
                              ) : (
                                <div className="w-full h-full border border-dashed rounded-lg flex flex-col items-center justify-center gap-1"
                                  style={{ borderColor: "rgba(100,80,30,0.3)", backgroundColor: "rgba(255,255,255,0.2)" }}>
                                  <field.icon className="w-5 h-5" style={{ color: "rgba(100,80,30,0.4)" }} />
                                  <span className="text-[7px]" style={{ color: "rgba(100,80,30,0.4)" }}>{field.label}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p style={{
                              fontSize: `${config.fontSize}px`,
                              fontFamily: config.fontFamily,
                              color: config.color,
                              textAlign: config.textAlign as any,
                              lineHeight: 1.8,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}>
                              {displayText}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 mt-4 shrink-0">
                <Button variant="outline" onClick={() => setEditorOpen(false)}>إلغاء</Button>
                <Button onClick={saveTemplate} disabled={saving} className="gap-2 bg-gold hover:bg-gold/90 text-primary-foreground rounded-xl px-6">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingTemplate ? "تحديث القالب" : "حفظ القالب"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCertificateTemplates;
