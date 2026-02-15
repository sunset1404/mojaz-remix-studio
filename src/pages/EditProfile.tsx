import { motion } from "framer-motion";
import { User, Phone, Mail, MapPin, Calendar, ChevronRight, Camera, Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "عبدالله محمد",
    phone: "+966 50 123 4567",
    email: "abdullah@email.com",
    city: "الرياض، المملكة العربية السعودية",
    birthdate: "1420/05/10 هـ",
    level: "المستوى 4",
  });

  const fields = [
    { key: "name" as const, label: "الاسم الكامل", icon: User, type: "text" },
    { key: "phone" as const, label: "رقم الجوال", icon: Phone, type: "tel" },
    { key: "email" as const, label: "البريد الإلكتروني", icon: Mail, type: "email" },
    { key: "city" as const, label: "المدينة", icon: MapPin, type: "text" },
    { key: "birthdate" as const, label: "تاريخ الميلاد", icon: Calendar, type: "text" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-8 rounded-b-[2.5rem] relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-primary-foreground" />
            </button>
            <h1 className="text-lg font-bold text-primary-foreground">تعديل الملف الشخصي</h1>
            <div className="w-9" />
          </div>

          {/* Avatar */}
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 rounded-full bg-primary-foreground/20 backdrop-blur-sm border-4 border-primary-foreground/30 flex items-center justify-center overflow-hidden">
              <User className="w-10 h-10 text-primary-foreground/60" />
            </div>
            <button className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-lg border-2 border-primary-foreground">
              <Camera className="w-4 h-4 text-gold-foreground" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Form Fields */}
      <div className="px-5 mt-6 space-y-3">
        {fields.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            className="glass-card rounded-2xl p-4"
          >
            <label className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
              <field.icon className="w-3.5 h-3.5 text-primary" />
              {field.label}
            </label>
            <input
              type={field.type}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
              dir="rtl"
            />
          </motion.div>
        ))}

        {/* Read-only level */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="glass-card rounded-2xl p-4 opacity-60"
        >
          <p className="text-[10px] text-muted-foreground mb-2">المستوى الحالي</p>
          <p className="text-sm font-semibold text-foreground">{form.level}</p>
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg mt-6"
        >
          <Save className="w-5 h-5" />
          حفظ التعديلات
        </motion.button>
      </div>
    </div>
  );
};

export default EditProfile;
