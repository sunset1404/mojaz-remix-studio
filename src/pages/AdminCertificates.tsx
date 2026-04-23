import { useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search, Award, GraduationCap, Plus, RefreshCw,
  ArrowRight, Download, Eye, Trash2, BookOpen,
  FileText, Users, MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import CertificateViewer from "@/components/CertificateViewer";
import SendCertificateWhatsAppDialog from "@/components/SendCertificateWhatsAppDialog";

interface CertificateRow {
  id: string;
  user_id: string;
  title: string;
  type: string;
  sheikh_name: string | null;
  issuer: string | null;
  date: string | null;
  status: string;
  riwaya: string | null;
  notes: string | null;
  student_name: string | null;
  reciter_name: string | null;
  certificate_text: string | null;
  student_phone: string | null;
  student_email: string | null;
  reciter_id: string | null;
  created_at: string;
}

interface StudentOption {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  preferred_riwaya: string;
  assigned_reciter_id: string | null;
  ijazah_status: string | null;
  preferred_track: string;
}

interface ReciterOption {
  user_id: string;
  full_name: string;
  signature_url: string | null;
  stamp_url: string | null;
}

interface ReciterCertText {
  reciter_id: string;
  type: string;
  riwaya: string | null;
  certification_text: string;
}

const CERT_TYPES = [
  { value: "ijaza", label: "إجازة قرآنية", icon: GraduationCap, color: "bg-gold/15 text-gold border-gold/30" },
  { value: "certificate", label: "شهادة ختم", icon: Award, color: "bg-primary/10 text-primary border-primary/30" },
];

const RIWAYAT = [
  "حفص عن عاصم",
  "ورش عن نافع",
  "قالون عن نافع",
  "شعبة عن عاصم",
  "الدوري عن أبي عمرو",
  "السوسي عن أبي عمرو",
  "ابن كثير",
  "ابن عامر",
  "أبو جعفر",
  "يعقوب",
  "خلف العاشر",
];

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [reciters, setReciters] = useState<ReciterOption[]>([]);
  const [reciterCerts, setReciterCerts] = useState<ReciterCertText[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewCert, setViewCert] = useState<CertificateRow | null>(null);
  const [waCert, setWaCert] = useState<CertificateRow | null>(null);
  const [waPdfUrl, setWaPdfUrl] = useState<string | undefined>(undefined);
  const [waPdfFilename, setWaPdfFilename] = useState<string>("certificate.pdf");
  const [waOpen, setWaOpen] = useState(false);
  const [preparingWaId, setPreparingWaId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<string>("ijaza");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedReciterId, setSelectedReciterId] = useState("");
  const [formRiwaya, setFormRiwaya] = useState("");
  const [formText, setFormText] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [certsRes, studentsRes, recitersRes, recCertsRes] = await Promise.all([
        supabase.from("certificates").select("*").order("created_at", { ascending: false }),
        supabase.from("student_profiles").select("id, user_id, full_name, phone, email, preferred_riwaya, assigned_reciter_id, ijazah_status, preferred_track"),
        supabase.from("reciter_profiles").select("user_id, full_name, signature_url, stamp_url").eq("status", "approved"),
        supabase.from("reciter_certifications").select("reciter_id, type, riwaya, certification_text"),
      ]);
      setCertificates(certsRes.data || []);
      setStudents(studentsRes.data || []);
      setReciters(recitersRes.data || []);
      setReciterCerts(recCertsRes.data || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Find matching certification text for a reciter based on type and riwaya
  const findCertText = (reciterId: string, type: string, riwaya: string) => {
    const certType = type === "ijaza" ? "ijaza" : "khatm";
    if (certType === "khatm") {
      return reciterCerts.find(c => c.reciter_id === reciterId && c.type === "khatm")?.certification_text || "";
    }
    return reciterCerts.find(c => c.reciter_id === reciterId && c.type === "ijaza" && c.riwaya === riwaya)?.certification_text || "";
  };

  // When student is selected, auto-fill reciter, riwaya, phone, email, and certification text
  const handleStudentSelect = (studentUserId: string) => {
    setSelectedStudentId(studentUserId);
    const student = students.find(s => s.user_id === studentUserId);
    if (student) {
      setFormPhone(student.phone || "");
      setFormEmail(student.email || "");
      setFormRiwaya(student.preferred_riwaya || "");
      if (student.assigned_reciter_id) {
        setSelectedReciterId(student.assigned_reciter_id);
        setFormText(findCertText(student.assigned_reciter_id, formType, student.preferred_riwaya || ""));
      } else {
        setSelectedReciterId("");
        setFormText("");
      }
    }
  };

  // When reciter is manually changed, update certification text
  const handleReciterSelect = (reciterId: string) => {
    setSelectedReciterId(reciterId);
    setFormText(findCertText(reciterId, formType, formRiwaya));
  };

  // When riwaya changes, update certification text
  const handleRiwayaSelect = (riwaya: string) => {
    setFormRiwaya(riwaya);
    if (selectedReciterId) {
      setFormText(findCertText(selectedReciterId, formType, riwaya));
    }
  };

  const getReciterName = (id: string) => reciters.find(r => r.user_id === id)?.full_name || "";
  const getStudentName = (userId: string) => students.find(s => s.user_id === userId)?.full_name || "";

  // Filter students for ijaza: only those with ijazah_granted status
  const ijazaEligibleStudents = useMemo(() => {
    if (formType === "ijaza") {
      return students.filter(s => s.ijazah_status === "ijazah_granted" || s.preferred_track === "الحصول على إجازة قرآنية");
    }
    return students;
  }, [students, formType]);

  const resetForm = () => {
    setFormType("ijaza");
    setSelectedStudentId("");
    setSelectedReciterId("");
    setFormRiwaya("");
    setFormText("");
    setFormNotes("");
    setFormPhone("");
    setFormEmail("");
  };

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast({ title: "يرجى اختيار الطالب", variant: "destructive" });
      return;
    }
    const studentName = getStudentName(selectedStudentId);
    const reciterName = selectedReciterId ? getReciterName(selectedReciterId) : null;

    setSubmitting(true);
    try {
      const title = formType === "ijaza"
        ? `إجازة في ${formRiwaya || "القرآن الكريم"}`
        : `شهادة ختم القرآن الكريم`;

      // Get reciter signature/stamp to embed in the certificate
      const reciterData = selectedReciterId ? reciters.find(r => r.user_id === selectedReciterId) : null;

      const { error } = await supabase.from("certificates").insert({
        user_id: selectedStudentId,
        title,
        type: formType,
        status: "معتمدة",
        sheikh_name: reciterName,
        riwaya: formRiwaya || null,
        certificate_text: formText || null,
        notes: formNotes || null,
        student_name: studentName,
        reciter_name: reciterName,
        reciter_id: selectedReciterId || null,
        reciter_signature_url: reciterData?.signature_url || null,
        reciter_stamp_url: reciterData?.stamp_url || null,
        student_phone: formPhone || null,
        student_email: formEmail || null,
        issuer: "منصة مجاز",
        date: new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
        issued_by: user?.id || null,
      } as any);
      if (error) throw error;

      // Send notification to the student
      const notifTitle = formType === "ijaza" ? "🎓 إجازة مباركة!" : "📜 شهادة جديدة!";
      const notifBody = formType === "ijaza"
        ? `مبروك! حصلت على إجازة في ${formRiwaya || "القرآن الكريم"}، نسأل الله أن ينفع بك.`
        : `مبروك! حصلت على شهادة ختم القرآن الكريم، استمر في التميز!`;
      await supabase.from("notifications").insert({
        user_id: selectedStudentId,
        title: notifTitle,
        body: notifBody,
        type: "certificate",
        sent_by: user?.id || null,
      });

      toast({ title: `تم إصدار ${formType === "ijaza" ? "الإجازة" : "الشهادة"} بنجاح ✅` });
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast({ title: "خطأ في الإصدار", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشهادة؟")) return;
    try {
      const { error } = await supabase.from("certificates").delete().eq("id", id);
      if (error) throw error;
      setCertificates(prev => prev.filter(c => c.id !== id));
      toast({ title: "تم الحذف بنجاح" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (cert: CertificateRow) => {
    setDownloadingId(cert.id);
    try {
      const reciter = cert.reciter_id ? reciters.find(r => r.user_id === cert.reciter_id) : null;
      const W = 1754; // A4 landscape ~150dpi
      const H = 1240;

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-10000px";
      container.style.left = "0";
      container.style.width = `${W}px`;
      container.style.height = `${H}px`;
      container.style.background = "#ffffff";
      document.body.appendChild(container);

      const root = createRoot(container);
      await new Promise<void>((resolve) => {
        root.render(
          <CertificateViewer
            cert={cert}
            reciterSignatureUrl={reciter?.signature_url || null}
            reciterStampUrl={reciter?.stamp_url || null}
            renderWidth={W}
            renderHeight={H}
          />
        );
        setTimeout(resolve, 700);
      });

      const target = (container.querySelector('[dir="rtl"] > div > div') as HTMLElement) || container;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);

      const safeName = (cert.student_name || "certificate").replace(/[^\p{L}\p{N}\s_-]/gu, "").trim() || "certificate";
      const typeLabel = cert.type === "ijaza" ? "إجازة" : "شهادة";
      pdf.save(`${typeLabel}-${safeName}.pdf`);

      root.unmount();
      document.body.removeChild(container);
      toast({ title: "تم تحميل الشهادة بنجاح ✅" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "تعذّر تحميل الشهادة", description: e.message, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  // Render the certificate as PDF, upload to storage, and return public URL
  const renderAndUploadPdf = async (cert: CertificateRow): Promise<{ url: string; filename: string }> => {
    const reciter = cert.reciter_id ? reciters.find(r => r.user_id === cert.reciter_id) : null;
    const W = 1754;
    const H = 1240;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-10000px";
    container.style.left = "0";
    container.style.width = `${W}px`;
    container.style.height = `${H}px`;
    container.style.background = "#ffffff";
    document.body.appendChild(container);

    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(
        <CertificateViewer
          cert={cert}
          reciterSignatureUrl={reciter?.signature_url || null}
          reciterStampUrl={reciter?.stamp_url || null}
          renderWidth={W}
          renderHeight={H}
        />
      );
      setTimeout(resolve, 700);
    });

    const target = (container.querySelector('[dir="rtl"] > div > div') as HTMLElement) || container;
    const canvas = await html2canvas(target, {
      scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
    });
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfW, pdfH);
    const blob = pdf.output("blob");

    root.unmount();
    document.body.removeChild(container);

    const typeLabel = cert.type === "ijaza" ? "ijaza" : "khatm";
    const filename = `${typeLabel}-${cert.id}.pdf`;
    const path = `${cert.user_id}/${filename}`;
    const { error: upErr } = await supabase.storage.from("certificates").upload(path, blob, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("certificates").getPublicUrl(path);
    const arabicFilename = (cert.type === "ijaza" ? "إجازة" : "شهادة") + `-${cert.student_name || ""}.pdf`;
    return { url: pub.publicUrl, filename: arabicFilename };
  };

  const handleSendWhatsApp = async (cert: CertificateRow) => {
    setPreparingWaId(cert.id);
    try {
      const { url, filename } = await renderAndUploadPdf(cert);
      setWaCert(cert);
      setWaPdfUrl(url);
      setWaPdfFilename(filename);
      setWaOpen(true);
    } catch (e: any) {
      console.error(e);
      toast({ title: "تعذّر تجهيز ملف الشهادة", description: e.message, variant: "destructive" });
    } finally {
      setPreparingWaId(null);
    }
  };

  const stats = useMemo(() => ({
    total: certificates.length,
    ijazat: certificates.filter(c => c.type === "ijaza").length,
    certs: certificates.filter(c => c.type === "certificate").length,
  }), [certificates]);

  const filtered = useMemo(() => {
    return certificates.filter(c => {
      const matchSearch = !searchQuery ||
        (c.student_name || "").includes(searchQuery) ||
        (c.title || "").includes(searchQuery) ||
        (c.reciter_name || "").includes(searchQuery);
      const matchType = typeFilter === "all" || c.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [certificates, searchQuery, typeFilter]);

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
              <h1 className="text-lg font-bold text-foreground">الشهادات والإجازات</h1>
              <p className="text-xs text-muted-foreground">إصدار وإدارة الإجازات القرآنية وشهادات الختم</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
              <Plus className="w-4 h-4" />
              إصدار جديد
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-2 text-muted-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="gradient-primary px-6 py-10">
          <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-white/5 -translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-white/5 translate-x-16 translate-y-16" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-7 h-7 text-gold" />
              <h2 className="text-2xl font-bold text-primary-foreground">الشهادات والإجازات القرآنية</h2>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-2xl">
              إصدار الإجازات القرآنية وشهادات ختم القرآن الكريم للطلاب المستحقين
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إجمالي الشهادات", value: stats.total, icon: FileText, bg: "bg-primary/10", iconColor: "text-primary" },
            { label: "الإجازات القرآنية", value: stats.ijazat, icon: GraduationCap, bg: "bg-gold/15", iconColor: "text-gold" },
            { label: "شهادات الختم", value: stats.certs, icon: Award, bg: "bg-primary/10", iconColor: "text-primary" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
              <Card className="border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                  <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shadow-sm`}>
                    <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{loading ? "—" : s.value}</span>
                  <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/30 bg-accent/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center">
                    <Award className="w-4 h-4 text-gold" />
                  </div>
                  سجل الشهادات والإجازات
                  <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px] bg-card border-border/50 text-sm">
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="ijaza">إجازات قرآنية</SelectItem>
                      <SelectItem value="certificate">شهادات ختم</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9 bg-card border-border/50 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-gold" />
                  </div>
                  <p className="text-muted-foreground text-sm">لا توجد شهادات بعد</p>
                  <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} variant="outline" className="mt-4 gap-2 rounded-xl">
                    <Plus className="w-4 h-4" /> إصدار أول شهادة
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-accent/10">
                      <TableHead className="text-right font-bold">الطالب</TableHead>
                      <TableHead className="text-right font-bold">النوع</TableHead>
                      <TableHead className="text-right font-bold">العنوان</TableHead>
                      <TableHead className="text-right font-bold">المقرئ</TableHead>
                      <TableHead className="text-right font-bold">التاريخ</TableHead>
                      <TableHead className="text-right font-bold">الحالة</TableHead>
                      <TableHead className="text-right font-bold">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((cert) => (
                      <TableRow key={cert.id} className="hover:bg-accent/20 transition-colors">
                        <TableCell className="font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{cert.student_name || getStudentName(cert.user_id) || "—"}</p>
                              {cert.student_phone && <p className="text-[10px] text-muted-foreground">{cert.student_phone}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] border ${cert.type === "ijaza" ? "bg-gold/15 text-gold border-gold/30" : "bg-primary/10 text-primary border-primary/30"}`}>
                            {cert.type === "ijaza" ? "إجازة" : "شهادة ختم"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-foreground max-w-[200px] truncate">{cert.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{cert.reciter_name || cert.sheikh_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{cert.date || "—"}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] border">{cert.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                              onClick={() => setViewCert(cert)} title="معاينة">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              onClick={() => handleDownload(cert)} disabled={downloadingId === cert.id} title="تحميل PDF">
                              {downloadingId === cert.id
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <Download className="w-3.5 h-3.5" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              onClick={() => handleSendWhatsApp(cert)} disabled={preparingWaId === cert.id} title="إرسال عبر واتساب">
                              {preparingWaId === cert.id
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <MessageCircle className="w-3.5 h-3.5" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(cert.id)} title="حذف">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Issue Certificate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-gold" />
              </div>
              {formType === "ijaza" ? "إصدار إجازة قرآنية جديدة" : "إصدار شهادة ختم جديدة"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              أدخل بيانات الشهادة لإصدارها بشكل رسمي
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              {CERT_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => { setFormType(ct.value); setSelectedStudentId(""); }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                    formType === ct.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${ct.value === "ijaza" ? "bg-gold/15" : "bg-primary/10"} flex items-center justify-center`}>
                    <ct.icon className={`w-5 h-5 ${ct.value === "ijaza" ? "text-gold" : "text-primary"}`} />
                  </div>
                  <span className="font-semibold text-sm text-foreground">{ct.label}</span>
                </button>
              ))}
            </div>

            {/* Row 1: Student, Email, Phone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary">
                  اختيار الطالب {formType === "ijaza" && <span className="text-[10px] text-muted-foreground">(الحاصلين على الإجازة القرآنية)</span>}
                </label>
                <Select value={selectedStudentId} onValueChange={handleStudentSelect}>
                  <SelectTrigger className="bg-card border-border/50">
                    <SelectValue placeholder={formType === "ijaza" ? "اختر طالب حاصل على الإجازة القرآنية" : "اختر الطالب"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ijazaEligibleStudents.map(s => (
                      <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">البريد الإلكتروني (اختياري)</label>
                <Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="name@example.com" className="bg-card border-border/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">رقم الهاتف (اختياري)</label>
                <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="05xxxxxxxxx" className="bg-card border-border/50" dir="ltr" />
              </div>
            </div>

            {/* Row 2: Reciter, Riwaya */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">المقرئ/ة (يتم اختياره تلقائياً)</label>
                <Select value={selectedReciterId} onValueChange={handleReciterSelect}>
                  <SelectTrigger className="bg-card border-border/50">
                    <SelectValue placeholder="سيتم اختيار المقرئ تلقائياً عند اختيار الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {reciters.map(r => (
                      <SelectItem key={r.user_id} value={r.user_id}>{r.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">الإجازة المعتمدة (القراءة/الرواية)</label>
                <Select value={formRiwaya} onValueChange={handleRiwayaSelect}>
                  <SelectTrigger className="bg-card border-border/50">
                    <SelectValue placeholder="اختر الطالب أولاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {RIWAYAT.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Certificate Text */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-primary">الصياغة المعتمدة (للمعاينة)</label>
              {selectedReciterId && !formText && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
                  <p className="font-semibold mb-1">⚠️ لا توجد صياغة معتمدة لهذه الرواية</p>
                  <p className="text-xs">المقرئ/ة لا يمتلك صياغة إجازة لرواية "{formRiwaya || "غير محددة"}". </p>
                  {(() => {
                    const available = reciterCerts.filter(c => c.reciter_id === selectedReciterId && c.type === (formType === "ijaza" ? "ijaza" : "khatm"));
                    if (available.length > 0) {
                      return (
                        <div className="mt-2">
                          <p className="text-xs font-semibold mb-1">الروايات المتوفرة للمقرئ/ة:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {available.map(a => (
                              <button
                                key={a.riwaya || "khatm"}
                                type="button"
                                onClick={() => { if (a.riwaya) handleRiwayaSelect(a.riwaya); }}
                                className="px-2.5 py-1 rounded-lg bg-amber-200/60 hover:bg-amber-300/60 text-xs font-medium transition-colors dark:bg-amber-800/40 dark:hover:bg-amber-700/40"
                              >
                                {a.riwaya || "ختم القرآن"}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return <p className="text-xs mt-1">يرجى إضافة صيغة الإجازة في إعدادات المقرئ/ة أولاً، أو أدخل النص يدوياً أدناه.</p>;
                  })()}
                </div>
              )}
              <Textarea
                value={formText}
                onChange={e => setFormText(e.target.value)}
                placeholder="يتم اختيار الصياغة تلقائياً من الإجازة المعتمدة للمقرئ/ة"
                className="bg-card border-border/50 min-h-[100px]"
              />
              <p className="text-[11px] text-muted-foreground">يتم اختيار الصياغة تلقائياً من الإجازة المعتمدة للمقرئ/ة</p>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">ملاحظات (اختياري)</label>
              <Textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="ملاحظات إضافية..."
                className="bg-card border-border/50 min-h-[80px]"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedStudentId}
              className="w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg px-8"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Award className="w-4 h-4" />
              )}
              {formType === "ijaza" ? "إصدار الإجازة" : "إصدار الشهادة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Certificate Dialog */}
      <Dialog open={!!viewCert} onOpenChange={() => setViewCert(null)}>
        <DialogContent className="sm:max-w-[960px] max-h-[95vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${viewCert?.type === "ijaza" ? "bg-gold/15" : "bg-primary/10"}`}>
                {viewCert?.type === "ijaza" ? <GraduationCap className="w-4 h-4 text-gold" /> : <Award className="w-4 h-4 text-primary" />}
              </div>
              معاينة الشهادة
            </DialogTitle>
            <DialogDescription>معاينة الشهادة بالتصميم الرسمي</DialogDescription>
          </DialogHeader>
          {viewCert && (
            <>
              <CertificateViewer
                cert={viewCert}
                reciterSignatureUrl={viewCert.reciter_id ? reciters.find(r => r.user_id === viewCert.reciter_id)?.signature_url : null}
                reciterStampUrl={viewCert.reciter_id ? reciters.find(r => r.user_id === viewCert.reciter_id)?.stamp_url : null}
              />
              <div className="flex justify-center mt-4">
                <Button onClick={() => handleDownload(viewCert)} disabled={downloadingId === viewCert.id} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                  {downloadingId === viewCert.id
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> جارٍ التحميل...</>
                    : <><Download className="w-4 h-4" /> تحميل PDF</>}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCertificates;
