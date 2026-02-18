import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, ToggleLeft } from "lucide-react";
import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  period: string;
  icon: typeof Zap;
  color: string;
  features: string[];
  notIncluded: string[];
  popular: boolean;
  hasBilling: boolean;
  subtitle?: string;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "المجاني",
    monthlyPrice: "0",
    period: "ساعة مجانية للحساب الجديد",
    icon: Zap,
    color: "muted",
    features: [
      "ساعة واحدة مجانية للتجربة",
      "اختيار مقرئ واحد",
      "تتبع أساسي للتقدم",
    ],
    notIncluded: [
      "ساعات إضافية بعد التجربة",
      "إجازات قرآنية",
      "شهادات معتمدة",
    ],
    popular: false,
    hasBilling: false,
    subtitle: "بعد انتهاء الساعة المجانية يتم تفعيل الاشتراك الشهري",
  },
  {
    id: "memorization",
    name: "الحفظ والمراجعة",
    monthlyPrice: "89",
    yearlyPrice: "890",
    period: "ريال / شهرياً",
    icon: Crown,
    color: "primary",
    features: [
      "10 ساعات شهرياً",
      "حفظ ومراجعة القرآن",
      "تصحيح التلاوة والتجويد",
      "جميع المقرئين متاحين",
      "تتبع متقدم للتقدم",
      "دعم أولوي 24/7",
    ],
    notIncluded: [],
    popular: true,
    hasBilling: true,
  },
  {
    id: "ijazah",
    name: "الإجازات القرآنية",
    monthlyPrice: "89",
    yearlyPrice: "890",
    period: "ريال / شهرياً",
    icon: Sparkles,
    color: "gold",
    features: [
      "10 ساعات شهرياً",
      "إجازة في القراءة",
      "شهادات معتمدة",
      "مقرئين متخصصين بالإجازات",
      "متابعة مستمرة للتقدم",
      "أولوية حجز المقرئين",
    ],
    notIncluded: [],
    popular: false,
    hasBilling: true,
  },
];


const Subscription = () => {
  const [billingCycle, setBillingCycle] = useState<Record<string, "monthly" | "yearly">>({});

  const getPrice = (plan: Plan) => {
    if (!plan.hasBilling) return plan.monthlyPrice;
    return (billingCycle[plan.id] || "monthly") === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getPeriod = (plan: Plan) => {
    if (!plan.hasBilling) return plan.period;
    return (billingCycle[plan.id] || "monthly") === "yearly" ? "ريال / سنوياً" : "ريال / شهرياً";
  };

  const toggleBilling = (planId: string) => {
    setBillingCycle((prev) => ({
      ...prev,
      [planId]: (prev[planId] || "monthly") === "monthly" ? "yearly" : "monthly",
    }));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-10 rounded-b-[2.5rem]">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-primary-foreground mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6" />
            الاشتراكات
          </h1>
          <p className="text-primary-foreground/80 text-sm text-center">اختر الباقة المناسبة لرحلتك القرآنية</p>
        </motion.div>
      </div>

      {/* Plans */}
      <div className="px-5 mt-6 space-y-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className={`rounded-2xl p-5 relative overflow-hidden ${
              plan.popular
                ? "bg-gradient-to-br from-gold to-[hsl(43,74%,45%)] text-white shadow-xl"
                : "glass-card"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-3 left-3 bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                الأكثر طلباً ⭐
              </div>
            )}

            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  plan.popular ? "bg-white/20" : "bg-gold/10"
                }`}
              >
                <plan.icon className={`w-6 h-6 ${plan.popular ? "text-white" : "text-gold"}`} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${plan.popular ? "" : "text-foreground"}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${plan.popular ? "" : "text-foreground"}`}>
                    {getPrice(plan)}
                  </span>
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {getPeriod(plan)}
                  </span>
                </div>
              </div>
            </div>

            {/* Billing toggle */}
            {plan.hasBilling && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className={`text-xs font-semibold ${(billingCycle[plan.id] || "monthly") === "monthly" ? (plan.popular ? "" : "text-foreground") : "text-muted-foreground"}`}>شهري</span>
                <button
                  onClick={() => toggleBilling(plan.id)}
                  className={`w-12 h-6 rounded-full relative transition-all ${
                    (billingCycle[plan.id] || "monthly") === "yearly"
                      ? plan.popular ? "bg-primary-foreground/30" : "bg-primary"
                      : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-all ${
                      (billingCycle[plan.id] || "monthly") === "yearly" ? "left-0.5" : "right-0.5"
                    }`}
                  />
                </button>
                <span className={`text-xs font-semibold ${(billingCycle[plan.id] || "monthly") === "yearly" ? (plan.popular ? "" : "text-foreground") : "text-muted-foreground"}`}>سنوي</span>
              </div>
            )}

            {plan.subtitle && (
              <p className={`text-xs mb-3 text-center ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {plan.subtitle}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-primary/20" : "bg-gold/10"
                    }`}
                  >
                    <Check className={`w-3 h-3 ${plan.popular ? "text-primary" : "text-gold"}`} />
                  </div>
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                    {feature}
                  </span>
                </div>
              ))}
              {plan.notIncluded.map((feature) => (
                <div key={feature} className="flex items-center gap-2 opacity-40">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs">✕</span>
                  </div>
                  <span className="text-sm line-through">{feature}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                plan.popular
                  ? "bg-white text-gold-foreground hover:bg-white/90"
                  : "gradient-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {plan.monthlyPrice === "0" ? "ابدأ مجاناً" : "اشترك الآن"}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;