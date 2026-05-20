import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  GraduationCap, Search, Phone, Mail, MessageCircle,
  Globe, UserCheck, TrendingUp, BookOpen,
  RefreshCw, ChevronDown, ChevronUp, Filter,
  ArrowRight, Clock, CheckCircle, XCircle, ShieldCheck, Award, Plus,
  Upload, Stamp, PenTool, Loader2, Trash2, Image, Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface ReciterProfile {
  id: string;
  user_id: string;
  full_name: string;
  gender: string;
  nationality: string;
  phone: string;
  city: string;
  profession: string;
  qualifications: string;
  teaching_experience: string;
  quran_certifications: string;
  preferred_track: string;
  preferred_days: string[];
  preferred_times: string[];
  id_number: string;
  status: string;
  reciter_type: string;
  created_at: string;
  stamp_url: string | null;
  signature_url: string | null;
}

interface ReciterCertification {
  id: string;
  reciter_id: string;
  type: string;
  riwaya: string | null;
  certification_text: string;
}

const RIWAYAT = [
  "حفص عن عاصم", "ورش عن نافع", "قالون عن نافع", "شعبة عن عاصم",
  "الدوري عن أبي عمرو", "السوسي عن أبي عمرو", "ابن كثير", "ابن عامر",
  "أبو جعفر", "يعقوب", "خلف العاشر",
];

