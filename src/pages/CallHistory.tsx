import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Phone, PhoneOff, PhoneIncoming, Star, Clock, MessageSquare, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

type CallStatus = "مكتملة" | "فائتة" | "جارية";

interface CallRecord {
  id: number;
  reciterName: string;
  date: string;
  time: string;
  duration: string;
  status: CallStatus;
  rating?: number;
  notes?: string;
}

const callRecords: CallRecord[] = [
  { id: 1, reciterName: "عبدالعزيز اختبار طالب", date: "10/02/2026", time: "15:40", duration: "25 دقيقة", status: "جارية" },
  { id: 2, reciterName: "عبدالعزيز اختبار طالب", date: "09/02/2026", time: "17:06", duration: "-", status: "فائتة" },
  { id: 3, reciterName: "عبدالعزيز اختبار طالب", date: "28/01/2026", time: "21:33", duration: "45 دقيقة", status: "مكتملة", rating: 5, notes: "أداء ممتاز في سورة البقرة، يحتاج تحسين في أحكام الإدغام" },
  { id: 4, reciterName: "عبدالعزيز اختبار طالب", date: "28/01/2026", time: "21:24", duration: "30 دقيقة", status: "مكتملة", rating: 4 },
  { id: 5, reciterName: "عبدالعزيز اختبار طالب", date: "28/01/2026", time: "21:24", duration: "-", status: "فائتة" },
  { id: 6, reciterName: "عبدالعزيز اختبار طالب", date: "28/01/2026", time: "21:07", duration: "20 دقيقة", status: "مكتملة", rating: 3, notes: "مراجعة الجزء الثالث، التركيز على مخارج الحروف" },
  { id: 7, reciterName: "عبدالعزيز اختبار طالب", date: "28/01/2026", time: "21:06", duration: "35 دقيقة", status: "مكتملة", rating: 4 },
];

const statusConfig: Record<CallStatus, { color: string; bg: string; icon: typeof Phone }> = {
  "مكتملة": { color: "text-green-600", bg: "bg-green-100", icon: Phone },
  "فائتة": { color: "text-destructive", bg: "bg-destructive/10", icon: PhoneOff },
  "جارية": { color: "text-gold", bg: "bg-gold/10", icon: PhoneIncoming },
};

const CallHistory = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-6 rounded-b-[2rem] relative">
        <div className="flex items-center justify-center relative">
          <Link to="/profile" className="absolute right-0">
            <ChevronRight className="w-5 h-5 text-primary-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-primary-foreground">سجل الجلسات</h1>
          <button className="absolute left-0">
            <RefreshCw className="w-4 h-4 text-primary-foreground/70" />
          </button>
        </div>
        <p className="text-primary-foreground/70 text-sm text-center mt-2">تاريخ جلسات الإقراء مع المقرئين</p>
      </div>

      {/* Call List */}
      <div className="px-5 mt-6 space-y-3">
        {callRecords.map((call, idx) => {
          const config = statusConfig[call.status];
          const StatusIcon = config.icon;
          const isExpanded = expandedId === call.id;

          return (
            <motion.div
              key={call.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + idx * 0.06 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : call.id)}
                className="w-full p-4 flex items-center gap-3"
              >
                {/* Phone Icon */}
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <StatusIcon className={`w-5 h-5 ${config.color}`} />
                </div>

                {/* Info */}
                <div className="flex-1 text-right">
                  <p className="font-semibold text-foreground text-sm">{call.reciterName}</p>
                  <p className="text-[10px] text-muted-foreground">{call.time} - {call.date}</p>
                </div>

                {/* Status Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-semibold`}>
                  {call.status}
                </span>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                      {/* Duration */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">المدة:</span>
                        <span className="text-foreground font-medium">{call.duration}</span>
                      </div>

                      {/* Rating */}
                      {call.rating && (
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-gold" />
                          <span className="text-muted-foreground">التقييم:</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < call.rating! ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
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
    </div>
  );
};

export default CallHistory;
