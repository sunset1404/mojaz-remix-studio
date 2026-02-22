import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Gift, ChevronLeft, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import PaymentModal from "@/components/PaymentModal";

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
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; planName: string; price: number | string; period?: string; subscriptionType?: string; durationMonths?: number; sourceType?: "subscription" | "gift" | "extra_hours"; metadata?: Record<string, any> }>({ open: false, planName: "", price: 0 });

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
            className={`rounded-2xl p-5 relative overflow-hidden ${plan.popular
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
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.popular ? "bg-white/20" : "bg-gold/10"
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
                  className={`w-12 h-6 rounded-full relative transition-all ${(billingCycle[plan.id] || "monthly") === "yearly"
                    ? plan.popular ? "bg-primary-foreground/30" : "bg-primary"
                    : "bg-muted"
                    }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-all ${(billingCycle[plan.id] || "monthly") === "yearly" ? "left-0.5" : "right-0.5"
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
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.popular ? "bg-primary/20" : "bg-gold/10"
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
              onClick={() => plan.monthlyPrice !== "0" && setPaymentModal({
                open: true,
                planName: plan.name,
                price: getPrice(plan) ?? "",
                period: (billingCycle[plan.id] || "monthly") === "yearly" ? "سنوياً" : "شهرياً",
                subscriptionType: plan.name,
                durationMonths: (billingCycle[plan.id] || "monthly") === "yearly" ? 12 : 1,
              })}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${plan.popular
                ? "bg-white text-gold-foreground hover:bg-white/90"
                : "gradient-primary text-primary-foreground hover:opacity-90"
                }`}
            >
              {plan.monthlyPrice === "0" ? "ابدأ مجاناً" : "اشترك الآن"}
            </motion.button>
          </motion.div>
        ))}
      </div>
      {/* Extra Hours Section */}
      <ExtraHoursSection onPay={(pkg) => setPaymentModal({ open: true, planName: `ساعات إضافية - ${pkg.label}`, price: pkg.price, subscriptionType: "ساعات إضافية", durationMonths: 0, sourceType: "extra_hours", metadata: { hours: pkg.hours, package_label: pkg.label } })} />

      {/* Gift Banner */}
      <div className="px-5 mt-4">
        <Link to="/gift">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-2xl bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(43,74%,38%)] p-4 flex items-center gap-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">أهدِ اشتراكًا لمن تحب 🎁</h3>
              <p className="text-white/70 text-xs">هدية ذات أثر باقٍ</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </motion.div>
        </Link>
      </div>

      <PaymentModal
        isOpen={paymentModal.open}
        onClose={() => setPaymentModal((p) => ({ ...p, open: false }))}
        planName={paymentModal.planName}
        price={paymentModal.price}
        period={paymentModal.period}
        subscriptionType={paymentModal.subscriptionType}
        durationMonths={paymentModal.durationMonths}
        sourceType={paymentModal.sourceType || "subscription"}
        metadata={paymentModal.metadata}
      />
    </div>
  );
};

const hourPackages = [
  { hours: 1, price: 15, label: "ساعة واحدة" },
  { hours: 3, price: 40, originalPrice: 45, label: "٣ ساعات" },
  { hours: 5, price: 60, originalPrice: 75, label: "٥ ساعات" },
  { hours: 10, price: 100, originalPrice: 150, label: "١٠ ساعات" },
];

const ExtraHoursSection = ({ onPay }: { onPay: (pkg: { label: string; price: number; hours: number }) => void }) => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  return (
    <div className="px-5 mt-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <div className="flex items-center gap-2 mb-3 px-1">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">ساعات إضافية</h2>
          <span className="text-[10px] text-muted-foreground">انتهت ساعاتك؟ أضف المزيد</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {hourPackages.map((pkg, i) => (
            <motion.button
              key={pkg.hours}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedPackage(selectedPackage === i ? null : i)}
              className={`rounded-2xl p-4 text-center transition-all border-2 ${selectedPackage === i
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border/50 glass-card"
                }`}
            >
              <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${selectedPackage === i ? "bg-primary/15" : "bg-muted"
                }`}>
                <Clock className={`w-5 h-5 ${selectedPackage === i ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <p className="font-bold text-foreground text-sm">{pkg.label}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-lg font-extrabold text-foreground">{pkg.price}</span>
                <span className="text-[10px] text-muted-foreground">ريال</span>
              </div>
              {pkg.originalPrice && (
                <p className="text-[10px] text-muted-foreground line-through">{pkg.originalPrice} ريال</p>
              )}
              {pkg.originalPrice && (
                <span className="inline-block mt-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  وفّر {Math.round((1 - pkg.price / pkg.originalPrice) * 100)}%
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {selectedPackage !== null && (
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPay(hourPackages[selectedPackage])}
            className="w-full mt-3 py-3 rounded-xl text-sm font-bold gradient-primary text-primary-foreground"
          >
            شراء {hourPackages[selectedPackage].label} - {hourPackages[selectedPackage].price} ريال
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default Subscription;