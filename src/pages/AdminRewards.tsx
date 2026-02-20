import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen, Flame, Award, Crown, BookMarked, Sparkles, Trophy,
  Star, Plus, Pencil, Trash2, Gem, Gift, Target, Zap
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Flame, Award, Crown, BookMarked, Sparkles, Trophy,
  Star, Gem, Gift, Target, Zap,
};

const iconOptions = Object.keys(iconMap);

type RewardRule = {
  id: string;
  name: string;
  description: string | null;
  action_key: string;
  points: number;
  icon: string;
  is_active: boolean;
  created_at: string;
};

const defaultForm = {
  name: "",
  description: "",
  action_key: "",
  points: 10,
  icon: "Star",
  is_active: true,
};

const AdminRewards = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["reward_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_rules")
        .select("*")
        .order("points", { ascending: true });
      if (error) throw error;
      return data as RewardRule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      if (editingRule) {
        const { error } = await supabase
          .from("reward_rules")
          .update(values)
          .eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reward_rules").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward_rules"] });
      toast({ title: editingRule ? "تم تحديث المكافأة" : "تمت إضافة المكافأة" });
      setDialogOpen(false);
      setEditingRule(null);
      setForm(defaultForm);
    },
    onError: (e: Error) => {
      toast({ title: "حدث خطأ", description: e.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("reward_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reward_rules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reward_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward_rules"] });
      toast({ title: "تم حذف المكافأة" });
      setDeleteId(null);
    },
  });

  const openAdd = () => {
    setEditingRule(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (rule: RewardRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description ?? "",
      action_key: rule.action_key,
      points: rule.points,
      icon: rule.icon,
      is_active: rule.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.action_key || form.points < 1) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  const IconComp = ({ name, className }: { name: string; className?: string }) => {
    const Comp = iconMap[name] ?? Star;
    return <Comp className={className} />;
  };

  const totalActive = rules.filter((r) => r.is_active).length;
  const maxPoints = rules.length > 0 ? Math.max(...rules.map((r) => r.points)) : 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المكافآت والنقاط</h1>
          <p className="text-sm text-muted-foreground mt-1">
            حدّد الأحداث التي تستحق مكافأة وعدد النقاط الممنوحة لكل حدث
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة مكافأة
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي المكافآت</p>
              <p className="text-2xl font-bold">{rules.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">مكافآت فعّالة</p>
              <p className="text-2xl font-bold">{totalActive}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أعلى مكافأة</p>
              <p className="text-2xl font-bold">{maxPoints} <span className="text-sm font-normal">نقطة</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <span className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-3">
          {rules.map((rule) => (
            <Card key={rule.id} className={`transition-all ${!rule.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    rule.is_active ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <IconComp name={rule.icon} className={`w-6 h-6 ${rule.is_active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{rule.name}</h3>
                      <Badge variant="outline" className="text-xs font-mono">{rule.action_key}</Badge>
                      {!rule.is_active && <Badge variant="secondary">معطّل</Badge>}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{rule.description}</p>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-center shrink-0">
                    <div className="text-2xl font-bold text-amber-500">{rule.points}</div>
                    <div className="text-xs text-muted-foreground">نقطة</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: rule.id, is_active: v })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {rules.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد مكافآت بعد. ابدأ بإضافة أولى!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditingRule(null); setForm(defaultForm); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingRule ? "تعديل المكافأة" : "إضافة مكافأة جديدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>اسم المكافأة *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="إتمام جلسة"
                />
              </div>
              <div className="space-y-1.5">
                <Label>النقاط الممنوحة *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>مفتاح الحدث * <span className="text-xs text-muted-foreground">(بالإنجليزية، بدون مسافات)</span></Label>
              <Input
                value={form.action_key}
                onChange={(e) => setForm({ ...form, action_key: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                placeholder="session_complete"
                className="font-mono text-sm"
                disabled={!!editingRule}
              />
            </div>

            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف المكافأة وسبب منحها..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>الأيقونة</Label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map((iconName) => {
                  const Comp = iconMap[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setForm({ ...form, icon: iconName })}
                      className={`w-full aspect-square rounded-lg flex items-center justify-center border-2 transition-all ${
                        form.icon === iconName
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      title={iconName}
                    >
                      <Comp className={`w-5 h-5 ${form.icon === iconName ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>مكافأة فعّالة</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "جاري الحفظ..." : editingRule ? "حفظ التعديلات" : "إضافة المكافأة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">هل أنت متأكد من حذف هذه المكافأة؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRewards;
