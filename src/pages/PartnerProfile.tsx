import { motion } from "framer-motion";
import { User, LogOut, Building2, Phone, Wallet, Settings, Shield, Bell, Headphones, Info, FileText, Share2, Star, ChevronLeft, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PartnerProfile = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (!user) return;
    supabase.from("partner_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  const menuItems = [
    { icon: Bell, label: "الإشعارات", path: "/notifications" },
    { icon: Shield, label: "الخصوصية والأمان", path: "/privacy-security" },
    { icon: Headphones, label: "تواصل معنا", path: "/contact-us" },
    { icon: Info, label: "عن التطبيق", path: "/about" },
    { icon: FileText, label: "سياسة الخصوصية", path: "/privacy-policy" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-5 rounded-b-[2.5rem] text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-24 h-24 rounded-full bg-primary-foreground/20 backdrop-blur-sm border-4 border-primary-foreground/30 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-10 h-10 text-primary-foreground/60" />
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">{profile?.full_name || "..."}</h1>
          <p className="text-primary-foreground/70 text-sm">شريك داعم</p>
          {profile?.organization_name && (
            <p className="text-primary-foreground/60 text-xs mt-1">{profile.organization_name}</p>
          )}
        </motion.div>
      </div>

      {/* Info Cards */}
      <div className="px-5 mt-5 space-y-3">
        {profile?.phone && (
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">رقم الجوال</p>
              <p className="font-semibold text-foreground text-sm">{profile.phone}</p>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">إجمالي الدعم</p>
            <p className="font-semibold text-foreground text-sm">{Number(profile?.total_support_amount || 0).toLocaleString()} ريال</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-5 mt-5">
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
          {/* Theme toggle */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {isDark ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-gold" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">المظهر</p>
              <p className="text-[10px] text-foreground/50">{isDark ? "داكن" : "فاتح"}</p>
            </div>
            <button onClick={toggleTheme} className={`w-12 h-7 rounded-full transition-all duration-300 relative ${isDark ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-primary-foreground shadow-sm transition-all duration-300 ${isDark ? "right-1" : "right-6"}`} />
            </button>
          </div>

          {menuItems.map((item) => (
            <Link key={item.label} to={item.path} className="block">
              <div className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-all active:scale-[0.98]">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-5 mt-5">
        <button
          onClick={async () => { await signOut(); navigate("/login"); }}
          className="rounded-xl p-4 flex items-center gap-3 w-full border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <p className="font-semibold text-destructive text-sm">تسجيل الخروج</p>
        </button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-6">الإصدار 1.0.0</p>
    </div>
  );
};

export default PartnerProfile;
