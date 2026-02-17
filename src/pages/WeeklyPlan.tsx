import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Clock, BookOpen, ChevronRight, ChevronLeft, Pencil, Trash2, X, Mic, BookMarked, Award, Layers, FileText, BookOpenCheck, Users, GraduationCap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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

// أهداف الطالب
const studentGoalTypes = [
  { key: "hifz", label: "حفظ", icon: BookOpen, desc: "حفظ آيات جديدة" },
  { key: "tasmee", label: "تسميع", icon: Mic, desc: "تسميع المحفوظ على شيخ" },
  { key: "tilawa", label: "تصحيح تلاوة", icon: BookMarked, desc: "تحسين النطق والتجويد" },
  { key: "ijaza", label: "إجازة قرآنية", icon: Award, desc: "الحصول على إجازة في رواية" },
];

// أهداف المقرئ
const reciterGoalTypes = [
  { key: "hifz_help", label: "مساعدة على الحفظ", icon: BookOpen, desc: "مساعدة الطلاب على حفظ القرآن" },
  { key: "tilawa_fix", label: "تصحيح التلاوة", icon: BookMarked, desc: "تصحيح التلاوة والتجويد للطلاب" },
  { key: "muraja3a", label: "مراجعة القرآن", icon: Users, desc: "مراجعة المحفوظ مع الطلاب" },
  { key: "ijaza_grant", label: "منح الإجازات", icon: GraduationCap, desc: "منح إجازات قرآنية للطلاب المتقنين" },
];

const scopeTypes = [
  { key: "full", label: "القرآن كاملاً", icon: BookOpenCheck, desc: "ختمة كاملة للقرآن الكريم" },
  { key: "juz", label: "أجزاء محددة", icon: Layers, desc: "اختيار أجزاء معينة من القرآن" },
  { key: "surah", label: "سور محددة", icon: FileText, desc: "اختيار سور معينة من القرآن" },
];

type Plan = {
  id: number;
  days: string[];
  times: string[];
  goals: string[];
  goalLabels: string[];
  scope: string;
  scopeLabel: string;
};

const studentInitialPlans: Plan[] = [
  { id: 1, days: ["sat", "mon", "wed"], times: ["بعد الفجر"], goals: ["hifz"], goalLabels: ["حفظ"], scope: "juz", scopeLabel: "أجزاء محددة" },
  { id: 2, days: ["sun", "tue", "thu"], times: ["بعد المغرب"], goals: ["tasmee"], goalLabels: ["تسميع"], scope: "full", scopeLabel: "القرآن كاملاً" },
];

const reciterInitialPlans: Plan[] = [
  { id: 1, days: ["sat", "mon", "wed"], times: ["بعد الفجر", "بعد العصر"], goals: ["hifz_help", "tilawa_fix"], goalLabels: ["مساعدة على الحفظ", "تصحيح التلاوة"], scope: "juz", scopeLabel: "أجزاء محددة" },
  { id: 2, days: ["sun", "tue", "thu"], times: ["بعد المغرب"], goals: ["muraja3a"], goalLabels: ["مراجعة القرآن"], scope: "full", scopeLabel: "القرآن كاملاً" },
];

const steps = ["الهدف", "المقدار", "الأيام", "الوقت"];

