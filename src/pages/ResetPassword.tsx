import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, Mail, KeyRound } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user lands here from old email link (?type=recovery) — already signed in
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || params.get("type") === "recovery") {
      setStep("password");
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStep("password");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || code.length < 6) {
      toast({ title: "خطأ", description: "أدخل البريد والرمز المكون من 6 أرقام", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });
    if (error) {
      toast({ title: "رمز غير صحيح", description: error.message, variant: "destructive" });
    } else {
      setStep("password");
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم التحديث", description: "تم تغيير كلمة المرور بنجاح" });
      await supabase.auth.signOut();
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--turquoise-dark)) 45%, hsl(var(--turquoise-dark) / 0.6) 70%, hsl(var(--gold) / 0.12) 90%, hsl(var(--gold) / 0.18) 100%)" }}
    >
      <div className="relative z-10 flex flex-col items-center pt-14 pb-8">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 150 }} className="mb-4">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-1 bg-card/90 backdrop-blur-sm">
            <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-2xl" />
          </div>
        </motion.div>
        <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-2xl font-bold text-primary-foreground font-cairo">
          {step === "otp" ? "إدخال رمز التحقق" : "تعيين كلمة مرور جديدة"}
        </motion.h1>
        <p className="text-primary-foreground/80 text-sm mt-2 px-6 text-center">
          {step === "otp" ? "أدخل الرمز المرسل إلى بريدك الإلكتروني" : "اختر كلمة مرور قوية لحسابك"}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 relative z-10">
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-sm">
          <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-primary-foreground/10">
            {step === "otp" ? (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground text-sm font-semibold">البريد الإلكتروني</Label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-gold" />
                    </div>
                    <Input id="email" type="email" placeholder="email@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="pr-14 text-left h-12 rounded-xl border-primary/20 bg-card focus:border-primary shadow-sm"
                      dir="ltr" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-foreground text-sm font-semibold">رمز التحقق (6 أرقام)</Label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-gold" />
                    </div>
                    <Input id="code" type="text" inputMode="numeric" maxLength={6} placeholder="------"
                      value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="pr-14 text-center h-12 rounded-xl border-primary/20 bg-card focus:border-primary shadow-sm text-2xl tracking-[0.5em] font-bold"
                      dir="ltr" required />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground h-13 text-base font-bold rounded-2xl shadow-md" disabled={loading}>
                  {loading ? <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" /> : (
                    <><CheckCircle className="w-5 h-5 ml-2" /> تحقق من الرمز</>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  لم يصلك الرمز؟{" "}
                  <a href="/forgot-password" className="text-primary font-semibold hover:underline">إعادة الإرسال</a>
                </p>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground text-sm font-semibold">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gold" />
                    </div>
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="pr-14 pl-12 text-left h-12 rounded-xl border-primary/20 bg-card focus:border-primary shadow-sm"
                      dir="ltr" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-foreground text-sm font-semibold">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gold" />
                    </div>
                    <Input id="confirm" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-14 text-left h-12 rounded-xl border-primary/20 bg-card focus:border-primary shadow-sm"
                      dir="ltr" required />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground h-13 text-base font-bold rounded-2xl shadow-md" disabled={loading}>
                  {loading ? <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" /> : (
                    <><CheckCircle className="w-5 h-5 ml-2" /> تحديث كلمة المرور</>
                  )}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
