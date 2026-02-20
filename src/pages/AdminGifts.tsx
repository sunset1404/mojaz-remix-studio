import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Gift, Search, TrendingUp, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface GiftSubscription {
  id: string;
  sender_id: string;
  recipient_name: string;
  recipient_phone: string;
  personal_message: string | null;
  plan_id: string;
  plan_name: string;
  duration_months: number;
  amount: number;
  gift_code: string;
  status: string;
  redeemed_at: string | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "في الانتظار", variant: "secondary" },
  redeemed: { label: "مُستخدم", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
};

const AdminGifts = () => {
  const [gifts, setGifts] = useState<GiftSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchGifts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gift_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    setGifts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchGifts(); }, []);

  const filtered = gifts.filter((g) =>
    g.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
    g.gift_code.toLowerCase().includes(search.toLowerCase()) ||
    g.plan_name.toLowerCase().includes(search.toLowerCase()) ||
    g.recipient_phone.includes(search)
  );

  // Stats
  const totalAmount = gifts.reduce((sum, g) => sum + Number(g.amount), 0);
  const totalGifts = gifts.length;
  const redeemed = gifts.filter((g) => g.status === "redeemed").length;
  const pending = gifts.filter((g) => g.status === "pending").length;

  const statsCards = [
    { label: "إجمالي الإهداءات", value: totalGifts, icon: Gift, color: "text-primary", bg: "bg-primary/10" },
    { label: "إجمالي المبالغ", value: `${totalAmount.toLocaleString()} ريال`, icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { label: "مُستخدمة", value: redeemed, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "في الانتظار", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الإهداءات</h1>
          <p className="text-muted-foreground text-sm">متابعة إهداءات الاشتراكات القرآنية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              قائمة الإهداءات ({filtered.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الكود أو الرقم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 text-right"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد إهداءات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-right py-3 px-3 font-semibold">المُهدى إليه</th>
                    <th className="text-right py-3 px-3 font-semibold">رقم الجوال</th>
                    <th className="text-right py-3 px-3 font-semibold">الباقة</th>
                    <th className="text-right py-3 px-3 font-semibold">المبلغ</th>
                    <th className="text-right py-3 px-3 font-semibold">المدة</th>
                    <th className="text-right py-3 px-3 font-semibold">كود الهدية</th>
                    <th className="text-right py-3 px-3 font-semibold">الحالة</th>
                    <th className="text-right py-3 px-3 font-semibold">تاريخ الإنشاء</th>
                    <th className="text-right py-3 px-3 font-semibold">تاريخ الاستخدام</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((gift, i) => {
                    const st = statusMap[gift.status] || { label: gift.status, variant: "outline" as const };
                    return (
                      <motion.tr
                        key={gift.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-3 font-medium text-foreground">{gift.recipient_name}</td>
                        <td className="py-3 px-3 text-muted-foreground" dir="ltr">{gift.recipient_phone}</td>
                        <td className="py-3 px-3">{gift.plan_name}</td>
                        <td className="py-3 px-3 font-semibold text-green-700">{Number(gift.amount).toLocaleString()} ر.س</td>
                        <td className="py-3 px-3">{gift.duration_months} {gift.duration_months === 1 ? "شهر" : "أشهر"}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded-lg tracking-widest">{gift.gift_code}</span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {new Date(gift.created_at).toLocaleDateString("ar-SA")}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {gift.redeemed_at ? new Date(gift.redeemed_at).toLocaleDateString("ar-SA") : "—"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGifts;
