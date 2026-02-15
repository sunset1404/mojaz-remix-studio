import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Clock, Star, BookOpen, ChevronRight, ChevronLeft, Pencil, Trash2, X, Mic, BookMarked, Award } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const allDays = [
  { key: "sat", label: "السبت" },
  { key: "sun", label: "الأحد" },
  { key: "mon", label: "الاثنين" },
  { key: "tue", label: "الثلاثاء" },
  { key: "wed", label: "الأربعاء" },
  { key: "thu", label: "الخميس" },
  { key: "fri", label: "الجمعة" },
];

const timeSlots = [
  "بعد الفجر", "الصباح", "بعد الظهر", "بعد العصر", "بعد المغرب", "بعد العشاء",
];

const goalTypes = [
  { key: "hifz", label: "حفظ", icon: BookOpen, desc: "حفظ آيات جديدة" },
  { key: "tasmee", label: "تسميع", icon: Mic, desc: "تسميع المحفوظ على شيخ" },
  { key: "tilawa", label: "تصحيح تلاوة", icon: BookMarked, desc: "تحسين النطق والتجويد" },
  { key: "ijaza", label: "إجازة قرآنية", icon: Award, desc: "الحصول على إجازة في رواية" },
];

type Plan = {
  id: number;
  days: string[];
  time: string;
  goal: string;
  goalLabel: string;
};

const initialPlans: Plan[] = [
  { id: 1, days: ["sat", "mon", "wed"], time: "بعد الفجر", goal: "hifz", goalLabel: "حفظ" },
  { id: 2, days: ["sun", "tue", "thu"], time: "بعد المغرب", goal: "tasmee", goalLabel: "تسميع" },
];

const steps = ["الهدف", "الأيام", "الوقت"];

