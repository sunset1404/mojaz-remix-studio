import { motion } from "framer-motion";
import { Gift, Check, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const RedeemGift = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [giftInfo, setGiftInfo] = useState<{ planName: string; duration: number } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({ title: "يرجى إدخال كود الهدية", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Look up & redeem via secure RPC
    const { data: result, error: rpcError } = await (supabase as any).rpc("redeem_gift_by_code", {
      p_code: code.trim().toUpperCase(),
    });

    setLoading(false);

    if (rpcError || !result?.success) {
      toast({ title: "كود الهدية غير صالح أو تم استخدامه مسبقاً", variant: "destructive" });
      return;
    }

    setGiftInfo({ planName: result.plan_name, duration: result.duration_months });
    setRedeemed(true);
  };

  if (redeemed && giftInfo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">تم تفعيل الهدية! 🎉</h2>
          <p className="text-muted-foreground mb-2">باقة: {giftInfo.planName}</p>
          <p className="text-muted-foreground mb-6">المدة: {giftInfo.duration} {giftInfo.duration === 1 ? "شهر" : giftInfo.duration < 11 ? "أشهر" : "شهر"}</p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="gradient-primary text-primary-foreground font-bold py-3 px-8 rounded-xl text-sm"
          >
            ابدأ رحلتك القرآنية
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تفعيل هدية</h1>
          <p className="text-muted-foreground text-sm">أدخل كود الهدية لتفعيل اشتراكك القرآني</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">كود الهدية</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="GIFT-XXXXXXXX"
              className="text-center text-lg font-bold tracking-widest"
              dir="ltr"
              maxLength={20}
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRedeem}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-[hsl(43,74%,45%)] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Gift className="w-5 h-5" />
                تفعيل الهدية
              </>
            )}
          </motion.button>
        </div>

        {!user && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            ليس لديك حساب؟{" "}
            <button onClick={() => navigate("/signup")} className="text-primary font-semibold underline">
              سجّل الآن
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default RedeemGift;
