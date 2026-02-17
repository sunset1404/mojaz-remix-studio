import { motion } from "framer-motion";
import { ChevronRight, CreditCard, Plus, Receipt, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type Card = { id: string; card_type: string; last4: string; expiry: string };
type Transaction = { id: string; title: string; date: string; amount: string; status: string };

const Payments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [cardsRes, txRes] = await Promise.all([
        supabase.from("payment_cards").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (cardsRes.data) setSavedCards(cardsRes.data);
      if (txRes.data) setTransactions(txRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

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
        <p className="text-primary-foreground/70 text-sm text-center mt-2">إدارة بطاقاتك وسجل الدفعات والفواتير</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="px-5 mt-6 space-y-6">
          {/* Saved Cards */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">بطاقات الائتمان</span>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
              {savedCards.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">لا توجد بطاقات محفوظة</p>
                </div>
              ) : (
                savedCards.map((card, idx) => (
                  <motion.div key={card.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 + idx * 0.08 }} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{card.card_type} •••• {card.last4}</p>
                      <p className="text-[10px] text-muted-foreground">تنتهي {card.expiry}</p>
                    </div>
                  </motion.div>
                ))
              )}
              <motion.button initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="p-4 flex items-center gap-3 w-full hover:bg-muted/30 transition-all">
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
              {transactions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">لا توجد دفعات سابقة</p>
                </div>
              ) : (
                transactions.map((tx, idx) => (
                  <motion.div key={tx.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 + idx * 0.08 }} className="p-4 flex items-center gap-3">
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
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
