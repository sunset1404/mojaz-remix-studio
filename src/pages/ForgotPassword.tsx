import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const emailValue = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
      redirectTo: `${window.location.origin}/reset-password?email=${encodeURIComponent(emailValue)}`,
    });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      setLoading(false);
    } else {
      toast({ title: "تم الإرسال", description: "أرسلنا رمز التحقق إلى بريدك" });
      navigate(`/reset-password?email=${encodeURIComponent(emailValue)}`);
    }
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
          className="text-2xl font-bold text-primary-foreground font-cairo">استعادة كلمة المرور</motion.h1>
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
          className="text-primary-foreground/70 text-sm mt-1">أدخل بريدك الإلكتروني لإرسال رمز التحقق</motion.p>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 relative z-10">
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-sm">
          <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-primary-foreground/10">
            <form onSubmit={handleSubmit} className="space-y-5">
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
              <Button type="submit" className="w-full gradient-primary text-primary-foreground h-13 text-base font-bold rounded-2xl shadow-md" disabled={loading}>
                {loading ? <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" /> : "إرسال رمز التحقق"}
              </Button>
            </form>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-center mt-8 text-card font-semibold drop-shadow-sm">
            <Link to="/login" className="text-primary-foreground font-bold hover:underline flex items-center justify-center gap-1">
              <ArrowRight className="w-4 h-4" /> العودة لتسجيل الدخول
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
