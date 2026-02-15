import { motion } from "framer-motion";
import { User, Phone, Mail, MapPin, BookOpen, Award, Calendar, ChevronLeft, LogOut, Settings, Bell, Moon, Shield, Camera, GraduationCap } from "lucide-react";

const personalInfo = [
  { icon: Phone, label: "رقم الجوال", value: "+966 50 123 4567" },
  { icon: Mail, label: "البريد الإلكتروني", value: "abdullah@email.com" },
  { icon: MapPin, label: "المدينة", value: "الرياض، المملكة العربية السعودية" },
  { icon: Calendar, label: "تاريخ الانضمام", value: "15 رمضان 1445 هـ" },
];

const ijazat = [
  { title: "إجازة في رواية حفص عن عاصم", sheikh: "الشيخ أحمد العجمي", date: "1444 هـ", status: "معتمدة" },
  { title: "إجازة في رواية ورش عن نافع", sheikh: "الشيخ ماهر المعيقلي", date: "1445 هـ", status: "قيد الإتمام" },
];

const menuItems = [
  { icon: Bell, label: "الإشعارات", desc: "تخصيص التنبيهات" },
  { icon: Moon, label: "المظهر", desc: "فاتح / داكن" },
  { icon: Shield, label: "الخصوصية والأمان", desc: "كلمة المرور، الجلسات" },
  { icon: BookOpen, label: "سجل الجلسات", desc: "تاريخ جلسات الإقراء" },
  { icon: Settings, label: "إعدادات التطبيق", desc: "الصوت، التخزين" },
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-14 rounded-b-[2.5rem] text-center relative">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="relative mx-auto w-24 h-24 mb-3">
            <div className="w-24 h-24 rounded-full bg-primary-foreground/20 backdrop-blur-sm border-4 border-primary-foreground/30 flex items-center justify-center overflow-hidden">
              <User className="w-10 h-10 text-primary-foreground/60" />
            </div>
            <button className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-lg border-2 border-primary-foreground">
              <Camera className="w-4 h-4 text-gold-foreground" />
            </button>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">عبدالله محمد</h1>
          <p className="text-primary-foreground/70 text-sm">طالب · المستوى 4</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="bg-primary-foreground/15 px-3 py-1 rounded-full">
              <span className="text-primary-foreground text-xs">🔥 14 يوم متتالي</span>
            </div>
            <div className="bg-primary-foreground/15 px-3 py-1 rounded-full">
              <span className="text-primary-foreground text-xs">⭐ 128 نجمة</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 -mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-3 gap-2 text-center"
        >
          <div>
            <p className="text-2xl font-bold text-primary">5</p>
            <p className="text-[10px] text-muted-foreground">أجزاء محفوظة</p>
          </div>
          <div className="border-x border-border">
            <p className="text-2xl font-bold text-gold">48</p>
            <p className="text-[10px] text-muted-foreground">ساعة إقراء</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">4</p>
            <p className="text-[10px] text-muted-foreground">شهادات</p>
          </div>
        </motion.div>
      </div>

      {/* Personal Info */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            البيانات الشخصية
          </h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            {personalInfo.map((info, i) => (
              <motion.div
                key={info.label}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className={`flex items-center gap-3 p-4 ${i < personalInfo.length - 1 ? "border-b border-border/50" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <info.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">{info.label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{info.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Ijazat (Certifications) */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-gold" />
            </div>
            الإجازات القرآنية
          </h2>
          <div className="space-y-3">
            {ijazat.map((ij, i) => (
              <motion.div
                key={ij.title}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm">{ij.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">على يد {ij.sheikh}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ij.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    ij.status === "معتمدة" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-gold/15 text-gold"
                  }`}>
                    {ij.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Settings Menu */}
      <div className="px-5 mt-6 space-y-2">
        <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          الإعدادات
        </h2>
        {menuItems.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card rounded-xl p-4 flex items-center gap-3 w-full hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold text-foreground text-sm">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}

        {/* Logout */}
        <motion.button
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl p-4 flex items-center gap-3 w-full border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all mt-4"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <p className="font-semibold text-destructive text-sm">تسجيل الخروج</p>
        </motion.button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-6">الإصدار 1.0.0</p>
    </div>
  );
};

export default Profile;
