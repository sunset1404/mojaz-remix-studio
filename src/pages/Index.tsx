import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Star, Calendar, Trophy, ChevronLeft, CalendarDays, Mic, Bell, Award, Headphones, Phone, Video, User, Gift, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOnlineReciters } from "@/hooks/useOnlineReciters";
import PopupMessageCard from "@/components/PopupMessageCard";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel } from
"@/components/ui/alert-dialog";

type StudentStats = {
  parts_memorized: number;
  sessions_count: number;
  certificates_count: number;
  commitment_rate: number;
};

type ReciterPreview = {
  user_id: string;
  full_name: string;
  preferred_track: string;
  avatar_url?: string | null;
};

type ActiveSubscription = {
  subscription_type: string;
  amount: number;
  duration_months: number;
  start_date: string;
  end_date: string;
  status: string;
};

type DebugPayment = {
  id: string;
  status: string;
  amount_sar: number;
  source_type: string;
  moyassar_payment_id: string | null;
  created_at: string | null;
};

type DebugTransaction = {
  id: string;
  title: string;
  amount: string;
  status: string;
  date: string;
};

const promoSlides = [
{ title: "القرآن الكريم", desc: "بمقرئين معتمدين", icon: BookOpen, bg: "gradient-primary", iconBg: "bg-gold/20", iconColor: "text-gold" },
{ title: "شهادات معتمدة", desc: "احصل على شهادات في الحفظ", icon: Award, bg: "gradient-gold", iconBg: "bg-primary/20", iconColor: "text-primary" },
{ title: "تلاوات مميزة", desc: "استمع بأصوات عذبة", icon: Headphones, bg: "gradient-primary", iconBg: "bg-gold/20", iconColor: "text-gold" }];


const quickStatsConfig = [
{ label: "أجزاء محفوظة", key: "parts_memorized" as keyof StudentStats, icon: BookOpen, color: "primary" },
{ label: "نجوم مكتسبة", key: "sessions_count" as keyof StudentStats, icon: Star, color: "gold" },
{ label: "التزام%", key: "commitment_rate" as keyof StudentStats, icon: Calendar, color: "primary" },
{ label: "شهادات", key: "certificates_count" as keyof StudentStats, icon: Trophy, color: "gold" }];


const features = [
{ title: "خطتي الأسبوعية", desc: "تابع تقدمك اليومي", icon: CalendarDays, color: "primary", path: "/weekly-plan" },
{ title: "إنجازاتي", desc: "شاهد تقدمك", icon: Trophy, color: "gold", path: "/achievements" }];

