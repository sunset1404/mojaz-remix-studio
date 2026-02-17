import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, BookOpen, Mic, Star, Moon } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

type RoleType = "student" | "reciter";

const FloatingIcon = ({ icon: Icon, className, delay }: { icon: any; className: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 0.12, y: 0 }}
    transition={{ delay, duration: 1.5, ease: "easeOut" }}
    className={`absolute ${className}`}
  >
    <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut" }}>
      <Icon className="w-full h-full text-primary" />
    </motion.div>
  </motion.div>
);

const Signup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<RoleType>("student");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "كلمة المرور قصيرة", description: "يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role });
    }
    toast({ title: "تم إنشاء الحساب بنجاح", description: "يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب" });
    navigate("/login");
    setLoading(false);
  };

  const roles = [
    { value: "student" as RoleType, label: "طالب", desc: "تعلّم وتلاوة القرآن", icon: BookOpen },
    { value: "reciter" as RoleType, label: "مقرئ", desc: "تعليم وإجازة الطلاب", icon: Mic },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Rich decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 -right-20 h-[45%] rounded-b-[80px]"
          style={{ background: "linear-gradient(160deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--turquoise-dark) / 0.08) 40%, hsl(var(--gold) / 0.06) 100%)" }}
        />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }}
          className="absolute top-16 -right-12 w-56 h-56 rounded-full border-2 border-primary/10" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.1 }}
          className="absolute -top-8 -left-16 w-48 h-48 rounded-full border-2 border-gold/10" />
        <div className="absolute top-12 left-8 w-24 h-24 rounded-full bg-primary/8 blur-2xl" />
        <div className="absolute top-40 right-4 w-20 h-20 rounded-full bg-gold/10 blur-2xl" />
        <div className="absolute bottom-32 left-12 w-16 h-16 rounded-full bg-primary/5 blur-xl" />
        <FloatingIcon icon={Star} className="top-20 left-6 w-6 h-6" delay={0.3} />
        <FloatingIcon icon={BookOpen} className="top-14 right-16 w-7 h-7" delay={0.6} />
        <FloatingIcon icon={Moon} className="top-36 left-16 w-5 h-5" delay={0.9} />
        <div className="absolute top-8 left-0 right-0 h-60 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-sm">
          {/* Logo */}
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 150 }} className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg border-2 border-primary/20 p-1 bg-card">
                <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-2xl" />
              </div>
              <div className="absolute -inset-4 rounded-[28px] bg-primary/8 blur-xl -z-10" />
            </div>
          </motion.div>

          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-2xl font-bold text-center text-foreground mb-1 font-cairo">إنشاء حساب جديد</h1>
            <p className="text-center text-foreground/50 font-normal mb-6">انضم إلينا الآن</p>
          </motion.div>

          {/* Form Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 -translate-y-12 translate-x-12" />
            <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-gold/5 translate-y-8 -translate-x-8" />

            <form onSubmit={handleSignup} className="space-y-4 relative z-10">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-foreground text-sm font-semibold">نوع الحساب</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => (
                    <motion.button key={r.value} type="button" whileTap={{ scale: 0.96 }}
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${
                        role === r.value ? "border-primary bg-primary/10 shadow-sm" : "border-border/60 bg-background/60 hover:border-primary/30"
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === r.value ? "bg-primary/15" : "bg-muted/20"}`}>
                        <r.icon className={`w-5 h-5 ${role === r.value ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <span className={`text-sm font-bold ${role === r.value ? "text-primary" : "text-foreground"}`}>{r.label}</span>
                      <span className={`text-[10px] leading-tight ${role === r.value ? "text-primary/70" : "text-foreground/40"}`}>{r.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground text-sm font-semibold">الاسم الكامل</Label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                    <User className="w-4 h-4 text-gold" />
                  </div>
                  <Input id="fullName" placeholder="أدخل اسمك الكامل" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pr-14 h-12 rounded-xl border-border/60 bg-background/60 focus:bg-background transition-colors" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-semibold">البريد الإلكتروني</Label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <Input id="email" type="email" placeholder="example@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-14 text-left h-12 rounded-xl border-border/60 bg-background/60 focus:bg-background transition-colors" dir="ltr" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground text-sm font-semibold">كلمة المرور</Label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-gold" />
                  </div>
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="6 أحرف على الأقل"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pr-14 pl-12 text-left h-12 rounded-xl border-border/60 bg-background/60 focus:bg-background transition-colors" dir="ltr" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <Button type="submit"
                className="w-full gradient-primary text-primary-foreground h-13 text-base font-bold rounded-2xl shadow-md hover:shadow-lg transition-shadow mt-1"
                disabled={loading}>
                {loading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" />
                ) : (
                  <><UserPlus className="w-5 h-5 ml-2" />إنشاء الحساب</>
                )}
              </Button>
            </form>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center mt-6 text-foreground/50">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">تسجيل الدخول</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
