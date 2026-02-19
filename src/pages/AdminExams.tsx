import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Clock, Users, CheckCircle2, XCircle, AlertCircle,
  GraduationCap, Search, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type ExamType = "admission" | "eligibility";
type ExamStatus = "scheduled" | "completed" | "cancelled";
type ExamResult = "passed" | "failed" | null;

interface Reciter {
  id: string;
  full_name: string;
  user_id: string;
}

interface Exam {
  id: string;
  type: ExamType;
  student_id: string | null;
  student_name: string | null;
  date: string;
  time: string;
  committee_member_1: string | null;
  committee_member_1_name: string | null;
  committee_member_2: string | null;
  committee_member_2_name: string | null;
  committee_member_3: string | null;
  committee_member_3_name: string | null;
  notes: string | null;
  status: ExamStatus;
  result: ExamResult;
  created_at: string;
}

const emptyForm = {
  type: "admission" as ExamType,
  student_name: "",
  date: "",
  time: "",
  committee_member_1: "",
  committee_member_1_name: "",
  committee_member_2: "",
  committee_member_2_name: "",
  committee_member_3: "",
  committee_member_3_name: "",
  notes: "",
  status: "scheduled" as ExamStatus,
  result: null as ExamResult,
};

const statusConfig: Record<ExamStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  scheduled: { label: "مجدول", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
  completed: { label: "مكتمل", variant: "default", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "ملغي", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

const resultConfig: Record<string, { label: string; className: string }> = {
  passed: { label: "ناجح", className: "text-green-600 bg-green-50 border-green-200" },
  failed: { label: "راسب", className: "text-red-600 bg-red-50 border-red-200" },
};

export default function AdminExams() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
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
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exams" as any)
      .select("*")
      .order("date", { ascending: true });

    if (!error && data) setExams(data as unknown as Exam[]);
    setLoading(false);
  };

  const fetchReciters = async () => {
    const { data } = await supabase
      .from("reciter_profiles")
      .select("id, full_name, user_id")
      .eq("status", "approved");
    if (data) setReciters(data);
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
      student_name: exam.student_name || "",
      date: exam.date,
      time: exam.time,
      committee_member_1: exam.committee_member_1 || "",
      committee_member_1_name: exam.committee_member_1_name || "",
      committee_member_2: exam.committee_member_2 || "",
      committee_member_2_name: exam.committee_member_2_name || "",
      committee_member_3: exam.committee_member_3 || "",
      committee_member_3_name: exam.committee_member_3_name || "",
      notes: exam.notes || "",
      status: exam.status,
      result: exam.result,
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
    if (!form.student_name || !form.date || !form.time) {
      toast({ title: "خطأ", description: "يرجى تعبئة اسم الطالب والتاريخ والوقت", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      type: form.type,
      student_name: form.student_name,
      date: form.date,
      time: form.time,
      committee_member_1: form.committee_member_1 || null,
      committee_member_1_name: form.committee_member_1_name || null,
      committee_member_2: form.committee_member_2 || null,
      committee_member_2_name: form.committee_member_2_name || null,
      committee_member_3: form.committee_member_3 || null,
      committee_member_3_name: form.committee_member_3_name || null,
      notes: form.notes || null,
      status: form.status,
      result: form.result,
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
      e.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.committee_member_1_name?.toLowerCase().includes(search.toLowerCase()) ||
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
            { label: "اختبارات القبول", value: admissionCount, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "اختبارات الاستحقاق", value: eligibilityCount, icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "مجدولة قادمة", value: scheduledCount, icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
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

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم الطالب أو المقرئ أو التاريخ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        {/* Tabs + Table */}
        <Card className="border-border/50">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border/50 px-4">
              <TabsList className="h-auto bg-transparent gap-1 py-2">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                  الكل ({exams.length})
                </TabsTrigger>
                <TabsTrigger value="admission" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                  القبول ({admissionCount})
                </TabsTrigger>
                <TabsTrigger value="eligibility" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                  الاستحقاق ({eligibilityCount})
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                  المجدولة ({scheduledCount})
                </TabsTrigger>
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
                        <TableHead className="text-right font-semibold">الطالب</TableHead>
                        <TableHead className="text-right font-semibold">النوع</TableHead>
                        <TableHead className="text-right font-semibold">التاريخ والوقت</TableHead>
                        <TableHead className="text-right font-semibold">لجنة الاختبار</TableHead>
                        <TableHead className="text-right font-semibold">الحالة</TableHead>
                        <TableHead className="text-right font-semibold">النتيجة</TableHead>
                        <TableHead className="text-right font-semibold">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam) => (
                        <TableRow key={exam.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">{exam.student_name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={exam.type === "admission" ? "secondary" : "outline"} className="text-xs">
                              {exam.type === "admission" ? "قبول" : "استحقاق"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1 text-sm">
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
                            <Badge
                              variant={statusConfig[exam.status].variant}
                              className="gap-1 text-xs"
                            >
                              {statusConfig[exam.status].icon}
                              {statusConfig[exam.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {exam.result ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${resultConfig[exam.result].className}`}>
                                {exam.result === "passed" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {resultConfig[exam.result].label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
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

            {/* Student */}
            <div className="space-y-2">
              <Label htmlFor="student_name">اسم الطالب</Label>
              <Input
                id="student_name"
                placeholder="أدخل اسم الطالب"
                value={form.student_name}
                onChange={(e) => setForm((p) => ({ ...p, student_name: e.target.value }))}
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Status & Result */}
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>نتيجة الاختبار</Label>
                <Select
                  value={form.result || "none"}
                  onValueChange={(v) => setForm((p) => ({ ...p, result: v === "none" ? null : v as ExamResult }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="لم يُحدد بعد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">لم يُحدد بعد</SelectItem>
                    <SelectItem value="passed">ناجح ✓</SelectItem>
                    <SelectItem value="failed">راسب ✗</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
