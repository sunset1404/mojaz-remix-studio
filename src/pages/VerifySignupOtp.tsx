import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, ShieldCheck, ArrowRight } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

const VerifySignupOtp = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = (params.get("email") || "").trim().toLowerCase();
  const role = params.get("role") || "student";

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) navigate("/signup");
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleVerify = async () => {
    if (token.length !== 8) {
      toast({ title: "رمز غير صحيح", description: "يجب أن يتكون الرمز من 8 أرقام", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    setLoading(false);
    if (error) {
      toast({ title: "فشل التحقق", description: "الرمز غير صحيح أو منتهي الصلاحية", variant: "destructive" });
      return;
    }
    toast({ title: "تم تفعيل الحساب بنجاح" });
    // user is now signed in via verifyOtp
    if (role === "reciter") navigate("/reciter-pending", { replace: true });
    else navigate("/", { replace: true });
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      toast({ title: "تعذر إعادة الإرسال", description: error.message, variant: "destructive" });
      return;
    }
    setCooldown(60);
    toast({ title: "تم إرسال رمز جديد إلى بريدك" });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(170deg, hsl(174 42% 28%) 0%, hsl(174 42% 35%) 30%, hsl(174 38% 40%) 55%, hsl(174 35% 38%) 80%, hsl(174 30% 32%) 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">

        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }} className="mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-1 bg-card/90 backdrop-blur-sm">
            <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-xl" />
          </div>
        </motion.div>

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }} className="w-full max-w-sm">
          <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-primary-foreground/10 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground font-cairo">تحقق من بريدك الإلكتروني</h2>
              <p className="text-muted-foreground text-xs leading-relaxed">
                أرسلنا رمزاً مكوناً من 8 أرقام إلى
              </p>
              <p className="text-foreground text-sm font-semibold flex items-center justify-center gap-1.5" dir="ltr">
                <Mail className="w-4 h-4 text-primary" />
                {email}
              </p>
            </div>

            <div className="space-y-2 text-right">
              <Label className="text-foreground text-sm font-semibold">رمز التحقق</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="--------"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="h-14 rounded-xl border-primary/20 bg-card focus:border-primary text-center text-2xl font-bold tracking-[10px]"
                dir="ltr"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || token.length !== 8}
              className="w-full gradient-primary text-primary-foreground h-12 rounded-2xl font-bold shadow-md"
            >
              {loading ? "جاري التحقق..." : "تفعيل الحساب"}
            </Button>

            <div className="pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="text-xs text-primary font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {cooldown > 0 ? `يمكنك إعادة الإرسال خلال ${cooldown} ثانية` : resending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifySignupOtp;
