import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  GraduationCap, Search, Phone, Mail, MessageCircle,
  Globe, UserCheck, TrendingUp, BookOpen,
  RefreshCw, ChevronDown, ChevronUp, Filter,
  ArrowRight, Clock, CheckCircle, XCircle, ShieldCheck
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
  created_at: string;
}

const AdminReciters = () => {
  const [reciters, setReciters] = useState<ReciterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [expandedReciter, setExpandedReciter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reciter_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReciters(data || []);
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
                                <div className="px-4 pb-4 border-t border-border/20 pt-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Personal Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <GraduationCap className="w-3 h-3" /> البيانات الشخصية
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجوال:</span><span className="font-medium text-foreground" dir="ltr">{reciter.phone}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجنسية:</span><span className="font-medium text-foreground">{reciter.nationality}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المدينة:</span><span className="font-medium text-foreground">{reciter.city}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المهنة:</span><span className="font-medium text-foreground">{reciter.profession}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">رقم الهوية:</span><span className="font-medium text-foreground">{reciter.id_number}</span></div>
                                      </div>
                                    </div>

                                    {/* Qualifications */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-gold flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> المؤهلات والخبرات
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">المؤهل:</span><span className="font-medium text-foreground">{reciter.qualifications}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الخبرة:</span><span className="font-medium text-foreground">{reciter.teaching_experience}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الإجازات:</span><span className="font-medium text-foreground">{reciter.quran_certifications}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المسار:</span><span className="font-medium text-foreground">{reciter.preferred_track || "غير محدد"}</span></div>
                                      </div>
                                    </div>

                                    {/* Schedule & Actions */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> التفضيلات والإجراءات
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div><span className="text-muted-foreground">الأيام:</span> <span className="font-medium text-foreground">{reciter.preferred_days?.join("، ") || "غير محدد"}</span></div>
                                        <div><span className="text-muted-foreground">الأوقات:</span> <span className="font-medium text-foreground">{reciter.preferred_times?.join("، ") || "غير محدد"}</span></div>
                                        <div><span className="text-muted-foreground">التسجيل:</span> <span className="font-medium text-foreground">{new Date(reciter.created_at).toLocaleDateString("ar-SA")}</span></div>
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
                                      </div>
                                    </div>
                                  </div>

                                  {/* Mobile Contact */}
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
    </div>
  );
};

export default AdminReciters;
