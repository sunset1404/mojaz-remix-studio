import { motion } from "framer-motion";
import { BookOpen, Star, Calendar, Trophy, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

const promoSlides = [
  { title: "خصم 50% على الاشتراك السنوي", desc: "اغتنم الفرصة واشترك الآن بنصف السعر", emoji: "🎉", bg: "from-primary to-primary/80" },
  { title: "ميزة جديدة: التسميع الصوتي", desc: "سجّل تلاوتك واحصل على تقييم فوري", emoji: "🎙️", bg: "from-gold to-gold/80" },
  { title: "تحدّي الأسبوع: احفظ سورة الملك", desc: "شارك في التحدي واربح نجوم إضافية", emoji: "🏆", bg: "from-primary to-turquoise-dark" },
];

const quickStats = [
  { label: "أجزاء محفوظة", value: "5", icon: BookOpen, color: "primary" },
  { label: "نجوم مكتسبة", value: "128", icon: Star, color: "gold" },
  { label: "أيام متتالية", value: "14", icon: Calendar, color: "primary" },
  { label: "إنجازات", value: "8", icon: Trophy, color: "gold" },
];

const features = [
  { title: "المقرئون", desc: "اختر مقرئك المفضل", icon: "🎙️", path: "/reciters" },
  { title: "خطتي الأسبوعية", desc: "تابع تقدمك اليومي", icon: "📅", path: "/weekly-plan" },
  { title: "إنجازاتي", desc: "شاهد تقدمك", icon: "🏆", path: "/achievements" },
  { title: "الاشتراكات", desc: "اكتشف الباقات", icon: "💎", path: "/subscription" },
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-primary px-6 pt-10 pb-7 rounded-b-[2.5rem] relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-2 border-primary-foreground/30 animate-float" />
          <div className="absolute bottom-8 left-8 w-20 h-20 rounded-full border border-primary-foreground/20 animate-float" style={{ animationDelay: "1s" }} />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <h1 className="text-3xl font-bold text-primary-foreground font-cairo mb-1">
            مرحباً بك 👋
          </h1>
          <p className="text-primary-foreground/80 text-sm mb-4">واصل رحلتك مع القرآن الكريم</p>

          {/* Promo Carousel */}
          <div className="relative overflow-hidden rounded-2xl h-24">
            {promoSlides.map((slide, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  x: `${(i - currentSlide) * 100}%`,
                  opacity: i === currentSlide ? 1 : 0.5,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
                className={`absolute inset-0 bg-gradient-to-l ${slide.bg} rounded-2xl p-4 flex items-center gap-3 border border-primary-foreground/20`}
              >
                <span className="text-3xl">{slide.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-primary-foreground font-bold text-sm leading-tight">{slide.title}</h3>
                  <p className="text-primary-foreground/80 text-xs mt-1 leading-tight">{slide.desc}</p>
                </div>
              </motion.div>
            ))}
            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {promoSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentSlide ? "bg-primary-foreground w-4" : "bg-primary-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Stats */}
      <div className="px-5 -mt-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-4 gap-2"
        >
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${
                stat.color === "gold" ? "bg-gold/20" : "bg-primary/10"
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === "gold" ? "text-gold" : "text-primary"
                }`} />
              </div>
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Today's Progress */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-3">تقدم اليوم</h2>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">سورة البقرة - الصفحة 15</span>
              <span className="text-sm font-bold text-primary">75%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                className="h-full gradient-primary rounded-full"
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Link
                to="/weekly-plan"
                className="flex-1 gradient-primary text-primary-foreground text-center py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                متابعة الحفظ
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-3">استكشف</h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link
                  to={feature.path}
                  className="glass-card rounded-2xl p-4 flex flex-col gap-2 hover:shadow-xl transition-all group block"
                >
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground self-start mt-auto group-hover:text-primary transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Motivational Banner */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="gradient-gold rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute -top-4 -left-4 w-24 h-24 border-2 border-gold-foreground/30 rounded-full" />
          </div>
          <div className="relative z-10">
            <p className="text-gold-foreground font-bold text-lg mb-1">🌟 لا تنسَ ورد اليوم!</p>
            <p className="text-gold-foreground/80 text-sm">
              "مَن قرأ حرفًا من كتاب الله فله به حسنة، والحسنة بعشر أمثالها"
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
