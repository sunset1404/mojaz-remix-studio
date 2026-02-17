import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Mail, MapPin, Calendar, ChevronRight, Camera, Save, Pencil, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const personalFields = [
  { icon: User, key: "name" as const, label: "الاسم الكامل", type: "text", editable: true },
  { icon: Phone, key: "phone" as const, label: "رقم الجوال", type: "tel", editable: true },
  { icon: Mail, key: "email" as const, label: "البريد الإلكتروني", type: "email", editable: false },
  { icon: MapPin, key: "city" as const, label: "المدينة", type: "text", editable: true },
  { icon: Calendar, key: "joinDate" as const, label: "تاريخ الانضمام", type: "text", editable: false },
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    joinDate: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const email = user.email || "";

      if (role === "reciter") {
        const { data } = await supabase
          .from("reciter_profiles")
          .select("full_name, phone, city, created_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setForm({
            name: data.full_name,
            phone: data.phone,
            email,
            city: data.city,
            joinDate: new Date(data.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
          });
        }
      } else if (role === "student") {
        const { data } = await supabase
          .from("student_profiles")
          .select("full_name, phone, residence_country, created_at, email")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setForm({
            name: data.full_name,
            phone: data.phone,
            email: data.email || email,
            city: data.residence_country,
            joinDate: new Date(data.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
          });
        }
      } else {
        // fallback to profiles table
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
      // Update profiles table
      await supabase
        .from("profiles")
        .update({ full_name: form.name, phone: form.phone })
        .eq("user_id", user.id);

      // Update role-specific table
      if (role === "reciter") {
        await supabase
          .from("reciter_profiles")
          .update({ full_name: form.name, phone: form.phone, city: form.city })
          .eq("user_id", user.id);
      } else if (role === "student") {
        await supabase
          .from("student_profiles")
          .update({ full_name: form.name, phone: form.phone, residence_country: form.city })
          .eq("user_id", user.id);
      }

      toast.success("تم حفظ التعديلات بنجاح");
      setIsEditing(false);
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    }
    setSaving(false);
  };

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

      {/* Personal Info */}
      <div className="px-5 mt-6">
        <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          البيانات الشخصية
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {personalFields.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className={`glass-card rounded-2xl p-4 ${isEditing && !field.editable ? "opacity-60" : ""}`}
              >
                <label className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                  <field.icon className="w-3.5 h-3.5 text-primary" />
                  {field.label}
                </label>
                {isEditing && field.editable ? (
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full bg-transparent text-sm font-semibold text-foreground outline-none border-b border-primary/30 pb-1"
                    dir="rtl"
                  />
                ) : (
                  <p className="text-sm font-semibold text-foreground">{form[field.key] || "—"}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button - only visible in edit mode */}
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
