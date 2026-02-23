import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import SplashScreen from "./SplashScreen";
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
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message === "Invalid login credentials" ?
        "البريد الإلكتروني أو كلمة المرور غير صحيحة" :
        error.message,
        variant: "destructive"
      });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
    style={{ background: "linear-gradient(170deg, hsl(174 42% 28%) 0%, hsl(174 42% 35%) 30%, hsl(174 38% 40%) 55%, hsl(174 35% 38%) 80%, hsl(174 30% 32%) 100%)" }}>

      {/* Subtle gold glow overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 85%, hsl(43 50% 50% / 0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 30% 50%, hsl(43 50% 50% / 0.12) 0%, transparent 60%)" }} />
      {/* Full-page decorative elements */}
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

      {/* Logo and title section */}
      <div className="relative z-10 flex flex-col items-center pt-14 pb-8">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 150 }} className="mb-4">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-1 bg-card/90 backdrop-blur-sm">
            <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-2xl" />
          </div>
        </motion.div>
        <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
        className="text-2xl font-bold font-cairo text-[#d2ac4b]">تسجيل الدخول</motion.h1>
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
        className="text-primary-foreground/70 text-sm mt-1">مرحباً بعودتك</motion.p>
      </div>

      {/* Form card */}
      <div className="flex-1 flex flex-col items-center px-6 relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-sm">

          <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-primary-foreground/10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground text-sm font-semibold">البريد الإلكتروني</Label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-14 text-left h-12 rounded-xl border-primary/20 bg-card focus:border-primary focus:bg-card transition-colors shadow-sm"
                    dir="ltr"
                    required />

              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground text-sm font-semibold">كلمة المرور</Label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gold" />
                </div>
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-14 pl-12 text-left h-12 rounded-xl border-primary/20 bg-card focus:border-primary focus:bg-card transition-colors shadow-sm"
                    dir="ltr"
                    required />

                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors">

                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <div className="flex justify-start">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground h-13 text-base font-bold rounded-2xl shadow-md hover:shadow-lg transition-shadow mt-2"
                disabled={loading}>

              {loading ?
                <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" /> :

                <>
                  <LogIn className="w-5 h-5 ml-2" />
                  تسجيل الدخول
                </>
                }
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-muted-foreground">أو الدخول بواسطة</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border/60 bg-background/80 hover:bg-background font-semibold"
                  onClick={async () => {
                    const { error } = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin
                    });
                    if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
                  }}>

                <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
              <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border/60 bg-background/80 hover:bg-background font-semibold"
                  onClick={async () => {
                    const { error } = await lovable.auth.signInWithOAuth("apple", {
                      redirect_uri: window.location.origin
                    });
                    if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
                  }}>

                <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple
              </Button>
            </div>
          </form>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 text-card font-semibold drop-shadow-sm">

            ليس لديك حساب؟{" "}
            <Link to="/signup" className="font-bold hover:underline text-[#d2ac4b]">
              إنشاء حساب جديد
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>);

};

export default Login;