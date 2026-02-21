import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, User, Phone, MapPin, BookOpen, Clock, Eye, EyeOff, Lock, Mail } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";
import CountrySelect from "@/components/CountrySelect";
import PhoneCodeSelect from "@/components/PhoneCodeSelect";
import { COUNTRY_CODES } from "@/data/countries";

const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
  if (!pwd) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: "ضعيفة", color: "bg-destructive" };
  if (score <= 2) return { level: 2, label: "مقبولة", color: "bg-orange-400" };
  if (score <= 3) return { level: 3, label: "جيدة", color: "bg-yellow-400" };
  if (score <= 4) return { level: 4, label: "قوية", color: "bg-emerald-400" };
  return { level: 5, label: "ممتازة", color: "bg-emerald-500" };
};

const STEPS = [
  { title: "الحساب", icon: Lock },
  { title: "البيانات الشخصية", icon: User },
  { title: "المؤهلات", icon: BookOpen },
  { title: "تفضيلات الإقراء", icon: Clock },
];

const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const TIMES = ["الفجر", "الصباح", "الظهر", "العصر", "المغرب", "العشاء"];
const TRACKS = ["حفظ القرآن الكريم", "التلاوة والتجويد", "الإجازة بالسند", "المراجعة والتثبيت"];

const ReciterSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Step 0: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 1: Personal info
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+966");
  const [city, setCity] = useState("");

  // Step 2: Professional
  const [profession, setProfession] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [quranCertifications, setQuranCertifications] = useState("");
  const [teachingExperience, setTeachingExperience] = useState("");

  // Step 3: Preferences
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [preferredTrack, setPreferredTrack] = useState<string[]>([]);

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  const validateStep = () => {
    if (step === 0) {
      if (!email || !password || !confirmPassword) { toast({ title: "مطلوب", description: "أدخل البريد وكلمة المرور وتأكيدها", variant: "destructive" }); return false; }
      if (password.length < 6) { toast({ title: "كلمة المرور قصيرة", description: "يجب أن تكون 6 أحرف على الأقل", variant: "destructive" }); return false; }
      if (password !== confirmPassword) { toast({ title: "عدم تطابق", description: "كلمة المرور وتأكيدها غير متطابقتين", variant: "destructive" }); return false; }
    }
    if (step === 1) {
      if (!fullName || !gender || !nationality || !idNumber || !phone || !city) {
        toast({ title: "مطلوب", description: "يرجى ملء جميع الحقول", variant: "destructive" }); return false;
      }
    }
    if (step === 2) {
      if (!profession || !qualifications || !quranCertifications || !teachingExperience) {
        toast({ title: "مطلوب", description: "يرجى ملء جميع الحقول", variant: "destructive" }); return false;
      }
    }
    if (step === 3) {
      if (preferredDays.length === 0 || preferredTimes.length === 0 || preferredTrack.length === 0) {
        toast({ title: "مطلوب", description: "يرجى اختيار التفضيلات", variant: "destructive" }); return false;
      }
    }
    return true;
  };

  const nextStep = async () => {
    if (!validateStep()) return;

    // Check email uniqueness on step 0 using SECURITY DEFINER function (bypasses RLS)
    if (step === 0) {
      const { data: emailExists } = await (supabase as any).rpc("check_email_exists", { p_email: email.trim().toLowerCase() });
      if (emailExists) {
        setEmailError("هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول أو استخدام بريد آخر");
        return;
      }
      setEmailError("");
    }

    // Check phone uniqueness on step 1 using SECURITY DEFINER function
    if (step === 1) {
      const fullPhone = `${phoneCode}${phone}`;
      const { data: phoneExists } = await (supabase as any).rpc("check_phone_exists", { p_phone: fullPhone });
      if (phoneExists) {
        setPhoneError("رقم الجوال مسجل مسبقاً في حساب آخر، يرجى استخدام رقم مختلف");
        return;
      }
      setPhoneError("");
    }

    setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));


  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });

    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: "reciter" as const });
      await supabase.from("reciter_profiles").insert({
        user_id: data.user.id,
        full_name: fullName,
        gender,
        nationality,
        id_number: idNumber,
        phone: `${phoneCode}${phone}`,
        city,
        profession,
        qualifications,
        quran_certifications: quranCertifications,
        teaching_experience: teachingExperience,
        preferred_days: preferredDays,
        preferred_times: preferredTimes,
        preferred_track: preferredTrack.join("، "),
        reciter_type: preferredTrack.includes("الإجازة بالسند") ? "ijazah" : "general",
      } as any);
    }

    toast({ title: "تم إنشاء الحساب بنجاح" });
    navigate("/signup/success?role=reciter");
    setLoading(false);
  };

  const inputClass = "h-12 rounded-xl border-primary/20 bg-card focus:border-primary focus:bg-card transition-colors shadow-sm";

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-semibold">البريد الإلكتروني</Label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  className={`pr-14 text-left ${inputClass} ${emailError ? "border-destructive focus:border-destructive" : ""}`} dir="ltr" required />
              </div>
              {emailError && (
                <p className="text-destructive text-xs font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {emailError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-semibold">كلمة المرور</Label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gold" />
                </div>
                <Input type={showPassword ? "text" : "password"} placeholder="6 أحرف على الأقل"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`pr-14 pl-12 text-left ${inputClass}`} dir="ltr" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {password && (() => {
                const strength = getPasswordStrength(password);
                return (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : "bg-muted/30"}`} />
                      ))}
                    </div>
                    <p className={`text-[11px] font-semibold text-right ${strength.level <= 1 ? "text-destructive" : strength.level <= 2 ? "text-orange-400" : strength.level <= 3 ? "text-yellow-500" : "text-emerald-500"}`}>
                      {strength.label}
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-semibold">تأكيد كلمة المرور</Label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gold" />
                </div>
                <Input type={showPassword ? "text" : "password"} placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pr-14 text-left ${inputClass}`} dir="ltr" required />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">الاسم الرباعي</Label>
                <Input placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">الجنس</Label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className={`w-full ${inputClass} px-3 border border-primary/20 bg-card text-foreground`}>
                  <option value="" disabled>الجنس</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">الجنسية</Label>
                <CountrySelect value={nationality} onChange={(v) => { setNationality(v); if (COUNTRY_CODES[v]) setPhoneCode(COUNTRY_CODES[v]); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">رقم الهوية</Label>
                <Input placeholder="رقم الهوية" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className={inputClass} dir="ltr" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-xs font-semibold">رقم الجوال</Label>
              <div className="flex gap-1.5" dir="ltr">
                <Input placeholder="5xxxxxxxx" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/^0+/, '')); setPhoneError(""); }}
                  className={`flex-1 min-w-0 ${inputClass} ${phoneError ? "border-destructive focus:border-destructive" : ""}`} dir="ltr" required />
                <PhoneCodeSelect value={phoneCode} onChange={setPhoneCode} />
              </div>
              {phoneError && (
                <p className="text-destructive text-xs font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {phoneError}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">مدينة الإقامة</Label>
                <Input placeholder="المدينة" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">المهنة</Label>
                <Input placeholder="المهنة" value={profession} onChange={(e) => setProfession(e.target.value)} className={inputClass} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">المؤهلات العلمية</Label>
                <Input placeholder="المؤهل العلمي" value={qualifications} onChange={(e) => setQualifications(e.target.value)} className={inputClass} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-xs font-semibold">الإجازات القرآنية</Label>
              <textarea placeholder="اذكر الإجازات القرآنية الحاصل عليها" value={quranCertifications}
                onChange={(e) => setQuranCertifications(e.target.value)}
                className={`w-full min-h-[80px] px-3 py-2 rounded-xl border border-primary/20 bg-card focus:border-primary focus:bg-card transition-colors shadow-sm resize-none text-sm`}
                required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-xs font-semibold">أبرز المحطات التعليمية والخبرات</Label>
              <textarea placeholder="اذكر خبراتك في التعليم والإقراء" value={teachingExperience}
                onChange={(e) => setTeachingExperience(e.target.value)}
                className={`w-full min-h-[80px] px-3 py-2 rounded-xl border border-primary/20 bg-card focus:border-primary focus:bg-card transition-colors shadow-sm resize-none text-sm`}
                required />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-semibold">أيام الأسبوع المفضلة للإقراء</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button key={day} type="button" onClick={() => toggleItem(preferredDays, day, setPreferredDays)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      preferredDays.includes(day) ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card text-foreground/60 hover:border-primary/30"
                    }`}>{day}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-semibold">أوقات الإقراء المفضلة</Label>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((time) => (
                  <button key={time} type="button" onClick={() => toggleItem(preferredTimes, time, setPreferredTimes)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      preferredTimes.includes(time) ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card text-foreground/60 hover:border-primary/30"
                    }`}>{time}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-semibold">مسار الإقراء المفضل</Label>
              <div className="grid grid-cols-2 gap-2">
                {TRACKS.map((track) => (
                  <button key={track} type="button" onClick={() => toggleItem(preferredTrack, track, setPreferredTrack)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      preferredTrack.includes(track) ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card text-foreground/60 hover:border-primary/30"
                    }`}>{track}</button>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--turquoise-dark)) 40%, hsl(var(--gold) / 0.35) 85%, hsl(var(--gold) / 0.5) 100%)" }}
    >
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }} transition={{ duration: 1.2 }}
          className="absolute top-12 right-6 w-40 h-40 rounded-full border-2 border-primary-foreground/20" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }} transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute -top-12 -left-12 w-56 h-56 rounded-full border-2 border-primary-foreground/15" />
        <div className="absolute top-16 right-24 w-3 h-3 rounded-full bg-gold/40" />
        <div className="absolute bottom-20 right-4 w-28 h-28 rounded-full bg-gold/15 blur-xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 150 }} className="mb-2">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-0.5 bg-card/90 backdrop-blur-sm">
            <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-xl" />
          </div>
        </motion.div>
        <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-xl font-bold text-primary-foreground font-cairo">تسجيل حساب مقرئ</motion.h1>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-6 mb-4">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center relative z-10">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: step >= i ? 1 : 0.8 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > i ? "bg-primary-foreground text-primary" : step === i ? "bg-primary-foreground text-primary ring-2 ring-gold/50" : "bg-primary-foreground/30 text-primary-foreground/60"
                }`}
              >
                {step > i ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </motion.div>
              <span className={`text-[10px] mt-1 font-semibold ${step >= i ? "text-primary-foreground" : "text-primary-foreground/50"}`}>{s.title}</span>
            </div>
          ))}
        </div>
        {/* Progress line */}
        <div className="absolute top-[18px] left-[15%] right-[15%] h-0.5 bg-primary-foreground/20 -z-0" />
        <motion.div
          className="absolute top-[18px] right-[15%] h-0.5 bg-primary-foreground"
          initial={{ width: "0%" }}
          animate={{ width: `${(step / 3) * 70}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Form card */}
      <div className="flex-1 flex flex-col items-center px-6 relative z-10 pb-6">
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="w-full max-w-sm">
          <div className="bg-card/90 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-primary-foreground/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-5">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={prevStep}
                  className="flex-1 h-12 rounded-2xl border-border/60 font-semibold">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  السابق
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={nextStep}
                  className="flex-1 gradient-primary text-primary-foreground h-12 rounded-2xl font-bold shadow-md">
                  التالي
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}
                  className="flex-1 gradient-primary text-primary-foreground h-12 rounded-2xl font-bold shadow-md">
                  {loading ? (
                    <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" />
                  ) : (
                    <>
                      <Check className="w-5 h-5 ml-1" />
                      إنشاء الحساب
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center mt-5 text-card font-semibold drop-shadow-sm">
            لديك حساب بالفعل؟{" "}
            <button onClick={() => navigate("/login")} className="text-primary-foreground font-bold hover:underline">تسجيل الدخول</button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default ReciterSignup;