const AdminReciters = () => {
  const [reciters, setReciters] = useState<ReciterProfile[]>([]);
  const [certifications, setCertifications] = useState<ReciterCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [expandedReciter, setExpandedReciter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Dialog for managing certification texts
  const [certDialogReciter, setCertDialogReciter] = useState<ReciterProfile | null>(null);
  const [certDialogType, setCertDialogType] = useState<string>("ijaza");
  const [certDialogRiwaya, setCertDialogRiwaya] = useState<string>("");
  const [certDialogText, setCertDialogText] = useState("");
  const [savingCert, setSavingCert] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReciterProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteReciter = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-reciter", {
        body: { reciter_id: deleteTarget.id, user_id: deleteTarget.user_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setReciters(prev => prev.filter(r => r.id !== deleteTarget.id));
      toast({ title: "تم حذف المقرئ بنجاح ✅" });
      setDeleteTarget(null);
    } catch (e: any) {
      toast({ title: "تعذّر الحذف", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Edit Reciter dialog
  const [editTarget, setEditTarget] = useState<ReciterProfile | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ReciterProfile>>({});

  const openEditDialog = (r: ReciterProfile) => {
    setEditTarget(r);
    setEditForm({
      full_name: r.full_name,
      phone: r.phone,
      gender: r.gender,
      nationality: r.nationality,
      city: r.city,
      id_number: r.id_number,
      profession: r.profession,
      qualifications: r.qualifications,
      quran_certifications: r.quran_certifications,
      teaching_experience: r.teaching_experience,
      preferred_track: r.preferred_track,
      reciter_type: r.reciter_type,
      status: r.status,
    });
  };

  const saveEditReciter = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("reciter_profiles")
        .update(editForm)
        .eq("id", editTarget.id);
      if (error) throw error;
      // Also sync profile name/phone
      await supabase.from("profiles").update({
        full_name: editForm.full_name,
        phone: editForm.phone,
      }).eq("user_id", editTarget.user_id);
      setReciters(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...editForm } as ReciterProfile : r));
      toast({ title: "تم تحديث بيانات المقرئ ✅" });
      setEditTarget(null);
    } catch (e: any) {
      toast({ title: "تعذّر التحديث", description: e.message, variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  // Add Reciter dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const emptyNew = {
    email: "", password: "", full_name: "", phone: "",
    gender: "male", nationality: "السعودية", city: "",
    id_number: "", reciter_type: "general", profession: "",
    qualifications: "", quran_certifications: "", teaching_experience: "",
    preferred_track: "", status: "approved",
  };
  const [newReciter, setNewReciter] = useState(emptyNew);

  const createReciter = async () => {
    const required = ["email","password","full_name","phone","gender","nationality","city","id_number"] as const;
    for (const k of required) {
      if (!String((newReciter as any)[k] || "").trim()) {
        toast({ title: "يرجى تعبئة الحقول المطلوبة", variant: "destructive" });
        return;
      }
    }
    if (newReciter.password.length < 6) {
      toast({ title: "كلمة المرور قصيرة (6 أحرف على الأقل)", variant: "destructive" });
      return;
    }
    setAddSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-reciter", { body: newReciter });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "تم إنشاء حساب المقرئ ✅" });
      setAddOpen(false);
      setNewReciter(emptyNew);
      fetchData();
    } catch (e: any) {
      toast({ title: "تعذّر الإنشاء", description: e.message, variant: "destructive" });
    } finally {
      setAddSaving(false);
    }
  };

  const uploadReciterAsset = async (reciterId: string, reciterUserId: string, file: File, type: "stamp" | "signature") => {
    const key = `${reciterId}-${type}`;
    setUploadingAsset(key);
    try {
      const ext = file.name.split(".").pop();
      const path = `${reciterUserId}/${type}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("reciter-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("reciter-assets")
        .getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      const col = type === "stamp" ? "stamp_url" : "signature_url";
      const { error: dbError } = await supabase
        .from("reciter_profiles")
        .update({ [col]: urlWithCacheBust })
        .eq("id", reciterId);
      if (dbError) throw dbError;
      setReciters(prev => prev.map(r => r.id === reciterId ? { ...r, [col]: urlWithCacheBust } : r));
      toast({ title: type === "stamp" ? "تم رفع الختم بنجاح ✅" : "تم رفع التوقيع بنجاح ✅" });
    } catch (e: any) {
      toast({ title: "خطأ في الرفع", description: e.message, variant: "destructive" });
    } finally {
      setUploadingAsset(null);
    }
  };

  const removeReciterAsset = async (reciterId: string, type: "stamp" | "signature") => {
    try {
      const col = type === "stamp" ? "stamp_url" : "signature_url";
      const { error } = await supabase
        .from("reciter_profiles")
        .update({ [col]: null })
        .eq("id", reciterId);
      if (error) throw error;
      setReciters(prev => prev.map(r => r.id === reciterId ? { ...r, [col]: null } : r));
      toast({ title: type === "stamp" ? "تم حذف الختم" : "تم حذف التوقيع" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, certRes] = await Promise.all([
        supabase.from("reciter_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("reciter_certifications").select("*"),
      ]);
      if (recRes.error) throw recRes.error;
      setReciters(recRes.data || []);
      setCertifications(certRes.data || []);
    } catch (error: any) {
      toast({ title: "خطأ في تحميل البيانات", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from("reciter_profiles")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      setReciters(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast({
        title: newStatus === "approved" ? "تم تفعيل الحساب" : "تم رفض الحساب",
        description: newStatus === "approved" ? "تم اعتماد المقرئ بنجاح" : "تم رفض طلب المقرئ",
      });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const getReciterCerts = (reciterId: string) =>
    certifications.filter(c => c.reciter_id === reciterId);

  const openCertDialog = (reciter: ReciterProfile, type: string = "ijaza", riwaya: string = "", existingText: string = "") => {
    setCertDialogReciter(reciter);
    setCertDialogType(type);
    setCertDialogRiwaya(riwaya);
    setCertDialogText(existingText);
  };

  const saveCertification = async () => {
    if (!certDialogReciter) return;
    if (certDialogType === "ijaza" && !certDialogRiwaya) {
      toast({ title: "يرجى اختيار الرواية", variant: "destructive" });
      return;
    }
    setSavingCert(true);
    try {
      const existing = certifications.find(c =>
        c.reciter_id === certDialogReciter.user_id &&
        c.type === certDialogType &&
        (certDialogType === "khatm" ? !c.riwaya : c.riwaya === certDialogRiwaya)
      );
      if (existing) {
        const { error } = await supabase.from("reciter_certifications")
          .update({ certification_text: certDialogText })
          .eq("id", existing.id);
        if (error) throw error;
        setCertifications(prev => prev.map(c => c.id === existing.id ? { ...c, certification_text: certDialogText } : c));
      } else {
        const { data, error } = await supabase.from("reciter_certifications")
          .insert({
            reciter_id: certDialogReciter.user_id,
            type: certDialogType,
            riwaya: certDialogType === "khatm" ? null : certDialogRiwaya,
            certification_text: certDialogText,
          })
          .select()
          .single();
        if (error) throw error;
        setCertifications(prev => [...prev, data]);
      }
      toast({ title: "تم حفظ الصياغة بنجاح ✅" });
      setCertDialogReciter(null);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSavingCert(false);
    }
  };

  const deleteCertification = async (certId: string) => {
    try {
      const { error } = await supabase.from("reciter_certifications").delete().eq("id", certId);
      if (error) throw error;
      setCertifications(prev => prev.filter(c => c.id !== certId));
      toast({ title: "تم حذف الصياغة" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    const total = reciters.length;
    const approved = reciters.filter(r => r.status === "approved").length;
    const pending = reciters.filter(r => r.status === "pending").length;
    const rejected = reciters.filter(r => r.status === "rejected").length;
    const males = reciters.filter(r => r.gender === "male").length;
    const females = reciters.filter(r => r.gender === "female").length;

    const nationalityMap: Record<string, number> = {};
    reciters.forEach(r => {
      nationalityMap[r.nationality] = (nationalityMap[r.nationality] || 0) + 1;
    });
    const topNationalities = Object.entries(nationalityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const cityMap: Record<string, number> = {};
    reciters.forEach(r => {
      if (r.city) cityMap[r.city] = (cityMap[r.city] || 0) + 1;
    });
    const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { total, approved, pending, rejected, males, females, topNationalities, topCities };
  }, [reciters]);

  const filteredReciters = useMemo(() => {
    return reciters.filter(r => {
      const matchesSearch = !searchQuery ||
        r.full_name.includes(searchQuery) ||
        r.phone.includes(searchQuery) ||
        r.nationality.includes(searchQuery) ||
        r.city.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesGender = genderFilter === "all" || r.gender === genderFilter;
      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [reciters, searchQuery, statusFilter, genderFilter]);

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${cleaned.replace("+", "")}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1"><CheckCircle className="w-3 h-3" />معتمد</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1"><XCircle className="w-3 h-3" />مرفوض</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1"><Clock className="w-3 h-3" />بانتظار التفعيل</Badge>;
    }
  };

  const statCards = [
    { label: "إجمالي المقرئين", value: stats.total, icon: GraduationCap, color: "primary", desc: "مقرئ مسجل" },
    { label: "معتمدون", value: stats.approved, icon: CheckCircle, color: "primary", desc: "مقرئ فعّال" },
    { label: "بانتظار التفعيل", value: stats.pending, icon: Clock, color: "gold", desc: "طلب جديد" },
    { label: "مرفوضون", value: stats.rejected, icon: XCircle, color: "destructive", desc: "طلب مرفوض" },
    { label: "الذكور", value: stats.males, icon: UserCheck, color: "primary", desc: "مقرئ" },
    { label: "الإناث", value: stats.females, icon: UserCheck, color: "gold", desc: "مقرئة" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1 text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">إدارة المقرئين</h1>
              <p className="text-xs text-muted-foreground">عرض وإدارة وتفعيل حسابات المقرئين</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              إضافة مقرئ
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="gradient-primary px-6 py-10">
          <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-white/5 -translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-white/5 translate-x-16 translate-y-16" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-7 h-7 text-gold" />
              <h2 className="text-2xl font-bold text-primary-foreground">لوحة إدارة المقرئين</h2>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-2xl">
              إدارة شاملة للمقرئين المعتمدين وطلبات التسجيل الجديدة وتفعيل الحسابات
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
              <Card className="group border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1.5 relative">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
                    stat.color === "gold" ? "bg-gold/15" : stat.color === "destructive" ? "bg-destructive/10" : "bg-primary/10"
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === "gold" ? "text-gold" : stat.color === "destructive" ? "text-destructive" : "text-primary"
                    }`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? <span className="inline-block w-8 h-6 rounded bg-muted animate-pulse" /> : stat.value}
                  </span>
                  <span className="text-sm font-medium text-foreground">{stat.label}</span>
                  <span className="text-[11px] text-muted-foreground">{stat.desc}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Insights Row */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Nationalities */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                  </div>
                  أكثر الجنسيات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded-lg bg-muted/50 animate-pulse" />)}</div>
                ) : stats.topNationalities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topNationalities.map(([nat, count], i) => (
                      <div key={nat} className="flex items-center justify-between p-2 rounded-lg bg-accent/20">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm font-medium text-foreground">{nat}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{count} مقرئ</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Cities */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-gold" />
                  </div>
                  أكثر المدن
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded-lg bg-muted/50 animate-pulse" />)}</div>
                ) : stats.topCities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topCities.map(([city, count]) => (
                      <div key={city} className="flex items-center justify-between p-2 rounded-lg bg-accent/20">
                        <span className="text-sm font-medium text-foreground">{city}</span>
                        <Badge variant="secondary" className="text-xs">{count} مقرئ</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Reciters List */}
      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/30 bg-accent/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-primary" />
                  </div>
                  جميع المقرئين
                  <Badge variant="secondary" className="text-xs">{filteredReciters.length} مقرئ</Badge>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث بالاسم أو الجوال أو المدينة..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9 bg-card border-border/50 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    {[
                      { key: "all", label: "الكل" },
                      { key: "pending", label: "بانتظار" },
                      { key: "approved", label: "معتمد" },
                      { key: "rejected", label: "مرفوض" },
                    ].map((s) => (
                      <Button
                        key={s.key}
                        variant={statusFilter === s.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(s.key)}
                        className="text-xs h-8 px-3"
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {["all", "male", "female"].map((g) => (
                      <Button
                        key={g}
                        variant={genderFilter === g ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGenderFilter(g)}
                        className="text-xs h-8 px-3"
                      >
                        {g === "all" ? "الجنسين" : g === "male" ? "ذكور" : "إناث"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}
                </div>
              ) : filteredReciters.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-12">لا يوجد مقرئون مطابقون للبحث</p>
              ) : (
                <div className="space-y-2">
                  {filteredReciters.map((reciter, i) => {
                    const isExpanded = expandedReciter === reciter.id;
                    return (
                      <motion.div
                        key={reciter.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                          reciter.status === "pending"
                            ? "border-amber-200/60 bg-amber-50/30"
                            : "border-border/30 " + (isExpanded ? "bg-accent/30 shadow-sm" : "bg-accent/10 hover:bg-accent/20")
                        }`}>
                          {/* Main Row */}
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => setExpandedReciter(isExpanded ? null : reciter.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                reciter.status === "approved" ? "bg-green-100" : reciter.status === "pending" ? "bg-amber-100" : "bg-red-100"
                              }`}>
                                <GraduationCap className={`w-4 h-4 ${
                                  reciter.status === "approved" ? "text-green-600" : reciter.status === "pending" ? "text-amber-600" : "text-red-600"
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground">{reciter.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {reciter.nationality} · {reciter.city} · {reciter.gender === "male" ? "ذكر" : "أنثى"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(reciter.status)}
                              {/* Quick contact */}
                              <div className="hidden md:flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                  onClick={(e) => { e.stopPropagation(); openWhatsApp(reciter.phone); }} title="واتساب">
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                  onClick={(e) => { e.stopPropagation(); window.open(`tel:${reciter.phone}`, "_self"); }} title="اتصال">
                                  <Phone className="w-4 h-4" />
                                </Button>
                              </div>
                              <span className="text-[11px] text-muted-foreground hidden sm:block">
                                {new Date(reciter.created_at).toLocaleDateString("ar-SA")}
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 border-t border-border/20 pt-3" dir="rtl">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Personal Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <GraduationCap className="w-3 h-3" /> البيانات الشخصية
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">الجوال:</span><span className="font-medium text-foreground" dir="ltr">{reciter.phone}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">الجنسية:</span><span className="font-medium text-foreground">{reciter.nationality}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">المدينة:</span><span className="font-medium text-foreground">{reciter.city}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">المهنة:</span><span className="font-medium text-foreground">{reciter.profession}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">رقم الهوية:</span><span className="font-medium text-foreground">{reciter.id_number}</span></div>
                                      </div>
                                    </div>

                                    {/* Qualifications */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-gold flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> المؤهلات والخبرات
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">المؤهل:</span><span className="font-medium text-foreground">{reciter.qualifications}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">الخبرة:</span><span className="font-medium text-foreground">{reciter.teaching_experience}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">الإجازات:</span><span className="font-medium text-foreground">{reciter.quran_certifications}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">المسار:</span><span className="font-medium text-foreground">{reciter.preferred_track || "غير محدد"}</span></div>
                                      </div>
                                    </div>

                                    {/* Schedule & Actions */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> التفضيلات والإجراءات
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">الأيام:</span> <span className="font-medium text-foreground">{reciter.preferred_days?.join("، ") || "غير محدد"}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">الأوقات:</span> <span className="font-medium text-foreground">{reciter.preferred_times?.join("، ") || "غير محدد"}</span></div>
                                        <div className="flex gap-2"><span className="text-muted-foreground shrink-0">التسجيل:</span> <span className="font-medium text-foreground">{new Date(reciter.created_at).toLocaleDateString("ar-SA")}</span></div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-muted-foreground shrink-0">نوع المقرئ:</span>
                                          <Select
                                            value={reciter.reciter_type || "general"}
                                            onValueChange={async (val) => {
                                              try {
                                                const { error } = await supabase
                                                  .from("reciter_profiles")
                                                  .update({ reciter_type: val })
                                                  .eq("id", reciter.id);
                                                if (error) throw error;
                                                setReciters(prev => prev.map(r => r.id === reciter.id ? { ...r, reciter_type: val } : r));
                                                toast({ title: "تم تحديث نوع المقرئ ✅" });
                                              } catch (e: any) {
                                                toast({ title: "خطأ", description: e.message, variant: "destructive" });
                                              }
                                            }}
                                          >
                                            <SelectTrigger className="h-7 w-[130px] text-xs bg-card border-border/50">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="general">مقرئ عام</SelectItem>
                                              <SelectItem value="ijazah">مقرئ إجازات</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      {/* Approval Actions */}
                                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                                        {reciter.status !== "approved" && (
                                          <Button
                                            size="sm"
                                            className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs"
                                            onClick={(e) => { e.stopPropagation(); updateStatus(reciter.id, "approved"); }}
                                            disabled={updatingId === reciter.id}
                                          >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            تفعيل الحساب
                                          </Button>
                                        )}
                                        {reciter.status !== "rejected" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                                            onClick={(e) => { e.stopPropagation(); updateStatus(reciter.id, "rejected"); }}
                                            disabled={updatingId === reciter.id}
                                          >
                                            <XCircle className="w-3.5 h-3.5" />
                                            رفض
                                          </Button>
                                        )}
                                        {reciter.status !== "pending" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 text-xs"
                                            onClick={(e) => { e.stopPropagation(); updateStatus(reciter.id, "pending"); }}
                                            disabled={updatingId === reciter.id}
                                          >
                                            <Clock className="w-3.5 h-3.5" />
                                            تعليق
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10 text-xs"
                                          onClick={(e) => { e.stopPropagation(); openEditDialog(reciter); }}
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          تعديل
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(reciter); }}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          حذف
                                        </Button>
                                      </div>
                                    </div>
                                  </div>


                                  {/* Stamp & Signature */}
                                  <div className="mt-4 pt-3 border-t border-border/20">
                                    <h4 className="text-xs font-bold text-primary flex items-center gap-1 mb-3">
                                      <Image className="w-3 h-3" /> الختم والتوقيع
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {/* Stamp */}
                                      <div className="space-y-2">
                                        <label className="text-[11px] font-semibold text-muted-foreground">ختم المقرئ</label>
                                        {reciter.stamp_url ? (
                                          <div className="relative group rounded-xl border border-border/30 bg-accent/10 p-2 flex items-center gap-3">
                                            <img src={reciter.stamp_url} alt="ختم" className="w-16 h-16 object-contain rounded-lg bg-white" />
                                            <div className="flex-1">
                                              <p className="text-[10px] text-muted-foreground">تم رفع الختم</p>
                                            </div>
                                            <div className="flex gap-1">
                                              <label className="cursor-pointer">
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                  const f = e.target.files?.[0];
                                                  if (f) uploadReciterAsset(reciter.id, reciter.user_id, f, "stamp");
                                                }} />
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                                                  <Upload className="w-3 h-3 text-primary" />
                                                </div>
                                              </label>
                                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                onClick={(e) => { e.stopPropagation(); removeReciterAsset(reciter.id, "stamp"); }}>
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <label className="cursor-pointer block">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              if (f) uploadReciterAsset(reciter.id, reciter.user_id, f, "stamp");
                                            }} />
                                            <div className="rounded-xl border-2 border-dashed border-border/50 p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
                                              {uploadingAsset === `${reciter.id}-stamp` ? (
                                                <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                                              ) : (
                                                <>
                                                  <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                                                  <p className="text-[10px] text-muted-foreground">رفع صورة الختم</p>
                                                </>
                                              )}
                                            </div>
                                          </label>
                                        )}
                                      </div>
                                      {/* Signature */}
                                      <div className="space-y-2">
                                        <label className="text-[11px] font-semibold text-muted-foreground">توقيع المقرئ</label>
                                        {reciter.signature_url ? (
                                          <div className="relative group rounded-xl border border-border/30 bg-accent/10 p-2 flex items-center gap-3">
                                            <img src={reciter.signature_url} alt="توقيع" className="w-16 h-16 object-contain rounded-lg bg-white" />
                                            <div className="flex-1">
                                              <p className="text-[10px] text-muted-foreground">تم رفع التوقيع</p>
                                            </div>
                                            <div className="flex gap-1">
                                              <label className="cursor-pointer">
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                  const f = e.target.files?.[0];
                                                  if (f) uploadReciterAsset(reciter.id, reciter.user_id, f, "signature");
                                                }} />
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                                                  <Upload className="w-3 h-3 text-primary" />
                                                </div>
                                              </label>
                                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                onClick={(e) => { e.stopPropagation(); removeReciterAsset(reciter.id, "signature"); }}>
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <label className="cursor-pointer block">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              if (f) uploadReciterAsset(reciter.id, reciter.user_id, f, "signature");
                                            }} />
                                            <div className="rounded-xl border-2 border-dashed border-border/50 p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
                                              {uploadingAsset === `${reciter.id}-signature` ? (
                                                <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                                              ) : (
                                                <>
                                                  <PenTool className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                                                  <p className="text-[10px] text-muted-foreground">رفع صورة التوقيع</p>
                                                </>
                                              )}
                                            </div>
                                          </label>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Certification Texts */}
                                  <div className="mt-4 pt-3 border-t border-border/20">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-xs font-bold text-gold flex items-center gap-1">
                                        <Award className="w-3 h-3" /> صيغ الإجازات والشهادات
                                      </h4>
                                      <div className="flex gap-1.5">
                                        <Button size="sm" variant="outline"
                                          onClick={(e) => { e.stopPropagation(); openCertDialog(reciter, "khatm"); }}
                                          className="text-[10px] h-7 gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10">
                                          <Plus className="w-3 h-3" /> صيغة ختم
                                        </Button>
                                        <Button size="sm" variant="outline"
                                          onClick={(e) => { e.stopPropagation(); openCertDialog(reciter, "ijaza"); }}
                                          className="text-[10px] h-7 gap-1 rounded-lg border-gold/30 text-gold hover:bg-gold/10">
                                          <Plus className="w-3 h-3" /> صيغة إجازة
                                        </Button>
                                      </div>
                                    </div>
                                    {(() => {
                                      const rCerts = getReciterCerts(reciter.user_id);
                                      if (rCerts.length === 0) return (
                                        <p className="text-[11px] text-muted-foreground text-center py-3 bg-accent/20 rounded-lg">
                                          لم تُضف أي صياغات بعد. أضف صيغة ختم أو إجازة لتظهر تلقائياً عند إصدار الشهادات.
                                        </p>
                                      );
                                      return (
                                        <div className="space-y-2">
                                          {rCerts.map(cert => (
                                            <div key={cert.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-accent/20 border border-border/20">
                                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cert.type === "ijaza" ? "bg-gold/15" : "bg-primary/10"}`}>
                                                {cert.type === "ijaza" ? <GraduationCap className="w-3.5 h-3.5 text-gold" /> : <Award className="w-3.5 h-3.5 text-primary" />}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <Badge className={`text-[9px] border ${cert.type === "ijaza" ? "bg-gold/15 text-gold border-gold/30" : "bg-primary/10 text-primary border-primary/30"}`}>
                                                    {cert.type === "ijaza" ? `إجازة - ${cert.riwaya}` : "شهادة ختم"}
                                                  </Badge>
                                                </div>
                                                <p className="text-[11px] text-foreground mt-1 line-clamp-2">{cert.certification_text || "—"}</p>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                                                  onClick={(e) => { e.stopPropagation(); openCertDialog(reciter, cert.type, cert.riwaya || "", cert.certification_text); }}>
                                                  <CheckCircle className="w-3 h-3" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                  onClick={(e) => { e.stopPropagation(); deleteCertification(cert.id); }}>
                                                  <XCircle className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  <div className="flex md:hidden items-center gap-2 mt-4 pt-3 border-t border-border/20">
                                    <Button variant="outline" size="sm" className="flex-1 gap-2 text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={() => openWhatsApp(reciter.phone)}>
                                      <MessageCircle className="w-4 h-4" /> واتساب
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-2 text-primary border-primary/20 hover:bg-primary/10"
                                      onClick={() => window.open(`tel:${reciter.phone}`, "_self")}>
                                      <Phone className="w-4 h-4" /> اتصال
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Certification Text Dialog */}
      <Dialog open={!!certDialogReciter} onOpenChange={() => setCertDialogReciter(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${certDialogType === "ijaza" ? "bg-gold/15" : "bg-primary/10"}`}>
                {certDialogType === "ijaza" ? <GraduationCap className="w-4 h-4 text-gold" /> : <Award className="w-4 h-4 text-primary" />}
              </div>
              {certDialogType === "ijaza" ? "صياغة إجازة قرآنية" : "صياغة شهادة ختم"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {certDialogReciter?.full_name} — {certDialogType === "ijaza" ? "أدخل صياغة الإجازة للرواية المحددة" : "أدخل صياغة شهادة ختم القرآن الكريم"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {certDialogType === "ijaza" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gold">الرواية</label>
                <Select value={certDialogRiwaya} onValueChange={setCertDialogRiwaya}>
                  <SelectTrigger className="bg-card border-border/50">
                    <SelectValue placeholder="اختر الرواية" />
                  </SelectTrigger>
                  <SelectContent>
                    {RIWAYAT.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">نص الصياغة المعتمدة</label>
              <Textarea
                value={certDialogText}
                onChange={e => setCertDialogText(e.target.value)}
                placeholder="أدخل نص الإجازة أو الشهادة المعتمدة..."
                className="bg-card border-border/50 min-h-[120px]"
              />
            </div>
            <Button
              onClick={saveCertification}
              disabled={savingCert}
              className="gap-2 bg-gold hover:bg-gold/90 text-primary-foreground rounded-xl"
            >
              {savingCert ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              حفظ الصياغة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Reciter Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              إضافة مقرئ جديد
            </DialogTitle>
            <DialogDescription>أنشئ حساب مقرئ مباشرة من داخل المنصة. سيتم تفعيل الحساب تلقائياً.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs font-medium">الاسم الكامل *</label>
              <Input value={newReciter.full_name} onChange={(e) => setNewReciter({ ...newReciter, full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">رقم الجوال *</label>
              <Input dir="ltr" value={newReciter.phone} onChange={(e) => setNewReciter({ ...newReciter, phone: e.target.value })} placeholder="+9665XXXXXXXX" />
            </div>
            <div>
              <label className="text-xs font-medium">البريد الإلكتروني *</label>
              <Input type="email" dir="ltr" value={newReciter.email} onChange={(e) => setNewReciter({ ...newReciter, email: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">كلمة المرور *</label>
              <Input type="text" dir="ltr" value={newReciter.password} onChange={(e) => setNewReciter({ ...newReciter, password: e.target.value })} placeholder="6 أحرف على الأقل" />
            </div>
            <div>
              <label className="text-xs font-medium">الجنس *</label>
              <Select value={newReciter.gender} onValueChange={(v) => setNewReciter({ ...newReciter, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">نوع المقرئ</label>
              <Select value={newReciter.reciter_type} onValueChange={(v) => setNewReciter({ ...newReciter, reciter_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">مقرئ عام</SelectItem>
                  <SelectItem value="ijazah">مقرئ إجازات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">الجنسية *</label>
              <Input value={newReciter.nationality} onChange={(e) => setNewReciter({ ...newReciter, nationality: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">المدينة *</label>
              <Input value={newReciter.city} onChange={(e) => setNewReciter({ ...newReciter, city: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">رقم الهوية *</label>
              <Input value={newReciter.id_number} onChange={(e) => setNewReciter({ ...newReciter, id_number: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">المهنة</label>
              <Input value={newReciter.profession} onChange={(e) => setNewReciter({ ...newReciter, profession: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium">المؤهلات</label>
              <Input value={newReciter.qualifications} onChange={(e) => setNewReciter({ ...newReciter, qualifications: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium">الإجازات القرآنية</label>
              <Input value={newReciter.quran_certifications} onChange={(e) => setNewReciter({ ...newReciter, quran_certifications: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium">الخبرة في التدريس</label>
              <Input value={newReciter.teaching_experience} onChange={(e) => setNewReciter({ ...newReciter, teaching_experience: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">حالة الحساب</label>
              <Select value={newReciter.status} onValueChange={(v) => setNewReciter({ ...newReciter, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="pending">بانتظار التفعيل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addSaving}>إلغاء</Button>
            <Button onClick={createReciter} disabled={addSaving} className="gap-2">
              {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إنشاء الحساب
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المقرئ</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المقرئ <span className="font-bold text-foreground">{deleteTarget?.full_name}</span>؟
              <br />
              سيتم حذف الحساب وجميع البيانات المرتبطة به نهائيًا، ولا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteReciter}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReciters;
