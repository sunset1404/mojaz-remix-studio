import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookMarked, Plus, Pencil, Trash2, RefreshCw, Users, Search, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Program {
  id: string;
  name: string;
  description: string | null;
  track_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  max_students: number | null;
  notes: string | null;
  created_at: string;
}

const TRACKS = [
  { value: "general", label: "إقراء عام" },
  { value: "ijazah", label: "إجازات" },
  { value: "mutoon", label: "حفظ متون الإقراء" },
  { value: "mixed", label: "مشترك" },
];

const emptyForm = {
  id: "", name: "", description: "", track_type: "general",
  start_date: "", end_date: "", status: "active", max_students: "", notes: "",
};

const AdminPrograms = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        supabase.from("programs" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("student_profiles").select("program_id"),
      ]);
      if (pRes.error) throw pRes.error;
      setPrograms(((pRes.data as any[]) || []) as Program[]);
      const map: Record<string, number> = {};
      for (const row of ((sRes.data as any[]) || [])) {
        const pid = row.program_id;
        if (pid) map[pid] = (map[pid] || 0) + 1;
      }
      setCounts(map);
    } catch (e: any) {
      toast({ title: "خطأ في تحميل البرامج", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditing(false); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (p: Program) => {
    setEditing(true);
    setForm({
      id: p.id, name: p.name, description: p.description || "", track_type: p.track_type || "general",
      start_date: p.start_date || "", end_date: p.end_date || "", status: p.status || "active",
      max_students: p.max_students ? String(p.max_students) : "", notes: p.notes || "",
    });
    setDialogOpen(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      toast({ title: "اسم البرنامج مطلوب", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        description: form.description || null,
        track_type: form.track_type,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        max_students: form.max_students ? Number(form.max_students) : null,
        notes: form.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("programs" as any).update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("programs" as any).insert({ ...payload, created_by: user?.id ?? null });
        if (error) throw error;
      }
      toast({ title: editing ? "تم تحديث البرنامج ✅" : "تم إضافة البرنامج ✅" });
      setDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: "تعذّر الحفظ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("programs" as any).delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast({ title: "تم حذف البرنامج" });
      setDeleteTarget(null);
      fetchData();
    } catch (e: any) {
      toast({ title: "تعذّر الحذف", description: e.message, variant: "destructive" });
    }
  };

  const filtered = useMemo(
    () => programs.filter((p) => !search || (p.name || "").includes(search) || (p.description || "").includes(search)),
    [programs, search]
  );

  const totalAssigned = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-card/90 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div>
              <h1 className="text-lg font-bold text-foreground">البرامج</h1>
              <p className="text-xs text-muted-foreground">إنشاء البرامج وتسكين الطلاب عليها ومتابعة تقاريرها</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAdd} size="sm" className="gap-2"><Plus className="w-4 h-4" /> إضافة برنامج</Button>
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-2 text-muted-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden">
        <div className="gradient-primary px-6 py-10">
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <BookMarked className="w-7 h-7 text-gold" />
              <h2 className="text-2xl font-bold text-primary-foreground">إدارة البرامج</h2>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-2xl">
              أضف برامج خاصة وسكّن عليها الطلاب، مع تقرير كامل لكل برنامج
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "عدد البرامج", value: programs.length, icon: BookMarked, color: "primary" },
            { label: "برامج نشطة", value: programs.filter(p => p.status === "active").length, icon: BarChart3, color: "gold" },
            { label: "طلاب مسكّنون", value: totalAssigned, icon: Users, color: "primary" },
            { label: "برامج مؤرشفة", value: programs.filter(p => p.status === "archived").length, icon: BookMarked, color: "gold" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stat.color === "gold" ? "bg-gold/15" : "bg-primary/10"}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color === "gold" ? "text-gold" : "text-primary"}`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-sm font-medium text-foreground">{stat.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/30 bg-accent/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookMarked className="w-4 h-4 text-primary" />
                </div>
                قائمة البرامج
                <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
              </CardTitle>
              <div className="relative min-w-[220px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث باسم البرنامج..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">لا توجد برامج بعد — ابدأ بإضافة برنامج</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p) => (
                  <Card key={p.id} className="border-border/40 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/admin/programs/${p.id}`)}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.description || "—"}</p>
                        </div>
                        <Badge className={`text-[10px] shrink-0 ${p.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                          {p.status === "active" ? "نشط" : "مؤرشف"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-accent/40">
                          {TRACKS.find(t => t.value === p.track_type)?.label || p.track_type}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-accent/40 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {counts[p.id] || 0} طالب
                        </span>
                        {p.start_date && <span className="px-2 py-0.5 rounded-full bg-accent/40">من {p.start_date}</span>}
                        {p.end_date && <span className="px-2 py-0.5 rounded-full bg-accent/40">إلى {p.end_date}</span>}
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1"
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/programs/${p.id}`); }}>
                          <BarChart3 className="w-3.5 h-3.5" /> التقرير
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600"
                          onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل البرنامج" : "إضافة برنامج"}</DialogTitle>
            <DialogDescription>عرّف البرنامج ثم سكّن الطلاب عليه من صفحات الطلاب</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">اسم البرنامج *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">الوصف</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">المسار</Label>
              <Select value={form.track_type} onValueChange={(v) => setForm({ ...form, track_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  {TRACKS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تاريخ البداية</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تاريخ النهاية</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الحد الأقصى للطلاب</Label>
              <Input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={submitForm} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البرنامج</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف <span className="font-bold text-foreground">{deleteTarget?.name}</span> وإلغاء تسكين طلابه (تبقى بياناتهم كما هي).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPrograms;
