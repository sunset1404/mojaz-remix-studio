import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Mail, MapPin, Calendar, ChevronRight, Camera, Save, Pencil, Loader2, Briefcase, GraduationCap, BookOpen, Clock, Shield, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FieldDef = {
  icon: React.ElementType;
  key: string;
  label: string;
  type: "text" | "tel" | "email" | "textarea";
  editable: boolean;
  section: string;
};

const studentFields: FieldDef[] = [
  { icon: User, key: "name", label: "الاسم الكامل", type: "text", editable: true, section: "personal" },
  { icon: User, key: "gender", label: "الجنس", type: "text", editable: false, section: "personal" },
  { icon: Globe, key: "nationality", label: "الجنسية", type: "text", editable: false, section: "personal" },
  { icon: Phone, key: "phone", label: "رقم الجوال", type: "tel", editable: true, section: "personal" },
  { icon: Mail, key: "email", label: "البريد الإلكتروني", type: "email", editable: false, section: "personal" },
  { icon: GraduationCap, key: "educationLevel", label: "المؤهل الدراسي", type: "text", editable: false, section: "personal" },
  { icon: Calendar, key: "joinDate", label: "تاريخ الانضمام", type: "text", editable: false, section: "personal" },
  // الهدف والمسار
  { icon: BookOpen, key: "preferredTrack", label: "المسار القرآني", type: "text", editable: false, section: "goal" },
  { icon: BookOpen, key: "preferredRiwaya", label: "الرواية", type: "text", editable: false, section: "goal" },
];

const reciterFields: FieldDef[] = [
  // البيانات الشخصية
  { icon: User, key: "name", label: "الاسم الكامل", type: "text", editable: true, section: "personal" },
  { icon: User, key: "gender", label: "الجنس", type: "text", editable: false, section: "personal" },
  { icon: MapPin, key: "nationality", label: "الجنسية", type: "text", editable: false, section: "personal" },
  { icon: Shield, key: "idNumber", label: "رقم الهوية", type: "text", editable: false, section: "personal" },
  { icon: Phone, key: "phone", label: "رقم الجوال", type: "tel", editable: true, section: "personal" },
  { icon: Mail, key: "email", label: "البريد الإلكتروني", type: "email", editable: false, section: "personal" },
  { icon: MapPin, key: "city", label: "مدينة الإقامة", type: "text", editable: true, section: "personal" },
  { icon: Calendar, key: "joinDate", label: "تاريخ الانضمام", type: "text", editable: false, section: "personal" },
  // المؤهلات والخبرات
  { icon: Briefcase, key: "profession", label: "المهنة", type: "text", editable: true, section: "qualifications" },
  { icon: GraduationCap, key: "qualifications", label: "المؤهلات العلمية", type: "text", editable: true, section: "qualifications" },
  { icon: BookOpen, key: "quranCertifications", label: "الإجازات القرآنية", type: "textarea", editable: true, section: "qualifications" },
  { icon: BookOpen, key: "teachingExperience", label: "الخبرات التعليمية", type: "textarea", editable: true, section: "qualifications" },
  // تفضيلات الإقراء
  { icon: Calendar, key: "preferredDays", label: "أيام الإقراء المفضلة", type: "text", editable: false, section: "preferences" },
  { icon: Clock, key: "preferredTimes", label: "أوقات الإقراء المفضلة", type: "text", editable: false, section: "preferences" },
  { icon: BookOpen, key: "preferredTrack", label: "مسار الإقراء", type: "text", editable: false, section: "preferences" },
];

