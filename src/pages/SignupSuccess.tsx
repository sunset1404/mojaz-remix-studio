import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMojaz from "@/assets/logo-mojaz.webp";

const SignupSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const role = params.get("role") || "student";

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
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-9 h-9 text-primary" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground font-cairo">
                تم إنشاء الحساب بنجاح!
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                يمكنك الآن تسجيل الدخول مباشرة باستخدام بريدك وكلمة المرور.
              </p>
            </div>

            <div className="bg-primary/5 rounded-2xl p-4 space-y-3 border border-primary/10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="text-foreground text-sm font-semibold">
                حسابك جاهز للاستخدام
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                لا حاجة لتأكيد البريد الإلكتروني.
              </p>
            </div>

            {role === "reciter" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gold/10 rounded-2xl p-4 space-y-2 border border-gold/20"
              >
                <p className="text-foreground text-xs font-semibold">
                  ⭐ ملاحظة للمقرئين
                </p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  بعد تفعيل حسابك، سيتم مراجعة طلبك من قبل إدارة التطبيق
                  وسيتم التواصل معك في أقرب وقت.
                </p>
              </motion.div>
            )}

            <Button
              onClick={() => navigate("/login")}
              className="w-full gradient-primary text-primary-foreground h-12 rounded-2xl font-bold shadow-md"
            >
              العودة لتسجيل الدخول
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupSuccess;
