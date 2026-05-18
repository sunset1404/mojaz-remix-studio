import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sparkles, BookOpen, Clock, Globe2, Users, ScrollText, FileText,
  ExternalLink, Plus, Pencil, Trash2, Save, Loader2, RefreshCw, Copy, MapPin,
} from "lucide-react";

type Entry = {
  id: string;
  reciter_name: string;
  entry_date: string;
  location: string | null;
  nationalities_count: number;
  riwayat_count: number;
  pages: number;
  juz: number;
  hours: number;
  students_count: number;
  notes: string | null;
  source: string;
  created_at: string;
};

type Location = { id: string; name: string };

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm: Omit<Entry, "id" | "created_at" | "source"> = {
  reciter_name: "",
  entry_date: todayISO(),
  location: "",
  nationalities_count: 0,
  riwayat_count: 0,
  pages: 0,
  juz: 0,
  hours: 0,
  students_count: 0,
  notes: "",
};

const AdminGhuyufRahman = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveyUrl, setSurveyUrl] = useState("");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [newLocation, setNewLocation] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: rows }, { data: locs }] = await Promise.all([
      supabase.from("ghuyuf_rahman_entries").select("*").order("entry_date", { ascending: false }),
      supabase.from("ghuyuf_rahman_locations").select("id, name").order("name"),
    ]);
    setEntries((rows as Entry[]) || []);
    setLocations((locs as Location[]) || []);
    setSurveyUrl(`${window.location.origin}/ghuyuf-rahman/survey`);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("ghuyuf_rahman_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ghuyuf_rahman_entries" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "ghuyuf_rahman_locations" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  const stats = entries.reduce(
    (acc, e) => {
      acc.pages += e.pages || 0;
      acc.juz += e.juz || 0;
      acc.hours += Number(e.hours) || 0;
      acc.students += e.students_count || 0;
      if (e.country) acc.countries.add(e.country.trim());
      if (e.nationality) acc.nationalities.add(e.nationality.trim());
      if (e.riwaya) acc.riwayat.add(e.riwaya.trim());
      acc.reciters.add(e.reciter_name.trim());
      return acc;
    },
    {
      pages: 0, juz: 0, hours: 0, students: 0,
      countries: new Set<string>(), nationalities: new Set<string>(),
      riwayat: new Set<string>(), reciters: new Set<string>(),
    }
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, entry_date: todayISO() });
    setDialogOpen(true);
  };

  const openEdit = (e: Entry) => {
    setEditing(e);
    setForm({
      reciter_name: e.reciter_name,
      entry_date: e.entry_date || todayISO(),
      location: e.location || "",
      country: e.country || "",
      nationality: e.nationality || "",
      riwaya: e.riwaya || "",
      pages: e.pages,
      juz: e.juz,
      hours: Number(e.hours),
      students_count: e.students_count,
      notes: e.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.reciter_name.trim()) {
      toast({ title: "اسم المقرئ مطلوب", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      reciter_name: form.reciter_name.trim(),
      entry_date: form.entry_date || todayISO(),
      location: form.location || null,
      country: form.country || null,
      nationality: form.nationality || null,
      riwaya: form.riwaya || null,
      pages: Number(form.pages) || 0,
      juz: Number(form.juz) || 0,
      hours: Number(form.hours) || 0,
      students_count: Number(form.students_count) || 0,
      notes: form.notes || null,
      source: editing ? editing.source : "manual",
    };
    const { error } = editing
      ? await supabase.from("ghuyuf_rahman_entries").update(payload).eq("id", editing.id)
      : await supabase.from("ghuyuf_rahman_entries").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "خطأ في الحفظ", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "✅ تم التحديث" : "✅ تمت الإضافة" });
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإدخال؟")) return;
    const { error } = await supabase.from("ghuyuf_rahman_entries").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "تم الحذف" });
    fetchAll();
  };

  const addLocation = async () => {
    const name = newLocation.trim();
    if (!name) return;
    const { error } = await supabase.from("ghuyuf_rahman_locations").insert({ name });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }
    setNewLocation("");
    toast({ title: "تمت الإضافة" });
    fetchAll();
  };

  const deleteLocation = async (id: string) => {
    if (!confirm("حذف هذا الموقع؟")) return;
    const { error } = await supabase.from("ghuyuf_rahman_locations").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }
    fetchAll();
  };

  const copySurvey = () => {
    if (!surveyUrl) return;
    navigator.clipboard.writeText(surveyUrl);
    toast({ title: "تم نسخ الرابط" });
  };

  const statCards = [
    { label: "إجمالي الصفحات", value: stats.pages.toLocaleString("en-US"), icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "إجمالي الأجزاء", value: stats.juz.toLocaleString("en-US"), icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "إجمالي الساعات", value: Math.round(stats.hours).toLocaleString("en-US"), icon: Clock, color: "text-gold", bg: "bg-gold/10" },
    { label: "عدد الدول", value: stats.countries.size, icon: Globe2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "عدد الجنسيات", value: stats.nationalities.size, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "عدد الروايات", value: stats.riwayat.size, icon: ScrollText, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "عدد المقرئين", value: stats.reciters.size, icon: Sparkles, color: "text-pink-500", bg: "bg-pink-500/10" },
    { label: "عدد الطلاب", value: stats.students.toLocaleString("en-US"), icon: Users, color: "text-teal-500", bg: "bg-teal-500/10" },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">إقراء ضيوف الرحمن</h1>
            <p className="text-sm text-muted-foreground">منجزات الإقراء لحجاج ومعتمري بيت الله الحرام</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocationsOpen(true)} className="gap-2">
            <MapPin className="w-4 h-4" />
            المواقع ({locations.length})
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة إنجاز
          </Button>
        </div>
      </div>

      {/* Share survey banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/5 via-gold/5 to-transparent p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <ExternalLink className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">رابط استبانة المقرئين</p>
            <p className="text-xs text-muted-foreground">
              يلزم المقرئ تسجيل الدخول باسم المستخدم وكلمة المرور لتعبئة منجزاته.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
          <code dir="ltr" className="flex-1 text-xs text-foreground truncate">{surveyUrl}</code>
          <Button size="sm" variant="ghost" onClick={copySurvey} className="gap-1 h-8 px-2">
            <Copy className="w-3.5 h-3.5" /> نسخ
          </Button>
          <Button size="sm" onClick={() => window.open(surveyUrl, "_blank", "noopener,noreferrer")} className="gap-1 h-8 px-3">
            <ExternalLink className="w-3.5 h-3.5" /> فتح
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-foreground truncate">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Entries */}
      <div className="rounded-2xl border border-border bg-card overflow-auto">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">الإدخالات ({entries.length})</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            لا توجد إدخالات بعد — أضف يدوياً أو شارك رابط الاستبانة مع المقرئين.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right font-bold">المقرئ</TableHead>
                <TableHead className="text-center font-bold text-xs">التاريخ</TableHead>
                <TableHead className="text-center font-bold text-xs">الموقع</TableHead>
                <TableHead className="text-center font-bold text-xs">الدولة</TableHead>
                <TableHead className="text-center font-bold text-xs">الجنسية</TableHead>
                <TableHead className="text-center font-bold text-xs">الرواية</TableHead>
                <TableHead className="text-center font-bold text-xs">الصفحات</TableHead>
                <TableHead className="text-center font-bold text-xs">الأجزاء</TableHead>
                <TableHead className="text-center font-bold text-xs">الساعات</TableHead>
                <TableHead className="text-center font-bold text-xs">الطلاب</TableHead>
                <TableHead className="text-center font-bold text-xs">المصدر</TableHead>
                <TableHead className="text-center font-bold text-xs">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.reciter_name}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap">{e.entry_date}</TableCell>
                  <TableCell className="text-center text-xs">{e.location || "—"}</TableCell>
                  <TableCell className="text-center text-xs">{e.country || "—"}</TableCell>
                  <TableCell className="text-center text-xs">{e.nationality || "—"}</TableCell>
                  <TableCell className="text-center text-xs">{e.riwaya || "—"}</TableCell>
                  <TableCell className="text-center font-bold">{e.pages}</TableCell>
                  <TableCell className="text-center font-bold">{e.juz}</TableCell>
                  <TableCell className="text-center font-bold">{Number(e.hours)}</TableCell>
                  <TableCell className="text-center font-bold">{e.students_count}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={e.source === "survey" ? "default" : "secondary"} className="text-[10px]">
                      {e.source === "survey" ? "استبانة" : "يدوي"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(e)} className="h-7 w-7 p-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(e.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الإدخال" : "إضافة إنجاز جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            <div className="md:col-span-2">
              <Label>اسم المقرئ *</Label>
              <Input value={form.reciter_name} onChange={(e) => setForm({ ...form, reciter_name: e.target.value })} />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
            </div>
            <div>
              <Label>موقع الإقراء</Label>
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الموقع" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الدولة</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <Label>الجنسية</Label>
              <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
            </div>
            <div>
              <Label>الرواية</Label>
              <Input value={form.riwaya} onChange={(e) => setForm({ ...form, riwaya: e.target.value })} placeholder="حفص عن عاصم..." />
            </div>
            <div>
              <Label>عدد الطلاب</Label>
              <Input type="number" value={form.students_count} onChange={(e) => setForm({ ...form, students_count: +e.target.value })} />
            </div>
            <div>
              <Label>عدد الصفحات</Label>
              <Input type="number" value={form.pages} onChange={(e) => setForm({ ...form, pages: +e.target.value })} />
            </div>
            <div>
              <Label>عدد الأجزاء</Label>
              <Input type="number" value={form.juz} onChange={(e) => setForm({ ...form, juz: +e.target.value })} />
            </div>
            <div>
              <Label>عدد الساعات</Label>
              <Input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: +e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Locations dialog */}
      <Dialog open={locationsOpen} onOpenChange={setLocationsOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> إدارة مواقع الإقراء
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="اسم الموقع الجديد"
                onKeyDown={(e) => { if (e.key === "Enter") addLocation(); }}
              />
              <Button onClick={addLocation} className="gap-1 shrink-0">
                <Plus className="w-4 h-4" /> إضافة
              </Button>
            </div>
            <div className="max-h-80 overflow-auto border border-border rounded-xl divide-y divide-border">
              {locations.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">لا توجد مواقع</p>
              ) : (
                locations.map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm">{l.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => deleteLocation(l.id)} className="h-7 w-7 p-0 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGhuyufRahman;
