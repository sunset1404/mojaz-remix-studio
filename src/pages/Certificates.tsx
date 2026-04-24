import { motion } from "framer-motion";
import { ChevronRight, GraduationCap, Award, Download, Share2, Loader2, Eye, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { createRoot } from "react-dom/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CertificateViewer from "@/components/CertificateViewer";

// Wrapper that scales the 920px certificate to fit within its container
const CertificateScaled = forwardRef<HTMLDivElement, {
  cert: any;
  reciterSignatureUrl?: string | null;
  reciterStampUrl?: string | null;
}>(({ cert, reciterSignatureUrl, reciterStampUrl }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setScale(Math.min(1, containerWidth / 920));
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-full" style={{ direction: "ltr" }}>
      <div
        style={{
          zoom: scale,
          width: "920px",
        }}
      >
        <CertificateViewer
          ref={ref}
          cert={cert}
          reciterSignatureUrl={reciterSignatureUrl}
          reciterStampUrl={reciterStampUrl}
        />
      </div>
    </div>
  );
});
CertificateScaled.displayName = "CertificateScaled";

type Certificate = {
  id: string;
  title: string;
  type: string;
  sheikh_name: string | null;
  issuer: string | null;
  date: string | null;
  status: string;
  student_name: string | null;
  reciter_name: string | null;
  reciter_id: string | null;
  riwaya: string | null;
  certificate_text: string | null;
  student_phone: string | null;
  student_email: string | null;
  notes: string | null;
  reciter_signature_url: string | null;
  reciter_stamp_url: string | null;
};