const sectionTitles: Record<string, { title: string; icon: React.ElementType }> = {
  personal: { title: "البيانات الشخصية", icon: User },
  qualifications: { title: "المؤهلات والخبرات", icon: GraduationCap },
  preferences: { title: "تفضيلات الإقراء", icon: Clock },
  goal: { title: "الهدف والمسار", icon: BookOpen },
};

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const email = user.email || "";

      if (role === "reciter") {
        const { data } = await supabase
          .from("reciter_profiles")
          .select("id, user_id, full_name, gender, nationality, city, created_at, profession, qualifications, quran_certifications, teaching_experience, preferred_days, preferred_times, preferred_track")
          .eq("user_id", user.id)
          .maybeSingle();
        // Fetch sensitive fields (id_number, phone) via secured RPC
        const { data: sensitive } = await (supabase as any).rpc("get_my_reciter_sensitive");
        const s = Array.isArray(sensitive) && sensitive[0] ? sensitive[0] : {};
        if (data) {
          setForm({
            name: data.full_name,
            gender: data.gender === "male" ? "ذكر" : data.gender === "female" ? "أنثى" : data.gender,
            nationality: data.nationality,
            idNumber: s.id_number || "",
            phone: s.phone || "",
            email,
            city: data.city,
            joinDate: new Date(data.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
            profession: data.profession,
            qualifications: data.qualifications,
            quranCertifications: data.quran_certifications,
            teachingExperience: data.teaching_experience,
            preferredDays: data.preferred_days?.join("، ") || "",
            preferredTimes: data.preferred_times?.join("، ") || "",
            preferredTrack: data.preferred_track || "",
          });
        }
      } else if (role === "student") {
        const { data } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setForm({
            name: data.full_name,
            gender: data.gender === "male" ? "ذكر" : data.gender === "female" ? "أنثى" : data.gender,
            nationality: data.nationality,
            phone: data.phone,
            email: data.email || email,
            educationLevel: data.education_level,
            joinDate: new Date(data.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
            preferredTrack: data.preferred_track || "",
            preferredRiwaya: data.preferred_riwaya || "",
          });
        } else {
          // Fallback: student profile not created yet, use profiles table
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, phone, created_at")
            .eq("user_id", user.id)
            .maybeSingle();
          if (profileData) {
            setForm({
              name: profileData.full_name || "",
              gender: "",
              nationality: "",
              phone: profileData.phone || "",
              email,
              educationLevel: "",
              joinDate: new Date(profileData.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
              preferredTrack: "",
              preferredRiwaya: "",
            });
          }
        }
      } else {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone, created_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setForm({
            name: data.full_name,
            phone: data.phone || "",
            email,
            city: "",
            joinDate: new Date(data.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, role]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ full_name: form.name, phone: form.phone })
        .eq("user_id", user.id);

      if (role === "reciter") {
        await supabase
          .from("reciter_profiles")
          .update({
            full_name: form.name,
            phone: form.phone,
            city: form.city,
            profession: form.profession,
            qualifications: form.qualifications,
            quran_certifications: form.quranCertifications,
            teaching_experience: form.teachingExperience,
          })
          .eq("user_id", user.id);
      } else if (role === "student") {
        await supabase
          .from("student_profiles")
          .update({ full_name: form.name, phone: form.phone })
          .eq("user_id", user.id);
      }

      toast.success("تم حفظ التعديلات بنجاح");
      setIsEditing(false);
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    }
    setSaving(false);
  };

  const fields = role === "reciter" ? reciterFields : studentFields;
  const sections = role === "reciter"
    ? ["personal", "qualifications", "preferences"]
    : ["personal", "goal"];

  const renderField = (field: FieldDef, i: number) => (
    <motion.div
      key={field.key}
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 + i * 0.04 }}
      className={`glass-card rounded-2xl p-4 ${isEditing && !field.editable ? "opacity-60" : ""}`}
    >
      <label className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
        <field.icon className="w-3.5 h-3.5 text-primary" />
        {field.label}
      </label>
      {isEditing && field.editable ? (
        field.type === "textarea" ? (
          <textarea
            value={form[field.key] || ""}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none border-b border-primary/30 pb-1 resize-none min-h-[60px]"
            dir="rtl"
          />
        ) : (
          <input
            type={field.type}
            value={form[field.key] || ""}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none border-b border-primary/30 pb-1"
            dir={field.type === "tel" || field.type === "email" ? "ltr" : "rtl"}
          />
        )
      ) : (
        <p className="text-sm font-semibold text-foreground whitespace-pre-wrap">{form[field.key] || "—"}</p>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-8 rounded-b-[2.5rem] relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-primary-foreground" />
            </button>
            <h1 className="text-lg font-bold text-primary-foreground">البيانات الشخصية</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center"
              >
                <Pencil className="w-4 h-4 text-primary-foreground" />
              </button>
            ) : (
              <div className="w-9" />
            )}
          </div>

          {/* Avatar */}
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 rounded-full bg-primary-foreground/20 backdrop-blur-sm border-4 border-primary-foreground/30 flex items-center justify-center overflow-hidden">
              <User className="w-10 h-10 text-primary-foreground/60" />
            </div>
            {isEditing && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-lg border-2 border-primary-foreground"
              >
                <Camera className="w-4 h-4 text-gold-foreground" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="px-5 mt-6 space-y-6">
          {sections.map((sectionKey) => {
            const sectionInfo = sectionTitles[sectionKey];
            const sectionFields = fields.filter((f) => f.section === sectionKey && (f.editable || form[f.key]));
            const SectionIcon = sectionInfo.icon;
            return (
              <div key={sectionKey}>
                <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <SectionIcon className="w-4 h-4 text-primary" />
                  </div>
                  {sectionInfo.title}
                </h2>
                <div className="space-y-3">
                  {sectionFields.map((field, i) => renderField(field, i))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="px-5 mt-6"
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfile;
