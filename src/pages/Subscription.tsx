import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "المجاني",
    price: "0",
    period: "مجاني للأبد",
    icon: Zap,
    color: "muted",
    features: [
      "مقرئ واحد متاح",
      "3 جلسات أسبوعياً",
      "تتبع أساسي للتقدم",
      "دعم عبر البريد",
    ],
    notIncluded: [
      "جلسات غير محدودة",
      "اختيار أي مقرئ",
      "شهادات معتمدة",
    ],
    popular: false,
  },
  {
    id: "premium",
    name: "المميز",
    price: "49",
    period: "ريال / شهرياً",
    icon: Crown,
    color: "primary",
    features: [
      "جميع المقرئين متاحين",
      "جلسات غير محدودة",
      "تتبع متقدم للتقدم",
      "شهادات معتمدة",
      "دعم أولوي 24/7",
      "تسجيلات الجلسات",
    ],
    notIncluded: [],
    popular: true,
  },
  {
    id: "annual",
    name: "السنوي",
    price: "399",
    period: "ريال / سنوياً",
    icon: Sparkles,
    color: "gold",
    features: [
      "جميع مميزات المميز",
      "خصم 32% على السعر",
      "جلسة خاصة شهرية",
      "إجازة في القراءة",
      "مجتمع خاص للطلاب",
      "أولوية حجز المقرئين",
    ],
    notIncluded: [],
    popular: false,
  },
];

const Subscription = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-10 rounded-b-[2.5rem]">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">💎 الاشتراكات</h1>
          <p className="text-primary-foreground/80 text-sm">اختر الباقة المناسبة لرحلتك القرآنية</p>
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
                ? "gradient-primary text-primary-foreground shadow-xl"
                : "glass-card"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-3 left-3 bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                الأكثر طلباً ⭐
              </div>
            )}

            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                plan.popular ? "bg-primary-foreground/20" : "bg-primary/10"
              }`}>
                <plan.icon className={`w-6 h-6 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${plan.popular ? "" : "text-foreground"}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${plan.popular ? "" : "text-foreground"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    plan.popular ? "bg-primary-foreground/20" : "bg-primary/10"
                  }`}>
                    <Check className={`w-3 h-3 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
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
                  ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  : "gradient-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {plan.price === "0" ? "ابدأ مجاناً" : "اشترك الآن"}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
