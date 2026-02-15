import { motion } from "framer-motion";
import { ChevronRight, GraduationCap, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ijazat = [
  { title: "إجازة في رواية حفص عن عاصم", sheikh: "الشيخ أحمد العجمي", date: "1444 هـ", status: "معتمدة" },
  { title: "إجازة في رواية ورش عن نافع", sheikh: "الشيخ ماهر المعيقلي", date: "1445 هـ", status: "قيد الإتمام" },
];

const certificates = [
  { title: "شهادة إتمام حفظ جزء عمّ", issuer: "مركز النور لتحفيظ القرآن", date: "1443 هـ" },
  { title: "شهادة إتمام حفظ جزء تبارك", issuer: "مركز النور لتحفيظ القرآن", date: "1444 هـ" },
  { title: "شهادة التجويد - المستوى الأول", issuer: "أكاديمية القرآن أونلاين", date: "1445 هـ" },
];

const Certificates = () => {
  const navigate = useNavigate();

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

      {/* Ijazat Section */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-gold" />
            </div>
            الإجازات القرآنية
          </h2>
          <div className="space-y-3">
            {ijazat.map((ij, i) => (
              <motion.div
                key={ij.title}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm">{ij.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">على يد {ij.sheikh}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ij.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    ij.status === "معتمدة"
                      ? "bg-primary/10 text-primary"
                      : "bg-gold/15 text-gold"
                  }`}>
                    {ij.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Certificates Section */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
            الشهادات
          </h2>
          <div className="space-y-3">
            {certificates.map((cert, i) => (
              <motion.div
                key={cert.title}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                className="glass-card rounded-2xl p-4"
              >
                <h3 className="font-bold text-foreground text-sm">{cert.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cert.issuer}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{cert.date}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Certificates;
