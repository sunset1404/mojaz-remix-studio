import { motion } from "framer-motion";
import { ChevronRight, CreditCard, Plus, Receipt, FileText, Loader2, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type Card = { id: string; card_type: string; last4: string; expiry: string };
type Transaction = { id: string; title: string; date: string; amount: string; status: string };

const Payments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // Add card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardHolder, setCardHolder] = useState("");

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

  const detectCardType = (number: string): string => {
    const clean = number.replace(/\s/g, "");
    if (/^4/.test(clean)) return "Visa";
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
    if (/^(4571|4576|9627|9682|5078)/.test(clean)) return "مدى";
    return "Visa";
  };

  const formatCardNumber = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 16);
    return clean.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) return clean.slice(0, 2) + "/" + clean.slice(2);
    return clean;
  };

  const handleAddCard = async () => {
    if (!user) return;
    const cleanNumber = cardNumber.replace(/\s/g, "");
    if (cleanNumber.length < 13) {
      toast({ title: "خطأ", description: "رقم البطاقة غير صحيح", variant: "destructive" });
      return;
    }
    if (cardExpiry.length < 5) {
      toast({ title: "خطأ", description: "تاريخ الانتهاء غير صحيح", variant: "destructive" });
      return;
    }
    if (cardHolder.trim().length < 2) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم حامل البطاقة", variant: "destructive" });
      return;
    }

    setAddingCard(true);
    const last4 = cleanNumber.slice(-4);
    const cardType = detectCardType(cleanNumber);

    const { data, error } = await supabase.from("payment_cards").insert({
      user_id: user.id,
      last4,
      card_type: cardType,
      expiry: cardExpiry,
    }).select().single();

    if (error) {
      toast({ title: "خطأ", description: "فشل في حفظ البطاقة", variant: "destructive" });
    } else if (data) {
      setSavedCards(prev => [data, ...prev]);
      toast({ title: "تم", description: "تمت إضافة البطاقة بنجاح" });
      setShowAddCard(false);
      setCardNumber("");
      setCardExpiry("");
      setCardHolder("");
    }
    setAddingCard(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (savedCards.length <= 1) {
      toast({ title: "تنبيه", description: "لا يمكن حذف البطاقة الوحيدة. أضف بطاقة أخرى أولاً.", variant: "destructive" });
      return;
    }
    setDeletingCardId(cardId);
    const { error } = await supabase.from("payment_cards").delete().eq("id", cardId);
    if (error) {
      toast({ title: "خطأ", description: "فشل في حذف البطاقة", variant: "destructive" });
    } else {
      setSavedCards(prev => prev.filter(c => c.id !== cardId));
      toast({ title: "تم", description: "تم حذف البطاقة" });
    }
    setDeletingCardId(null);
  };

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
                    {savedCards.length > 1 && (
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        disabled={deletingCardId === card.id}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        {deletingCardId === card.id ? (
                          <Loader2 className="w-4 h-4 text-destructive animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        )}
                      </button>
                    )}
                  </motion.div>
                ))
              )}

              {/* Add Card Button / Form */}
              {showAddCard ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground">إضافة بطاقة جديدة</span>
                    <button onClick={() => setShowAddCard(false)} className="p-1 rounded-lg hover:bg-muted/50">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <Input
                    placeholder="رقم البطاقة"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    inputMode="numeric"
                    className="text-left"
                    dir="ltr"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      inputMode="numeric"
                      className="text-left flex-1"
                      dir="ltr"
                    />
                    <Input
                      placeholder="اسم حامل البطاقة"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="flex-[2]"
                    />
                  </div>
                  <Button onClick={handleAddCard} disabled={addingCard} className="w-full">
                    {addingCard ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                    حفظ البطاقة
                  </Button>
                </div>
              ) : (
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setShowAddCard(true)}
                  className="p-4 flex items-center gap-3 w-full hover:bg-muted/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5 text-gold" />
                  </div>
                  <p className="font-semibold text-gold text-sm">إضافة بطاقة جديدة</p>
                </motion.button>
              )}
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
