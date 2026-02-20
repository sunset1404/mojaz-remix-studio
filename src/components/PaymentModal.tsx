import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Smartphone, Building2, Lock, ChevronLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number | string;
  period?: string;
  onConfirm?: () => void;
  subscriptionType?: string;
  durationMonths?: number;
};

const paymentMethods = [
  { id: "card", label: "بطاقة ائتمانية / مدى", icon: CreditCard, desc: "Visa, Mastercard, Mada" },
  { id: "apple", label: "Apple Pay", icon: Smartphone, desc: "ادفع بسرعة وأمان" },
  { id: "bank", label: "تحويل بنكي", icon: Building2, desc: "IBAN محلي" },
];

const PaymentModal = ({ isOpen, onClose, planName, price, period, subscriptionType, durationMonths }: PaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setConfirming(true);
    try {
      // Fetch student profile info
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      const startDate = new Date();
      const months = durationMonths || (period?.includes("سنو") ? 12 : 1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);

      await supabase.from("student_subscriptions").insert({
        student_id: user.id,
        student_name: profile?.full_name || "طالب",
        student_phone: profile?.phone || null,
        subscription_type: subscriptionType || planName,
        amount: parseFloat(String(price)) || 0,
        duration_months: months,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        status: "active",
        notes: `تم الاشتراك عبر التطبيق - ${planName}`,
      });

      setConfirmed(true);
      toast({ title: "تم تأكيد الاشتراك بنجاح! 🎉" });
      setTimeout(() => {
        setConfirmed(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      toast({ title: "خطأ في تأكيد الاشتراك", description: err.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { type: "spring", damping: 28, stiffness: 300 } }}
            exit={{ y: "100%", opacity: 0, transition: { duration: 0, ease: "linear" } }}
            className="fixed inset-x-0 max-w-md mx-auto z-[70] bg-background rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              bottom: "68px",
              maxHeight: "calc(100dvh - 108px)",
            }}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 px-5 pt-4 pb-2">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-3" />
              <button
                onClick={onClose}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <h2 className="text-base font-bold text-foreground text-center">إتمام الدفع</h2>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
              {confirmed ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-foreground">تم تأكيد الاشتراك!</p>
                  <p className="text-sm text-muted-foreground text-center">اشتراكك في <strong>{planName}</strong> قيد التفعيل</p>
                </motion.div>
              ) : (
                <>
                  {/* Order Summary */}
                  <div className="glass-card rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الباقة</span>
                      <span className="text-sm font-bold text-foreground">{planName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">المبلغ</span>
                      <span className="text-lg font-extrabold text-foreground">
                        {price}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          ريال{period ? ` / ${period}` : ""}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <p className="text-sm font-semibold text-foreground">اختر طريقة الدفع</p>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center gap-3 glass-card rounded-xl p-3 cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all opacity-60"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <method.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold text-foreground">{method.label}</p>
                          <p className="text-xs text-muted-foreground">{method.desc}</p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>

                  {/* Coming Soon Notice */}
                  <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold text-gold">🚧 بوابة الدفع قيد التفعيل</p>
                    <p className="text-xs text-muted-foreground mt-0.5">سيتم تفعيل الدفع الإلكتروني قريباً</p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span>جميع المدفوعات مشفرة وآمنة</span>
                  </div>

                  {/* Confirm button */}
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full py-3 rounded-xl text-sm font-bold gradient-primary text-primary-foreground disabled:opacity-60"
                  >
                    {confirming ? "جاري التأكيد..." : "تأكيد الاشتراك"}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
