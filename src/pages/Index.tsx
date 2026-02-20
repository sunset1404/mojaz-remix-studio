import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Star, Calendar, Trophy, ChevronLeft, CalendarDays, Mic, Bell, Award, Headphones, Phone, Video, User, Gift } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import reciter1 from "@/assets/reciters/reciter1.jpg";
import reciter2 from "@/assets/reciters/reciter2.jpg";
import reciter3 from "@/assets/reciters/reciter3.jpg";
import reciter4 from "@/assets/reciters/reciter4.jpg";
import reciter5 from "@/assets/reciters/reciter5.jpg";

const topReciters = [
{ name: "أحمد العجمي", image: reciter1, rating: 4.9, online: true },
{ name: "ماهر المعيقلي", image: reciter2, rating: 4.8, online: true },
{ name: "عبدالرحمن السديس", image: reciter3, rating: 5.0, online: false },
{ name: "سعد الغامدي", image: reciter4, rating: 4.9, online: true },
{ name: "فارس عبّاد", image: reciter5, rating: 4.6, online: false }];

const promoSlides = [
{ title: "القرآن الكريم", desc: "بمقرئين معتمدين", icon: BookOpen, bg: "gradient-primary", iconBg: "bg-gold/20", iconColor: "text-gold" },
{ title: "شهادات معتمدة", desc: "احصل على شهادات في الحفظ", icon: Award, bg: "gradient-gold", iconBg: "bg-primary/20", iconColor: "text-primary" },
{ title: "تلاوات مميزة", desc: "استمع بأصوات عذبة", icon: Headphones, bg: "gradient-primary", iconBg: "bg-gold/20", iconColor: "text-gold" }];


const quickStats = [
{ label: "أجزاء محفوظة", value: "5", icon: BookOpen, color: "primary" },
{ label: "نجوم مكتسبة", value: "128", icon: Star, color: "gold" },
{ label: "أيام متتالية", value: "14", icon: Calendar, color: "primary" },
{ label: "إنجازات", value: "8", icon: Trophy, color: "gold" }];

const features = [
{ title: "خطتي الأسبوعية", desc: "تابع تقدمك اليومي", icon: CalendarDays, color: "primary", path: "/weekly-plan" },
{ title: "إنجازاتي", desc: "شاهد تقدمك", icon: Trophy, color: "gold", path: "/achievements" }];

const Index = () => {
  const { user, avatarUrl } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("student_profiles").select("full_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) {
          setUserName(data.full_name);
        } else {
          // Fallback to profiles table if student_profiles not found
          supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
            .then(({ data: p }) => { if (p?.full_name) setUserName(p.full_name); });
        }
      });
  }, [user]);

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
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-primary/20 bg-muted flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="صورة المستخدم" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground font-cairo">
              أهلاً {userName || "بك"} 👋
            </h1>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative"
          >
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
                    return <Icon className={`w-8 h-8 ${promoSlides[currentSlide].iconColor}`} />;
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
            {promoSlides.map((_, i) =>
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlide ? "bg-primary-foreground w-6" : "bg-primary-foreground/40 w-2"}`
              } />
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 -mt-5 py-[19px]">
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

      {/* Study Plan Card */}
      <div className="px-5 mt-3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}>
          <Link to="/weekly-plan" className="block">
            <div className="relative rounded-2xl overflow-hidden gradient-primary p-5 shadow-lg">
              <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-primary-foreground">خطتي الدراسية</h3>
                  <p className="text-sm text-primary-foreground/75 mt-0.5">نظّم جلسات القراءة وتابع تقدمك</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-primary-foreground/60 shrink-0" />
              </div>
            </div>
          </Link>
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
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {topReciters.map((reciter, i) =>
            <motion.div
              key={reciter.name}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              whileTap={{ scale: 0.97 }}>

                <div className="flex flex-col items-center gap-2.5 w-[130px] bg-card rounded-2xl p-4 border border-border/50 shadow-sm">

                  <Link to="/reciters" className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-[72px] h-[72px] rounded-full overflow-hidden ring-2 ring-primary/20 shadow-md">
                        <img
                        src={reciter.image}
                        alt={reciter.name}
                        className="w-full h-full object-cover" />
                      </div>
                      <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[2.5px] border-card ${reciter.online ? "bg-green-500" : "bg-destructive"}`} />
                    </div>
                    <span className="text-xs font-semibold text-foreground text-center leading-tight line-clamp-1">
                      {reciter.name}
                    </span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-gold fill-current" />
                    <span className="text-xs font-bold text-foreground">{reciter.rating}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all">
                      <Video className="w-4.5 h-4.5 text-primary" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all">
                      <Phone className="w-4.5 h-4.5 text-primary" />
                    </button>
                  </div>
                </div>
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
            <div className="relative rounded-2xl overflow-hidden gradient-primary p-5 shadow-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gold text-lg">✦</span>
                    <span className="text-primary-foreground text-xs font-bold bg-gold/20 px-3 py-1 rounded-full">الباقة الذهبية</span>
                  </div>
                  <h3 className="text-primary-foreground font-bold text-lg">45 دقيقة متبقية</h3>
                  <p className="text-primary-foreground/70 text-xs mt-1">من أصل 120 دقيقة شهرياً</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-full bg-gold/20 border-[3px] border-gold/40 flex items-center justify-center shadow-lg">
                    <span className="text-primary-foreground font-extrabold text-base">37%</span>
                  </div>
                  <span className="text-primary-foreground/80 text-[10px] font-medium">متبقي</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Gift Subscription Card */}
      <div className="px-5 mt-5 mb-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          whileTap={{ scale: 0.98 }}>
          <Link to="/gift" className="block">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[hsl(43,74%,49%)] to-[hsl(43,74%,38%)] p-5 shadow-xl">
              <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">أهدِ القرآن لمن تحب</h3>
                  <p className="text-white/75 text-xs mt-0.5">اشتراك قرآني هدية ذات أثر باقٍ 🎁</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-white/60 shrink-0" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

    </div>);

};

export default Index;