const Index = () => {
  const { user, avatarUrl } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userName, setUserName] = useState("");
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [topReciters, setTopReciters] = useState<ReciterPreview[]>([]);
  const [isIjazahTrack, setIsIjazahTrack] = useState(false);
  const [assignedReciter, setAssignedReciter] = useState<ReciterPreview | null>(null);
  const onlineReciterIds = useOnlineReciters();
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [totalMinutes, setTotalMinutes] = useState<number | null>(null);
  const [popupMessage, setPopupMessage] = useState<{id: string;title: string;message: string;icon: string;color_scheme: string;} | null>(null);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const showDebug = import.meta.env.MODE !== "production";
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError] = useState("");
  const [debugPayments, setDebugPayments] = useState<DebugPayment[]>([]);
  const [debugTransactions, setDebugTransactions] = useState<DebugTransaction[]>([]);
  const [debugHourCredits, setDebugHourCredits] = useState<number | null>(null);
  const [debugUpdatedAt, setDebugUpdatedAt] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    // Fetch student profile (name + gender for filtering)
    supabase.from("student_profiles").select("full_name, gender, preferred_track, assigned_reciter_id").eq("user_id", user.id).maybeSingle().
    then(({ data }) => {
      if (data?.full_name) {
        setUserName(data.full_name);
      } else {
        supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle().
        then(({ data: p }) => {if (p?.full_name) setUserName(p.full_name);});
      }

      // Check if ijazah track
      const isIjazah = data?.preferred_track === "الحصول على إجازة قرآنية";
      setIsIjazahTrack(isIjazah);

      if (isIjazah && data?.assigned_reciter_id) {
        // Fetch assigned reciter details
        supabase.from("reciter_profiles")
          .select("user_id, full_name, preferred_track, stamp_url")
          .eq("user_id", data.assigned_reciter_id)
          .maybeSingle()
          .then(({ data: reciterData }) => {
            if (reciterData) {
              setAssignedReciter({
                user_id: reciterData.user_id,
                full_name: reciterData.full_name,
                preferred_track: reciterData.preferred_track,
                avatar_url: reciterData.stamp_url ?? null,
              });
            }
          });
      } else if (!isIjazah) {
        // Fetch approved reciters filtered by same gender (normal track only)
        let reciterQuery = supabase.from("reciter_profiles").
        select("user_id, full_name, preferred_track, stamp_url").
        eq("status", "approved").
        limit(6);

        if (data?.gender) {
          reciterQuery = reciterQuery.eq("gender", data.gender);
        }

        reciterQuery.then(({ data: recitersData }) => {
          if (recitersData) {
            setTopReciters(recitersData.map((r) => ({
              user_id: r.user_id,
              full_name: r.full_name,
              preferred_track: r.preferred_track,
              avatar_url: r.stamp_url ?? null
            })));
          }
        });
      }
    });

    // Fetch active subscription
    supabase.from("student_subscriptions").
    select("subscription_type, amount, duration_months, start_date, end_date, status").
    eq("student_id", user.id).
    eq("status", "active").
    order("created_at", { ascending: false }).
    limit(1).
    maybeSingle().
    then(({ data }) => {
      if (data) {
        // Check if subscription has expired
        const endDate = new Date(data.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (endDate < today) {
          // Mark as expired in DB
          supabase.from("student_subscriptions").
          update({ status: "expired" }).
          eq("student_id", user.id).
          eq("status", "active").
          lte("end_date", today.toISOString().split("T")[0]).
          then(() => {
            // Show expired dialog only once per session
            const expiredKey = `subscription_expired_shown_${user.id}`;
            if (!sessionStorage.getItem(expiredKey)) {
              setShowExpiredDialog(true);
              sessionStorage.setItem(expiredKey, "1");
            }
          });
        } else {
          setActiveSubscription(data);
          // Fetch total minutes from the subscription plan
          supabase.from("subscription_plans")
            .select("monthly_minutes")
            .eq("name", data.subscription_type)
            .eq("is_active", true)
            .maybeSingle()
            .then(({ data: planData }) => {
              if (planData) setTotalMinutes(planData.monthly_minutes);
            });
        }
      } else {
        // Check if there's any expired subscription to show dialog
        supabase.from("student_subscriptions").
        select("id").
        eq("student_id", user.id).
        eq("status", "expired").
        limit(1).
        maybeSingle().
        then(({ data: expired }) => {
          if (expired) {
            const expiredKey = `subscription_expired_shown_${user.id}`;
            if (!sessionStorage.getItem(expiredKey)) {
              setShowExpiredDialog(true);
              sessionStorage.setItem(expiredKey, "1");
            }
          }
        });
      }
    });

    // Fetch remaining minutes
    supabase.from("student_hour_credits")
      .select("remaining_minutes")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRemainingMinutes(data.remaining_minutes);
      });
  }, [user]);

  const fetchDebugData = useCallback(async () => {
    if (!user) return;
    setDebugLoading(true);
    setDebugError("");
    try {
      const [paymentsRes, creditsRes, txRes] = await Promise.all([
      supabase.
      from("payment_invoice_metadata").
      select("id, status, amount_sar, source_type, moyassar_payment_id, created_at").
      eq("user_id", user.id).
      order("created_at", { ascending: false }).
      limit(5),
      (supabase as any).
      from("student_hour_credits").
      select("hours, updated_at").
      eq("user_id", user.id).
      maybeSingle(),
      supabase.
      from("transactions").
      select("id, title, amount, status, date").
      eq("user_id", user.id).
      order("created_at", { ascending: false }).
      limit(5)]
      );

      if (paymentsRes.error || creditsRes.error || txRes.error) {
        throw new Error("تعذر تحميل بيانات الاختبار");
      }

      setDebugPayments((paymentsRes.data || []) as DebugPayment[]);
      setDebugTransactions((txRes.data || []) as DebugTransaction[]);
      setDebugHourCredits(creditsRes.data?.hours ?? null);
      setDebugUpdatedAt(creditsRes.data?.updated_at ?? null);
    } catch (err: any) {
      setDebugError(err?.message || "تعذر تحميل بيانات الاختبار");
    } finally {
      setDebugLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (showDebug) {
      fetchDebugData();
    }
  }, [showDebug, fetchDebugData]);

  // Popup messages: check for relevant trigger events and show popup (persisted in DB)
  useEffect(() => {
    if (!user) return;

    const checkPopups = async () => {
      // Fetch all active popup messages for students
      const { data: popups } = await supabase.
      from("popup_messages" as any).
      select("*").
      eq("target_role", "student").
      eq("is_active", true);
      if (!popups || popups.length === 0) return;

      // Fetch already-shown events from DB
      const { data: viewedRows } = await supabase.
      from("popup_message_views" as any).
      select("trigger_event").
      eq("user_id", user.id);
      const viewedEvents = new Set((viewedRows || []).map((r: any) => r.trigger_event));

      // Check for recent certificates (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: recentCerts } = await supabase.
      from("certificates").
      select("id, type, created_at").
      eq("user_id", user.id).
      gte("created_at", sevenDaysAgo.toISOString()).
      order("created_at", { ascending: false });

      const triggeredEvents: string[] = [];

      if (recentCerts && recentCerts.length > 0) {
        const hasIjaza = recentCerts.some((c: any) => c.type === "ijaza");
        const hasCert = recentCerts.some((c: any) => c.type === "certificate");
        if (hasIjaza) triggeredEvents.push("ijaza_earned");
        if (hasCert) triggeredEvents.push("certificate_earned");
      }

      // Find first matching popup not shown before (persisted in DB)
      for (const event of triggeredEvents) {
        if (viewedEvents.has(event)) continue;

        const matching = (popups as any[]).find((p: any) => p.trigger_event === event);
        if (matching) {
          setPopupMessage({
            id: matching.id,
            title: matching.title,
            message: matching.message,
            icon: matching.icon,
            color_scheme: matching.color_scheme
          });
          // Persist in DB so it never shows again
          await supabase.from("popup_message_views" as any).insert({
            user_id: user.id,
            trigger_event: event,
            popup_message_id: matching.id
          });
          break;
        }
      }
    };

    checkPopups();
  }, [user]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);


  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="px-6 pt-10 pb-3">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-primary/20 bg-muted flex items-center justify-center shrink-0">
              {avatarUrl ?
              <img src={avatarUrl} alt="صورة المستخدم" className="w-full h-full object-cover" /> :

              <User className="w-5 h-5 text-muted-foreground" />
              }
            </div>
          <h1 className="text-2xl font-bold text-foreground font-cairo">
              أهلاً {userName ? userName.split(" ").slice(0, 2).join(" ") : "بك"} 👋
            </h1>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">

            <Bell className="w-5 h-5 text-primary" />
            {unreadCount > 0 &&
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gold rounded-full border-2 border-background" />
            }
          </button>
        </motion.div>
      </div>

      {/* Full-width Promo Carousel */}
      <div className="px-5 mb-2">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl"
          style={{ height: '150px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 30 }}
              className={`absolute inset-0 ${promoSlides[currentSlide].bg} rounded-2xl p-6 flex items-center gap-5`}>
              
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-white/5 -translate-x-10 -translate-y-10" />
              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-white/5 translate-x-8 translate-y-8" />
              
              <div className="relative z-10 flex items-center gap-5 w-full">
                <div className={`w-16 h-16 rounded-2xl ${promoSlides[currentSlide].iconBg} flex items-center justify-center shrink-0 shadow-lg`}>
                  {(() => {
                    const Icon = promoSlides[currentSlide].icon;
                    return <Icon className={`w-8 h-8 ${promoSlides[currentSlide].iconColor}`} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-primary-foreground leading-tight">{promoSlides[currentSlide].title}</h3>
                  <p className="text-sm mt-1 text-primary-foreground/80">{promoSlides[currentSlide].desc}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {promoSlides.map((_, i) =>
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlide ? "bg-primary-foreground w-6" : "bg-primary-foreground/40 w-2"}`
              } />
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 -mt-5 py-[19px]">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-4 gap-2">

          {quickStatsConfig.map((stat, i) => {
            const value = studentStats ? studentStats[stat.key] : 0;
            const displayValue = stat.key === "commitment_rate" ? `${Math.round(Number(value))}%` : String(value);
            return (
              <motion.div
                key={stat.label}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${
                stat.color === "gold" ? "bg-gold/20" : "bg-primary/10"}`}>
                <stat.icon className={`w-5 h-5 ${stat.color === "gold" ? "text-gold" : "text-primary"}`} />
              </div>
              <span className="text-lg font-bold text-foreground">{displayValue}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
            </motion.div>);

          })}
        </motion.div>
      </div>

      {/* Study Plan Card */}
      <div className="px-5 mt-3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}>
          <Link to="/weekly-plan" className="block">
            <div className="relative rounded-2xl overflow-hidden gradient-primary p-5 shadow-lg">
              <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-primary-foreground">خطتي الدراسية</h3>
                  <p className="text-sm text-primary-foreground/75 mt-0.5">نظّم جلسات القراءة وتابع تقدمك</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-primary-foreground/60 shrink-0" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>


      {/* Reciters Section */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}>

          {isIjazahTrack ? (
            /* Ijazah track: Show assigned reciter card */
            assignedReciter ? (() => {
              const isOnline = onlineReciterIds.includes(assignedReciter.user_id);
              return (
                <div className="relative rounded-2xl overflow-hidden p-5 shadow-lg bg-card border border-border/50">
                  {/* Decorative accent lines */}
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 -translate-y-10 translate-x-10" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-gold/5 translate-y-6 -translate-x-6" />
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: "linear-gradient(90deg, hsl(174 42% 35%), hsl(43 74% 49%))" }} />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-primary" />
                      </div>
                      <h2 className="font-bold text-foreground text-base">مقرئك المعتمد</h2>
                    </div>

                    {/* Reciter info */}
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-[72px] h-[72px] rounded-full overflow-hidden ring-2 ring-primary/20 shadow-md bg-muted flex items-center justify-center">
                          {assignedReciter.avatar_url ? (
                            <img src={assignedReciter.avatar_url} alt={assignedReciter.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-9 h-9 text-muted-foreground" />
                          )}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[2.5px] border-card ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-foreground font-bold text-lg leading-tight">{assignedReciter.full_name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                          <span className={`text-xs font-medium ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {isOnline ? 'متصل الآن' : 'غير متصل'}
                          </span>
                        </div>
                      </div>

                      {/* Call buttons */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => isOnline && navigate(`/reciters/${assignedReciter.user_id}`)}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isOnline ? 'bg-primary/10 hover:bg-primary/20 active:scale-95' : 'bg-muted/50 opacity-40 cursor-not-allowed'}`}
                          disabled={!isOnline}>
                          <Phone className="w-5 h-5 text-primary" />
                        </button>
                        <button
                          onClick={() => isOnline && navigate(`/reciters/${assignedReciter.user_id}`)}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isOnline ? 'bg-gold/15 hover:bg-gold/25 active:scale-95' : 'bg-muted/50 opacity-40 cursor-not-allowed'}`}
                          disabled={!isOnline}>
                          <Video className="w-5 h-5 text-gold" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="glass-card rounded-2xl p-5 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Mic className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-1">لم يتم تعيين مقرئ بعد</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">سيظهر مقرئك هنا بعد اجتياز اختبار القبول وتسكينك من قبل الإدارة</p>
              </div>
            )
          ) : (
            /* Normal track: Show reciters list */
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-bold text-foreground text-base">المقرئون</h2>
                </div>
                <Link to="/reciters" className="flex items-center gap-1 text-xs text-primary font-semibold">
                  المزيد <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {topReciters.length === 0 &&
                <p className="text-xs text-muted-foreground py-4 px-2">لا يوجد مقرئون متاحون حالياً</p>
                }
                {topReciters.map((reciter, i) =>
                <motion.div
                  key={reciter.user_id}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  whileTap={{ scale: 0.97 }}>
                    <div className="flex flex-col items-center gap-2.5 w-[110px] bg-card rounded-2xl p-3 border border-border/50 shadow-sm">
                      <Link to="/reciters" className="flex flex-col items-center gap-2 w-full">
                        <div className="relative">
                          <div className="w-[64px] h-[64px] rounded-full overflow-hidden ring-2 ring-primary/20 shadow-md bg-muted flex items-center justify-center">
                            {reciter.avatar_url ?
                          <img src={reciter.avatar_url} alt={reciter.full_name} className="w-full h-full object-cover" /> :
                          <User className="w-8 h-8 text-muted-foreground" />
                            }
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-card ${onlineReciterIds.includes(reciter.user_id) ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                        </div>
                        <span className="text-xs font-semibold text-foreground text-center leading-tight line-clamp-2">
                          {reciter.full_name}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 w-full justify-center">
                        <button className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all">
                          <Video className="w-4 h-4 text-primary" />
                        </button>
                        <button className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all">
                          <Phone className="w-4 h-4 text-primary" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>


      {/* Subscription Card */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileTap={{ scale: 0.98 }}>
          <Link to="/subscription" className="block">
            <div className="relative rounded-2xl overflow-hidden gradient-primary p-5 shadow-xl">
              <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
              <div className="relative z-10 flex items-center gap-4">
                {activeSubscription ? (() => {
                  const end = new Date(activeSubscription.end_date);
                  const now = new Date();
                  const start = new Date(activeSubscription.start_date);
                  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                  const pct = totalDays > 0 ? Math.round(daysLeft / totalDays * 100) : 0;
                  return (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gold text-lg">✦</span>
                          <span className="text-primary-foreground text-xs font-bold bg-gold/20 px-3 py-1 rounded-full">{activeSubscription.subscription_type}</span>
                        </div>
                        <h3 className="text-primary-foreground font-bold text-lg">{daysLeft} يوم متبقي</h3>
                        <p className="text-primary-foreground/70 text-xs mt-1">ينتهي في {activeSubscription.end_date}</p>
                        {totalMinutes !== null && remainingMinutes !== null && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-primary-foreground/80 text-[11px]">
                              <span>الإجمالي: {Math.round(totalMinutes / 60)} ساعة</span>
                              <span>•</span>
                              <span>المتبقي: {Math.round(remainingMinutes / 60)} ساعة</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gold rounded-full transition-all"
                                style={{ width: `${Math.min(100, totalMinutes > 0 ? (remainingMinutes / totalMinutes) * 100 : 0)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-16 rounded-full bg-gold/20 border-[3px] border-gold/40 flex items-center justify-center shadow-lg">
                          <span className="text-primary-foreground font-extrabold text-base">{pct}%</span>
                        </div>
                        <span className="text-primary-foreground/80 text-[10px] font-medium">متبقي</span>
                      </div>
                    </>);

                })() :
                <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-gold" />
                        <span className="text-primary-foreground text-xs font-bold bg-gold/20 px-3 py-1 rounded-full">لا يوجد اشتراك نشط</span>
                      </div>
                      <h3 className="text-primary-foreground font-bold text-lg">اشترك الآن</h3>
                      <p className="text-primary-foreground/70 text-xs mt-1">استمتع بجلسات قرآنية مع مقرئين معتمدين</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gold/20 border-2 border-gold/30 flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5 text-primary-foreground/70" />
                    </div>
                  </>
                }
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Gift Subscription Card */}
      <div className="px-5 mt-5 mb-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          whileTap={{ scale: 0.98 }}>
          <Link to="/gift" className="block">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[hsl(43,74%,49%)] to-[hsl(43,74%,38%)] p-5 shadow-xl">
              <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">أهدِ القرآن لمن تحب</h3>
                  <p className="text-white/75 text-xs mt-0.5">اشتراك قرآني هدية ذات أثر باقٍ 🎁</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-white/60 shrink-0" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {showDebug &&
      <div className="px-5 mt-6">
          




































































        </div>
      }

      <PopupMessageCard message={popupMessage} onClose={() => setPopupMessage(null)} />

      {/* Expired Subscription Dialog */}
      <AlertDialog open={showExpiredDialog} onOpenChange={setShowExpiredDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-lg">
              ⏰ انتهى اشتراكك
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm leading-relaxed">
              انتهت مدة اشتراكك الحالي. يمكنك تجديد اشتراكك بإحدى الباقات المتاحة أو شراء رصيد ساعات إضافية لمتابعة رحلتك القرآنية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => navigate("/subscription")}
              className="w-full gradient-primary text-primary-foreground rounded-xl">

              تصفح الباقات
            </AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-xl mt-0">
              لاحقاً
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

};

export default Index;