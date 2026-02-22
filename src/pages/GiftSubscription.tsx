import { motion } from "framer-motion";
import { Gift, Check, Send, Sparkles, Crown, Star, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "@/components/PaymentModal";

type GiftPlan = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  duration: string;
  durationMonths: number;
  hours: string;
  discount?: string;
  features: string[];
  icon: typeof Gift;
  popular: boolean;
};

const giftPlans: GiftPlan[] = [
  {
    id: "gift_start",
    name: "هدية الانطلاقة",
    price: 89,
    duration: "شهر واحد",
    durationMonths: 1,
    hours: "10 ساعات",
    features: ["10 ساعات تعليمية", "حفظ ومراجعة", "مقرئ معتمد"],
    icon: Gift,
    popular: false,
  },
  {
    id: "gift_excellence",
    name: "هدية التميز",
    price: 445,
    originalPrice: 534,
    duration: "6 أشهر",
    durationMonths: 6,
    hours: "60 ساعة",
    discount: "توفير 17%",
    features: ["60 ساعة تعليمية", "حفظ ومراجعة متقدم", "شهادة تقدم", "مقرئ معتمد"],
    icon: Crown,
    popular: true,
  },
  {
    id: "gift_khatma",
    name: "هدية الختمة",
    price: 790,
    originalPrice: 1068,
    duration: "سنة كاملة",
    durationMonths: 12,
    hours: "120 ساعة",
    discount: "توفير 26%",
    features: ["120 ساعة تعليمية", "أولوية حجز المقرئين", "شهادة إتمام معتمدة", "متابعة مستمرة"],
    icon: Star,
    popular: false,
  },
];

const GiftSubscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [giftResult, setGiftResult] = useState<{ code: string; planName: string } | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);

  const generateGiftCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "GIFT-";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !recipientName.trim() || !recipientPhone.trim()) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (!user) return;

    const plan = giftPlans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    const giftCode = generateGiftCode();

    const { error } = await supabase.from("gift_subscriptions").insert({
      sender_id: user.id,
      recipient_name: recipientName.trim(),
      recipient_phone: recipientPhone.trim(),
      personal_message: personalMessage.trim() || null,
      plan_id: plan.id,
      plan_name: plan.name,
      duration_months: plan.durationMonths,
      amount: plan.price,
      gift_code: giftCode,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      toast({ title: "حدث خطأ أثناء إنشاء الهدية", variant: "destructive" });
      return;
    }

    setGiftResult({ code: giftCode, planName: plan.name });
  };

  const shareViaWhatsApp = () => {
    if (!giftResult) return;
    const appUrl = window.location.origin;
    const message = `🎁 لقد أهداك أحدهم اشتراكًا قرآنيًا (${giftResult.planName})!\n\nاستخدم كود الهدية: ${giftResult.code}\n\nحمّل التطبيق وسجّل حسابك من هنا:\n${appUrl}/redeem-gift?code=${giftResult.code}`;
    window.open(`https://wa.me/${recipientPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (giftResult) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">تم إنشاء الهدية بنجاح! 🎉</h2>
          <p className="text-muted-foreground mb-6">شارك كود الهدية مع {recipientName}</p>

          <div className="glass-card rounded-2xl p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-2">كود الهدية</p>
            <p className="text-3xl font-bold text-primary tracking-widest">{giftResult.code}</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={shareViaWhatsApp}
            className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 mb-3"
          >
            <Send className="w-5 h-5" />
            مشاركة عبر واتساب
          </motion.button>

          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground underline mt-2">
            العودة للرئيسية
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(43,74%,49%)] to-[hsl(43,74%,38%)] px-6 pt-12 pb-10 rounded-b-[2.5rem]">
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">أهدِ اشتراكًا قرآنيًا</h1>
          <p className="text-white/80 text-sm">اجعل هديتك ذات أثر باقٍ 🎁</p>
        </motion.div>
      </div>

      {/* Plans */}
      <div className="px-5 mt-6 space-y-4">
        <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          اختر باقة الإهداء
        </h2>

        {giftPlans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.12 }}
            onClick={() => setSelectedPlan(plan.id)}
            className={`rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all border-2 ${selectedPlan === plan.id
                ? "border-gold shadow-xl"
                : "border-transparent"
              } ${plan.popular
                ? "bg-gradient-to-br from-gold to-[hsl(43,74%,45%)] text-white shadow-lg"
                : "glass-card"
              }`}
          >
            {plan.popular && (
              <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                الأكثر طلباً ⭐
              </div>
            )}

            {plan.discount && (
              <div className={`absolute top-3 ${plan.popular ? "right-3" : "left-3"} bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full`}>
                {plan.discount}
              </div>
            )}

            <div className="flex items-start gap-3 mb-3 mt-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.popular ? "bg-white/20" : "bg-gold/10"}`}>
                <plan.icon className={`w-6 h-6 ${plan.popular ? "text-white" : "text-gold"}`} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${plan.popular ? "" : "text-foreground"}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-extrabold ${plan.popular ? "" : "text-foreground"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>ريال</span>
                  {plan.originalPrice && (
                    <span className={`text-sm line-through ${plan.popular ? "text-white/50" : "text-muted-foreground/60"}`}>{plan.originalPrice} ريال</span>
                  )}
                </div>
                <div className={`flex items-center gap-2 mt-1 text-xs ${plan.popular ? "text-white/80" : "text-muted-foreground"}`}>
                  <Clock className="w-3.5 h-3.5" /> {plan.duration} • {plan.hours}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${plan.popular ? "bg-white/20" : "bg-gold/10"}`}>
                    <Check className={`w-2.5 h-2.5 ${plan.popular ? "text-white" : "text-gold"}`} />
                  </div>
                  <span className={`text-xs ${plan.popular ? "text-white/90" : "text-foreground"}`}>{f}</span>
                </div>
              ))}
            </div>

            {selectedPlan === plan.id && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4">
                <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recipient Form */}
      {selectedPlan && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-5 mt-6">
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-primary" />
            بيانات المُهدى إليه
          </h2>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">اسم المُهدى إليه *</label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="أدخل اسم الشخص"
                className="text-right"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">رقم الجوال (واتساب) *</label>
              <Input
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="مثال: 966512345678+"
                className="text-right"
                dir="ltr"
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">رسالة شخصية (اختياري)</label>
              <textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="أهديك هذا الاشتراك لتبدأ رحلتك مع القرآن..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-right min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={500}
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (!selectedPlan || !recipientName.trim() || !recipientPhone.trim()) {
                toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
                return;
              }
              setPaymentModal(true);
            }}
            disabled={loading}
            className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-gold to-[hsl(43,74%,45%)] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Gift className="w-5 h-5" />
                أهدِ الآن
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {selectedPlan && (() => {
        const plan = giftPlans.find((p) => p.id === selectedPlan);
        return plan ? (
          <PaymentModal
            isOpen={paymentModal}
            onClose={() => setPaymentModal(false)}
            planName={plan.name}
            price={plan.price}
            sourceType="gift"
            durationMonths={plan.durationMonths}
            metadata={{
              recipient_name: recipientName,
              recipient_phone: recipientPhone,
              personal_message: personalMessage,
              plan_id: plan.id,
            }}
          />
        ) : null;
      })()}
    </div>
  );
};

export default GiftSubscription;
