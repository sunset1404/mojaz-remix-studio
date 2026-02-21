import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, User, Filter, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface SessionRecord {
  id: string;
  other_user_name: string;
  date: string;
  time: string;
  duration: string;
  status: string;
  rating: number | null;
  notes: string | null;
}

const ReciterSessionLog = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "مكتملة" | "ملغاة">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("session_records")
      .select("id, other_user_name, date, time, duration, status, rating, notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSessions(data || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = sessions.filter((s) => {
    const matchSearch = s.other_user_name.includes(search);
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const totalSessions = sessions.filter((s) => s.status === "مكتملة").length;
  const totalHours = sessions
    .filter((s) => s.status === "مكتملة")
    .reduce((acc, s) => {
      const nums = s.duration.replace(/[^0-9]/g, "");
      return acc + (parseInt(nums) || 0);
    }, 0);

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-[2.5rem]">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-primary-foreground mb-1 flex items-center justify-center gap-2"
        >
          <Calendar className="w-6 h-6" />
          سجل الجلسات
        </motion.h1>
        <p className="text-sm text-primary-foreground/80 text-center">جميع جلساتك مع الطلاب</p>
      </div>

      {/* Stats */}
      <div className="px-5 mt-5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">{totalSessions}</span>
            <p className="text-[11px] text-muted-foreground">جلسة مكتملة</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xl font-bold text-foreground">{totalHours}</span>
            <p className="text-[11px] text-muted-foreground">دقيقة إقراء</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-5 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم الطالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "مكتملة", "ملغاة"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {f === "all" ? "الكل" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      <div className="px-5 space-y-3">
        {loading ? (
          <div className="text-center py-10">
            <span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full inline-block" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">لا توجد جلسات</div>
        ) : (
          filtered.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{session.other_user_name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{session.date}</span>
                    <span>•</span>
                    <span>{session.time}</span>
                    <span>•</span>
                    <span>{session.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {session.status === "مكتملة" ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-xs font-medium ${session.status === "مكتملة" ? "text-primary" : "text-destructive"}`}>
                    {session.status}
                  </span>
                </div>
              </div>
              {session.rating && (
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx} className={`text-sm ${idx < session.rating! ? "text-gold" : "text-border"}`}>★</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReciterSessionLog;
