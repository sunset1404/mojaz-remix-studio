import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, User, Lock, Mail, Eye, EyeOff, BookOpen, Clock, Calendar, Users, CheckCircle2, Award } from "lucide-react";
import logoMojaz from "@/assets/logo-mojaz.webp";
import CountrySelect from "@/components/CountrySelect";
import PhoneCodeSelect from "@/components/PhoneCodeSelect";
import { COUNTRY_CODES } from "@/data/countries";
import { validatePassword, mapAuthError, isPasswordError } from "@/lib/passwordPolicy";

interface AdmissionExam {
  id: string;
  date: string;
  time: string;
  capacity: number;
  committee_member_1_name: string | null;
  committee_member_2_name: string | null;
  committee_member_3_name: string | null;
  registered_count: number;
}

const getPasswordStrength = (pwd: string): {level: number;label: string;color: string;} => {
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

const BASE_STEPS = [
{ title: "الحساب", icon: Lock },
{ title: "البيانات الشخصية", icon: User },
{ title: "الهدف", icon: BookOpen }];


const IJAZAH_STEP = { title: "بيانات الإجازة", icon: Award };

const EDUCATION_LEVELS = ["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه", "أخرى"];
const RIWAYAT = ["حفص عن عاصم", "ورش عن نافع", "قالون عن نافع", "شعبة عن عاصم", "الدوري عن أبي عمرو", "أخرى"];
const TRACKS = ["حفظ القرآن الكريم", "التلاوة والتجويد", "الحصول على إجازة قرآنية", "المراجعة والتثبيت"];

const getEmailStatusMessage = (status: string | null | undefined) => {
  if (status === "active") {
    return "هذا الحساب موجود ومفعل بالفعل، يمكنك تسجيل الدخول بهذا البريد.";
  }
  if (status === "needs_activation") {
    return "هذا الحساب موجود لكنه يحتاج إلى تفعيل أو استكمال بياناته قبل استخدامه.";
  }
  return "هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول أو استخدام بريد آخر";
};

const StudentSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");


  // Step 0: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 1: Personal info
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+966");
  const [educationLevel, setEducationLevel] = useState("");

  // Step 2: Preferences
  const [preferredRiwaya, setPreferredRiwaya] = useState("");
  const [preferredTrack, setPreferredTrack] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [hasPreviousCertifications, setHasPreviousCertifications] = useState<"yes" | "no" | "">("");
  const [previousCertifications, setPreviousCertifications] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [admissionExams, setAdmissionExams] = useState<AdmissionExam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  const isIjazah = preferredTrack === "الحصول على إجازة قرآنية";
  const steps = isIjazah ? [...BASE_STEPS, IJAZAH_STEP] : BASE_STEPS;
  const totalSteps = steps.length - 1;
  const isLastStep = step === totalSteps;

  const inputClass = "h-12 rounded-xl border-primary/20 bg-card focus:border-primary focus:bg-card transition-colors shadow-sm";

  // Fetch admission exams when track changes to ijazah
  useEffect(() => {
    if (preferredTrack === "الحصول على إجازة قرآنية") {
      setLoadingExams(true);
      const fetchExams = async () => {
        const { data: examsData } = await (supabase as any).
        from("exams").
        select("id, date, time, capacity, committee_member_1_name, committee_member_2_name, committee_member_3_name").
        eq("type", "admission").
        eq("status", "scheduled").
        order("date", { ascending: true });

        if (!examsData) {setLoadingExams(false);return;}

        const { data: countData } = await (supabase as any).
        from("student_profiles").
        select("selected_exam_id").
        in("selected_exam_id", examsData.map((e: AdmissionExam) => e.id));

        const countMap: Record<string, number> = {};
        (countData || []).forEach((row: {selected_exam_id: string;}) => {
          if (row.selected_exam_id) {
            countMap[row.selected_exam_id] = (countMap[row.selected_exam_id] || 0) + 1;
          }
        });

        const available = examsData.
        map((exam: AdmissionExam) => ({ ...exam, registered_count: countMap[exam.id] || 0 })).
        filter((exam: AdmissionExam) => exam.registered_count < exam.capacity);

        setAdmissionExams(available);
        setLoadingExams(false);
      };
      fetchExams();
    } else {
      setAdmissionExams([]);
      setSelectedExamId("");
    }
  }, [preferredTrack]);

  const validateStep = () => {
    if (step === 0) {
      if (!email) { toast({ title: "مطلوب", description: "أدخل البريد الإلكتروني", variant: "destructive" }); return false; }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) { setEmailError("صيغة البريد الإلكتروني غير صحيحة"); return false; }
      const check = validatePassword(password);
      if (!check.valid) { setPasswordError(check.message); return false; }
      setPasswordError("");
      if (!confirmPassword) { setConfirmError("يرجى تأكيد كلمة المرور"); return false; }
      if (password !== confirmPassword) { setConfirmError("كلمة المرور وتأكيدها غير متطابقتين"); return false; }
      setConfirmError("");
    }

    if (step === 1) {
      if (!fullName || !gender || !nationality || !phone || !educationLevel) {
        toast({ title: "مطلوب", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });return false;
      }
    }
    if (step === 2) {
      if (!preferredTrack) {
        toast({ title: "مطلوب", description: "يرجى اختيار المسار", variant: "destructive" });return false;
      }
    }
    if (step === 3 && isIjazah) {
      if (!preferredRiwaya) {
        toast({ title: "مطلوب", description: "يرجى اختيار الرواية", variant: "destructive" });return false;
      }
    }
    return true;
  };

  const nextStep = async () => {
    if (!validateStep()) return;

    if (step === 0) {
      const { data: emailStatus } = await (supabase as any).rpc("get_email_registration_status", { p_email: email.trim().toLowerCase() });
      if (emailStatus === "active") {
        setEmailError(getEmailStatusMessage(emailStatus));
        return;
      }
      setEmailError("");
    }

    if (step === 1) {
      const fullPhone = `${phoneCode}${phone}`;
      const { data: phoneExists } = await (supabase as any).rpc("check_phone_exists", { p_phone: fullPhone });
      if (phoneExists) {
        setPhoneError("رقم الجوال مسجل مسبقاً في حساب آخر، يرجى استخدام رقم مختلف");
        return;
      }
      setPhoneError("");
    }

    setStep((s) => Math.min(s + 1, totalSteps));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("signup-student", {
      body: {
        email,
        password,
        full_name: fullName,
        gender,
        nationality,
        phone: `${phoneCode}${phone}`,
        education_level: educationLevel,
        quran_certifications: hasPreviousCertifications === "yes" ? previousCertifications : "",
        preferred_riwaya: preferredRiwaya,
        preferred_track: preferredTrack,
        join_date: joinDate,
        selected_exam_id: selectedExamId || null,
      },
    });

    if (error || (data as any)?.error) {
      const raw = (data as any)?.message || error?.message || "حدث خطأ أثناء التسجيل";
      const friendly = mapAuthError(raw);
      if (isPasswordError(raw)) {
        setPasswordError(friendly);
        setStep(0);
        toast({ title: "كلمة المرور غير مقبولة", description: friendly, variant: "destructive" });
      } else {
        toast({ title: "خطأ في التسجيل", description: friendly, variant: "destructive" });
      }
      setLoading(false);
      return;
    }


    toast({ title: "تم إنشاء الحساب بنجاح" });
    navigate("/signup/success?role=student");
    setLoading(false);
  };

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
                <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => {setEmail(e.target.value);setEmailError("");}}
                className={`pr-14 text-left ${inputClass} ${emailError ? "border-destructive focus:border-destructive" : ""}`} dir="ltr" required />
              </div>
              {emailError &&
              <p className="text-destructive text-xs font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {emailError}
                </p>
              }
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-semibold">كلمة المرور</Label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gold" />
                </div>
                <Input type={showPassword ? "text" : "password"} placeholder="8 أحرف على الأقل، حرف ورقم"
                value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                className={`pr-14 pl-12 text-left ${inputClass} ${passwordError ? "border-destructive focus:border-destructive" : ""}`} dir="ltr" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted/30 flex items-center justify-center transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-destructive text-xs font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {passwordError}
                </p>
              )}

              {password && (() => {
                const strength = getPasswordStrength(password);
                return (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) =>
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : "bg-muted/30"}`} />
                      )}
                    </div>
                    <p className={`text-[11px] font-semibold text-right ${strength.level <= 1 ? "text-destructive" : strength.level <= 2 ? "text-orange-400" : strength.level <= 3 ? "text-yellow-500" : "text-emerald-500"}`}>
                      {strength.label}
                    </p>
                  </div>);
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
          </div>);

      case 1:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">1. الاسم الثلاثي *</Label>
                <Input placeholder="أدخل إجابتك هنا" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">2. الجنس *</Label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                className={`w-full ${inputClass} px-3 border border-primary/20 bg-card text-foreground`}>
                  <option value="" disabled>اختر إجابة</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">3. الجنسية *</Label>
                <CountrySelect value={nationality} onChange={(v) => {setNationality(v);if (COUNTRY_CODES[v]) setPhoneCode(COUNTRY_CODES[v]);}} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">4. المؤهل الدراسي *</Label>
                <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}
                className={`w-full ${inputClass} px-3 border border-primary/20 bg-card text-foreground`}>
                  <option value="" disabled>اختر إجابة</option>
                  {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-xs font-semibold">5. رقم الجوال *</Label>
              <div className="flex gap-1.5">
                <Input placeholder="5xxxxxxxx" value={phone} onChange={(e) => {setPhone(e.target.value.replace(/^0+/, ''));setPhoneError("");}}
                className={`flex-1 ${inputClass} ${phoneError ? "border-destructive focus:border-destructive" : ""}`} dir="ltr" required />
                <PhoneCodeSelect value={phoneCode} onChange={setPhoneCode} />
              </div>
              {phoneError &&
              <p className="text-destructive text-xs font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {phoneError}
                </p>
              }
            </div>
          </div>);

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-foreground text-xs font-semibold">6. المسار القرآني الذي تودّ الالتحاق به *</Label>
              <div className="grid grid-cols-1 gap-2">
                {TRACKS.map((t) =>
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setPreferredTrack(t);
                    if (t !== "الحصول على إجازة قرآنية") {
                      setPreferredRiwaya("");
                      setSelectedExamId("");
                      setHasPreviousCertifications("");
                      setPreviousCertifications("");
                    }
                  }}
                  className={`w-full text-right px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                  preferredTrack === t ?
                  "border-primary bg-primary/10 text-primary shadow-sm" :
                  "border-primary/20 bg-card text-foreground hover:border-primary/40"}`}>
                    <div className="flex items-center justify-between">
                      <span>{t}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    preferredTrack === t ? "border-primary" : "border-muted-foreground/30"}`}>
                        {preferredTrack === t && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>);

      case 3:
        // Only shown for ijazah track
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-foreground text-xs font-semibold">7. الرواية أو القراءة المتقنّد لها *</Label>
              <select value={preferredRiwaya} onChange={(e) => setPreferredRiwaya(e.target.value)}
              className={`w-full ${inputClass} px-3 border border-primary/20 bg-card text-foreground`}>
                <option value="" disabled>اختر إجابة</option>
                {RIWAYAT.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Exam Selection */}
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                8. اختر موعد اختبار القبول المناسب لك
                <span className="text-muted-foreground font-normal">(اختياري)</span>
              </Label>
              {loadingExams ?
              <div className="flex items-center justify-center py-4">
                  <span className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full inline-block" />
                </div> :
              admissionExams.length === 0 ?
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
                  <Calendar className="w-7 h-7 text-primary/40 mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">لا توجد مواعيد اختبار متاحة حالياً</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">سيتم إبلاغك بالموعد لاحقاً</p>
                </div> :

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {/* No preference option */}
                  <button
                  type="button"
                  onClick={() => setSelectedExamId("")}
                  className={`w-full text-right p-3 rounded-xl border-2 transition-all ${
                  selectedExamId === "" ?
                  "border-primary/40 bg-primary/5" :
                  "border-border/40 bg-card hover:border-primary/30"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">لم أحدد بعد، إبلاغي لاحقاً</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedExamId === "" ? "border-primary" : "border-muted-foreground/30"}`}>
                          {selectedExamId === "" && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                    </button>

                  {admissionExams.map((exam) => {
                  const isSelected = selectedExamId === exam.id;
                  const committee = [exam.committee_member_1_name, exam.committee_member_2_name, exam.committee_member_3_name].filter(Boolean);
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setSelectedExamId(exam.id)}
                      className={`w-full text-right p-3 rounded-xl border-2 transition-all ${
                      isSelected ?
                      "border-primary bg-primary/8 shadow-sm" :
                      "border-border/40 bg-card hover:border-primary/40 hover:bg-primary/3"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary" : "bg-primary/10"}`}>
                                  <Calendar className={`w-3 h-3 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                                </div>
                                <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                  {new Date(exam.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 pr-8">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {exam.time}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="w-3 h-3" />
                                  {exam.capacity - exam.registered_count} مقعد متبقٍ
                                </span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                            </div>
                          </div>
                        </button>);
                })}
                </div>
              }
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground text-xs font-semibold">9. هل لديك إجازات قرآنية سابقة؟</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                { value: "yes" as const, label: "نعم" },
                { value: "no" as const, label: "لا" }].
                map((opt) =>
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setHasPreviousCertifications(opt.value);
                    if (opt.value === "no") setPreviousCertifications("");
                  }}
                  className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                  hasPreviousCertifications === opt.value ?
                  "border-primary bg-primary/10 text-primary shadow-sm" :
                  "border-primary/20 bg-card text-foreground hover:border-primary/40"}`}>
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    hasPreviousCertifications === opt.value ? "border-primary" : "border-muted-foreground/30"}`}>
                        {hasPreviousCertifications === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <span>{opt.label}</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {hasPreviousCertifications === "yes" &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">10. اذكر الإجازات القرآنية السابقة</Label>
                <textarea
                value={previousCertifications}
                onChange={(e) => setPreviousCertifications(e.target.value)}
                placeholder="مثال: إجازة في رواية حفص عن عاصم من الشيخ ..."
                rows={3}
                maxLength={500}
                className={`w-full ${inputClass} px-3 py-3 border border-primary/20 bg-card text-foreground resize-none rounded-xl text-sm`} />
              </motion.div>
            }
          </div>);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
    style={{ background: "linear-gradient(170deg, hsl(174 42% 28%) 0%, hsl(174 42% 35%) 30%, hsl(174 38% 40%) 55%, hsl(174 35% 38%) 80%, hsl(174 30% 32%) 100%)" }}>

      {/* Subtle gold glow overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 85%, hsl(43 50% 50% / 0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 30% 50%, hsl(43 50% 50% / 0.12) 0%, transparent 60%)" }} />
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }} transition={{ duration: 1.2 }}
        className="absolute top-12 right-6 w-40 h-40 rounded-full border-2 border-primary-foreground/20" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }} transition={{ duration: 1.2, delay: 0.2 }}
        className="absolute -top-12 -left-12 w-56 h-56 rounded-full border-2 border-primary-foreground/15" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.06 }} transition={{ duration: 1, delay: 0.4 }}
        className="absolute bottom-20 right-4 w-28 h-28 rounded-full bg-gold/15 blur-xl" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }} transition={{ duration: 1, delay: 0.3 }}
        className="absolute bottom-40 -left-8 w-36 h-36 rounded-full bg-primary-foreground/10 blur-xl" />
        <div className="absolute top-16 right-24 w-3 h-3 rounded-full bg-gold/40" />
        <div className="absolute top-32 left-10 w-2 h-2 rounded-full bg-gold/50" />
        <div className="absolute bottom-32 right-16 w-2.5 h-2.5 rounded-full bg-primary-foreground/25" />
        <div className="absolute top-1/2 left-6 w-2 h-2 rounded-full bg-gold/30" />
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
        className="text-xl font-bold font-cairo text-[#d2ac4b]">تسجيل حساب طالب</motion.h1>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-6 mb-4">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {steps.map((s, i) =>
          <div key={i} className="flex flex-col items-center relative z-10">
              <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: step >= i ? 1 : 0.8 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step > i ? "bg-primary-foreground text-primary" : step === i ? "bg-primary-foreground text-primary ring-2 ring-gold/50" : "bg-primary-foreground/30 text-primary-foreground/60"}`}>
                {step > i ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </motion.div>
              <span className={`text-[10px] mt-1 font-semibold ${step >= i ? "text-primary-foreground" : "text-primary-foreground/50"}`}>{s.title}</span>
            </div>
          )}
        </div>
        <div className="absolute top-[18px] left-[15%] right-[15%] h-0.5 bg-primary-foreground/20 -z-0" />
        <motion.div
          className="absolute top-[18px] right-[15%] h-0.5 bg-primary-foreground"
          initial={{ width: "0%" }}
          animate={{ width: `${step / totalSteps * 70}%` }}
          transition={{ duration: 0.4 }} />
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
                transition={{ duration: 0.25 }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-5">
              {step > 0 &&
              <Button type="button" variant="outline" onClick={prevStep}
              className="flex-1 h-12 rounded-2xl border-border/60 font-semibold">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  السابق
                </Button>
              }
              {!isLastStep ?
              <Button type="button" onClick={nextStep}
              className="flex-1 gradient-primary text-primary-foreground h-12 rounded-2xl font-bold shadow-md">
                  التالي
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </Button> :

              <Button type="button" onClick={handleSubmit} disabled={loading}
              className="flex-1 gradient-primary text-primary-foreground h-12 rounded-2xl font-bold shadow-md">
                  {loading ?
                <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full inline-block" /> :
                <>
                      <Check className="w-5 h-5 ml-1" />
                      إنشاء الحساب
                    </>
                }
                </Button>
              }
            </div>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center mt-5 text-card font-semibold drop-shadow-sm">
            لديك حساب بالفعل؟{" "}
            <button onClick={() => navigate("/login")} className="font-bold hover:underline text-[#d2ac4b]">تسجيل الدخول</button>
          </motion.p>
        </motion.div>
      </div>
    </div>);
};

export default StudentSignup;