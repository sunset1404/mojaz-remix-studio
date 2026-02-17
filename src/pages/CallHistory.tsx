import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Phone, PhoneOff, PhoneIncoming, Star, Clock, MessageSquare, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type CallStatus = "مكتملة" | "فائتة" | "جارية";

interface CallRecord {
  id: string;
  other_user_name: string;
  date: string;
  time: string;
  duration: string;
  status: string;
  rating: number | null;
  notes: string | null;
}

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Phone }> = {
  "مكتملة": { color: "text-green-600", bg: "bg-green-100", icon: Phone },
  "فائتة": { color: "text-destructive", bg: "bg-destructive/10", icon: PhoneOff },
  "جارية": { color: "text-gold", bg: "bg-gold/10", icon: PhoneIncoming },
};

const CallHistory = () => {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);

  const fetchRecords = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("session_records")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setCallRecords(data);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-6 rounded-b-[2rem] relative">
        <div className="flex items-center justify-center relative">
          <Link to="/profile" className="absolute right-0">
            <ChevronRight className="w-5 h-5 text-primary-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-primary-foreground">سجل الجلسات</h1>
          <button className="absolute left-0" onClick={fetchRecords}>
            <RefreshCw className="w-4 h-4 text-primary-foreground/70" />
          </button>
        </div>
        <p className="text-primary-foreground/70 text-sm text-center mt-2">تاريخ جلسات الإقراء مع المقرئين</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : callRecords.length === 0 ? (
        <div className="px-5 mt-6">
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">لا توجد جلسات سابقة</p>
          </div>
        </div>
      ) : (
        <div className="px-5 mt-6 space-y-3">
          {callRecords.map((call, idx) => {
            const config = statusConfig[call.status] || statusConfig["مكتملة"];
            const StatusIcon = config.icon;
            const isExpanded = expandedId === call.id;

            return (
              <motion.div key={call.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 + idx * 0.06 }} className="glass-card rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : call.id)} className="w-full p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-semibold text-foreground text-sm">{call.other_user_name}</p>
                    <p className="text-[10px] text-muted-foreground">{call.time} - {call.date}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-semibold`}>
                    {call.status}
                  </span>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">المدة:</span>
                          <span className="text-foreground font-medium">{call.duration}</span>
                        </div>
                        {call.rating && (
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-gold" />
                            <span className="text-muted-foreground">التقييم:</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < call.rating! ? "fill-gold text-gold" : "text-muted-foreground/30"}`} />
                              ))}
                            </div>
                          </div>
                        )}
                        {call.notes && (
                          <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-semibold text-foreground">ملاحظات المقرئ:</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{call.notes}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CallHistory;
