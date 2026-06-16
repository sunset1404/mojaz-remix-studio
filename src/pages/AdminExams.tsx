import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList, Plus, Pencil, Trash2, Calendar,
  Clock, Users, CheckCircle2, XCircle,
  GraduationCap, Search, Loader2, Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type ExamType = "admission" | "eligibility";
type ExamStatus = "scheduled" | "completed" | "cancelled";

interface Reciter {
  id: string;
  full_name: string;
  user_id: string;
}

interface StudentOption {
  user_id: string;
  full_name: string;
}

interface Exam {
  id: string;
  type: ExamType;
  student_id: string | null;
  student_name: string | null;
  date: string;
  time: string;
  capacity: number;
  committee_member_1: string | null;
  committee_member_1_name: string | null;
  committee_member_2: string | null;
  committee_member_2_name: string | null;
  committee_member_3: string | null;
  committee_member_3_name: string | null;
  notes: string | null;
  status: ExamStatus;
  created_at: string;
}

const emptyForm = {
  type: "admission" as ExamType,
  student_id: "",
  student_name: "",
  date: "",
  time: "",
  capacity: 10,
  committee_member_1: "",
  committee_member_1_name: "",
  committee_member_2: "",
  committee_member_2_name: "",
  committee_member_3: "",
  committee_member_3_name: "",
  notes: "",
  status: "scheduled" as ExamStatus,
};

