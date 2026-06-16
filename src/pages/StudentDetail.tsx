import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, User, BookOpen, Clock, Trophy, Award,
  Star, Calendar, Phone, Video, MapPin, GraduationCap,
  Target, TrendingUp
} from "lucide-react";
import { ExamEvaluationsSection } from "@/components/exam-evaluation/ExamEvaluationsSection";

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !studentId) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", studentId)
        .eq("assigned_reciter_id", user.id)
        .maybeSingle(),
      supabase
        .from("student_achievements")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("session_records")
        .select("*")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([profileRes, achRes, sessionsRes]) => {
      setStudent(profileRes.data);
      setAchievements(achRes.data);
      setSessions(sessionsRes.data || []);
      setLoading(false);
    });
  }, [user, studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground">لم يتم العثور على بيانات الطالب</p>
        <button onClick={() => navigate(-1)} className="text-primary font-semibold">العودة</button>
      </div>
    );
  }

  const level = achievements ? Math.floor((achievements.total_minutes || 0) / 300) + 1 : 1;

  const statsCards = [
    { label: "الجلسات", value: achievements?.sessions_count || 0, icon: Calendar, color: "primary" },
    { label: "الدقائق", value: achievements?.total_minutes || 0, icon: Clock, color: "gold" },
    { label: "الأجزاء", value: `${achievements?.parts_memorized || 0}/30`, icon: BookOpen, color: "primary" },
    { label: "الصفحات", value: achievements?.pages_memorized || 0, icon: Target, color: "gold" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-10 rounded-b-[2.5rem] relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 right-5 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ArrowRight className="w-5 h-5 text-primary-foreground" />
        </button>

        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center pt-4"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">{student.full_name}</h1>
          <p className="text-sm text-primary-foreground/75 mt-1">
            {student.preferred_riwaya || student.preferred_track}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 text-gold fill-current" />
            <span className="text-sm font-bold text-primary-foreground">المستوى {level}</span>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 -mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-4 gap-2"
        >
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${stat.color === "gold" ? "bg-gold/20" : "bg-primary/10"
                }`}>
                <stat.icon className={`w-5 h-5 ${stat.color === "gold" ? "text-gold" : "text-primary"
                  }`} />
              </div>
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Personal Info */}
      <div className="px-5 mt-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            البيانات الشخصية
          </h2>
          <div className="space-y-3">
            {[
              { label: "الجنسية", value: student.nationality, icon: MapPin },
              { label: "بلد الإقامة", value: student.residence_country, icon: MapPin },
              { label: "المستوى التعليمي", value: student.education_level, icon: GraduationCap },
              { label: "المهنة", value: student.profession, icon: Target },
              { label: "الرواية المفضلة", value: student.preferred_riwaya, icon: BookOpen },
              { label: "المسار", value: student.preferred_track, icon: TrendingUp },
            ].filter(item => item.value).map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            المنجزات
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-primary">{achievements?.completions || 0}</span>
              <p className="text-[10px] text-muted-foreground mt-1">ختمات</p>
            </div>
            <div className="bg-gold/10 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-gold">{achievements?.certificates_count || 0}</span>
              <p className="text-[10px] text-muted-foreground mt-1">شهادات</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-primary">{achievements?.commitment_rate || 0}%</span>
              <p className="text-[10px] text-muted-foreground mt-1">نسبة الالتزام</p>
            </div>
            <div className="bg-gold/10 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-gold">{level}</span>
              <p className="text-[10px] text-muted-foreground mt-1">المستوى</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Sessions */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            آخر الجلسات
          </h2>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">لا توجد جلسات مسجلة</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{session.date}</p>
                    <p className="text-xs text-muted-foreground">{session.duration} • {session.status}</p>
                  </div>
                  <div className="text-left">
                    {session.parts_reached && (
                      <p className="text-xs text-primary">جزء {session.parts_reached}</p>
                    )}
                    {session.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: session.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-gold fill-current" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Contact Actions */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3"
        >
          <button className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" />
            اتصال
          </button>
          <button
            onClick={async () => {
              if (!user || !student?.user_id || isCalling) return;
              setIsCalling(true);
              try {
                const { data, error } = await supabase.functions.invoke("reciter-call", {
                  body: { student_id: student.user_id },
                });

                if (error) throw error;
                if (data?.error) throw new Error(data.error);

                navigate(`/call/${data.room_id}`);
              } catch (err: any) {
                toast({
                  title: "خطأ",
                  description: err?.message || "فشل في بدء المكالمة",
                  variant: "destructive",
                });
              } finally {
                setIsCalling(false);
              }
            }}
            disabled={isCalling}
            className="flex-1 bg-primary/10 text-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Video className="w-5 h-5" />
            {isCalling ? "جاري الاتصال..." : "مكالمة فيديو"}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDetail;
