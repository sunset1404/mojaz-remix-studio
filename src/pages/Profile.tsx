import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, BookOpen, ChevronLeft, LogOut, Settings, Bell, Moon, Shield, Camera, Award, CalendarDays, Image, X, Headphones, Info, FileText, CreditCard, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";

const menuSections = [
  {
    title: "الحساب",
    icon: User,
    items: [
      { icon: User, label: "البيانات الشخصية", desc: "الاسم، الجوال، البريد", path: "/profile/edit" },
      { icon: Award, label: "الإجازات والشهادات", desc: "إجازاتي وشهاداتي المعتمدة", path: "/certificates" },
      { icon: CalendarDays, label: "خطتي الأسبوعية", desc: "عرض وتعديل خطة الحفظ", path: "/weekly-plan" },
      { icon: CreditCard, label: "المدفوعات والفواتير", desc: "بطاقات الائتمان، سجل الدفعات", path: "/payments" },
      { icon: PhoneCall, label: "سجل الجلسات", desc: "تاريخ جلسات الإقراء والتقييمات", path: "/call-history" },
    ],
  },
  {
    title: "إعدادات التطبيق",
    icon: Settings,
    items: [
      { icon: Bell, label: "الإشعارات", desc: "تخصيص التنبيهات" },
      { icon: Moon, label: "المظهر", desc: "فاتح / داكن" },
      { icon: BookOpen, label: "سجل الجلسات", desc: "تاريخ جلسات الإقراء" },
      { icon: Settings, label: "إعدادات التطبيق", desc: "الصوت، التخزين" },
      { icon: Shield, label: "الخصوصية والأمان", desc: "كلمة المرور، الجلسات" },
    ],
  },
  {
    title: "الدعم والمساعدة",
    icon: Headphones,
    items: [
      { icon: Headphones, label: "تواصل معنا", desc: "الدعم الفني والاستفسارات" },
      { icon: Info, label: "عن التطبيق", desc: "الإصدار ١.٠.٠" },
      { icon: FileText, label: "سياسة الخصوصية", desc: "الشروط والأحكام" },
    ],
  },
];

const Profile = () => {
  let itemIndex = 0;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    setShowImageOptions(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Image Options Modal */}
      <AnimatePresence>
        {showImageOptions && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowImageOptions(false)}
          >
            <motion.div
              initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-md bg-card rounded-t-2xl p-5 pb-24 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2" dir="rtl">
                <h3 className="text-base font-bold text-foreground">تغيير الصورة الشخصية</h3>
                <button onClick={() => setShowImageOptions(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all"
                dir="rtl"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground text-sm">التقاط صورة بالكاميرا</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all"
                dir="rtl"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground text-sm">اختيار صورة من المعرض</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-5 rounded-b-[2.5rem] text-center relative">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="relative mx-auto w-24 h-24 mb-3">
            <div className="w-24 h-24 rounded-full bg-primary-foreground/20 backdrop-blur-sm border-4 border-primary-foreground/30 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="صورة شخصية" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary-foreground/60" />
              )}
            </div>
            <button onClick={() => setShowImageOptions(true)} className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-lg border-2 border-primary-foreground">
              <Camera className="w-4 h-4 text-gold-foreground" />
            </button>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">عبدالله محمد</h1>
          <p className="text-primary-foreground/70 text-sm">طالب · المستوى 4</p>
        </motion.div>
      </div>


      {/* Menu Sections */}
      <div className="px-5 mt-6 space-y-5">
        {menuSections.map((section, sIdx) => (
          <div key={section.title} className="animate-fade-in" style={{ animationDelay: `${sIdx * 80}ms`, animationFillMode: 'both' }}>
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-2.5 px-1" dir="rtl">
              <section.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{section.title}</span>
            </div>
            {/* Section Items */}
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
              {section.items.map((item) => {
                const idx = itemIndex++;
                const inner = (
                  <div
                    key={item.label}
                    className="p-4 flex items-center gap-3 w-full hover:bg-muted/30 transition-all active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-foreground text-sm">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </div>
                );

                return item.path ? (
                  <Link key={item.label} to={item.path} className="block">
                    {inner}
                  </Link>
                ) : (
                  <button key={item.label} className="w-full">
                    {inner}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button
          className="rounded-xl p-4 flex items-center gap-3 w-full border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 active:scale-[0.98] transition-all mt-4"
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

export default Profile;
