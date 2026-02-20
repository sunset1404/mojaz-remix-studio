import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Smartphone, Building2, Lock, ChevronLeft } from "lucide-react";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number | string;
  period?: string;
  onConfirm?: () => void;
};

const paymentMethods = [
  { id: "card", label: "بطاقة ائتمانية / مدى", icon: CreditCard, desc: "Visa, Mastercard, Mada" },
  { id: "apple", label: "Apple Pay", icon: Smartphone, desc: "ادفع بسرعة وأمان" },
  { id: "bank", label: "تحويل بنكي", icon: Building2, desc: "IBAN محلي" },
];

const PaymentModal = ({ isOpen, onClose, planName, price, period, onConfirm }: PaymentModalProps) => {
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
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <h2 className="text-lg font-bold text-foreground text-center mb-1">إتمام الدفع</h2>

            {/* Order Summary */}
            <div className="glass-card rounded-2xl p-4 mb-4 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الباقة</span>
                <span className="text-sm font-bold text-foreground">{planName}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">المبلغ</span>
                <span className="text-lg font-extrabold text-foreground">
                  {price} <span className="text-sm font-normal text-muted-foreground">ريال{period ? ` / ${period}` : ""}</span>
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <p className="text-sm font-semibold text-foreground mb-3">اختر طريقة الدفع</p>
            <div className="space-y-2.5 mb-5">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center gap-3 glass-card rounded-xl p-3.5 cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all opacity-60"
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
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm font-bold text-gold">🚧 بوابة الدفع قيد التفعيل</p>
              <p className="text-xs text-muted-foreground mt-1">سيتم تفعيل الدفع الإلكتروني قريباً</p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span>جميع المدفوعات مشفرة وآمنة</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
