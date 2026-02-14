import { motion } from "framer-motion";
import { Check, BookOpen, Clock, Star } from "lucide-react";
import { useState } from "react";

const weekDays = [
  { day: "السبت", short: "سب", date: "8" },
  { day: "الأحد", short: "أح", date: "9" },
  { day: "الاثنين", short: "إث", date: "10" },
  { day: "الثلاثاء", short: "ثل", date: "11" },
  { day: "الأربعاء", short: "أر", date: "12" },
  { day: "الخميس", short: "خم", date: "13" },
  { day: "الجمعة", short: "جم", date: "14" },
];

const todayIndex = 5; // Thursday

const dailyTasks = [
  { id: 1, title: "حفظ الآيات 45-50", surah: "سورة البقرة", duration: "30 دقيقة", type: "حفظ", done: true },
  { id: 2, title: "مراجعة سورة الفاتحة", surah: "سورة الفاتحة", duration: "15 دقيقة", type: "مراجعة", done: true },
  { id: 3, title: "تجويد - أحكام النون الساكنة", surah: "تجويد", duration: "20 دقيقة", type: "تجويد", done: false },
  { id: 4, title: "جلسة إقراء مع الشيخ", surah: "جلسة مباشرة", duration: "45 دقيقة", type: "إقراء", done: false },
];

const WeeklyPlan = () => {
  const [tasks, setTasks] = useState(dailyTasks);
  const completedCount = tasks.filter(t => t.done).length;

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "حفظ": return "bg-primary/10 text-primary";
      case "مراجعة": return "bg-gold/20 text-gold";
      case "تجويد": return "bg-accent text-accent-foreground";
      case "إقراء": return "gradient-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-10 rounded-b-[2.5rem]">
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">📅 خطتي الأسبوعية</h1>
          <p className="text-primary-foreground/80 text-sm">فبراير 2026 · الأسبوع الثاني</p>
        </motion.div>
      </div>

      {/* Week Days */}
      <div className="px-5 -mt-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-3 flex justify-between"
        >
          {weekDays.map((d, i) => (
            <motion.button
              key={d.day}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                i === todayIndex
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : i < todayIndex
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className="text-[10px] font-medium">{d.short}</span>
              <span className="text-sm font-bold">{d.date}</span>
              {i < todayIndex && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              {i === todayIndex && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Today's Summary */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">تقدم اليوم</h2>
            <span className="text-sm font-bold text-primary">{completedCount}/{tasks.length}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>110 دقيقة إجمالي</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="w-3.5 h-3.5" />
              <span>+25 نقطة متوقعة</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tasks */}
      <div className="px-5 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">مهام اليوم</h2>
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleTask(task.id)}
              className={`glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                task.done ? "opacity-60" : ""
              }`}
            >
              <motion.div
                animate={{ scale: task.done ? [1, 1.3, 1] : 1 }}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.done ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {task.done && <Check className="w-4 h-4 text-primary-foreground" />}
              </motion.div>

              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTypeColor(task.type)}`}>
                    {task.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {task.duration}
                  </span>
                </div>
              </div>

              <BookOpen className={`w-4 h-4 shrink-0 ${task.done ? "text-muted" : "text-primary"}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Motivational */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="gradient-gold rounded-2xl p-4 text-center"
        >
          <p className="text-gold-foreground font-bold">🔥 أنت على سلسلة 14 يوم!</p>
          <p className="text-gold-foreground/70 text-xs mt-1">واصل الجهد، أنت قريب من إنجاز جديد</p>
        </motion.div>
      </div>
    </div>
  );
};

export default WeeklyPlan;
