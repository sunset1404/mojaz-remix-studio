import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Gift, ChevronLeft, Clock, Loader2, HandHeart } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";
import GrantRequestDialog from "@/components/GrantRequestDialog";

const iconMap: Record<string, typeof Zap> = {
  Zap, Crown, Sparkles
};

type DBPlan = {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number | null;
  period: string;
  icon: string;
  features: string[];
  not_included: string[];
  is_popular: boolean;
  has_billing: boolean;
  subtitle: string | null;
  sort_order: number;
};

type ActiveSub = {
  id: string;
  name: string;
  durationMonths: number;
  startDate: string;
  endDate: string;
  amount: number;
};

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<DBPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<Record<string, "monthly" | "yearly">>({});
  const [freeLoading, setFreeLoading] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSub[]>([]);
  const [paymentModal, setPaymentModal] = useState<{open: boolean;planName: string;price: number | string;period?: string;subscriptionType?: string;durationMonths?: number;sourceType?: "subscription" | "gift" | "extra_hours";metadata?: Record<string, any>;}>({ open: false, planName: "", price: 0 });

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.
      from("subscription_plans").
      select("*").
      eq("is_active", true).
      order("sort_order");
      if (data) setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!user) { setActiveSubscriptions([]); return; }
    supabase
      .from("student_subscriptions")
      .select("id, subscription_type, duration_months, start_date, end_date, amount")
      .eq("student_id", user.id)
      .eq("status", "active")
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("end_date", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setActiveSubscriptions(data.map(s => ({
            id: s.id,
            name: s.subscription_type,
            durationMonths: s.duration_months,
            startDate: s.start_date,
            endDate: s.end_date,
            amount: Number(s.amount) || 0,
          })));
        } else {
          setActiveSubscriptions([]);
        }
      });
  }, [user]);

  const isSubscribedTo = (planName: string, durationMonths?: number) =>
    activeSubscriptions.some(s => s.name === planName && (durationMonths === undefined || s.durationMonths === durationMonths));
  const getSubscribedPlan = (planName: string, durationMonths?: number) =>
    activeSubscriptions.find(s => s.name === planName && (durationMonths === undefined || s.durationMonths === durationMonths));

  const handleFreePlan = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (isSubscribedTo("المجاني")) {
      toast.info("أنت مشترك في الباقة المجانية بالفعل");
      return;
    }
    setFreeLoading(true);
    try {
      const { data: profile } = await supabase.
      from("student_profiles").
      select("full_name, phone").
      eq("user_id", user.id).
      maybeSingle();

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const { error } = await supabase.
      from("student_subscriptions").
      insert({
        student_id: user.id,
        student_name: profile?.full_name || "طالب",
        student_phone: profile?.phone || null,
        subscription_type: "المجاني",
        amount: 0,
        duration_months: 1,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        status: "active",
        notes: "اشتراك مجاني - ساعة واحدة شهرياً"
      });

      if (error) throw error;

      // Add 60 minutes (1 hour) to student credits
      const { data: existingCredit } = await (supabase as any).
      from("student_hour_credits").
      select("id, remaining_minutes").
      eq("user_id", user.id).
      maybeSingle();

      if (existingCredit) {
        await (supabase as any).
        from("student_hour_credits").
        update({ remaining_minutes: Number(existingCredit.remaining_minutes) + 60 }).
        eq("id", existingCredit.id);
      } else {
        await (supabase as any).
        from("student_hour_credits").
        insert({ user_id: user.id, remaining_minutes: 60 });
      }

      toast.success("تم تفعيل الباقة المجانية بنجاح! 🎉");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تفعيل الباقة المجانية");
    } finally {
      setFreeLoading(false);
    }
  };

  const getPrice = (plan: DBPlan) => {
    if (!plan.has_billing) return String(plan.price_monthly);
    return (billingCycle[plan.id] || "monthly") === "yearly" ? String(plan.price_yearly ?? plan.price_monthly) : String(plan.price_monthly);
  };

  const getPeriod = (plan: DBPlan) => {
    if (!plan.has_billing) return plan.period;
    return (billingCycle[plan.id] || "monthly") === "yearly" ? "ريال / سنوياً" : "ريال / شهرياً";
  };

  const toggleBilling = (planId: string) => {
    setBillingCycle((prev) => ({
      ...prev,
      [planId]: (prev[planId] || "monthly") === "monthly" ? "yearly" : "monthly"
    }));
  };

  const PlanIcon = (iconName: string) => iconMap[iconName] || Zap;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>);

  }

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

      {/* Gift Banner - Top */}
      <div className="px-5 mt-5">
        <Link to="/gift">
















        </Link>
      </div>

      {/* Grant Request */}
      <div className="px-5 mt-4">
        <button
          onClick={() => setGrantOpen(true)}
          className="w-full rounded-2xl p-4 flex items-center gap-3 bg-gradient-to-l from-primary/10 to-gold/10 border border-primary/20 hover:from-primary/15 hover:to-gold/15 transition-all text-right">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <HandHeart className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">طلب منحة اشتراك</p>
            <p className="text-xs text-muted-foreground">إذا كنت غير قادر على الدفع، قدّم طلبك وستراجعه الإدارة</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Plans */}
      <div className="px-5 mt-5 space-y-4">
        {plans.map((plan, i) => {
          const Icon = PlanIcon(plan.icon);
          const isFree = plan.price_monthly === 0;
          return (
            <motion.div
              key={plan.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className={`rounded-2xl p-5 relative overflow-hidden ${plan.is_popular ?
              "bg-gradient-to-br from-gold to-[hsl(43,74%,45%)] text-white shadow-xl" :
              "glass-card"}`
              }>

              {plan.is_popular &&
              <div className="absolute top-3 left-3 bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  الأكثر طلباً ⭐
                </div>
              }

              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.is_popular ? "bg-white/20" : "bg-gold/10"}`}>

                  <Icon className={`w-6 h-6 ${plan.is_popular ? "text-white" : "text-gold"}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${plan.is_popular ? "" : "text-foreground"}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    {isFree ?
                    <span className={`text-lg font-extrabold ${plan.is_popular ? "" : "text-primary"}`}>ساعة واحدة شهرياً

                    </span> :

                    <>
                        <span className={`text-3xl font-extrabold ${plan.is_popular ? "" : "text-foreground"}`}>
                          {getPrice(plan)}
                        </span>
                        <span className={`text-sm ${plan.is_popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {getPeriod(plan)}
                        </span>
                      </>
                    }
                  </div>
                </div>
              </div>

              {/* Billing toggle */}
              {plan.has_billing &&
              <div className="flex items-center justify-center gap-3 mb-4">
                  <span className={`text-xs font-semibold ${(billingCycle[plan.id] || "monthly") === "monthly" ? plan.is_popular ? "" : "text-foreground" : "text-muted-foreground"}`}>شهري</span>
                  <button
                  onClick={() => toggleBilling(plan.id)}
                  className={`w-12 h-6 rounded-full relative transition-all ${(billingCycle[plan.id] || "monthly") === "yearly" ?
                  plan.is_popular ? "bg-primary-foreground/30" : "bg-primary" :
                  "bg-muted"}`
                  }>

                    <div
                    className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-all ${(billingCycle[plan.id] || "monthly") === "yearly" ? "left-0.5" : "right-0.5"}`
                    } />

                  </button>
                  <span className={`text-xs font-semibold ${(billingCycle[plan.id] || "monthly") === "yearly" ? plan.is_popular ? "" : "text-foreground" : "text-muted-foreground"}`}>سنوي</span>
                </div>
              }

              {plan.subtitle &&
              <p className={`text-xs mb-3 text-center ${plan.is_popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.subtitle}
                </p>
              }

              <div className="space-y-2 mb-4">
                {plan.features.map((feature) =>
                <div key={feature} className="flex items-center gap-2">
                    <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.is_popular ? "bg-primary/20" : "bg-gold/10"}`}>

                      <Check className={`w-3 h-3 ${plan.is_popular ? "text-primary" : "text-gold"}`} />
                    </div>
                    <span className={`text-sm ${plan.is_popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </div>
                )}
                {plan.not_included.map((feature) =>
                <div key={feature} className="flex items-center gap-2 opacity-40">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs">✕</span>
                    </div>
                    <span className="text-sm line-through">{feature}</span>
                  </div>
                )}
              </div>

              {(() => {
                const selectedCycle = (billingCycle[plan.id] || "monthly") as "monthly" | "yearly";
                const selectedDuration = isFree ? 1 : (selectedCycle === "yearly" ? 12 : 1);
                const subscribed = plan.has_billing || isFree
                  ? isSubscribedTo(plan.name, selectedDuration)
                  : isSubscribedTo(plan.name);
                const sub = plan.has_billing || isFree
                  ? getSubscribedPlan(plan.name, selectedDuration)
                  : getSubscribedPlan(plan.name);
                return (
                  <>
                    {subscribed && sub && (
                      <div className={`text-center text-xs mb-2 ${plan.is_popular ? "text-white/80" : "text-muted-foreground"}`}>
                        مشترك حتى {new Date(sub.endDate).toLocaleDateString('ar-SA')}
                      </div>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={subscribed || (isFree && freeLoading)}
                      onClick={() => {
                        if (isFree) {
                          handleFreePlan();
                        } else {
                          setPaymentModal({
                            open: true,
                            planName: plan.name,
                            price: getPrice(plan),
                            period: selectedCycle === "yearly" ? "سنوياً" : "شهرياً",
                            subscriptionType: plan.name,
                            durationMonths: selectedCycle === "yearly" ? 12 : 1
                          });
                        }
                      }}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                        subscribed
                          ? plan.is_popular
                            ? "bg-white/30 text-white cursor-default"
                            : "bg-muted text-muted-foreground cursor-default"
                          : plan.is_popular
                            ? "bg-white text-gold-foreground hover:bg-white/90"
                            : "gradient-primary text-primary-foreground hover:opacity-90"
                      } disabled:opacity-80`}>
                      {isFree
                        ? freeLoading ? "جاري التفعيل..." : subscribed ? "مشترك ✓" : "ابدأ مجاناً"
                        : subscribed ? "مشترك ✓" : "اشترك الآن"}
                    </motion.button>
                  </>
                );
              })()}
            </motion.div>);

        })}
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
        metadata={paymentModal.metadata} />

      <GrantRequestDialog open={grantOpen} onOpenChange={setGrantOpen} />

    </div>);

};

