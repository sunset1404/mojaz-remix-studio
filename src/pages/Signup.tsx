import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Mic } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";

const roles = [
{ value: "student", label: "طالب", desc: "تعلّم وتلاوة القرآن", icon: BookOpen, path: "/signup/student" },
{ value: "reciter", label: "مقرئ", desc: "تعليم وإجازة الطلاب", icon: Mic, path: "/signup/reciter" }];


const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
    style={{ background: "linear-gradient(170deg, hsl(174 42% 28%) 0%, hsl(174 42% 35%) 30%, hsl(174 38% 40%) 55%, hsl(174 35% 38%) 80%, hsl(174 30% 32%) 100%)" }}>

      {/* Subtle gold glow overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 85%, hsl(43 50% 50% / 0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 30% 50%, hsl(43 50% 50% / 0.12) 0%, transparent 60%)" }} />
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }} transition={{ duration: 1.2 }}
        className="absolute top-12 right-6 w-40 h-40 rounded-full border-2 border-primary-foreground/20" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }} transition={{ duration: 1.2, delay: 0.2 }}
        className="absolute -top-12 -left-12 w-56 h-56 rounded-full border-2 border-primary-foreground/15" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.06 }} transition={{ duration: 1, delay: 0.4 }}
        className="absolute bottom-20 right-4 w-28 h-28 rounded-full bg-gold/15 blur-xl" />
        <div className="absolute top-16 right-24 w-3 h-3 rounded-full bg-gold/40" />
        <div className="absolute top-32 left-10 w-2 h-2 rounded-full bg-gold/50" />
      </div>

      {/* Logo and title */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-8">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 150 }} className="mb-4">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-1 bg-card/90 backdrop-blur-sm">
            <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-2xl" />
          </div>
        </motion.div>
        <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-2xl font-bold font-cairo text-[#d2ac4b]">إنشاء حساب جديد</motion.h1>
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-primary-foreground/70 text-sm mt-1">اختر نوع الحساب للمتابعة</motion.p>
      </div>

      {/* Role selection */}
      <div className="flex-1 flex flex-col items-center px-6 relative z-10 pb-8">
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }}
        className="w-full max-w-sm">
          <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-primary-foreground/10">
            <p className="text-foreground text-sm font-semibold text-center mb-4">نوع الحساب</p>
            <div className="grid grid-cols-2 gap-4">
              {roles.map((r) =>
              <motion.button key={r.value} type="button" whileTap={{ scale: 0.96 }}
              onClick={() => navigate(r.path)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-border/60 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted/20">
                    <r.icon className="w-6 h-6 text-[#cca33e]" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{r.label}</span>
                  <span className="text-[10px] leading-tight text-foreground/40">{r.desc}</span>
                </motion.button>
              )}
            </div>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center mt-6 text-card font-semibold drop-shadow-sm">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="font-bold hover:underline text-[#d2ac4b]">تسجيل الدخول</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>);

};

export default Signup;