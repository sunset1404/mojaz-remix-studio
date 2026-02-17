import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, BookOpen, Mic } from "lucide-react";
import logoEqraa from "@/assets/logo-eqraa.jpg";

type RoleType = "student" | "reciter";

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
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Assign role
    if (data.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role });

      if (roleError) {
        console.error("Error assigning role:", roleError);
      }
    }

    toast({
      title: "تم إنشاء الحساب بنجاح",
      description: "يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب",
    });
    navigate("/login");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-6">
          <img src={logoEqraa} alt="إقرأ" className="w-20 h-20 rounded-2xl shadow-lg" />
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-2">إنشاء حساب جديد</h1>
        <p className="text-center text-muted-foreground mb-6">انضم إلينا الآن</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-foreground">نوع الحساب</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "student"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <BookOpen className={`w-7 h-7 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-semibold ${role === "student" ? "text-primary" : "text-foreground"}`}>
                  طالب
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("reciter")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "reciter"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <Mic className={`w-7 h-7 ${role === "reciter" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-semibold ${role === "reciter" ? "text-primary" : "text-foreground"}`}>
                  مقرئ
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground">الاسم الكامل</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="fullName"
                placeholder="أدخل اسمك الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pr-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10 text-left"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="6 أحرف على الأقل"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10 text-left"
                dir="ltr"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground h-12 text-base font-semibold rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" />
            ) : (
              <>
                <UserPlus className="w-5 h-5 ml-2" />
                إنشاء الحساب
              </>
            )}
          </Button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
