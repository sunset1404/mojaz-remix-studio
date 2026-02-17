import { motion } from "framer-motion";
import { ChevronRight, GraduationCap, Award, Download, Share2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type Certificate = {
  id: string;
  title: string;
  type: string;
  sheikh_name: string | null;
  issuer: string | null;
  date: string | null;
  status: string;
};

const handleDownload = (title: string) => {
  toast.success(`جاري تحميل "${title}" كملف PDF`);
};

const handleShare = async (title: string) => {
  const shareData = { title, text: `شهادة: ${title}`, url: window.location.href };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch { /* cancelled */ }
  } else {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("تم نسخ رابط الشهادة إلى الحافظة");
  }
};

const Certificates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ijazat, setIjazat] = useState<Certificate[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
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
    fetch();
  }, [user]);

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
                  {ijazat.map((ij, i) => (
                    <motion.div key={ij.id} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }} className="glass-card rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-sm">{ij.title}</h3>
                          {ij.sheikh_name && <p className="text-xs text-muted-foreground mt-1">على يد {ij.sheikh_name}</p>}
                          {ij.date && <p className="text-[10px] text-muted-foreground mt-0.5">{ij.date}</p>}
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${ij.status === "معتمدة" ? "bg-primary/10 text-primary" : "bg-gold/15 text-gold"}`}>
                          {ij.status}
                        </span>
                      </div>
                      {ij.status === "معتمدة" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                          <button onClick={() => handleDownload(ij.title)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors">
                            <Download className="w-3.5 h-3.5" /> تحميل PDF
                          </button>
                          <button onClick={() => handleShare(ij.title)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/15 transition-colors">
                            <Share2 className="w-3.5 h-3.5" /> مشاركة
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
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
                  {certificates.map((cert, i) => (
                    <motion.div key={cert.id} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.55 + i * 0.08 }} className="glass-card rounded-2xl p-4">
                      <h3 className="font-bold text-foreground text-sm">{cert.title}</h3>
                      {cert.issuer && <p className="text-xs text-muted-foreground mt-1">{cert.issuer}</p>}
                      {cert.date && <p className="text-[10px] text-muted-foreground mt-0.5">{cert.date}</p>}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                        <button onClick={() => handleDownload(cert.title)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors">
                          <Download className="w-3.5 h-3.5" /> تحميل PDF
                        </button>
                        <button onClick={() => handleShare(cert.title)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/15 transition-colors">
                          <Share2 className="w-3.5 h-3.5" /> مشاركة
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Certificates;
