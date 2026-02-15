import { motion } from "framer-motion";
import { BookOpen, Star, Calendar, Trophy, ChevronLeft, ChevronLeft as ChevronMore } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import reciter1 from "@/assets/reciters/reciter1.jpg";
import reciter2 from "@/assets/reciters/reciter2.jpg";
import reciter3 from "@/assets/reciters/reciter3.jpg";
import reciter4 from "@/assets/reciters/reciter4.jpg";
import reciter5 from "@/assets/reciters/reciter5.jpg";

const topReciters = [
  { name: "أحمد العجمي", image: reciter1 },
  { name: "ماهر المعيقلي", image: reciter2 },
  { name: "عبدالرحمن السديس", image: reciter3 },
  { name: "سعد الغامدي", image: reciter4 },
  { name: "فارس عبّاد", image: reciter5 },
];

const promoSlides = [
  { title: "خصم 50% على الاشتراك السنوي", desc: "اغتنم الفرصة واشترك الآن بنصف السعر", emoji: "🎉", bg: "from-primary to-primary/80", dark: false },
  { title: "ميزة جديدة: التسميع الصوتي", desc: "سجّل تلاوتك واحصل على تقييم فوري", emoji: "🎙️", bg: "from-beige to-beige-dark", dark: true },
  { title: "تحدّي الأسبوع: احفظ سورة الملك", desc: "شارك في التحدي واربح نجوم إضافية", emoji: "🏆", bg: "from-primary to-turquoise-dark", dark: false },
];

const quickStats = [
  { label: "أجزاء محفوظة", value: "5", icon: BookOpen, color: "primary" },
  { label: "نجوم مكتسبة", value: "128", icon: Star, color: "gold" },
  { label: "أيام متتالية", value: "14", icon: Calendar, color: "primary" },
  { label: "إنجازات", value: "8", icon: Trophy, color: "gold" },
];

const features = [
  { title: "خطتي الأسبوعية", desc: "تابع تقدمك اليومي", icon: "📅", path: "/weekly-plan" },
  { title: "إنجازاتي", desc: "شاهد تقدمك", icon: "🏆", path: "/achievements" },
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
                className={`absolute inset-0 bg-gradient-to-l ${slide.bg} rounded-2xl p-4 flex items-center gap-3 border ${slide.dark ? "border-beige-dark/30" : "border-primary-foreground/20"}`}
              >
                <span className="text-3xl">{slide.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm leading-tight ${slide.dark ? "text-foreground" : "text-primary-foreground"}`}>{slide.title}</h3>
                  <p className={`text-xs mt-1 leading-tight ${slide.dark ? "text-muted-foreground" : "text-primary-foreground/80"}`}>{slide.desc}</p>
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

      {/* Reciters Section */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="rounded-2xl bg-primary/5 border border-primary/10 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground text-base">🎙️ المقرئون</h2>
            <Link to="/reciters" className="flex items-center gap-1 text-xs text-primary font-semibold">
              المزيد <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {topReciters.map((reciter, i) => (
              <motion.div
                key={reciter.name}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/reciters"
                  className="flex flex-col items-center gap-2 w-[76px] group"
                >
                  <div className="w-[68px] h-[68px] rounded-2xl overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-lg">
                    <img
                      src={reciter.image}
                      alt={reciter.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-2">
                    {reciter.name}
                  </span>
                </Link>
              </motion.div>
            ))}
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

      {/* Subscription Card */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link to="/subscription" className="block">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-l from-primary via-primary/90 to-turquoise-dark p-5 shadow-lg">
              {/* Decorative beige accents */}
              <div className="absolute top-3 left-3 w-20 h-20 rounded-full bg-beige/10 blur-xl" />
              <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full bg-beige/8 blur-2xl" />
              <div className="absolute top-1/2 left-1/4 w-12 h-12 rounded-full bg-gold/10 blur-lg" />
              <div className="absolute top-3 left-3 w-16 h-16 rounded-full border border-beige/15 opacity-40" />
              <div className="absolute bottom-2 left-10 w-8 h-8 rounded-full border border-beige/10 opacity-25" />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">💎</span>
                    <span className="text-foreground text-xs font-medium bg-beige px-2.5 py-1 rounded-full border border-gold/20 shadow-sm">الباقة الذهبية</span>
                  </div>
                  <h3 className="text-primary-foreground font-bold text-lg mt-2">45 دقيقة متبقية</h3>
                  <p className="text-beige text-xs mt-1">من أصل 120 دقيقة شهرياً</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 rounded-full border-[3px] border-beige/40 flex items-center justify-center bg-beige/10">
                    <span className="text-beige font-bold text-sm">37%</span>
                  </div>
                  <span className="text-beige/70 text-[10px]">متبقي</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

    </div>
  );
};

export default Index;
