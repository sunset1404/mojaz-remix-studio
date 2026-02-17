import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Colored top section with wave */}
      <div className="relative w-full" style={{ minHeight: "42vh" }}>
        {/* Main gradient background */}
        <div className="absolute inset-0 gradient-primary" />
        
        {/* Decorative circles */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.15 }}
          transition={{ duration: 1.2 }}
          className="absolute top-8 right-8 w-32 h-32 rounded-full border-2 border-primary-foreground/30"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute -top-10 -left-10 w-48 h-48 rounded-full border-2 border-primary-foreground/20"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.08 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="absolute bottom-16 left-6 w-20 h-20 rounded-full bg-primary-foreground/20"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.06 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute top-20 left-1/2 w-16 h-16 rounded-full bg-primary-foreground/15"
        />

        {/* Gold accent dots */}
        <div className="absolute top-14 right-20 w-3 h-3 rounded-full bg-gold/40" />
        <div className="absolute top-28 left-14 w-2 h-2 rounded-full bg-gold/50" />
        <div className="absolute bottom-24 right-12 w-2.5 h-2.5 rounded-full bg-gold/35" />

        {/* Floating decorative lines */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.12, x: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute top-24 right-4 w-12 h-0.5 bg-primary-foreground/30 rounded-full rotate-45"
        />
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.1, x: 0 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="absolute bottom-28 left-10 w-8 h-0.5 bg-primary-foreground/25 rounded-full -rotate-30"
        />

        {/* Logo and title */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-12 pb-20">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 150 }}
            className="mb-4"
          >
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-1 bg-card/90 backdrop-blur-sm">
              <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-2xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-bold text-primary-foreground font-cairo"
          >
            تسجيل الدخول
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-primary-foreground/70 text-sm mt-1"
          >
            مرحباً بعودتك
          </motion.p>
        </div>

        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path
              d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </div>

      {/* Form section */}
      <div className="flex-1 flex flex-col items-center px-6 -mt-4 relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-sm"
        >
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
                  required
                />
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
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground h-13 text-base font-bold rounded-2xl shadow-md hover:shadow-lg transition-shadow mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 ml-2" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 text-foreground/50"
          >
            ليس لديك حساب؟{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              إنشاء حساب جديد
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
