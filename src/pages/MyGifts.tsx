import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, Clock, CheckCircle, Send, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface GiftRecord {
  id: string;
  recipient_name: string;
  recipient_phone: string;
  plan_name: string;
  duration_months: number;
  amount: number;
  gift_code: string;
  status: string;
  personal_message: string | null;
  created_at: string;
  redeemed_at: string | null;
}

const statusMap: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: { label: "في الانتظار", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  redeemed: { label: "مُستخدمة", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
};

const MyGifts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("gift_subscriptions")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });
      setGifts(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalAmount = gifts.reduce((sum, g) => sum + Number(g.amount), 0);
  const redeemedCount = gifts.filter((g) => g.status === "redeemed").length;
  const pendingCount = gifts.filter((g) => g.status === "pending").length;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(43,74%,49%)] to-[hsl(43,74%,38%)] px-6 pt-12 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">إهداءاتي</h1>
            <p className="text-white/70 text-sm">اشتراكات أهديتها للآخرين</p>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "إجمالي الإهداءات", value: gifts.length },
            { label: "مُستخدمة", value: redeemedCount },
            { label: "في الانتظار", value: pendingCount },
          ].map((s) => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-white/70 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Total amount banner */}
      {gifts.length > 0 && (
        <div className="mx-5 mt-4 glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">إجمالي المبالغ المُهداة</p>
            <p className="text-lg font-bold text-foreground">{totalAmount.toLocaleString()} ريال سعودي</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="px-5 mt-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : gifts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Gift className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold mb-1">لا توجد إهداءات بعد</p>
            <p className="text-muted-foreground text-sm mb-5">أهدِ اشتراكًا لأحبائك الآن</p>
            <button
              onClick={() => navigate("/gift")}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-[hsl(43,74%,45%)] text-white font-bold text-sm"
            >
              أهدِ اشتراكًا
            </button>
          </motion.div>
        ) : (
          gifts.map((gift, i) => {
            const st = statusMap[gift.status] || statusMap["pending"];
            const StatusIcon = st.icon;
            return (
              <motion.div
                key={gift.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3" dir="rtl">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground text-sm">{gift.recipient_name}</p>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.bg} ${st.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1" dir="ltr">
                        <Send className="w-3 h-3" />
                        {gift.recipient_phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold text-green-700 text-sm">{Number(gift.amount).toLocaleString()} ر.س</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs" dir="rtl">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Gift className="w-3.5 h-3.5 text-primary" />
                    <span>{gift.plan_name} · {gift.duration_months} {gift.duration_months === 1 ? "شهر" : "أشهر"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{new Date(gift.created_at).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between" dir="rtl">
                  <span className="font-mono text-[11px] bg-muted px-2 py-1 rounded-lg tracking-widest text-muted-foreground">
                    {gift.gift_code}
                  </span>
                  {gift.redeemed_at && (
                    <span className="text-[10px] text-muted-foreground">
                      استُخدم: {new Date(gift.redeemed_at).toLocaleDateString("ar-SA")}
                    </span>
                  )}
                </div>

                {gift.personal_message && (
                  <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2 text-right">
                    "{gift.personal_message}"
                  </p>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {gifts.length > 0 && (
        <div className="px-5 mt-5">
          <button
            onClick={() => navigate("/gift")}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-[hsl(43,74%,45%)] text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <Gift className="w-5 h-5" />
            أهدِ اشتراكًا جديدًا
          </button>
        </div>
      )}
    </div>
  );
};

export default MyGifts;
