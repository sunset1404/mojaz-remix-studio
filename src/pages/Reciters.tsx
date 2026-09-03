import { motion } from "framer-motion";
import { Star, Phone, Search, Heart, Mic, User, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineReciters } from "@/hooks/useOnlineReciters";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";



type Reciter = {
  id: string;
  user_id: string;
  full_name: string;
  preferred_track: string;
  stamp_url: string | null;
  certifications: string[];
};

type FilterType = "all" | "available" | "favorites";

const Reciters = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
  const [noCreditsMessage, setNoCreditsMessage] = useState("");
  const [ijazahStatus, setIjazahStatus] = useState<string | null>(null); // null = not ijazah student
  const [isIjazahStudent, setIsIjazahStudent] = useState(false);
  const onlineReciters = useOnlineReciters();

  const handleCall = async (reciter: Reciter) => {
    if (!user) {
      toast({ title: "يرجى تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }
    if (callingId) return;
    setCallingId(reciter.user_id);

    try {
      const { data, error } = await supabase.functions.invoke("request-call", {
        body: { reciter_id: reciter.user_id },
      });

      if (error) {
        // Check if it's a credits/subscription error from edge function
        const errorBody = error.message ? JSON.parse(error.message || "{}") : {};
        if (errorBody?.error === "no_credits" || errorBody?.error === "no_subscription") {
          setNoCreditsMessage(errorBody.message || "نفذ رصيد ساعاتك");
          setShowNoCreditsDialog(true);
          return;
        }
        throw error;
      }

      // Check for error in response body (403 returns as data, not error)
      if (data?.error === "no_credits" || data?.error === "no_subscription") {
        setNoCreditsMessage(data.message || "نفذ رصيد ساعاتك");
        setShowNoCreditsDialog(true);
        return;
      }

      if (data?.error) throw new Error(data.message || data.error);

      toast({ title: "جاري الاتصال...", description: `بانتظار رد ${reciter.full_name}` });
      navigate(`/call/${data.room_id}?role=caller`);
    } catch (err: unknown) {
      console.error("Call error:", err);
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
      // Try to parse JSON error from edge function
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed?.error === "no_credits" || parsed?.error === "no_subscription") {
          setNoCreditsMessage(parsed.message || "نفذ رصيد ساعاتك");
          setShowNoCreditsDialog(true);
          return;
        }
      } catch {
        // The error is already represented by its plain message below.
      }
      toast({ title: "فشل بدء المكالمة", description: errorMessage, variant: "destructive" });
    } finally {
      setCallingId(null);
    }
  };

  useEffect(() => {
    const fetchReciters = async () => {
      let studentGender: string | null = null;
      let studentTrack: string | null = null;
      let assignedReciterId: string | null = null;
      let studentIjazahStatus: string | null = null;

      if (user) {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("gender, preferred_track, assigned_reciter_id, ijazah_status")
          .eq("user_id", user.id)
          .maybeSingle();
        studentGender = profile?.gender ?? null;
        studentTrack = profile?.preferred_track ?? null;
        assignedReciterId = profile?.assigned_reciter_id ?? null;
        studentIjazahStatus = profile?.ijazah_status ?? null;
      }

      // Check if ijazah student
      const isIjazah = studentTrack === "الحصول على إجازة قرآنية";
      setIsIjazahStudent(isIjazah);
      setIjazahStatus(studentIjazahStatus);

      // If ijazah student without assigned reciter, show message only
      if (isIjazah && !assignedReciterId) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("reciter_profiles")
        .select("id, user_id, full_name, preferred_track, stamp_url")
        .eq("status", "approved");

      // Ijazah students only see their assigned reciter
      if (isIjazah && assignedReciterId) {
        query = query.eq("user_id", assignedReciterId);
      } else if (studentGender) {
        query = query.eq("gender", studentGender);
      }

      const { data } = await query;

      // Fetch certifications for all reciters
      const reciterUserIds = (data ?? []).map(r => r.user_id);
      const certMap: Record<string, string[]> = {};
      
      if (reciterUserIds.length > 0) {
        const { data: certs } = await supabase
          .from("reciter_certifications")
          .select("reciter_id, type, riwaya, certification_text")
          .in("reciter_id", reciterUserIds);
        
        (certs ?? []).forEach(c => {
          const label = c.riwaya || c.certification_text || (c.type === 'khatm' ? 'ختم القرآن' : 'إجازة');
          if (!certMap[c.reciter_id]) certMap[c.reciter_id] = [];
          certMap[c.reciter_id].push(label);
        });
      }

      const recitersWithCerts: Reciter[] = (data ?? []).map(r => ({
        ...r,
        certifications: certMap[r.user_id] || [],
      }));

      setReciters(recitersWithCerts);

      // Fetch queue counts for all reciters
      if (reciterUserIds.length > 0) {
        const { data: queueData } = await supabase
          .from("video_call_sessions")
          .select("reciter_id")
          .in("reciter_id", reciterUserIds)
          .eq("status", "waiting")
          .eq("caller_role", "student");
        
        const counts: Record<string, number> = {};
        (queueData ?? []).forEach(q => {
          counts[q.reciter_id] = (counts[q.reciter_id] || 0) + 1;
        });
        setQueueCounts(counts);
      }

      setLoading(false);
    };
    fetchReciters();
  }, [user]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const filtered = reciters.filter((r) => {
    const matchSearch = r.full_name.includes(search) || (r.preferred_track || "").includes(search);
    const isOnline = onlineReciters.includes(r.user_id);
    const matchFilter =
      filter === "all" ||
      (filter === "available" && isOnline) ||
      (filter === "favorites" && favorites.includes(r.id));
    return matchSearch && matchFilter;
  });

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "الجميع" },
    { key: "available", label: "متاح الآن" },
    { key: "favorites", label: "المفضلة" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-[2.5rem]">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-primary-foreground mb-4 flex items-center justify-center gap-2"
        >
          <Mic className="w-6 h-6" />
          المقرئون
        </motion.h1>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مقرئ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-primary-foreground/95 border-0 pr-10 rounded-xl text-foreground placeholder:text-muted-foreground"
          />
        </motion.div>
      </div>

      {/* Ijazah student without assigned reciter - show notice */}
      {isIjazahStudent && reciters.length === 0 && !loading ? (
        <div className="px-5 mt-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gold" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">مسار الإجازة القرآنية</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ijazahStatus === "pending_test"
                ? "سيتم إظهار المقرئ المخصص لك بعد اجتياز اختبار القبول. يرجى متابعة موعد الاختبار والاستعداد له."
                : "جاري معالجة طلبك. سيتم تعيين مقرئ لك قريباً بإذن الله."}
            </p>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Filter Tabs - hide for ijazah students */}
          {!isIjazahStudent && (
            <div className="px-5 mt-4 flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === tab.key
                    ? "gradient-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Reciters List */}
          <div className="px-5 mt-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {filter === "favorites" ? "لم تقم بإضافة أي مقرئ للمفضلة بعد" : "لا يوجد مقرئون معتمدون حالياً"}
          </div>
        )}

        {!loading && filtered.map((reciter, i) => (
          <div
            key={reciter.id}
            onClick={() => navigate(`/reciters/${reciter.user_id}`)}
            className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
          >
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-muted flex items-center justify-center">
              {reciter.stamp_url ? (
                <img src={reciter.stamp_url} alt={reciter.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-muted-foreground" />
              )}
              {(() => {
                const isOnline = onlineReciters.includes(reciter.user_id);
                return (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                );
              })()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">{reciter.full_name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {reciter.certifications.length > 0
                  ? reciter.certifications.join(" • ")
                  : reciter.preferred_track || "—"}
              </p>
              {(() => {
                const isOnline = onlineReciters.includes(reciter.user_id);
                const qCount = queueCounts[reciter.user_id] || 0;
                const estimatedMinutes = qCount * 30;
                if (!isOnline) {
                  return (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground">غير متصل</span>
                    </div>
                  );
                }
                return qCount > 0 ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-semibold text-gold">
                      {qCount} في الطابور • ~{estimatedMinutes} د انتظار
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-semibold text-primary">متاح فوراً</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(reciter.id); }}
                className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-destructive/10 transition-colors"
              >
                <Heart className={`w-4 h-4 ${favorites.includes(reciter.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCall(reciter); }}
                disabled={callingId === reciter.user_id || !onlineReciters.includes(reciter.user_id)}
                className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-30"
              >
                <Phone className="w-4 h-4 text-primary" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCall(reciter); }}
                disabled={callingId === reciter.user_id || !onlineReciters.includes(reciter.user_id)}
                className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-30"
              >
                <Video className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {/* No Credits Dialog */}
      <AlertDialog open={showNoCreditsDialog} onOpenChange={setShowNoCreditsDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm mx-auto" dir="rtl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-lg">نفذ رصيد الساعات</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              {noCreditsMessage || "لا يوجد لديك رصيد كافٍ لبدء مكالمة. يرجى تجديد اشتراكك أو شراء ساعات إضافية."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => navigate("/subscription")}
              className="gradient-primary text-primary-foreground rounded-xl"
            >
              تجديد الاشتراك
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => navigate("/subscription")}
              className="bg-gold text-white rounded-xl hover:bg-gold/90"
            >
              شراء ساعات إضافية
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reciters;