const WeeklyPlan = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Wizard state
  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");

  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedGoal("");
    setSelectedDays([]);
    setSelectedTime("");
    setEditingPlan(null);
    setShowWizard(false);
  };

  const openAddWizard = () => {
    resetWizard();
    setShowWizard(true);
  };

  const openEditWizard = (plan: Plan) => {
    setEditingPlan(plan);
    setSelectedGoal(plan.goal);
    setSelectedDays(plan.days);
    setSelectedTime(plan.time);
    setCurrentStep(0);
    setShowWizard(true);
  };

  const deletePlan = (id: number) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const canNext = () => {
    if (currentStep === 0) return selectedGoal !== "";
    if (currentStep === 1) return selectedDays.length > 0;
    if (currentStep === 2) return selectedTime !== "";
    return false;
  };

  const handleFinish = () => {
    const goalInfo = goalTypes.find(g => g.key === selectedGoal);
    const newPlan: Plan = {
      id: editingPlan ? editingPlan.id : Date.now(),
      days: selectedDays,
      time: selectedTime,
      goal: selectedGoal,
      goalLabel: goalInfo?.label || "",
    };

    if (editingPlan) {
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? newPlan : p));
    } else {
      setPlans(prev => [...prev, newPlan]);
    }
    resetWizard();
  };

  const toggleDay = (key: string) => {
    setSelectedDays(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
  };

  const getDayLabel = (key: string) => allDays.find(d => d.key === key)?.label || key;

  const getGoalIcon = (goalKey: string) => {
    const g = goalTypes.find(t => t.key === goalKey);
    return g ? g.icon : BookOpen;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-8 rounded-b-[2.5rem] relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-primary-foreground" />
            </button>
            <h1 className="text-lg font-bold text-primary-foreground">خطتي الأسبوعية</h1>
            <button onClick={openAddWizard} className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
          <p className="text-primary-foreground/70 text-xs text-center">إدارة خطط الحفظ والتسميع الخاصة بك</p>
        </motion.div>
      </div>

      {/* Plans List */}
      <div className="px-5 mt-6">
        {plans.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card rounded-2xl p-8 text-center"
          >
            <p className="text-muted-foreground text-sm">لا توجد خطط بعد</p>
            <button
              onClick={openAddWizard}
              className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold mt-4 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة خطة جديدة
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan, i) => {
              const GoalIcon = getGoalIcon(plan.goal);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <GoalIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-sm">{plan.goalLabel}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{plan.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditWizard(plan)}
                        className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                    {plan.days.map(d => (
                      <span key={d} className="text-[10px] bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">
                        {getDayLabel(d)}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {plans.length > 0 && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={openAddWizard}
            className="w-full mt-4 glass-card rounded-2xl p-4 flex items-center justify-center gap-2 text-primary font-semibold text-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة خطة جديدة
          </motion.button>
        )}
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end justify-center pb-20"
            onClick={resetWizard}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Wizard Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">
                  {editingPlan ? "تعديل الخطة" : "خطة جديدة"}
                </h2>
                <button onClick={resetWizard} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-center gap-0 mb-8">
                {steps.map((step, i) => (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < currentStep
                          ? "gradient-primary text-primary-foreground"
                          : i === currentStep
                          ? "bg-primary/15 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-[10px] mt-1 font-medium ${
                        i <= currentStep ? "text-primary" : "text-muted-foreground"
                      }`}>{step}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-1 mb-4 rounded-full transition-colors ${
                        i < currentStep ? "bg-primary" : "bg-muted"
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-muted-foreground mb-4">ما هدف هذه الخطة؟</p>
                    {goalTypes.map((goal, idx) => {
                      const bgTints = [
                        "bg-primary/[0.03]",
                        "bg-accent/30",
                        "bg-primary/[0.06]",
                        "bg-accent/20",
                      ];
                      return (
                        <button
                          key={goal.key}
                          onClick={() => setSelectedGoal(goal.key)}
                          className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-all border-2 ${
                            selectedGoal === goal.key
                              ? "border-primary bg-primary/10 shadow-sm"
                              : `border-border ${bgTints[idx % bgTints.length]} hover:border-primary/30`
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedGoal === goal.key ? "bg-primary/15" : "bg-muted/60"
                          }`}>
                            <goal.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-right flex-1">
                            <p className="font-bold text-foreground text-sm">{goal.label}</p>
                            <p className="text-[10px] text-muted-foreground">{goal.desc}</p>
                          </div>
                          {selectedGoal === goal.key && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                  >
                    <p className="text-sm text-muted-foreground mb-4">اختر أيام الأسبوع المناسبة</p>
                    <div className="grid grid-cols-2 gap-2">
                      {allDays.map(day => {
                        const selected = selectedDays.includes(day.key);
                        return (
                          <button
                            key={day.key}
                            onClick={() => toggleDay(day.key)}
                            className={`rounded-xl p-3.5 flex items-center justify-between transition-all border-2 ${
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:border-primary/30"
                            }`}
                          >
                            <span className="font-semibold text-foreground text-sm">{day.label}</span>
                            {selected && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setSelectedDays(allDays.map(d => d.key))}
                      className="w-full mt-3 text-xs text-primary font-semibold py-2"
                    >
                      تحديد جميع الأيام
                    </button>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                  >
                    <p className="text-sm text-muted-foreground mb-4">اختر الوقت المفضل</p>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map(time => {
                        const selected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`rounded-xl p-3.5 flex items-center justify-between transition-all border-2 ${
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:border-primary/30"
                            }`}
                          >
                            <span className="font-semibold text-foreground text-sm">{time}</span>
                            {selected && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8 mb-6">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex-1 py-3.5 rounded-xl border-2 border-border text-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => canNext() && setCurrentStep(prev => prev + 1)}
                    disabled={!canNext()}
                    className={`flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md ${
                      canNext()
                        ? "gradient-primary text-primary-foreground shadow-primary/25"
                        : "bg-muted text-muted-foreground shadow-none"
                    }`}
                  >
                    التالي
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => canNext() && handleFinish()}
                    disabled={!canNext()}
                    className={`flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md ${
                      canNext()
                        ? "gradient-primary text-primary-foreground shadow-primary/25"
                        : "bg-muted text-muted-foreground shadow-none"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {editingPlan ? "حفظ التعديلات" : "إنشاء الخطة"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyPlan;
