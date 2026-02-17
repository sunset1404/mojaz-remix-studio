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
      {/* Decorative background */}
      <div className="absolute top-0 left-0 right-0 h-72 gradient-primary opacity-[0.07] rounded-b-[60px]" />
      <div className="absolute top-10 -left-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-32 -right-16 w-32 h-32 rounded-full bg-gold/10 blur-2xl" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-lg border-2 border-primary/20 p-1 bg-card">
              <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-2xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-center text-foreground mb-1 font-cairo">مرحباً بعودتك</h1>
            <p className="text-center text-foreground/50 font-normal mb-8">سجّل دخولك للمتابعة</p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-3xl p-6 shadow-sm"
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
                    className="pr-14 text-left h-12 rounded-xl border-border/60 bg-background/60 focus:bg-background transition-colors"
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
                    className="pr-14 pl-12 text-left h-12 rounded-xl border-border/60 bg-background/60 focus:bg-background transition-colors"
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
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 text-foreground/50"
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
