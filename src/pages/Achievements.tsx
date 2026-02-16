import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, BookOpen, Target, Award, Flame, Check } from "lucide-react";

const achievements = [
  { id: 1, title: "الخطوة الأولى", desc: "أكمل أول جلسة إقراء", icon: "🌟", earned: true, date: "15 يناير 2026" },
  { id: 2, title: "قارئ منتظم", desc: "أكمل 7 أيام متتالية", icon: "🔥", earned: true, date: "22 يناير 2026" },
  { id: 3, title: "حافظ الجزء", desc: "أتم حفظ جزء كامل", icon: "📖", earned: true, date: "5 فبراير 2026" },
  { id: 4, title: "نجم التجويد", desc: "احصل على تقييم ممتاز في التجويد", icon: "⭐", earned: true, date: "10 فبراير 2026" },
  { id: 5, title: "المثابر", desc: "أكمل 30 يوماً متتالياً", icon: "💪", earned: false, progress: 14, total: 30 },
  { id: 6, title: "حافظ 5 أجزاء", desc: "أتم حفظ 5 أجزاء", icon: "🏆", earned: false, progress: 3, total: 5 },
  { id: 7, title: "المتقن", desc: "أتم مراجعة 10 سور بإتقان", icon: "🎯", earned: false, progress: 6, total: 10 },
  { id: 8, title: "الختمة", desc: "أتم ختم القرآن كاملاً", icon: "👑", earned: false, progress: 5, total: 30 },
];

const stats = [
  { label: "ساعات الإقراء", value: "48", icon: BookOpen },
  { label: "إنجازات مكتسبة", value: "4/8", icon: Trophy },
  { label: "أعلى سلسلة", value: "14 يوم", icon: Flame },
  { label: "تقييم عام", value: "4.8", icon: Star },
];

const weekDays = [
  { key: "sat", label: "س" },
  { key: "sun", label: "ح" },
  { key: "mon", label: "ن" },
  { key: "tue", label: "ث" },
  { key: "wed", label: "ر" },
  { key: "thu", label: "خ" },
  { key: "fri", label: "ج" },
];

// أيام الخطة الأسبوعية (من صفحة الخطة الدراسية)
const planDays = ["sat", "mon", "wed"];
// الأيام التي أنجز فيها الطالب مهامه
const completedDays = ["sat", "mon"];

const Achievements = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-10 rounded-b-[2.5rem]">
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">🏆 إنجازاتي</h1>
          <p className="text-primary-foreground/80 text-sm">تابع مسيرتك وإنجازاتك القرآنية</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 -mt-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-3"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 p-2"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Weekly Plan Progress */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4" dir="rtl">
            <span className="font-bold text-foreground text-sm">تقدم الخطة الأسبوعية</span>
            <span className="text-xs text-primary font-semibold">
              {completedDays.length}/{planDays.length} أيام
            </span>
          </div>
          {/* Day labels */}
          <div className="flex items-center justify-between gap-1 mb-2" dir="rtl">
            {weekDays.map((day) => {
              const isInPlan = planDays.includes(day.key);
              const isDone = completedDays.includes(day.key);
              return (
                <div key={day.key} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className={`text-[10px] font-semibold ${isInPlan ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {day.label}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isDone
                        ? "gradient-primary shadow-md"
                        : isInPlan
                        ? "bg-primary/10 border-2 border-dashed border-primary/30"
                        : "bg-muted/50"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : isInPlan ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Segmented progress bar */}
          <div className="flex items-center gap-1 mt-3" dir="rtl">
            {weekDays.map((day) => {
              const isDone = completedDays.includes(day.key);
              const isInPlan = planDays.includes(day.key);
              return (
                <motion.div
                  key={day.key}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className={`flex-1 h-2 rounded-full ${
                    isDone
                      ? "gradient-primary"
                      : isInPlan
                      ? "bg-primary/20"
                      : "bg-muted/60"
                  }`}
                />
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Level Progress */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              <span className="font-bold text-foreground">المستوى 4</span>
            </div>
            <span className="text-sm text-primary font-bold">680 / 1000 نقطة</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "68%" }}
              transition={{ delay: 0.6, duration: 1 }}
              className="h-full gradient-gold rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">320 نقطة للوصول إلى المستوى 5 🌟</p>
        </motion.div>
      </div>

      {/* Achievements List */}
      <div className="px-5 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">جميع الإنجازات</h2>
        <div className="space-y-3">
          {achievements.map((ach, i) => (
            <motion.div
              key={ach.id}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className={`glass-card rounded-2xl p-4 flex items-center gap-4 ${
                !ach.earned ? "opacity-70" : ""
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                ach.earned ? "gradient-gold shadow-md" : "bg-muted"
              }`}>
                {ach.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{ach.title}</h3>
                <p className="text-xs text-muted-foreground">{ach.desc}</p>
                {ach.earned ? (
                  <p className="text-xs text-primary mt-1">✓ مكتسب · {ach.date}</p>
                ) : (
                  <div className="mt-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all"
                        style={{ width: `${((ach.progress || 0) / (ach.total || 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{ach.progress}/{ach.total}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