const Certificates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ijazat, setIjazat] = useState<Certificate[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [viewCert, setViewCert] = useState<Certificate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setIjazat(data.filter(c => c.type === "ijaza"));
        setCertificates(data.filter(c => c.type === "certificate"));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const total = ijazat.length + certificates.length;

  const handleDownload = useCallback(async (cert: Certificate) => {
    setDownloadingId(cert.id);

    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      // A4 portrait at 150 DPI = 1240 x 1754 px.
      const downloadWidth = 1240;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${downloadWidth + 40}px;height:2400px;visibility:hidden;pointer-events:none;border:none;`;
      document.body.appendChild(iframe);

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.src = "about:blank";
      });

      const iframeDoc = iframe.contentDocument!;
      const iframeWin = iframe.contentWindow! as any;

      const fontStyle = iframeDoc.createElement("style");
      fontStyle.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;500;600;700;800&display=swap');
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body { font-family: 'Cairo', 'Amiri', sans-serif; direction: rtl; }
      `;
      iframeDoc.head.appendChild(fontStyle);

      const certEl = iframeDoc.createElement("div");
      certEl.style.width = `${downloadWidth}px`;
      certEl.style.overflow = "hidden";
      iframeDoc.body.appendChild(certEl);

      const root = createRoot(certEl);
      root.render(
        <CertificateViewer
          cert={cert}
          reciterSignatureUrl={cert.reciter_signature_url}
          reciterStampUrl={cert.reciter_stamp_url}
          renderWidth={downloadWidth}
        />
      );

      await new Promise(r => setTimeout(r, 300));
      try {
        if (iframeWin.document?.fonts?.ready) {
          await iframeWin.document.fonts.ready;
          await Promise.all([
            iframeWin.document.fonts.load("700 32px Amiri"),
            iframeWin.document.fonts.load("400 17px Amiri"),
            iframeWin.document.fonts.load("700 16px Cairo"),
            iframeWin.document.fonts.load("400 14px Cairo"),
          ]);
        }
      } catch {}
      await new Promise(r => setTimeout(r, 800));

      const renderedHeight = certEl.scrollHeight;

      const canvas = await (html2canvas as any)(certEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: downloadWidth,
        width: downloadWidth,
        height: renderedHeight,
        foreignObjectRendering: true,
        window: iframe.contentWindow!,
      });

      root.unmount();
      document.body.removeChild(iframe);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgRatio = renderedHeight / downloadWidth;
      let drawW = pdfW;
      let drawH = pdfW * imgRatio;
      if (drawH > pdfH) {
        drawH = pdfH;
        drawW = pdfH / imgRatio;
      }
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, drawW, drawH);

      pdf.save(`${cert.title}.pdf`);
      toast.success("تم تحميل الشهادة بنجاح");
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء التحميل");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleShare = useCallback(async (cert: Certificate) => {
    const url = `${window.location.origin}/verify/${cert.id}`;
    const shareData = {
      title: cert.title,
      text: `شهادة: ${cert.title}`,
      url,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // share cancelled
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط الشهادة إلى الحافظة");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.cssText = "position:fixed;left:-9999px;";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("تم نسخ رابط الشهادة إلى الحافظة");
    }
  }, []);

  const CertCard = ({ cert, i, delay, accent }: { cert: Certificate; i: number; delay: number; accent: "gold" | "primary" }) => {
    const Icon = accent === "gold" ? GraduationCap : Award;
    const ringClass = accent === "gold" ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary";
    return (
      <motion.div
        key={cert.id}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: delay + i * 0.08 }}
      >
        <Card className="border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-2xl ${ringClass} flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2">{cert.title}</h3>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${cert.status === "معتمدة" ? "bg-primary/10 text-primary border-primary/20" : "bg-gold/15 text-gold border-gold/20"}`}
                  >
                    {cert.status}
                  </Badge>
                </div>
                {cert.sheikh_name && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">على يد {cert.sheikh_name}</p>
                )}
                {cert.riwaya && (
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">رواية: {cert.riwaya}</p>
                )}
                {cert.date && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{cert.date}</p>
                )}
              </div>
            </div>

            {cert.status === "معتمدة" && (
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40">
                <button
                  onClick={() => setViewCert(cert)}
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-accent/40 hover:bg-accent/70 text-foreground text-[11px] font-semibold transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  معاينة
                </button>
                <button
                  onClick={() => handleDownload(cert)}
                  disabled={downloadingId === cert.id}
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-[11px] font-semibold transition-colors disabled:opacity-50"
                >
                  {downloadingId === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  تحميل
                </button>
                <button
                  onClick={() => handleShare(cert)}
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-gold/10 hover:bg-gold/15 text-gold text-[11px] font-semibold transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const stats = [
    { label: "إجمالي الشهادات", value: total, icon: FileText, bg: "bg-primary/10", iconColor: "text-primary" },
    { label: "الإجازات القرآنية", value: ijazat.length, icon: GraduationCap, bg: "bg-gold/15", iconColor: "text-gold" },
    { label: "شهادات الختم", value: certificates.length, icon: Award, bg: "bg-primary/10", iconColor: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="gradient-primary px-5 pt-10 pb-14 rounded-b-[2.5rem] relative">
          <div className="absolute top-0 left-0 w-56 h-56 rounded-full bg-white/5 -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-44 h-44 rounded-full bg-white/5 translate-x-12 translate-y-12" />

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-primary-foreground" />
              </button>
              <h1 className="text-base font-bold text-primary-foreground">الشهادات والإجازات</h1>
              <div className="w-9" />
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gold/20 backdrop-blur-sm flex items-center justify-center">
                <Award className="w-5 h-5 text-gold" />
              </div>
              <h2 className="text-xl font-bold text-primary-foreground">الشهادات والإجازات القرآنية</h2>
            </div>
            <p className="text-primary-foreground/70 text-xs leading-relaxed pr-1">
              إصدار الإجازات القرآنية وشهادات ختم القرآن الكريم للطلاب المستحقين
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats - overlapping */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-3 gap-2.5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border/50 shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                  <div className={`w-10 h-10 rounded-2xl ${s.bg} flex items-center justify-center shadow-sm`}>
                    <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                  </div>
                  <span className="text-xl font-bold text-foreground leading-none">
                    {loading ? "—" : s.value}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground leading-tight">
                    {s.label}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Ijazat Section */}
          <div className="px-4 mt-7">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gold/15 flex items-center justify-center">
                    <GraduationCap className="w-3.5 h-3.5 text-gold" />
                  </div>
                  الإجازات القرآنية
                </h2>
                <Badge variant="secondary" className="text-[10px] bg-gold/10 text-gold border-gold/20">
                  {ijazat.length}
                </Badge>
              </div>
              {ijazat.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-muted/20">
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-5 h-5 text-gold" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">لا توجد إجازات بعد</p>
                    <p className="text-muted-foreground/70 text-xs mt-1">ستظهر إجازاتك هنا فور إصدارها</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {ijazat.map((ij, i) => <CertCard key={ij.id} cert={ij} i={i} delay={0.3} accent="gold" />)}
                </div>
              )}
            </motion.div>
          </div>

          {/* Certificates Section */}
          <div className="px-4 mt-7">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5 text-primary" />
                  </div>
                  شهادات الختم
                </h2>
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  {certificates.length}
                </Badge>
              </div>
              {certificates.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-muted/20">
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">لا توجد شهادات بعد</p>
                    <p className="text-muted-foreground/70 text-xs mt-1">ستظهر شهاداتك هنا فور إصدارها</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert, i) => <CertCard key={cert.id} cert={cert} i={i} delay={0.5} accent="primary" />)}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* View Certificate Dialog */}
      <Dialog open={!!viewCert} onOpenChange={() => setViewCert(null)}>
        <DialogContent className="w-[calc(100vw-16px)] max-w-[960px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">معاينة الشهادة</DialogTitle>
            <DialogDescription className="text-xs">معاينة الشهادة بالتصميم الرسمي</DialogDescription>
          </DialogHeader>
          {viewCert && (
            <CertificateScaled
              ref={certRef}
              cert={viewCert}
              reciterSignatureUrl={(viewCert as any).reciter_signature_url}
              reciterStampUrl={(viewCert as any).reciter_stamp_url}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Certificates;
