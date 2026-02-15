import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Mail, MapPin, Calendar, ChevronRight, Camera, Save, GraduationCap, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const personalFields = [
  { icon: User, key: "name" as const, label: "الاسم الكامل", type: "text", editable: true },
  { icon: Phone, key: "phone" as const, label: "رقم الجوال", type: "tel", editable: true },
  { icon: Mail, key: "email" as const, label: "البريد الإلكتروني", type: "email", editable: false },
  { icon: MapPin, key: "city" as const, label: "المدينة", type: "text", editable: true },
  { icon: Calendar, key: "joinDate" as const, label: "تاريخ الانضمام", type: "text", editable: true },
];

const ijazat = [
  { title: "إجازة في رواية حفص عن عاصم", sheikh: "الشيخ أحمد العجمي", date: "1444 هـ", status: "معتمدة" },
  { title: "إجازة في رواية ورش عن نافع", sheikh: "الشيخ ماهر المعيقلي", date: "1445 هـ", status: "قيد الإتمام" },
];

const EditProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "عبدالله محمد",
    phone: "+966 50 123 4567",
    email: "abdullah@email.com",
    city: "الرياض، المملكة العربية السعودية",
    joinDate: "15 رمضان 1445 هـ",
  });

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
                <p className="text-sm font-semibold text-foreground">{form[field.key]}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ijazat */}
      <div className="px-5 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-gold" />
            </div>
            الإجازات القرآنية
          </h2>
          <div className="space-y-3">
            {ijazat.map((ij, i) => (
              <motion.div
                key={ij.title}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm">{ij.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">على يد {ij.sheikh}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ij.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    ij.status === "معتمدة"
                      ? "bg-primary/10 text-primary"
                      : "bg-gold/15 text-gold"
                  }`}>
                    {ij.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
              onClick={() => setIsEditing(false)}
              className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-5 h-5" />
              حفظ التعديلات
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfile;