const WeeklyPlan = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isReciter = role === "reciter";

  const goalTypes = isReciter ? reciterGoalTypes : studentGoalTypes;
  const subtitle = isReciter
    ? "إدارة خطط الإقراء والجلسات الخاصة بك"
    : "إدارة خطط الحفظ والتسميع الخاصة بك";

  const [plans, setPlans] = useState<Plan[]>(isReciter ? reciterInitialPlans : studentInitialPlans);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Wizard state
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedScope, setSelectedScope] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customHour, setCustomHour] = useState("12");
  const [customMinute, setCustomMinute] = useState("00");
  const [customPeriod, setCustomPeriod] = useState("صباحاً");

  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedGoals([]);
    setSelectedScope("");
    setSelectedDays([]);
    setSelectedTimes([]);
    setCustomTime("");
    setShowCustomPicker(false);
    setCustomHour("12");
    setCustomMinute("00");
    setCustomPeriod("صباحاً");
    setEditingPlan(null);
    setShowWizard(false);
  };

  const openAddWizard = () => {
    if (plans.length > 0) {
      setShowLimitDialog(true);
      return;
    }
    resetWizard();
    setShowWizard(true);
  };

  const openEditWizard = (plan: Plan) => {
    setEditingPlan(plan);
    setSelectedGoals(plan.goals);
    setSelectedScope(plan.scope);
    setSelectedDays(plan.days);
    setSelectedTimes(plan.times);
    setCustomTime(plan.times.some(t => !timeSlots.includes(t)) ? plan.times.find(t => !timeSlots.includes(t)) || "" : "");
    setCurrentStep(0);
    setShowWizard(true);
  };

  const deletePlan = (id: number) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    setDeleteConfirmId(null);
  };

  const toggleGoal = (key: string) => {
    if (isReciter) {
      // Reciter can select multiple goals
      setSelectedGoals(prev =>
        prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]
      );
    } else {
      // Student selects single goal
      setSelectedGoals([key]);
    }
  };

  const shouldSkipScope = () => {
    // Skip scope for ijaza (student) or ijaza_grant (reciter)
    return selectedGoals.includes("ijaza") || selectedGoals.includes("ijaza_grant");
  };

  const canNext = () => {
    if (currentStep === 0) return selectedGoals.length > 0;
    if (currentStep === 1) return selectedScope !== "";
    if (currentStep === 2) return selectedDays.length > 0;
    if (currentStep === 3) return selectedTimes.length > 0;
    return false;
  };

  const handleFinish = () => {
    const goalLabels = selectedGoals.map(g => goalTypes.find(t => t.key === g)?.label || "");
    const scopeInfo = scopeTypes.find(s => s.key === selectedScope);
    const newPlan: Plan = {
      id: editingPlan ? editingPlan.id : Date.now(),
      days: selectedDays,
      times: selectedTimes,
      goals: selectedGoals,
      goalLabels,
      scope: selectedScope,
      scopeLabel: scopeInfo?.label || "",
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
    const allGoals = [...studentGoalTypes, ...reciterGoalTypes];
    const g = allGoals.find(t => t.key === goalKey);
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
            <h1 className="text-lg font-bold text-primary-foreground">
              {isReciter ? "خطة الإقراء الأسبوعية" : "خطتي الأسبوعية"}
            </h1>
            <div className="w-9 h-9" />
          </div>
          <p className="text-primary-foreground/70 text-xs text-center">{subtitle}</p>
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
              const FirstGoalIcon = getGoalIcon(plan.goals[0]);
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
                        <FirstGoalIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-sm">{plan.goalLabels.join(" · ")}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{plan.times.join(" · ")}</span>
                          </div>
                          <span className="text-[10px] text-gold font-semibold">• {plan.scopeLabel}</span>
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
                        onClick={() => setDeleteConfirmId(plan.id)}
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

      {/* Limit Dialog (student only) */}
      <AnimatePresence>
        {showLimitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowLimitDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <p className="text-foreground font-bold text-base mb-5">لديك خطة بالفعل</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLimitDialog(false);
                    openEditWizard(plans[0]);
                  }}
                  className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                >
                  <Pencil className="w-4 h-4" />
                  تعديل
                </button>
                <button
                  onClick={() => {
                    setShowLimitDialog(false);
                    setDeleteConfirmId(plans[0].id);
                  }}
                  className="flex-1 py-3 rounded-xl border-2 border-destructive/30 text-destructive font-semibold text-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <p className="text-foreground font-bold text-base mb-5">هل تريد حذف هذه الخطة؟</p>
              <div className="flex gap-3">
                <button
                  onClick={() => deletePlan(deleteConfirmId)}
                  className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  حذف
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-foreground font-semibold text-sm"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <div className={`w-8 h-0.5 mx-0.5 mb-4 rounded-full transition-colors ${
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
                    <p className="text-sm text-muted-foreground mb-4">
                      {isReciter
                        ? "ما أهداف الإقراء في هذه الخطة؟ (يمكنك اختيار أكثر من هدف)"
                        : "ما هدف هذه الخطة؟"}
                    </p>
                    {goalTypes.map((goal, idx) => {
                      const bgTints = [
                        "bg-primary/[0.03]",
                        "bg-accent/30",
                        "bg-primary/[0.06]",
                        "bg-accent/20",
                      ];
                      const isSelected = selectedGoals.includes(goal.key);
                      return (
                        <button
                          key={goal.key}
                          onClick={() => toggleGoal(goal.key)}
                          className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-all border-2 ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : `border-border ${bgTints[idx % bgTints.length]} hover:border-primary/30`
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-primary/15" : "bg-muted/60"
                          }`}>
                            <goal.icon className="w-5 h-5 text-gold" />
                          </div>
                          <div className="text-right flex-1">
                            <p className="font-bold text-foreground text-sm">{goal.label}</p>
                            <p className="text-[10px] text-muted-foreground">{goal.desc}</p>
                          </div>
                          {isSelected && (
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
                    className="space-y-3"
                  >
                    <p className="text-sm text-muted-foreground mb-4">
                      {isReciter ? "حدد نطاق الإقراء" : "حدد مقدار الحفظ أو المراجعة"}
                    </p>
                    {scopeTypes.map((scope, idx) => {
                      const bgTints = ["bg-primary/[0.03]", "bg-accent/30", "bg-accent/20"];
                      return (
                        <button
                          key={scope.key}
                          onClick={() => setSelectedScope(scope.key)}
                          className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-all border-2 ${
                            selectedScope === scope.key
                              ? "border-primary bg-primary/10 shadow-sm"
                              : `border-border ${bgTints[idx % bgTints.length]} hover:border-primary/30`
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedScope === scope.key ? "bg-primary/15" : "bg-muted/60"
                          }`}>
                            <scope.icon className="w-5 h-5 text-gold" />
                          </div>
                          <div className="text-right flex-1">
                            <p className="font-bold text-foreground text-sm">{scope.label}</p>
                            <p className="text-[10px] text-muted-foreground">{scope.desc}</p>
                          </div>
                          {selectedScope === scope.key && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                  >
                    <p className="text-sm text-muted-foreground mb-4">
                      {isReciter ? "اختر أيام الإقراء المناسبة" : "اختر أيام الأسبوع المناسبة"}
                    </p>
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

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                  >
                    <p className="text-sm text-muted-foreground mb-4">
                      {isReciter ? "اختر أوقات الإقراء المفضلة (يمكنك اختيار عدة أوقات)" : "اختر الوقت المفضل"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map(time => {
                        const selected = selectedTimes.includes(time);
                        return (
                          <button
                            key={time}
                            onClick={() => {
                              if (isReciter) {
                                setSelectedTimes(prev =>
                                  prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
                                );
                              } else {
                                setSelectedTimes([time]);
                                setCustomTime("");
                              }
                            }}
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
                    {/* Custom time picker */}
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setShowCustomPicker(!showCustomPicker);
                          if (!showCustomPicker) {
                            const built = `${customHour}:${customMinute} ${customPeriod}`;
                            setCustomTime(built);
                            if (isReciter) {
                              setSelectedTimes(prev => prev.includes(built) ? prev : [...prev, built]);
                            } else {
                              setSelectedTimes([built]);
                            }
                          }
                        }}
                        className={`w-full rounded-xl p-3.5 flex items-center gap-3 transition-all border-2 ${
                          selectedTimes.some(t => !timeSlots.includes(t))
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className={`flex-1 text-sm font-semibold text-right ${
                          selectedTimes.some(t => !timeSlots.includes(t)) ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {selectedTimes.find(t => !timeSlots.includes(t)) || "وقت مخصص"}
                        </span>
                        {selectedTimes.some(t => !timeSlots.includes(t)) && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                      <AnimatePresence>
                        {showCustomPicker && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center justify-center gap-3 mt-3 p-4 rounded-xl border-2 border-primary/20 bg-card" dir="ltr">
                              {/* Period */}
                              <select
                                value={customPeriod}
                                onChange={(e) => {
                                  setCustomPeriod(e.target.value);
                                  const built = `${customHour}:${customMinute} ${e.target.value}`;
                                  setCustomTime(built);
                                  // Remove old custom time and add new
                                  setSelectedTimes(prev => {
                                    const withoutCustom = prev.filter(t => timeSlots.includes(t));
                                    return [...withoutCustom, built];
                                  });
                                }}
                                className="bg-muted rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground outline-none border border-border focus:border-primary appearance-none text-center"
                              >
                                <option value="صباحاً">صباحاً</option>
                                <option value="مساءً">مساءً</option>
                              </select>
                              <span className="text-lg font-bold text-muted-foreground">:</span>
                              {/* Minutes */}
                              <select
                                value={customMinute}
                                onChange={(e) => {
                                  setCustomMinute(e.target.value);
                                  const built = `${customHour}:${e.target.value} ${customPeriod}`;
                                  setCustomTime(built);
                                  setSelectedTimes(prev => {
                                    const withoutCustom = prev.filter(t => timeSlots.includes(t));
                                    return [...withoutCustom, built];
                                  });
                                }}
                                className="bg-muted rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground outline-none border border-border focus:border-primary appearance-none text-center w-16"
                              >
                                {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")).map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <span className="text-lg font-bold text-muted-foreground">:</span>
                              {/* Hours */}
                              <select
                                value={customHour}
                                onChange={(e) => {
                                  setCustomHour(e.target.value);
                                  const built = `${e.target.value}:${customMinute} ${customPeriod}`;
                                  setCustomTime(built);
                                  setSelectedTimes(prev => {
                                    const withoutCustom = prev.filter(t => timeSlots.includes(t));
                                    return [...withoutCustom, built];
                                  });
                                }}
                                className="bg-muted rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground outline-none border border-border focus:border-primary appearance-none text-center w-16"
                              >
                                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8 mb-6">
                {currentStep > 0 && (
                  <button
                    onClick={() => {
                      let prev = currentStep - 1;
                      if (prev === 1 && shouldSkipScope()) prev = 0;
                      setCurrentStep(prev);
                    }}
                    className="flex-1 py-3.5 rounded-xl border-2 border-border text-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => {
                      if (!canNext()) return;
                      let next = currentStep + 1;
                      if (next === 1 && shouldSkipScope()) {
                        setSelectedScope("full");
                        next = 2;
                      }
                      setCurrentStep(next);
                    }}
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
