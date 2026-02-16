import { motion } from "framer-motion";
import { ChevronRight, CreditCard, Plus, Receipt, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const savedCards = [
  { id: 1, type: "Visa", last4: "4242", expiry: "12/27" },
  { id: 2, type: "Mastercard", last4: "8831", expiry: "06/26" },
];

const transactions = [
  { id: 1, title: "اشتراك شهري - باقة المتميز", date: "2026-02-10", amount: "49.99", status: "مدفوع" },
  { id: 2, title: "اشتراك شهري - باقة المتميز", date: "2026-01-10", amount: "49.99", status: "مدفوع" },
  { id: 3, title: "اشتراك شهري - باقة المتميز", date: "2025-12-10", amount: "49.99", status: "مدفوع" },
];

const Payments = () => {
  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-6 rounded-b-[2rem] relative">
        <div className="flex items-center justify-center relative">
          <Link to="/profile" className="absolute right-0">
            <ChevronRight className="w-5 h-5 text-primary-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-primary-foreground">المدفوعات والفواتير</h1>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Saved Cards */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">بطاقات الائتمان</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
            {savedCards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + idx * 0.08 }}
                className="p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{card.type} •••• {card.last4}</p>
                  <p className="text-[10px] text-muted-foreground">تنتهي {card.expiry}</p>
                </div>
              </motion.div>
            ))}
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 flex items-center gap-3 w-full hover:bg-muted/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-gold" />
              </div>
              <p className="font-semibold text-gold text-sm">إضافة بطاقة جديدة</p>
            </motion.button>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Receipt className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">سجل الدفعات</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
            {transactions.map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + idx * 0.08 }}
                className="p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{tx.title}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground text-sm">{tx.amount} ر.س</p>
                  <p className="text-[10px] text-green-500">{tx.status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
