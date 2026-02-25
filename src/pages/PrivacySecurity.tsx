import { ChevronRight, Shield, Lock, Smartphone, Eye, EyeOff, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PrivacySecurity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [biometric, setBiometric] = useState(() => {
    return localStorage.getItem("biometric_enabled") === "true";
  });

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: "ضعيفة", color: "bg-destructive" };
    if (score <= 2) return { level: 2, label: "مقبولة", color: "bg-orange-400" };
    if (score <= 3) return { level: 3, label: "جيدة", color: "bg-yellow-400" };
    if (score <= 4) return { level: 4, label: "قوية", color: "bg-emerald-400" };
    return { level: 5, label: "ممتازة", color: "bg-emerald-500" };
  };

  const handleBiometricToggle = () => {
    const newVal = !biometric;
    setBiometric(newVal);
    localStorage.setItem("biometric_enabled", String(newVal));
    toast({
      title: newVal ? "تم التفعيل" : "تم الإيقاف",
      description: newVal ? "سيتم استخدام البصمة لتسجيل الدخول" : "تم إيقاف تسجيل الدخول بالبصمة",
    });
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة غير متطابقة", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم تغيير كلمة المرور بنجاح" });
      setShowPasswordForm(false);
      
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-5 rounded-b-[2.5rem] text-center relative">
        <Link to="/profile" className="absolute right-4 top-8">
          <ChevronRight className="w-6 h-6 text-primary-foreground" />
        </Link>
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl font-bold text-primary-foreground">الخصوصية والأمان</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">كلمة المرور والبصمة</p>
      </div>

      <div className="px-5 mt-6 space-y-3">
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
          {/* Change Password */}
          <div className="animate-fade-in" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="p-4 flex items-center gap-3 w-full"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-foreground text-sm">تغيير كلمة المرور</p>
                <p className="text-[10px] text-muted-foreground">تحديث كلمة المرور الحالية</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showPasswordForm ? "rotate-90" : "rotate-180"}`} />
            </button>

            {showPasswordForm && (
              <div className="px-4 pb-4 space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="كلمة المرور الجديدة"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-12 text-left"
                    dir="ltr"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                {newPassword && (() => {
                  const strength = getPasswordStrength(newPassword);
                  return (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : "bg-muted/30"}`} />
                        ))}
                      </div>
                      <p className={`text-[11px] font-semibold text-right ${strength.level <= 1 ? "text-destructive" : strength.level <= 2 ? "text-orange-400" : strength.level <= 3 ? "text-yellow-500" : "text-emerald-500"}`}>
                        {strength.label}
                      </p>
                    </div>
                  );
                })()}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="تأكيد كلمة المرور الجديدة"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 text-left"
                    dir="ltr"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full">
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  تغيير كلمة المرور
                </Button>
              </div>
            )}
          </div>

          {/* Biometric Login */}
          <div
            className="p-4 flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: "40ms", animationFillMode: "both" }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">تسجيل الدخول بالبصمة</p>
              <p className="text-[10px] text-muted-foreground">استخدام بصمة الإصبع أو الوجه</p>
            </div>
            <button
              onClick={handleBiometricToggle}
              className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                biometric ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-primary-foreground shadow-sm transition-all duration-300 ${
                  biometric ? "right-1" : "right-6"
                }`}
              />
            </button>
          </div>
        </div>

          {/* Privacy Policy */}
          <Link
            to="/privacy-policy"
            className="glass-card rounded-2xl p-4 flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: "80ms", animationFillMode: "both" }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">سياسة الخصوصية</p>
              <p className="text-[10px] text-muted-foreground">الشروط والأحكام</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </Link>
      </div>
    </div>
  );
};

export default PrivacySecurity;