const statusConfig: Record<ExamStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  scheduled: { label: "مجدول", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
  completed: { label: "مكتمل", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "ملغي", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function AdminExams() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchExams();
    fetchReciters();
    fetchStudents();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("exams")
      .select("*")
      .order("date", { ascending: true });
    if (!error && data) setExams(data as Exam[]);
    setLoading(false);
  };

  const fetchReciters = async () => {
    const { data } = await supabase
      .from("reciter_profiles")
      .select("id, full_name, user_id")
      .eq("status", "approved");
    if (data) setReciters(data);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("student_profiles")
      .select("user_id, full_name")
      .order("full_name", { ascending: true });
    if (data) setStudents(data as StudentOption[]);
  };

  const openAdd = () => {
    setEditingExam(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setForm({
      type: exam.type,
      student_id: exam.student_id || "",
      student_name: exam.student_name || "",
      date: exam.date,
      time: exam.time,
      capacity: exam.capacity ?? 10,
      committee_member_1: exam.committee_member_1 || "",
      committee_member_1_name: exam.committee_member_1_name || "",
      committee_member_2: exam.committee_member_2 || "",
      committee_member_2_name: exam.committee_member_2_name || "",
      committee_member_3: exam.committee_member_3 || "",
      committee_member_3_name: exam.committee_member_3_name || "",
      notes: exam.notes || "",
      status: exam.status,
    });
    setDialogOpen(true);
  };

  const handleReciterSelect = (slot: 1 | 2 | 3, reciterId: string) => {
    const reciter = reciters.find((r) => r.id === reciterId);
    setForm((prev) => ({
      ...prev,
      [`committee_member_${slot}`]: reciterId,
      [`committee_member_${slot}_name`]: reciter?.full_name || "",
    }));
  };

  const handleSave = async () => {
    if (!form.date || !form.time) {
      toast({ title: "خطأ", description: "يرجى تحديد التاريخ والوقت", variant: "destructive" });
      return;
    }
    if (form.capacity < 1 || form.capacity > 100) {
      toast({ title: "خطأ", description: "السعة يجب أن تكون بين 1 و 100", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      type: form.type,
      student_id: form.student_id || null,
      student_name: form.student_name || null,
      date: form.date,
      time: form.time,
      capacity: form.capacity,
      committee_member_1: form.committee_member_1 || null,
      committee_member_1_name: form.committee_member_1_name || null,
      committee_member_2: form.committee_member_2 || null,
      committee_member_2_name: form.committee_member_2_name || null,
      committee_member_3: form.committee_member_3 || null,
      committee_member_3_name: form.committee_member_3_name || null,
      notes: form.notes || null,
      status: form.status,
    };

    let error;
    if (editingExam) {
      ({ error } = await (supabase as any).from("exams").update(payload).eq("id", editingExam.id));
    } else {
      ({ error } = await (supabase as any).from("exams").insert(payload));
    }

    if (error) {
      toast({ title: "خطأ", description: "فشل في حفظ الاختبار", variant: "destructive" });
    } else {
      toast({ title: "تم الحفظ", description: editingExam ? "تم تحديث الاختبار بنجاح" : "تم إضافة الاختبار بنجاح" });
      setDialogOpen(false);
      fetchExams();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الاختبار؟")) return;
    const { error } = await (supabase as any).from("exams").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "فشل في حذف الاختبار", variant: "destructive" });
    } else {
      toast({ title: "تم الحذف", description: "تم حذف الاختبار بنجاح" });
      fetchExams();
    }
  };

  const filteredExams = exams.filter((e) => {
    const matchSearch = !search ||
      e.committee_member_1_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.committee_member_2_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.date?.includes(search);
    const matchTab =
      activeTab === "all" ||
      (activeTab === "admission" && e.type === "admission") ||
      (activeTab === "eligibility" && e.type === "eligibility") ||
      (activeTab === "scheduled" && e.status === "scheduled");
    return matchSearch && matchTab;
  });

  const admissionCount = exams.filter((e) => e.type === "admission").length;
  const eligibilityCount = exams.filter((e) => e.type === "eligibility").length;
  const scheduledCount = exams.filter((e) => e.status === "scheduled").length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 px-6 py-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="w-px h-5 bg-border" />
          <ClipboardList className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">اختبارات القبول والاستحقاق</h1>
          <div className="mr-auto">
            <Button onClick={openAdd} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة اختبار
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "اختبارات القبول", value: admissionCount, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "اختبارات الاستحقاق", value: eligibilityCount, icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { label: "مجدولة قادمة", value: scheduledCount, icon: Calendar, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالمقرئ أو التاريخ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        {/* Tabs + Table */}
        <Card className="border-border/50">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border/50 px-4">
              <TabsList className="h-auto bg-transparent gap-1 py-2">
                {[
                  { value: "all", label: `الكل (${exams.length})` },
                  { value: "admission", label: `القبول (${admissionCount})` },
                  { value: "eligibility", label: `الاستحقاق (${eligibilityCount})` },
                  { value: "scheduled", label: `المجدولة (${scheduledCount})` },
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg text-sm">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <ClipboardList className="w-12 h-12 opacity-30" />
                  <p className="text-sm">لا توجد اختبارات</p>
                  <Button variant="outline" size="sm" onClick={openAdd}>إضافة اختبار جديد</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-right font-semibold">إجراءات</TableHead>
                        <TableHead className="text-right font-semibold">ملاحظات</TableHead>
                        <TableHead className="text-right font-semibold">الحالة</TableHead>
                        <TableHead className="text-right font-semibold">لجنة الاختبار</TableHead>
                        <TableHead className="text-right font-semibold">السعة</TableHead>
                        <TableHead className="text-right font-semibold">التاريخ والوقت</TableHead>
                        <TableHead className="text-right font-semibold">النوع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam) => (
                        <TableRow key={exam.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(exam)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(exam.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[160px]">
                            <span className="text-sm text-muted-foreground truncate block">{exam.notes || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig[exam.status].variant} className="gap-1 text-xs">
                              {statusConfig[exam.status].icon}
                              {statusConfig[exam.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-sm">
                              {exam.committee_member_1_name && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                                  {exam.committee_member_1_name}
                                </span>
                              )}
                              {exam.committee_member_2_name && (
                                <span className="text-muted-foreground text-xs pr-4">{exam.committee_member_2_name}</span>
                              )}
                              {exam.committee_member_3_name && (
                                <span className="text-muted-foreground text-xs pr-4">{exam.committee_member_3_name}</span>
                              )}
                              {!exam.committee_member_1_name && <span className="text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Hash className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="font-semibold text-foreground">{exam.capacity}</span>
                              <span className="text-xs text-muted-foreground">طالب</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1 text-sm font-medium">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                {exam.date}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {exam.time}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={exam.type === "admission" ? "secondary" : "outline"} className="text-xs">
                              {exam.type === "admission" ? "قبول" : "استحقاق"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              {editingExam ? "تعديل الاختبار" : "إضافة اختبار جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Type */}
            <div className="space-y-2">
              <Label>نوع الاختبار</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "admission", label: "اختبار القبول", desc: "لقبول الطلاب الجدد في مسار الإجازة" },
                  { value: "eligibility", label: "اختبار الاستحقاق", desc: "للتحقق من استحقاق منح الإجازة" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: opt.value as ExamType }))}
                    className={`p-3 rounded-xl border-2 text-right transition-all ${
                      form.type === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date, Time & Capacity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">الوقت</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">السعة (طلاب)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={100}
                  value={form.capacity}
                  onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            {/* Committee */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                لجنة الاختبار (حتى 3 مقرئين)
              </Label>
              <div className="space-y-3 bg-muted/30 rounded-xl p-4">
                {([1, 2, 3] as const).map((slot) => {
                  const memberId = form[`committee_member_${slot}` as keyof typeof form] as string;
                  return (
                    <div key={slot} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">العضو {slot}</Label>
                      <Select
                        value={memberId || "none"}
                        onValueChange={(v) => {
                          if (v === "none") {
                            setForm((p) => ({
                              ...p,
                              [`committee_member_${slot}`]: "",
                              [`committee_member_${slot}_name`]: "",
                            }));
                          } else {
                            handleReciterSelect(slot, v);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder={`اختر المقرئ ${slot}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— لا يوجد —</SelectItem>
                          {reciters.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>حالة الاختبار</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as ExamStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">مجدول</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أي ملاحظات أو تعليمات خاصة بالاختبار..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingExam ? "حفظ التغييرات" : "إضافة الاختبار"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
