import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Star, Calendar, Trophy, ChevronLeft, CalendarDays, Mic, Bell, Award, Headphones } from "lucide-react";
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
{ name: "فارس عبّاد", image: reciter5 }];

const promoSlides = [
  { title: "القرآن الكريم", desc: "بمقرئين معتمدين", icon: BookOpen, bg: "gradient-primary", iconBg: "bg-white/20" },
  { title: "شهادات معتمدة", desc: "احصل على شهادات في الحفظ", icon: Award, bg: "gradient-gold", iconBg: "bg-white/30" },
  { title: "تلاوات مميزة", desc: "استمع بأصوات عذبة", icon: Headphones, bg: "gradient-primary", iconBg: "bg-white/20" },
];

const quickStats = [
{ label: "أجزاء محفوظة", value: "5", icon: BookOpen, color: "primary" },
{ label: "نجوم مكتسبة", value: "128", icon: Star, color: "gold" },
{ label: "أيام متتالية", value: "14", icon: Calendar, color: "primary" },
{ label: "إنجازات", value: "8", icon: Trophy, color: "gold" }];

const features = [
{ title: "خطتي الأسبوعية", desc: "تابع تقدمك اليومي", icon: CalendarDays, color: "primary", path: "/weekly-plan" },
{ title: "إنجازاتي", desc: "شاهد تقدمك", icon: Trophy, color: "gold", path: "/achievements" }];

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
      <div className="px-6 pt-10 pb-3">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground font-cairo">
            أهلاً عبدالعزيز 👋
          </h1>
          <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-primary" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gold rounded-full border-2 border-background" />
          </button>
        </motion.div>
      </div>

      {/* Full-width Promo Carousel */}
      <div className="px-5 mb-2">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl"
          style={{ height: '150px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 30 }}
              className={`absolute inset-0 ${promoSlides[currentSlide].bg} rounded-2xl p-6 flex items-center gap-5`}>
              
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-white/5 -translate-x-10 -translate-y-10" />
              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-white/5 translate-x-8 translate-y-8" />
              
              <div className="relative z-10 flex items-center gap-5 w-full">
                <div className={`w-16 h-16 rounded-2xl ${promoSlides[currentSlide].iconBg} flex items-center justify-center shrink-0 shadow-lg`}>
                  {(() => {
                    const Icon = promoSlides[currentSlide].icon;
                    return <Icon className="w-8 h-8 text-primary-foreground" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-primary-foreground leading-tight">{promoSlides[currentSlide].title}</h3>
                  <p className="text-sm mt-1 text-primary-foreground/80">{promoSlides[currentSlide].desc}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {promoSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "bg-primary-foreground w-6" : "bg-primary-foreground/40 w-2"
                }`} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 -mt-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-4 gap-2">

          {quickStats.map((stat, i) =>
          <motion.div
            key={stat.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex flex-col items-center text-center">

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${
            stat.color === "gold" ? "bg-gold/20" : "bg-primary/10"}`
            }>
                <stat.icon className={`w-5 h-5 ${
              stat.color === "gold" ? "text-gold" : "text-primary"}`
              } />
              </div>
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Today's Progress */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}>

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
                className="h-full gradient-primary rounded-full" />

            </div>
            <div className="flex items-center gap-2 mt-4">
              <Link
                to="/weekly-plan"
                className="flex-1 gradient-primary text-primary-foreground text-center py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">

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
          className="glass-card rounded-2xl p-4">

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mic className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-bold text-foreground text-base">المقرئون</h2>
            </div>
            <Link to="/reciters" className="flex items-center gap-1 text-xs text-primary font-semibold">
              المزيد <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {topReciters.map((reciter, i) =>
            <motion.div
              key={reciter.name}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              whileTap={{ scale: 0.95 }}>

                <Link
                to="/reciters"
                className="flex flex-col items-center gap-2 w-[76px] group">

                  <div className="w-[68px] h-[68px] rounded-2xl overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-lg">
                    <img
                    src={reciter.image}
                    alt={reciter.name}
                    className="w-full h-full object-cover" />

                  </div>
                  <span className="text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-2">
                    {reciter.name}
                  </span>
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}>

          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, i) =>
            <motion.div
              key={feature.title}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              whileTap={{ scale: 0.96 }}>

                <Link
                to={feature.path}
                className="glass-card rounded-2xl p-4 flex flex-col gap-2 hover:shadow-xl transition-all group block">

                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                feature.color === "gold" ? "bg-gold/15" : "bg-primary/10"}`
                }>
                    <feature.icon className={`w-5 h-5 ${
                  feature.color === "gold" ? "text-gold" : "text-primary"}`
                  } />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                  
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Subscription Card */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileTap={{ scale: 0.98 }}>

          <Link to="/subscription" className="block">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-turquoise-dark p-5 shadow-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-gold/15 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-gold/10 blur-xl" />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gold text-lg">✦</span>
                    <span className="text-turquoise-dark text-xs font-bold bg-gold px-3 py-1 rounded-full">الباقة الذهبية</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">45 دقيقة متبقية</h3>
                  <p className="text-gray-300 text-xs mt-1">من أصل 120 دقيقة شهرياً</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-full bg-turquoise-dark border-[3px] border-gold flex items-center justify-center shadow-lg">
                    <span className="text-gold font-extrabold text-base">37%</span>
                  </div>
                  <span className="text-white text-[10px] font-medium">متبقي</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

    </div>);

};

export default Index;