import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz-new.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 0 = logo appears, 1 = text appears, 2 = move up + show form
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900);
    const t2 = setTimeout(() => setStep(2), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const settled = step >= 2;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background:
          "linear-gradient(170deg, hsl(174 42% 28%) 0%, hsl(174 42% 35%) 30%, hsl(174 38% 40%) 55%, hsl(174 35% 38%) 80%, hsl(174 30% 32%) 100%)",
      }}
    >
      {/* Gold glow overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 85%, hsl(43 50% 50% / 0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 30% 50%, hsl(43 50% 50% / 0.12) 0%, transparent 60%)",
      }} />

      {/* Decorative circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }} transition={{ duration: 1.2 }}
          className="absolute top-12 right-6 w-40 h-40 rounded-full border-2 border-primary-foreground/20" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }} transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute -top-12 -left-12 w-56 h-56 rounded-full border-2 border-primary-foreground/15" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.06 }} transition={{ duration: 1, delay: 0.4 }}
          className="absolute bottom-20 right-4 w-28 h-28 rounded-full bg-gold/15 blur-xl" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }} transition={{ duration: 1, delay: 0.3 }}
          className="absolute bottom-40 -left-8 w-36 h-36 rounded-full bg-primary-foreground/10 blur-xl" />
        <div className="absolute top-16 right-24 w-3 h-3 rounded-full bg-gold/40" />
        <div className="absolute top-32 left-10 w-2 h-2 rounded-full bg-gold/50" />
        <div className="absolute bottom-32 right-16 w-2.5 h-2.5 rounded-full bg-primary-foreground/25" />
        <div className="absolute top-1/2 left-6 w-2 h-2 rounded-full bg-gold/30" />
      </div>

      {/* Splash glow */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-10"
        style={{ width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, hsl(43 50% 55% / 0.25) 0%, transparent 70%)" }}
        initial={{ opacity: 0, scale: 0.5, top: "calc(38vh - 160px)" }}
        animate={settled
          ? { opacity: 0, scale: 0.3, top: "0px" }
          : { opacity: 0.3, scale: 1, top: "calc(38vh - 160px)" }
        }
        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Floating particles (splash only) */}
      {!settled && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none z-10"
              style={{
                width: 4 + i * 3, height: 4 + i * 3,
                background: `hsla(43, 50%, 55%, ${0.15 + i * 0.05})`,
                top: `${15 + i * 13}%`, left: `${10 + (i % 3) * 30}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1], scale: [0, 1.2, 0.8, 1], y: [0, -10, 5, 0] }}
              transition={{ duration: 2.5, delay: 0.3 + i * 0.15, repeat: Infinity, repeatType: "reverse" }}
            />
          ))}
        </>
      )}

      {/* ====== LOGO AREA ====== */}
      <div className="relative z-20 flex flex-col items-center" style={{ minHeight: settled ? "auto" : "100vh" }}>
        {/* This spacer pushes the logo to center or top */}
        <motion.div
          initial={{ height: "calc(38vh - 72px)" }}
          animate={{ height: settled ? 56 : "calc(38vh - 72px)" }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Logo container */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
        >
          <motion.div
            className="relative"
            animate={!settled ? { y: [0, -6, 0] } : { y: 0 }}
            transition={!settled ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="rounded-3xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-1 bg-card/90 backdrop-blur-sm"
              initial={{ width: 144, height: 144 }}
              animate={settled ? { width: 96, height: 96 } : { width: 144, height: 144 }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-2xl" />
            </motion.div>

            {/* Shine sweep */}
            {!settled && (
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute w-full h-full"
                  style={{ background: "linear-gradient(105deg, transparent 40%, hsla(0,0%,100%,0.3) 45%, hsla(0,0%,100%,0.1) 50%, transparent 55%)" }}
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Text area */}
        <div className="mt-4 text-center overflow-hidden">
          {/* Splash title "مُجاز" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              settled
                ? { opacity: 0, y: -20, height: 0, marginBottom: 0 }
                : step >= 1
                  ? { opacity: 1, y: 0, height: "auto", marginBottom: 8 }
                  : { opacity: 0, y: 20, height: "auto", marginBottom: 8 }
            }
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-4xl font-bold font-cairo tracking-wide" style={{ color: "#d2ac4b" }}>مُجاز</h1>
            <motion.p
              className="text-white/70 text-sm mt-2 font-cairo"
              initial={{ opacity: 0 }}
              animate={step >= 1 && !settled ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              إجازات قرآنية بالسند المتصل
            </motion.p>
          </motion.div>

          {/* Decorative line */}
          <motion.div
            className="mx-auto w-16 h-0.5 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #d2ac4b, transparent)" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={
              step === 1
                ? { scaleX: 1, opacity: 1, height: 2 }
                : settled
                  ? { scaleX: 0, opacity: 0, height: 0 }
                  : { scaleX: 0, opacity: 0 }
            }
            transition={{ duration: 0.6 }}
          />

          {/* Login title */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={settled ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: settled ? 0.5 : 0, ease: "easeOut" }}
          >
            <h1 className="text-2xl font-bold font-cairo text-[#d2ac4b]">تسجيل الدخول</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">مرحباً بعودتك</p>
          </motion.div>
        </div>
      </div>

      {/* ====== LOGIN FORM ====== */}
      <motion.div
        className="flex-1 flex flex-col items-center px-6 relative z-10 pb-8"
        initial={{ opacity: 0, y: 60 }}
        animate={settled ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 0.7, delay: settled ? 0.6 : 0, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ pointerEvents: settled ? "auto" : "none" }}
      >
        <div className="w-full max-w-sm">
          <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-primary-foreground/10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-semibold">البريد الإلكتروني</Label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <Input id="email" type="email" placeholder="example@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-14 text-left h-12 rounded-xl border-primary/20 bg-card focus:border-primary focus:bg-card transition-colors shadow-sm"
                    dir="ltr" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground text-sm font-semibold">كلمة المرور</Label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-gold" />
                  </div>
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pr-14 pl-12 text-left h-12 rounded-xl border-primary/20 bg-card focus:border-primary focus:bg-card transition-colors shadow-sm"
                    dir="ltr" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-start">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold">نسيت كلمة المرور؟</Link>
              </div>

              <Button type="submit"
                className="w-full gradient-primary text-primary-foreground h-13 text-base font-bold rounded-2xl shadow-md hover:shadow-lg transition-shadow mt-2"
                disabled={loading}>
                {loading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" />
                ) : (
                  <><LogIn className="w-5 h-5 ml-2" />تسجيل الدخول</>
                )}
              </Button>

            </form>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={settled ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center mt-8 text-card font-semibold drop-shadow-sm"
          >
            ليس لديك حساب؟{" "}
            <Link to="/signup" className="font-bold hover:underline text-[#d2ac4b]">إنشاء حساب جديد</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
