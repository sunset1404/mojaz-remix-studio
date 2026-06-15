import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMojaz from "@/assets/logo-mojaz.webp";
import logoEqraa from "@/assets/logo-eqraa.jpg";
import { useAuth } from "@/contexts/AuthContext";

const ReciterPending = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--turquoise-dark)) 40%, hsl(var(--gold) / 0.35) 85%, hsl(var(--gold) / 0.5) 100%)",
      }}
    >
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1.2 }}
          className="absolute top-12 right-6 w-40 h-40 rounded-full border-2 border-primary-foreground/20"
        />
        <div className="absolute bottom-20 right-4 w-28 h-28 rounded-full bg-gold/15 blur-xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-1 bg-card/90 backdrop-blur-sm">
            <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-xl" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-primary-foreground/10 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto"
            >
              <Clock className="w-9 h-9 text-gold" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground font-cairo">
                حسابك قيد المراجعة من قبل الإدارة
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                طلبك قيد المراجعة من قبل إدارة التطبيق
              </p>
            </div>

            <div className="bg-primary/5 rounded-2xl p-4 space-y-3 border border-primary/10">
              <p className="text-foreground text-sm font-semibold leading-relaxed">
                سيتم التواصل معك في أقرب وقت ممكن بعد الانتهاء من مراجعة بياناتك والتحقق من مؤهلاتك.
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                نشكرك على اهتمامك بالانضمام إلى منصة مجاز، ونتطلع للعمل معك في خدمة كتاب الله.
              </p>
            </div>

            {/* Admin contact info */}
            <div className="bg-card rounded-2xl p-4 space-y-3 border border-border/60">
              <p className="text-foreground text-xs font-bold">للتواصل مع إدارة التطبيق</p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href="tel:+966507040036"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  dir="ltr"
                >
                  <Phone className="w-3.5 h-3.5" />
                  0507040036
                </a>
                <a
                  href="https://wa.me/966507040036"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  واتساب
                </a>
              </div>
            </div>

            <Button
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
              variant="outline"
              className="w-full h-12 rounded-2xl font-bold border-border/60"
            >
              تسجيل الخروج
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReciterPending;
