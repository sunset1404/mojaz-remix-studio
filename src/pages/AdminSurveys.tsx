import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ClipboardList, Plus, Pencil, Trash2, Copy, ExternalLink, Loader2, Files, RefreshCw,
} from "lucide-react";

type Survey = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  external_link_code: string;
  created_at: string;
};

const AdminSurveys = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Survey | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });

  const publicUrl = (code: string) => `${window.location.origin}/survey/${code}`;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: rows }, { data: subs }] = await Promise.all([
      supabase.from("surveys").select("*").order("created_at", { ascending: false }),
      supabase.from("survey_submissions").select("survey_id"),
    ]);
    setSurveys((rows as Survey[]) || []);
    const map: Record<string, number> = {};
    (subs || []).forEach((s: { survey_id: string }) => {
      map[s.survey_id] = (map[s.survey_id] || 0) + 1;
    });
    setCounts(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createSurvey = async () => {
    if (!form.title.trim()) {
      toast({ title: "عنوان الاستبانة مطلوب", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("surveys")
      .insert({ title: form.title.trim(), description: form.description.trim() || null })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "فشل الإنشاء", description: error.message, variant: "destructive" });
      return;
    }
    setOpen(false);
    setForm({ title: "", description: "" });
    navigate(`/admin/surveys/${data.id}`);
  };

  const toggleActive = async (s: Survey) => {
    const { error } = await supabase.from("surveys").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) {
      toast({ title: "فشل التحديث", description: error.message, variant: "destructive" });
      return;
    }
    setSurveys((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const duplicate = async (s: Survey) => {
    const { data: created, error } = await supabase
      .from("surveys")
      .insert({ title: `${s.title} (نسخة)`, description: s.description, is_active: false })
      .select("id")
      .single();
    if (error || !created) {
      toast({ title: "فشل النسخ", variant: "destructive" });
      return;
    }
    const { data: qs } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", s.id)
      .order("order_index");
    if (qs?.length) {
      await supabase.from("survey_questions").insert(
        qs.map((q) => ({
          survey_id: created.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          placeholder: q.placeholder,
          is_required: q.is_required,
          order_index: q.order_index,
        }))
      );
    }
    toast({ title: "تم نسخ الاستبانة" });
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("surveys").delete().eq("id", toDelete.id);
    if (error) {
      toast({ title: "فشل الحذف", description: error.message, variant: "destructive" });
    } else {
      setSurveys((prev) => prev.filter((x) => x.id !== toDelete.id));
      toast({ title: "تم حذف الاستبانة" });
    }
    setToDelete(null);
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(publicUrl(code));
    toast({ title: "تم نسخ الرابط العام" });
  };

  return (
    <div dir="rtl" className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">الاستبانات</h1>
            <p className="text-sm text-muted-foreground">إنشاء وإدارة الاستبانات ومشاركتها برابط عام</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAll} className="gap-2">
            <RefreshCw className="w-4 h-4" /> تحديث
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> استبانة جديدة
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : surveys.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">لا توجد استبانات بعد</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">المشاركات</TableHead>
                <TableHead className="text-right">الرابط العام</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{s.title}</div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{s.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "نشطة" : "معطلة"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{counts[s.id] || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => copyLink(s.external_link_code)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(publicUrl(s.external_link_code), "_blank", "noopener")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/admin/surveys/${s.id}`)}>
                        <Pencil className="w-3.5 h-3.5" /> تحرير
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicate(s)}>
                        <Files className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(s)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>استبانة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>العنوان</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createSurvey} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الاستبانة</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف «{toDelete?.title}» مع جميع أسئلتها ومشاركاتها. لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSurveys;
