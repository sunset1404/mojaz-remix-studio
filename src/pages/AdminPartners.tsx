import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  UserCheck, Search, Phone, Mail, MessageCircle,
  TrendingUp, DollarSign, Users, Building2,
  RefreshCw, ChevronDown, ChevronUp,
  ArrowRight, Plus, Copy, Check, Eye, EyeOff,
  Wallet, Clock, UserPlus, X, Loader2, BookMarked, BarChart3
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface PartnerProfile {
  id: string;
  user_id: string;
  full_name: string;
  organization_name: string | null;
  phone: string | null;
  email: string | null;
  total_support_amount: number;
  cost_per_minute: number;
  created_at: string;
  deleted_at?: string | null;
}

interface PartnerUsage {
  partner_id: string;
  minutes_used: number;
}

interface PartnerStudent {
  partner_id: string;
  student_id: string;
  status: string;
}

const AdminPartners = () => {
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [usageLogs, setUsageLogs] = useState<PartnerUsage[]>([]);
  const [partnerStudents, setPartnerStudents] = useState<PartnerStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Create partner form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPartner, setNewPartner] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    organization_name: "",
    total_support_amount: "",
  });
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Assign students dialog
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; partnerId: string; partnerName: string }>({ open: false, partnerId: "", partnerName: "" });
  const [allStudents, setAllStudents] = useState<{ user_id: string; full_name: string; phone: string; preferred_track: string; program_id?: string | null }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<"all" | "ijazah" | "general">("all");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [partnersRes, usageRes, studentsRes] = await Promise.all([
        supabase.from("partner_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("partner_usage_logs").select("partner_id, minutes_used"),
        supabase.from("partner_students").select("partner_id, student_id, status"),
      ]);
      if (partnersRes.error) throw partnersRes.error;
      setPartners(partnersRes.data || []);
      setUsageLogs(usageRes.data || []);
      setPartnerStudents(studentsRes.data || []);
    } catch (error: any) {
      toast({ title: "خطأ في تحميل البيانات", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getPartnerUsage = (partnerId: string) => {
    const logs = usageLogs.filter(l => l.partner_id === partnerId);
    return logs.reduce((sum, l) => sum + Number(l.minutes_used), 0);
  };

  const getPartnerStudentCount = (partnerId: string) => {
    return partnerStudents.filter(s => s.partner_id === partnerId && s.status === "active").length;
  };

  const getBalance = (partner: PartnerProfile) => {
    const totalUsedMinutes = getPartnerUsage(partner.user_id);
    const usedAmount = totalUsedMinutes * Number(partner.cost_per_minute);
    return Number(partner.total_support_amount) - usedAmount;
  };

  const stats = useMemo(() => {
    const total = partners.length;
    const totalSupport = partners.reduce((s, p) => s + Number(p.total_support_amount), 0);
    const totalUsedMinutes = usageLogs.reduce((s, l) => s + Number(l.minutes_used), 0);
    const totalStudents = new Set(partnerStudents.filter(s => s.status === "active").map(s => s.student_id)).size;
    const avgCostPerMinute = partners.length > 0
      ? partners.reduce((s, p) => s + Number(p.cost_per_minute), 0) / partners.length
      : 0;
    const totalUsedAmount = usageLogs.reduce((s, l) => {
      const partner = partners.find(p => p.user_id === l.partner_id);
      return s + Number(l.minutes_used) * (partner ? Number(partner.cost_per_minute) : 0.82);
    }, 0);
    const totalBalance = totalSupport - totalUsedAmount;

    return { total, totalSupport, totalUsedMinutes, totalStudents, avgCostPerMinute, totalBalance };
  }, [partners, usageLogs, partnerStudents]);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      if (!searchQuery) return true;
      return p.full_name.includes(searchQuery) ||
        (p.organization_name && p.organization_name.includes(searchQuery)) ||
        (p.phone && p.phone.includes(searchQuery));
    });
  }, [partners, searchQuery]);

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${cleaned.replace("+", "")}`, "_blank");
  };

  const createPartnerAccount = async () => {
    if (!newPartner.full_name || !newPartner.email || !newPartner.password) {
      toast({ title: "تنبيه", description: "يرجى تعبئة الاسم والبريد وكلمة المرور", variant: "destructive" });
      return;
    }
    try {
      setCreating(true);
      const { data, error } = await supabase.functions.invoke("create-partner", {
        body: {
          email: newPartner.email.trim(),
          password: newPartner.password,
          full_name: newPartner.full_name.trim(),
          phone: newPartner.phone.trim(),
          organization_name: newPartner.organization_name.trim(),
          total_support_amount: parseFloat(newPartner.total_support_amount) || 0,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreatedCredentials({
        email: newPartner.email.trim(),
        password: newPartner.password,
        name: newPartner.full_name.trim(),
      });
      toast({ title: "تم إنشاء الحساب بنجاح", description: `تم إنشاء حساب الشريك ${newPartner.full_name}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "خطأ في إنشاء الحساب", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const getAppUrl = () => {
    return window.location.origin;
  };

  const getCredentialsMessage = () => {
    if (!createdCredentials) return "";
    return `السلام عليكم ورحمة الله وبركاته 🌙

أهلاً بك يا *${createdCredentials.name}* في منصة مجاز لإقراء القرآن الكريم ✨

تم إنشاء حسابك كشريك داعم في المنصة، وهذه بيانات الدخول الخاصة بك:

📧 البريد الإلكتروني: ${createdCredentials.email}
🔑 كلمة المرور: ${createdCredentials.password}

🔗 رابط التطبيق: ${getAppUrl()}

جزاكم الله خيراً على دعمكم الكريم لبرنامج إقراء القرآن الكريم 🤲

_منصة مجاز - نظام إدارة إقراء القرآن_`;
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(getCredentialsMessage());
    setCopied(true);
    toast({ title: "تم النسخ", description: "تم نسخ بيانات الدخول مع الرسالة" });
    setTimeout(() => setCopied(false), 2000);
  };

  const sendViaWhatsApp = () => {
    if (!createdCredentials) return;
    const msg = encodeURIComponent(getCredentialsMessage());
    const phone = newPartner.phone.replace(/[^0-9+]/g, "").replace("+", "");
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    }
  };

  const sendViaEmail = () => {
    if (!createdCredentials) return;
    const subject = encodeURIComponent("بيانات الدخول لمنصة مجاز");
    const body = encodeURIComponent(getCredentialsMessage());
    window.open(`mailto:${createdCredentials.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const resetCreateForm = () => {
    setNewPartner({ full_name: "", email: "", password: "", phone: "", organization_name: "", total_support_amount: "" });
    setCreatedCredentials(null);
    setShowPassword(false);
    setCopied(false);
  };

  const openAssignDialog = async (partnerId: string, partnerName: string) => {
    setAssignDialog({ open: true, partnerId, partnerName });
    setSelectedStudentIds(new Set());
    setStudentSearch("");
    setTrackFilter("all");
    setProgramFilter("all");
    setLoadingStudents(true);
    try {
      const [{ data }, progRes] = await Promise.all([
        supabase.from("student_profiles").select("user_id, full_name, phone, preferred_track, program_id"),
        (supabase as any).from("programs").select("id, name").order("created_at", { ascending: false }),
      ]);
      setAllStudents((data as any[]) || []);
      const progs = (((progRes as any)?.data as any[]) || []) as { id: string; name: string }[];
      setPrograms(progs);
    } catch {
      toast({ title: "خطأ في تحميل الطلاب", variant: "destructive" });
    } finally {
      setLoadingStudents(false);
    }
  };

  // All students assigned to ANY partner (globally)
  const globallyAssignedIds = useMemo(() => {
    return new Set(
      partnerStudents
        .filter(s => s.status === "active")
        .map(s => s.student_id)
    );
  }, [partnerStudents]);

  const filteredStudents = useMemo(() => {
    let list = allStudents.filter(s => !globallyAssignedIds.has(s.user_id));
    if (trackFilter === "ijazah") list = list.filter(s => s.preferred_track === "إجازة");
    else if (trackFilter === "general") list = list.filter(s => s.preferred_track !== "إجازة");
    if (programFilter === "none") list = list.filter(s => !s.program_id);
    else if (programFilter !== "all") list = list.filter(s => s.program_id === programFilter);
    if (studentSearch) list = list.filter(s => s.full_name.includes(studentSearch) || s.phone.includes(studentSearch));
    return list;
  }, [allStudents, studentSearch, trackFilter, programFilter, globallyAssignedIds]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const available = filteredStudents;
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      const allSelected = available.every(s => next.has(s.user_id));
      if (allSelected) {
        available.forEach(s => next.delete(s.user_id));
      } else {
        available.forEach(s => next.add(s.user_id));
      }
      return next;
    });
  };

  const assignStudents = async () => {
    if (selectedStudentIds.size === 0) return;
    setAssigning(true);
    try {
      const rows = Array.from(selectedStudentIds).map(studentId => ({
        partner_id: assignDialog.partnerId,
        student_id: studentId,
        status: "active",
      }));
      const { error } = await supabase.from("partner_students").insert(rows);
      if (error) throw error;
      toast({ title: "تم تسكين الطلاب بنجاح", description: `تم إضافة ${rows.length} طالب على الشريك` });
      setAssignDialog({ open: false, partnerId: "", partnerName: "" });
      fetchData();
    } catch (error: any) {
      toast({ title: "خطأ في تسكين الطلاب", description: error.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const statCards = [
    { label: "إجمالي الشركاء", value: stats.total, icon: UserCheck, color: "primary", desc: "شريك داعم" },
    { label: "إجمالي الدعم", value: `${stats.totalSupport.toLocaleString()} ر.س`, icon: Wallet, color: "gold", desc: "ميزانية مخصصة" },
    { label: "الرصيد المتبقي", value: `${Math.round(stats.totalBalance).toLocaleString()} ر.س`, icon: DollarSign, color: "primary", desc: "رصيد متاح" },
    { label: "الدقائق المستهلكة", value: Math.round(stats.totalUsedMinutes).toLocaleString(), icon: Clock, color: "gold", desc: "دقيقة" },
    { label: "الطلاب المدعومون", value: stats.totalStudents, icon: Users, color: "primary", desc: "طالب نشط" },
    { label: "تكلفة الدقيقة", value: `${stats.avgCostPerMinute.toFixed(2)} ر.س`, icon: TrendingUp, color: "gold", desc: "متوسط التكلفة" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div>
              <h1 className="text-lg font-bold text-foreground">إدارة الشركاء</h1>
              <p className="text-xs text-muted-foreground">إدارة حسابات الشركاء الداعمين وأرصدتهم</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetCreateForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 text-xs">
                  <Plus className="w-4 h-4" />
                  إنشاء حساب شريك
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                {!createdCredentials ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-right">إنشاء حساب شريك جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>الاسم الكامل *</Label>
                        <Input
                          placeholder="اسم الشريك"
                          value={newPartner.full_name}
                          onChange={(e) => setNewPartner(p => ({ ...p, full_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>البريد الإلكتروني *</Label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          dir="ltr"
                          value={newPartner.email}
                          onChange={(e) => setNewPartner(p => ({ ...p, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>كلمة المرور *</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="كلمة مرور قوية"
                            dir="ltr"
                            value={newPartner.password}
                            onChange={(e) => setNewPartner(p => ({ ...p, password: e.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>رقم الجوال</Label>
                        <Input
                          placeholder="+966xxxxxxxxx"
                          dir="ltr"
                          value={newPartner.phone}
                          onChange={(e) => setNewPartner(p => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>اسم المنظمة / الجهة</Label>
                        <Input
                          placeholder="اسم الجهة الداعمة (اختياري)"
                          value={newPartner.organization_name}
                          onChange={(e) => setNewPartner(p => ({ ...p, organization_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>مبلغ الدعم (ر.س)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          dir="ltr"
                          value={newPartner.total_support_amount}
                          onChange={(e) => setNewPartner(p => ({ ...p, total_support_amount: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">إلغاء</Button>
                      </DialogClose>
                      <Button onClick={createPartnerAccount} disabled={creating} className="gap-2">
                        {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        إنشاء الحساب
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-right text-green-600">✅ تم إنشاء الحساب بنجاح</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="bg-accent/30 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الاسم:</span>
                          <span className="font-semibold text-foreground">{createdCredentials.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">البريد:</span>
                          <span className="font-semibold text-foreground" dir="ltr">{createdCredentials.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">كلمة المرور:</span>
                          <span className="font-semibold text-foreground font-mono" dir="ltr">{createdCredentials.password}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">اختر طريقة إرسال البيانات للشريك:</p>

                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          className="gap-2 text-green-600 border-green-200 hover:bg-green-50 justify-start"
                          onClick={sendViaWhatsApp}
                        >
                          <MessageCircle className="w-4 h-4" />
                          إرسال عبر واتساب
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 justify-start"
                          onClick={sendViaEmail}
                        >
                          <Mail className="w-4 h-4" />
                          إرسال عبر البريد الإلكتروني
                        </Button>
                        <Button
                          variant="outline"
                          className={`gap-2 justify-start ${copied ? "text-green-600 border-green-300" : "text-foreground"}`}
                          onClick={copyCredentials}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "تم النسخ!" : "نسخ البيانات مع الرسالة"}
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button onClick={resetCreateForm}>إغلاق</Button>
                      </DialogClose>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
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
              <UserCheck className="w-7 h-7 text-gold" />
              <h2 className="text-2xl font-bold text-primary-foreground">لوحة إدارة الشركاء</h2>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-2xl">
              إدارة شاملة للشركاء الداعمين وأرصدتهم ومتابعة استهلاكهم وطلابهم المدعومين
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
                    stat.color === "gold" ? "bg-gold/15" : "bg-primary/10"
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === "gold" ? "text-gold" : "text-primary"
                    }`} />
                  </div>
                  <span className="text-xl font-bold text-foreground">
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

      {/* Partners List */}
      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/30 bg-accent/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-primary" />
                  </div>
                  جميع الشركاء الداعمين
                  <Badge variant="secondary" className="text-xs">{filteredPartners.length} شريك</Badge>
                </CardTitle>
                <div className="relative min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو الجهة أو الجوال..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 bg-card border-border/50 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">لا يوجد شركاء مطابقين للبحث</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4" />
                    إنشاء حساب شريك جديد
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPartners.map((partner, i) => {
                    const isExpanded = expandedPartner === partner.id;
                    const usedMinutes = getPartnerUsage(partner.user_id);
                    const usedAmount = usedMinutes * Number(partner.cost_per_minute);
                    const balance = Number(partner.total_support_amount) - usedAmount;
                    const studentCount = getPartnerStudentCount(partner.user_id);
                    const balancePercent = Number(partner.total_support_amount) > 0
                      ? (balance / Number(partner.total_support_amount)) * 100
                      : 0;

                    return (
                      <motion.div
                        key={partner.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div className={`rounded-xl border border-border/30 overflow-hidden transition-all duration-200 ${
                          isExpanded ? "bg-accent/30 shadow-sm" : "bg-accent/10 hover:bg-accent/20"
                        }`}>
                          {/* Main Row */}
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => setExpandedPartner(isExpanded ? null : partner.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                {partner.organization_name
                                  ? <Building2 className="w-4 h-4 text-primary" />
                                  : <UserCheck className="w-4 h-4 text-primary" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm text-foreground">{partner.full_name}</p>
                                  {partner.deleted_at && (
                                    <>
                                      <Badge className="bg-zinc-200 text-zinc-800 border-zinc-300 text-[10px]">حساب محذوف</Badge>
                                      <RestoreAccountButton userId={partner.user_id} onRestored={fetchData} />
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {partner.organization_name || "شريك فردي"} · {studentCount} طالب · {Math.round(usedMinutes)} دقيقة
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Balance badge */}
                              <Badge className={`text-xs ${
                                balancePercent > 50 ? "bg-green-100 text-green-700 border-green-200"
                                  : balancePercent > 20 ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                              }`}>
                                {Math.round(balance).toLocaleString()} ر.س
                              </Badge>
                              {/* Quick contact */}
                              <div className="hidden md:flex items-center gap-1">
                                {partner.phone && (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                      onClick={(e) => { e.stopPropagation(); openWhatsApp(partner.phone!); }} title="واتساب">
                                      <MessageCircle className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                      onClick={(e) => { e.stopPropagation(); window.open(`tel:${partner.phone}`, "_self"); }} title="اتصال">
                                      <Phone className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground hidden sm:block">
                                {new Date(partner.created_at).toLocaleDateString("ar-SA")}
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
                                    {/* Partner Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <UserCheck className="w-3 h-3" /> بيانات الشريك
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">الاسم:</span><span className="font-medium text-foreground">{partner.full_name}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">البريد:</span><span className="font-medium text-foreground" dir="ltr">{partner.email || "غير محدد"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجهة:</span><span className="font-medium text-foreground">{partner.organization_name || "غير محدد"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الجوال:</span><span className="font-medium text-foreground" dir="ltr">{partner.phone || "غير محدد"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">التسجيل:</span><span className="font-medium text-foreground">{new Date(partner.created_at).toLocaleDateString("ar-SA")}</span></div>
                                      </div>
                                    </div>

                                    {/* Financial Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-gold flex items-center gap-1">
                                        <Wallet className="w-3 h-3" /> البيانات المالية
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">إجمالي الدعم:</span><span className="font-medium text-foreground">{Number(partner.total_support_amount).toLocaleString()} ر.س</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المستهلك:</span><span className="font-medium text-foreground">{Math.round(usedAmount).toLocaleString()} ر.س</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">المتبقي:</span><span className={`font-bold ${balance > 0 ? "text-green-600" : "text-red-600"}`}>{Math.round(balance).toLocaleString()} ر.س</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">تكلفة الدقيقة:</span><span className="font-medium text-foreground">{Number(partner.cost_per_minute).toFixed(2)} ر.س</span></div>
                                      </div>
                                      {/* Balance bar */}
                                      <div className="mt-2">
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all ${
                                              balancePercent > 50 ? "bg-green-500" : balancePercent > 20 ? "bg-amber-500" : "bg-red-500"
                                            }`}
                                            style={{ width: `${Math.max(0, Math.min(100, balancePercent))}%` }}
                                          />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">{Math.round(balancePercent)}% متبقي</p>
                                      </div>
                                    </div>

                                    {/* Usage Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> الاستهلاك والأداء
                                      </h4>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">الطلاب النشطون:</span><span className="font-medium text-foreground">{studentCount}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">الدقائق المستهلكة:</span><span className="font-medium text-foreground">{Math.round(usedMinutes).toLocaleString()}</span></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assign Students Button */}
                                  <div className="mt-4 pt-3 border-t border-border/20 flex flex-wrap items-center gap-2">
                                    <Button
                                      size="sm"
                                      className="gap-2"
                                      onClick={(e) => { e.stopPropagation(); openAssignDialog(partner.user_id, partner.full_name); }}
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      إضافة طلاب على هذا الداعم
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2"
                                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/partners/${partner.user_id}/report`); }}
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      تقرير المنجزات
                                    </Button>
                                  </div>

                                  {/* Mobile Contact */}
                                  {partner.phone && (
                                    <div className="flex md:hidden items-center gap-2 mt-4 pt-3 border-t border-border/20">
                                      <Button variant="outline" size="sm" className="flex-1 gap-2 text-green-600 border-green-200 hover:bg-green-50"
                                        onClick={() => openWhatsApp(partner.phone!)}>
                                        <MessageCircle className="w-4 h-4" /> واتساب
                                      </Button>
                                      <Button variant="outline" size="sm" className="flex-1 gap-2 text-primary border-primary/20 hover:bg-primary/10"
                                        onClick={() => window.open(`tel:${partner.phone}`, "_self")}>
                                        <Phone className="w-4 h-4" /> اتصال
                                      </Button>
                                    </div>
                                  )}
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

      {/* Assign Students Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => { if (!open) setAssignDialog({ open: false, partnerId: "", partnerName: "" }); }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة طلاب على: {assignDialog.partnerName}</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو رقم الجوال..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="pr-9"
            />
          </div>

          {/* Filters: Track tabs + Program dropdown in one compact row */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-accent/20 rounded-lg p-1 shrink-0">
              {[
                { key: "all" as const, label: "الكل" },
                { key: "general" as const, label: "إقراء" },
                { key: "ijazah" as const, label: "إجازات" },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTrackFilter(tab.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    trackFilter === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="flex-1 h-8 text-xs gap-1.5">
                <BookMarked className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="البرنامج" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">كل البرامج</SelectItem>
                <SelectItem value="none">بدون برنامج</SelectItem>
                {programs.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select all + count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={selectAllFiltered}
            >
              تحديد / إلغاء تحديد الكل
            </button>
            <span>{selectedStudentIds.size} طالب محدد من أصل {filteredStudents.length}</span>
          </div>

          {/* Students List */}
          <div className="flex-1 overflow-y-auto border border-border/30 rounded-xl divide-y divide-border/20 min-h-0 max-h-[45vh]">
            {loadingStudents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">لا يوجد طلاب</div>
            ) : (
              filteredStudents.map(student => {
                const isSelected = selectedStudentIds.has(student.user_id);
                return (
                  <div
                    key={student.user_id}
                    className={`flex items-center gap-3 p-3 transition-colors cursor-pointer ${
                      isSelected ? "bg-primary/5" : "hover:bg-accent/30"
                    }`}
                    onClick={() => toggleStudent(student.user_id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleStudent(student.user_id)}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{student.phone}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {student.preferred_track === "إجازة" ? "إجازة" : "إقراء"}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={assignStudents} disabled={assigning || selectedStudentIds.size === 0} className="gap-2">
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              تسكين {selectedStudentIds.size} طالب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartners;
