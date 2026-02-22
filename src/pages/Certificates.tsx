import { motion } from "framer-motion";
import { ChevronRight, GraduationCap, Award, Download, Share2, Loader2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { createRoot } from "react-dom/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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


  const handleDownload = useCallback(async (cert: Certificate) => {
    setDownloadingId(cert.id);

    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      // Use a hidden iframe to completely isolate html2canvas from the main page
      // Render at exact A4 landscape ratio: 297:210 ≈ 1.414
      const downloadWidth = 1414;
      const downloadHeight = 1000;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${downloadWidth + 40}px;height:${downloadHeight + 40}px;visibility:hidden;pointer-events:none;border:none;`;
      document.body.appendChild(iframe);

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.src = "about:blank";
      });

      const iframeDoc = iframe.contentDocument!;

      // Add Google Fonts directly to iframe
      const fontLink = iframeDoc.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;500;600;700;800&display=swap";
      iframeDoc.head.appendChild(fontLink);

      // Copy all stylesheets into the iframe
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      styles.forEach((s) => {
        iframeDoc.head.appendChild(s.cloneNode(true));
      });

      // Set base font on iframe body
      iframeDoc.body.style.cssText = "margin:0;padding:0;font-family:'Cairo','Amiri',sans-serif;direction:rtl;";

      // Create render target inside iframe - fixed landscape dimensions
      const certEl = iframeDoc.createElement("div");
      certEl.style.width = `${downloadWidth}px`;
      certEl.style.height = `${downloadHeight}px`;
      certEl.style.overflow = "hidden";
      iframeDoc.body.appendChild(certEl);

      const root = createRoot(certEl);
      root.render(
        <CertificateViewer
          cert={cert}
          reciterSignatureUrl={cert.reciter_signature_url}
          reciterStampUrl={cert.reciter_stamp_url}
          renderWidth={downloadWidth}
          renderHeight={downloadHeight}
        />
      );

      // Wait for render + fonts + images to load
      await new Promise(r => setTimeout(r, 2000));

      const canvas = await (html2canvas as any)(certEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: downloadWidth,
        width: downloadWidth,
        height: downloadHeight,
        window: iframe.contentWindow!,
      });

      // Cleanup iframe
      root.unmount();
      document.body.removeChild(iframe);

      // Landscape A4 - fill entire page edge to edge, zero margins
      const pdf = new jsPDF("l", "mm", "a4");
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210);

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
      // share cancelled or failed, fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط الشهادة إلى الحافظة");
    } catch {
      // clipboard API blocked, use fallback
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

  const CertCard = ({ cert, i, delay }: { cert: Certificate; i: number; delay: number }) => (
    <motion.div key={cert.id} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: delay + i * 0.08 }} className="glass-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm">{cert.title}</h3>
          {cert.sheikh_name && <p className="text-xs text-muted-foreground mt-1">على يد {cert.sheikh_name}</p>}
          {cert.date && <p className="text-[10px] text-muted-foreground mt-0.5">{cert.date}</p>}
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${cert.status === "معتمدة" ? "bg-primary/10 text-primary" : "bg-gold/15 text-gold"}`}>
          {cert.status}
        </span>
      </div>
      {cert.status === "معتمدة" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
          <button onClick={() => setViewCert(cert)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-accent text-foreground text-xs font-semibold hover:bg-accent/80 transition-colors">
            <Eye className="w-3.5 h-3.5" /> معاينة
          </button>
          <button
            onClick={() => handleDownload(cert)}
            disabled={downloadingId === cert.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors disabled:opacity-50"
          >
            {downloadingId === cert.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} تحميل PDF
          </button>
          <button onClick={() => handleShare(cert)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/15 transition-colors">
            <Share2 className="w-3.5 h-3.5" /> مشاركة
          </button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-8 rounded-b-[2.5rem] relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-primary-foreground" />
            </button>
            <h1 className="text-lg font-bold text-primary-foreground">الإجازات والشهادات</h1>
            <div className="w-9" />
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Ijazat Section */}
          <div className="px-5 mt-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-gold" />
                </div>
                الإجازات القرآنية
              </h2>
              {ijazat.length === 0 ? (
                <div className="glass-card rounded-2xl p-6 text-center">
                  <p className="text-muted-foreground text-sm">لا توجد إجازات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ijazat.map((ij, i) => <CertCard key={ij.id} cert={ij} i={i} delay={0.3} />)}
                </div>
              )}
            </motion.div>
          </div>

          {/* Certificates Section */}
          <div className="px-5 mt-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-4 h-4 text-primary" />
                </div>
                الشهادات
              </h2>
              {certificates.length === 0 ? (
                <div className="glass-card rounded-2xl p-6 text-center">
                  <p className="text-muted-foreground text-sm">لا توجد شهادات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert, i) => <CertCard key={cert.id} cert={cert} i={i} delay={0.55} />)}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* View Certificate Dialog - Mobile optimized */}
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