type HourPackage = {id: string;label: string;hours: number;price: number;original_price: number | null;};

const ExtraHoursSection = ({ onPay }: {onPay: (pkg: {label: string;price: number;hours: number;}) => void;}) => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [hourPackages, setHourPackages] = useState<HourPackage[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.
      from("extra_hour_packages").
      select("*").
      eq("is_active", true).
      order("sort_order");
      if (data) setHourPackages(data);
    };
    fetch();
  }, []);

  if (hourPackages.length === 0) return null;

  return (
    <div className="px-5 mt-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}>

        <div className="flex items-center gap-2 mb-3 px-1">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">ساعات إضافية</h2>
          <span className="text-[10px] text-muted-foreground">انتهت ساعاتك؟ أضف المزيد</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {hourPackages.map((pkg, i) =>
          <motion.button
            key={pkg.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.08 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedPackage(selectedPackage === i ? null : i)}
            className={`rounded-2xl p-4 text-center transition-all border-2 ${selectedPackage === i ?
            "border-primary bg-primary/5 shadow-md" :
            "border-border/50 glass-card"}`
            }>

              <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${selectedPackage === i ? "bg-primary/15" : "bg-muted"}`
            }>
                <Clock className={`w-5 h-5 ${selectedPackage === i ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <p className="font-bold text-foreground text-sm">{pkg.label}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-lg font-extrabold text-foreground">{pkg.price}</span>
                <span className="text-[10px] text-muted-foreground">ريال</span>
              </div>
              {pkg.original_price &&
            <p className="text-[10px] text-muted-foreground line-through">{pkg.original_price} ريال</p>
            }
              {pkg.original_price &&
            <span className="inline-block mt-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  وفّر {Math.round((1 - pkg.price / pkg.original_price) * 100)}%
                </span>
            }
            </motion.button>
          )}
        </div>

        {selectedPackage !== null && hourPackages[selectedPackage] &&
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPay(hourPackages[selectedPackage])}
          className="w-full mt-3 py-3 rounded-xl text-sm font-bold gradient-primary text-primary-foreground">

            شراء {hourPackages[selectedPackage].label} - {hourPackages[selectedPackage].price} ريال
          </motion.button>
        }
      </motion.div>
    </div>);

};

export default Subscription;