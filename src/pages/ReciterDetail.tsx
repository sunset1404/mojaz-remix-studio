import { motion } from "framer-motion";
import { ArrowRight, User, Phone, Video, MapPin, Briefcase, BookOpen, GraduationCap, Calendar, Clock, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

type ReciterProfile = {
  id: string;
  user_id: string;
  full_name: string;
  preferred_track: string;
  stamp_url: string | null;
  city: string;
  nationality: string;
  profession: string;
  qualifications: string;
  quran_certifications: string;
  teaching_experience: string;
  preferred_days: string[];
  preferred_times: string[];
  gender: string;
};



const ReciterDetail = () => {
  const { reciterId } = useParams<{ reciterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const onlineReciters = useOnlineReciters();
  const [reciter, setReciter] = useState<ReciterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
  const [noCreditsMessage, setNoCreditsMessage] = useState("");

  useEffect(() => {
    const fetchReciter = async () => {
      if (!reciterId) return;

      const { data: reciterData } = await supabase
          .from("reciter_profiles")
          .select("id, user_id, full_name, preferred_track, stamp_url, city, nationality, profession, qualifications, quran_certifications, teaching_experience, preferred_days, preferred_times, gender")
          .eq("user_id", reciterId)
          .eq("status", "approved")
          .maybeSingle();

      setReciter(reciterData);
      setLoading(false);
    };
    fetchReciter();
  }, [reciterId]);

  const handleCall = async () => {
    if (!user || !reciter) {
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
        const errorBody = error.message ? JSON.parse(error.message || "{}") : {};
        if (errorBody?.error === "no_credits" || errorBody?.error === "no_subscription") {
          setNoCreditsMessage(errorBody.message || "نفذ رصيد ساعاتك");
          setShowNoCreditsDialog(true);
          return;
        }
        throw error;
      }

      if (data?.error === "no_credits" || data?.error === "no_subscription") {
        setNoCreditsMessage(data.message || "نفذ رصيد ساعاتك");
        setShowNoCreditsDialog(true);
        return;
      }

      if (data?.error) throw new Error(data.error);

      toast({ title: "جاري الاتصال...", description: `بانتظار رد ${reciter.full_name}` });
      navigate(`/call/${data.room_id}?role=caller`);
    } catch (err: any) {
      console.error("Call error:", err);
      try {
        const parsed = JSON.parse(err?.message || "{}");
        if (parsed?.error === "no_credits" || parsed?.error === "no_subscription") {
          setNoCreditsMessage(parsed.message || "نفذ رصيد ساعاتك");
          setShowNoCreditsDialog(true);
          return;
        }
      } catch {}
      toast({ title: "فشل بدء المكالمة", description: err.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setCallingId(null);
    }
  };

  const isOnline = reciter ? onlineReciters.includes(reciter.user_id) : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24" dir="rtl">
        <div className="gradient-primary px-6 pt-12 pb-20 rounded-b-[2.5rem]" />
        <div className="px-5 -mt-14 space-y-4">
          <div className="bg-card rounded-2xl p-6 shadow-lg animate-pulse">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reciter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">لم يتم العثور على المقرئ</p>
          <button onClick={() => navigate(-1)} className="text-primary font-semibold">العودة</button>
        </div>
      </div>
    );
  }

  const infoItems = [
    { icon: MapPin, label: "المدينة", value: reciter.city },
    { icon: Briefcase, label: "المهنة", value: reciter.profession },
    { icon: GraduationCap, label: "المؤهلات", value: reciter.qualifications },
    { icon: BookOpen, label: "المسار", value: reciter.preferred_track },
  ].filter(item => item.value);

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-20 rounded-b-[2.5rem] relative">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-primary-foreground" />
          </button>
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-bold text-primary-foreground"
          >
            ملف المقرئ
          </motion.h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-5 -mt-14">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-primary/20">
                {reciter.stamp_url ? (
                  <img src={reciter.stamp_url} alt={reciter.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <span className={`absolute bottom-1 left-1 w-4 h-4 rounded-full border-2 border-card ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
            <h2 className="text-xl font-bold text-foreground">{reciter.full_name}</h2>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
              {isOnline ? "متاح الآن" : "غير متصل"}
            </span>
          </div>

          {/* Call Buttons */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={handleCall}
              disabled={callingId === reciter.user_id || !isOnline}
              className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-30"
            >
              <Phone className="w-5 h-5" />
              اتصال صوتي
            </button>
            <button
              onClick={handleCall}
              disabled={callingId === reciter.user_id || !isOnline}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-all disabled:opacity-30"
            >
              <Video className="w-5 h-5" />
              مكالمة فيديو
            </button>
          </div>
        </motion.div>
      </div>

      {/* Certifications from profile */}
      {reciter.quran_certifications && (
        <div className="px-5 mt-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-5 shadow-sm"
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              الإجازات القرآنية
            </h3>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{reciter.quran_certifications}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Info Section */}
      {infoItems.length > 0 && (
        <div className="px-5 mt-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-5 shadow-sm"
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              معلومات المقرئ
            </h3>
            <div className="space-y-3">
              {infoItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Teaching Experience / Achievements */}
      {reciter.teaching_experience && (
        <div className="px-5 mt-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-2xl p-5 shadow-sm"
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              أبرز المحطات التعليمية والمنجزات
            </h3>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{reciter.teaching_experience}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Schedule */}
      {(reciter.preferred_days.length > 0 || reciter.preferred_times.length > 0) && (
        <div className="px-5 mt-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-5 shadow-sm"
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              أوقات التواجد
            </h3>
            {reciter.preferred_days.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">الأيام المفضلة</p>
                <div className="flex flex-wrap gap-2">
                  {reciter.preferred_days.map((day, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {reciter.preferred_times.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">الأوقات المفضلة</p>
                <div className="flex flex-wrap gap-2">
                  {reciter.preferred_times.map((time, i) => {
                    const convertTo12 = (t: string) => {
                      const match = t.match(/^(\d{1,2}):(\d{2})$/);
                      if (!match) return t;
                      let h = parseInt(match[1]);
                      const m = match[2];
                      const period = h >= 12 ? "م" : "ص";
                      if (h === 0) h = 12;
                      else if (h > 12) h -= 12;
                      return `${h}:${m} ${period}`;
                    };
                    const formatted = time.includes(" - ")
                      ? time.split(" - ").map(convertTo12).join(" - ")
                      : convertTo12(time);
                    return (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary/70" />
                        {formatted}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
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
            <AlertDialogAction onClick={() => navigate("/subscription")} className="gradient-primary text-primary-foreground rounded-xl">
              تجديد الاشتراك
            </AlertDialogAction>
            <AlertDialogAction onClick={() => navigate("/subscription")} className="bg-gold text-white rounded-xl hover:bg-gold/90">
              شراء ساعات إضافية
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReciterDetail;
