import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Calendar,
} from "lucide-react";

interface Subscription {
  id: string;
  student_id: string;
  student_name: string;
  student_phone: string | null;
  subscription_type: string;
  amount: number;
  duration_months: number;
  start_date: string;
  end_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface StudentOption {
  user_id: string;
  full_name: string;
  phone: string;
}

const SUBSCRIPTION_TYPES = [
  "حفظ القرآن الكريم",
  "الإجازات القرآنية",
  "حفظ ومراجعة",
  "تجويد القرآن",
  "اشتراك مجاني",
];

const STATUS_OPTIONS = [
  { value: "active", label: "نشط", color: "bg-green-500/10 text-green-600 border-green-200" },
  { value: "expired", label: "منتهي", color: "bg-red-500/10 text-red-600 border-red-200" },
  { value: "cancelled", label: "ملغي", color: "bg-gray-500/10 text-gray-600 border-gray-200" },
  { value: "pending", label: "معلق", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
];

const getStatusInfo = (status: string) => {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
};

const getDaysRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    student_id: "",
    student_name: "",
    student_phone: "",
    subscription_type: "حفظ القرآن الكريم",
    amount: "89",
    duration_months: "1",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (form.start_date && form.duration_months) {
      const start = new Date(form.start_date);
      start.setMonth(start.getMonth() + parseInt(form.duration_months));
      setForm((f) => ({ ...f, end_date: start.toISOString().split("T")[0] }));
    }
  }, [form.start_date, form.duration_months]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subsRes, studentsRes] = await Promise.all([
        supabase
          .from("student_subscriptions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("student_profiles")
          .select("user_id, full_name, phone")
          .order("full_name"),
      ]);
      if (subsRes.error) throw subsRes.error;
      if (studentsRes.error) throw studentsRes.error;
      setSubscriptions((subsRes.data as Subscription[]) || []);
      setStudents((studentsRes.data as StudentOption[]) || []);
    } catch (err: any) {
      toast({ title: "خطأ في تحميل البيانات", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    const today = new Date().toISOString().split("T")[0];
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    setForm({
      student_id: "",
      student_name: "",
      student_phone: "",
      subscription_type: "حفظ القرآن الكريم",
      amount: "89",
      duration_months: "1",
      start_date: today,
      end_date: end.toISOString().split("T")[0],
      status: "active",
      notes: "",
    });
    setShowDialog(true);
  };

  const openEdit = (sub: Subscription) => {
    setEditing(sub);
    setForm({
      student_id: sub.student_id,
      student_name: sub.student_name,
      student_phone: sub.student_phone || "",
      subscription_type: sub.subscription_type,
      amount: String(sub.amount),
      duration_months: String(sub.duration_months),
      start_date: sub.start_date,
      end_date: sub.end_date,
      status: sub.status,
      notes: sub.notes || "",
    });
    setShowDialog(true);
  };

  const handleStudentChange = (userId: string) => {
    const student = students.find((s) => s.user_id === userId);
    setForm((f) => ({
      ...f,
      student_id: userId,
      student_name: student?.full_name || "",
      student_phone: student?.phone || "",
    }));
  };

  const handleSave = async () => {
    if (!form.student_id || !form.start_date || !form.end_date) {
      toast({ title: "الرجاء تعبئة جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        student_name: form.student_name,
        student_phone: form.student_phone || null,
        subscription_type: form.subscription_type,
        amount: parseFloat(form.amount) || 0,
        duration_months: parseInt(form.duration_months) || 1,
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
        notes: form.notes || null,
      };

      if (editing) {
        const { error } = await supabase
          .from("student_subscriptions")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "تم تحديث الاشتراك بنجاح" });
      } else {
        const { error } = await supabase.from("student_subscriptions").insert(payload);
        if (error) throw error;
        toast({ title: "تم إضافة الاشتراك بنجاح" });
      }
      setShowDialog(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: "خطأ في الحفظ", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الاشتراك؟")) return;
    try {
      const { error } = await supabase.from("student_subscriptions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "تم حذف الاشتراك" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "خطأ في الحذف", description: err.message, variant: "destructive" });
    }
  };

  const filtered = subscriptions.filter((s) => {
    const matchSearch =
      s.student_name.includes(search) ||
      (s.student_phone || "").includes(search) ||
      s.subscription_type.includes(search);
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const expiredCount = subscriptions.filter((s) => s.status === "expired").length;
  const cancelledCount = subscriptions.filter((s) => s.status === "cancelled").length;

  const statCards = [
    { label: "إجمالي الاشتراكات", value: subscriptions.length, icon: CreditCard, color: "primary" },
    { label: "الاشتراكات النشطة", value: activeCount, icon: CheckCircle, color: "green" },
    { label: "الاشتراكات المنتهية", value: expiredCount, icon: XCircle, color: "red" },
    { label: "الملغية", value: cancelledCount, icon: Clock, color: "gray" },
    { label: "إجمالي الإيرادات", value: `${totalRevenue.toLocaleString()} ر.س`, icon: DollarSign, color: "gold" },
    { label: "متوسط الاشتراك", value: subscriptions.length ? `${(totalRevenue / subscriptions.length).toFixed(0)} ر.س` : "—", icon: TrendingUp, color: "primary" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div>
              <h1 className="text-lg font-bold text-foreground">إدارة الاشتراكات</h1>
              <p className="text-xs text-muted-foreground">متابعة اشتراكات الطلاب والإيرادات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAll} disabled={loading} className="gap-2 text-muted-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              اشتراك جديد
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="gradient-primary px-6 py-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white/5 translate-x-12 translate-y-12" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <CreditCard className="w-7 h-7 text-gold" />
            <h2 className="text-2xl font-bold text-primary-foreground">نظام إدارة الاشتراكات</h2>
          </div>
          <p className="text-primary-foreground/70 text-sm">
            تتبع اشتراكات الطلاب، مواعيد الانتهاء، والإيرادات
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    stat.color === "gold" ? "bg-gold/15" :
                    stat.color === "green" ? "bg-green-500/10" :
                    stat.color === "red" ? "bg-red-500/10" :
                    stat.color === "gray" ? "bg-muted" :
                    "bg-primary/10"
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === "gold" ? "text-gold" :
                      stat.color === "green" ? "text-green-600" :
                      stat.color === "red" ? "text-red-500" :
                      stat.color === "gray" ? "text-muted-foreground" :
                      "text-primary"
                    }`} />
                  </div>
                  {loading ? (
                    <div className="w-10 h-6 rounded bg-muted animate-pulse" />
                  ) : (
                    <span className="text-xl font-bold text-foreground">{stat.value}</span>
                  )}
                  <span className="text-[11px] text-muted-foreground leading-tight">{stat.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/30 bg-accent/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                قائمة الاشتراكات
                <Badge variant="secondary" className="mr-auto text-xs">{filtered.length} اشتراك</Badge>
              </CardTitle>
              <div className="flex gap-2 mr-auto w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو الهاتف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-9 h-9 text-sm"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 w-32 text-sm">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لا توجد اشتراكات مطابقة</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filtered.map((sub, i) => {
                  const statusInfo = getStatusInfo(sub.status);
                  const daysLeft = getDaysRemaining(sub.end_date);
                  return (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-accent/20 transition-colors"
                    >
                      {/* Student info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{sub.student_name}</p>
                          <p className="text-xs text-muted-foreground">{sub.student_phone || "—"}</p>
                          <p className="text-xs text-muted-foreground">{sub.subscription_type}</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-foreground">{sub.amount.toLocaleString()} ر.س</p>
                          <p className="text-[11px] text-muted-foreground">{sub.duration_months} شهر</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{sub.start_date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{sub.end_date}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          {sub.status === "active" && daysLeft > 0 ? (
                            <span className={`text-xs font-medium ${daysLeft <= 7 ? "text-orange-500" : "text-green-600"}`}>
                              {daysLeft} يوم متبقي
                            </span>
                          ) : sub.status === "active" && daysLeft <= 0 ? (
                            <span className="text-xs text-red-500">منتهي الصلاحية</span>
                          ) : null}
                        </div>
                        <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(sub)} className="h-8 w-8 p-0">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(sub.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الاشتراك" : "إضافة اشتراك جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Student */}
            <div className="space-y-1.5">
              <Label>الطالب *</Label>
              <Select value={form.student_id} onValueChange={handleStudentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      {s.full_name} — {s.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>نوع الاشتراك</Label>
              <Select value={form.subscription_type} onValueChange={(v) => setForm((f) => ({ ...f, subscription_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Amount */}
              <div className="space-y-1.5">
                <Label>المبلغ (ر.س)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  min="0"
                />
              </div>
              {/* Duration */}
              <div className="space-y-1.5">
                <Label>المدة (أشهر)</Label>
                <Select value={form.duration_months} onValueChange={(v) => setForm((f) => ({ ...f, duration_months: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 6, 12].map((m) => (
                      <SelectItem key={m} value={String(m)}>{m} شهر{m > 1 && m < 11 ? "" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Start Date */}
              <div className="space-y-1.5">
                <Label>تاريخ البدء *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              {/* End Date */}
              <div className="space-y-1.5">
                <Label>تاريخ الانتهاء *</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="ملاحظات اختيارية..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : editing ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
