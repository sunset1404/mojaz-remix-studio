import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Sparkles, Zap, Gift, Star, Check, Clock,
  Plus, Pencil, Trash2, Power, PowerOff, X, Save, ChevronDown, ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// ─── Types ─────────────────────────────────────────────────────────────────
interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number | null;
  period: string;
  icon: string;
  features: string[];
  not_included: string[];
  is_popular: boolean;
  has_billing: boolean;
  subtitle: string | null;
  sort_order: number;
  is_active: boolean;
}

interface GiftPlan {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  duration: string;
  duration_months: number;
  hours: string;
  discount: string | null;
  features: string[];
  icon: string;
  is_popular: boolean;
  sort_order: number;
  is_active: boolean;
}

// ─── Icon map ───────────────────────────────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  Crown, Sparkles, Zap, Gift, Star, Clock,
};
const iconOptions = ["Crown", "Sparkles", "Zap", "Gift", "Star", "Clock"];

// ─── Empty forms ─────────────────────────────────────────────────────────────
const emptySubPlan: Omit<SubscriptionPlan, "id"> = {
  name: "", price_monthly: 0, price_yearly: null, period: "ريال / شهرياً",
  icon: "Crown", features: [], not_included: [], is_popular: false,
  has_billing: true, subtitle: null, sort_order: 99, is_active: true,
};
const emptyGiftPlan: Omit<GiftPlan, "id"> = {
  name: "", price: 0, original_price: null, duration: "شهر واحد",
  duration_months: 1, hours: "10 ساعات", discount: null, features: [],
  icon: "Gift", is_popular: false, sort_order: 99, is_active: true,
};

// ─── SubscriptionPlanCard ───────────────────────────────────────────────────
const SubscriptionPlanCard = ({
  plan, onToggle, onEdit, onDelete,
}: {
  plan: SubscriptionPlan;
  onToggle: (id: string, v: boolean) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (id: string) => void;
}) => {
  const Icon = iconMap[plan.icon] || Crown;
  const isPopular = plan.is_popular;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className={`rounded-2xl p-5 relative overflow-hidden border-2 transition-all ${
        !plan.is_active ? "opacity-50 border-border" :
        isPopular
          ? "bg-gradient-to-br from-gold to-[hsl(43,74%,45%)] text-white shadow-xl border-transparent"
          : "bg-card border-border shadow-sm"
      }`}
    >
      {/* Popular badge */}
      {isPopular && plan.is_active && (
        <div className="absolute top-3 left-3 bg-primary-foreground/20 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
          الأكثر طلباً ⭐
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <Badge variant={plan.is_active ? "default" : "secondary"} className="text-[10px]">
          {plan.is_active ? "مفعّل" : "معطّل"}
        </Badge>
      </div>

      {/* Icon + name + price */}
      <div className="flex items-start gap-3 mt-6 mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPopular ? "bg-white/20" : "bg-primary/10"}`}>
          <Icon className={`w-6 h-6 ${isPopular ? "text-white" : "text-primary"}`} />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${isPopular ? "text-white" : "text-foreground"}`}>{plan.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-extrabold ${isPopular ? "text-white" : "text-foreground"}`}>
              {plan.price_monthly === 0 ? "مجاني" : `${plan.price_monthly}`}
            </span>
            {plan.price_monthly > 0 && (
              <span className={`text-xs ${isPopular ? "text-white/70" : "text-muted-foreground"}`}>{plan.period}</span>
            )}
          </div>
          {plan.price_yearly && (
            <p className={`text-xs ${isPopular ? "text-white/70" : "text-muted-foreground"}`}>
              سنوياً: {plan.price_yearly} ريال
            </p>
          )}
        </div>
      </div>

      {plan.subtitle && (
        <p className={`text-xs mb-3 text-center ${isPopular ? "text-white/70" : "text-muted-foreground"}`}>{plan.subtitle}</p>
      )}

      {/* Features */}
      <div className="space-y-1.5 mb-4">
        {plan.features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isPopular ? "bg-white/20" : "bg-primary/10"}`}>
              <Check className={`w-2.5 h-2.5 ${isPopular ? "text-white" : "text-primary"}`} />
            </div>
            <span className={`text-xs ${isPopular ? "text-white/90" : "text-foreground"}`}>{f}</span>
          </div>
        ))}
        {plan.not_included?.map((f) => (
          <div key={f} className="flex items-center gap-2 opacity-40">
            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center"><span className="text-[10px]">✕</span></div>
            <span className="text-xs line-through">{f}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/20">
        <Switch
          checked={plan.is_active}
          onCheckedChange={(v) => onToggle(plan.id, v)}
          className="data-[state=checked]:bg-green-500"
        />
        <span className={`text-xs flex-1 ${isPopular ? "text-white/80" : "text-muted-foreground"}`}>
          {plan.is_active ? "مفعّل" : "معطّل"}
        </span>
        <button onClick={() => onEdit(plan)} className={`p-2 rounded-xl hover:bg-white/20 transition-colors ${isPopular ? "text-white" : "text-muted-foreground"}`}>
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(plan.id)} className={`p-2 rounded-xl hover:bg-destructive/20 transition-colors ${isPopular ? "text-white" : "text-destructive"}`}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── GiftPlanCard ───────────────────────────────────────────────────────────
const GiftPlanCard = ({
  plan, onToggle, onEdit, onDelete,
}: {
  plan: GiftPlan;
  onToggle: (id: string, v: boolean) => void;
  onEdit: (plan: GiftPlan) => void;
  onDelete: (id: string) => void;
}) => {
  const Icon = iconMap[plan.icon] || Gift;
  const isPopular = plan.is_popular;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className={`rounded-2xl p-5 relative overflow-hidden border-2 transition-all ${
        !plan.is_active ? "opacity-50 border-border" :
        isPopular
          ? "bg-gradient-to-br from-gold to-[hsl(43,74%,45%)] text-white shadow-xl border-transparent"
          : "bg-card border-border shadow-sm"
      }`}
    >
      {isPopular && plan.is_active && (
        <div className="absolute top-3 left-3 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">الأكثر طلباً ⭐</div>
      )}
      {plan.discount && (
        <div className={`absolute top-3 ${isPopular ? "right-3" : "left-3"} bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
          {plan.discount}
        </div>
      )}

      <div className="absolute top-3 right-3">
        <Badge variant={plan.is_active ? "default" : "secondary"} className="text-[10px]">
          {plan.is_active ? "مفعّل" : "معطّل"}
        </Badge>
      </div>

      <div className="flex items-start gap-3 mt-6 mb-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPopular ? "bg-white/20" : "bg-gold/10"}`}>
          <Icon className={`w-6 h-6 ${isPopular ? "text-white" : "text-gold"}`} />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${isPopular ? "text-white" : "text-foreground"}`}>{plan.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold ${isPopular ? "text-white" : "text-foreground"}`}>{plan.price}</span>
            <span className={`text-sm ${isPopular ? "text-white/70" : "text-muted-foreground"}`}>ريال</span>
            {plan.original_price && (
              <span className={`text-sm line-through ${isPopular ? "text-white/50" : "text-muted-foreground/60"}`}>{plan.original_price} ريال</span>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs mt-1 ${isPopular ? "text-white/80" : "text-muted-foreground"}`}>
            <Clock className="w-3 h-3" /> {plan.duration} • {plan.hours}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {plan.features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isPopular ? "bg-white/20" : "bg-gold/10"}`}>
              <Check className={`w-2.5 h-2.5 ${isPopular ? "text-white" : "text-gold"}`} />
            </div>
            <span className={`text-xs ${isPopular ? "text-white/90" : "text-foreground"}`}>{f}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/20">
        <Switch
          checked={plan.is_active}
          onCheckedChange={(v) => onToggle(plan.id, v)}
          className="data-[state=checked]:bg-green-500"
        />
        <span className={`text-xs flex-1 ${isPopular ? "text-white/80" : "text-muted-foreground"}`}>
          {plan.is_active ? "مفعّل" : "معطّل"}
        </span>
        <button onClick={() => onEdit(plan)} className={`p-2 rounded-xl hover:bg-white/20 transition-colors ${isPopular ? "text-white" : "text-muted-foreground"}`}>
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(plan.id)} className={`p-2 rounded-xl hover:bg-destructive/20 transition-colors ${isPopular ? "text-white" : "text-destructive"}`}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── FeatureEditor ────────────────────────────────────────────────────────────
const FeatureEditor = ({
  label, items, onChange,
}: { label: string; items: string[]; onChange: (items: string[]) => void }) => {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    onChange([...items, newItem.trim()]);
    setNewItem("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
            <span className="text-sm flex-1">{item}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="أضف ميزة..."
          className="text-right text-sm h-8"
          onKeyDown={(e) => e.key === "Enter" && addItem()}
        />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-8 px-3">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const AdminPlans = () => {
  const { toast } = useToast();

  // Sub plans state
  const [subPlans, setSubPlans] = useState<SubscriptionPlan[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [subDialog, setSubDialog] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionPlan | null>(null);
  const [subForm, setSubForm] = useState<Omit<SubscriptionPlan, "id">>(emptySubPlan);

  // Gift plans state
  const [giftPlans, setGiftPlans] = useState<GiftPlan[]>([]);
  const [giftLoading, setGiftLoading] = useState(true);
  const [giftDialog, setGiftDialog] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftPlan | null>(null);
  const [giftForm, setGiftForm] = useState<Omit<GiftPlan, "id">>(emptyGiftPlan);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSubPlans = async () => {
    setSubLoading(true);
    const { data } = await (supabase as any).from("subscription_plans").select("*").order("sort_order");
    setSubPlans(data || []);
    setSubLoading(false);
  };

  const fetchGiftPlans = async () => {
    setGiftLoading(true);
    const { data } = await (supabase as any).from("gift_plans").select("*").order("sort_order");
    setGiftPlans(data || []);
    setGiftLoading(false);
  };

  useEffect(() => { fetchSubPlans(); fetchGiftPlans(); }, []);

  // ── Sub plan CRUD ──────────────────────────────────────────────────────────
  const openAddSub = () => { setEditingSub(null); setSubForm(emptySubPlan); setSubDialog(true); };
  const openEditSub = (plan: SubscriptionPlan) => {
    setEditingSub(plan);
    setSubForm({ ...plan });
    setSubDialog(true);
  };

  const saveSub = async () => {
    if (!subForm.name) { toast({ title: "يرجى إدخال اسم الباقة", variant: "destructive" }); return; }
    if (editingSub) {
      const { error } = await (supabase as any).from("subscription_plans").update(subForm).eq("id", editingSub.id);
      if (error) { toast({ title: "حدث خطأ", variant: "destructive" }); return; }
      toast({ title: "تم تحديث الباقة" });
    } else {
      const { error } = await (supabase as any).from("subscription_plans").insert(subForm);
      if (error) { toast({ title: "حدث خطأ", variant: "destructive" }); return; }
      toast({ title: "تم إضافة الباقة" });
    }
    setSubDialog(false);
    fetchSubPlans();
  };

  const toggleSub = async (id: string, value: boolean) => {
    await (supabase as any).from("subscription_plans").update({ is_active: value }).eq("id", id);
    fetchSubPlans();
  };

  const deleteSub = async (id: string) => {
    if (!confirm("هل تريد حذف هذه الباقة؟")) return;
    await (supabase as any).from("subscription_plans").delete().eq("id", id);
    toast({ title: "تم الحذف" });
    fetchSubPlans();
  };

  // ── Gift plan CRUD ─────────────────────────────────────────────────────────
  const openAddGift = () => { setEditingGift(null); setGiftForm(emptyGiftPlan); setGiftDialog(true); };
  const openEditGift = (plan: GiftPlan) => {
    setEditingGift(plan);
    setGiftForm({ ...plan });
    setGiftDialog(true);
  };

  const saveGift = async () => {
    if (!giftForm.name) { toast({ title: "يرجى إدخال اسم الباقة", variant: "destructive" }); return; }
    if (editingGift) {
      const { error } = await (supabase as any).from("gift_plans").update(giftForm).eq("id", editingGift.id);
      if (error) { toast({ title: "حدث خطأ", variant: "destructive" }); return; }
      toast({ title: "تم تحديث باقة الإهداء" });
    } else {
      const { error } = await (supabase as any).from("gift_plans").insert(giftForm);
      if (error) { toast({ title: "حدث خطأ", variant: "destructive" }); return; }
      toast({ title: "تم إضافة باقة الإهداء" });
    }
    setGiftDialog(false);
    fetchGiftPlans();
  };

  const toggleGift = async (id: string, value: boolean) => {
    await (supabase as any).from("gift_plans").update({ is_active: value }).eq("id", id);
    fetchGiftPlans();
  };

  const deleteGift = async (id: string) => {
    if (!confirm("هل تريد حذف هذه الباقة؟")) return;
    await (supabase as any).from("gift_plans").delete().eq("id", id);
    toast({ title: "تم الحذف" });
    fetchGiftPlans();
  };

  const IconPreview = ({ iconName }: { iconName: string }) => {
    const Icon = iconMap[iconName] || Crown;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الباقات</h1>
          <p className="text-muted-foreground text-sm">تحكم في باقات الاشتراكات والإهداءات المعروضة في التطبيق</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" dir="rtl">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="subscriptions" className="gap-2">
            <Crown className="w-4 h-4" /> باقات الاشتراكات
          </TabsTrigger>
          <TabsTrigger value="gifts" className="gap-2">
            <Gift className="w-4 h-4" /> باقات الإهداءات
          </TabsTrigger>
        </TabsList>

        {/* ── Subscription Plans Tab ── */}
        <TabsContent value="subscriptions" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{subPlans.length} باقة • {subPlans.filter(p => p.is_active).length} مفعّلة</p>
            <Button onClick={openAddSub} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> إضافة باقة
            </Button>
          </div>

          {subLoading ? (
            <div className="flex justify-center py-12">
              <span className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {subPlans.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id} plan={plan}
                  onToggle={toggleSub} onEdit={openEditSub} onDelete={deleteSub}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Gift Plans Tab ── */}
        <TabsContent value="gifts" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{giftPlans.length} باقة • {giftPlans.filter(p => p.is_active).length} مفعّلة</p>
            <Button onClick={openAddGift} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> إضافة باقة إهداء
            </Button>
          </div>

          {giftLoading ? (
            <div className="flex justify-center py-12">
              <span className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {giftPlans.map((plan) => (
                <GiftPlanCard
                  key={plan.id} plan={plan}
                  onToggle={toggleGift} onEdit={openEditGift} onDelete={deleteGift}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Subscription Dialog ── */}
      <Dialog open={subDialog} onOpenChange={setSubDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingSub ? "تعديل الباقة" : "إضافة باقة جديدة"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1">
              <Label>اسم الباقة *</Label>
              <Input value={subForm.name} onChange={(e) => setSubForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: الحفظ والمراجعة" className="text-right" />
            </div>

            {/* Icon */}
            <div className="space-y-1">
              <Label>الأيقونة</Label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((ic) => {
                  const Ic = iconMap[ic];
                  return (
                    <button key={ic} onClick={() => setSubForm(f => ({ ...f, icon: ic }))}
                      className={`p-2.5 rounded-xl border-2 transition-all ${subForm.icon === ic ? "border-primary bg-primary/10" : "border-border"}`}>
                      <Ic className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>السعر الشهري (ريال)</Label>
                <Input type="number" value={subForm.price_monthly} onChange={(e) => setSubForm(f => ({ ...f, price_monthly: parseFloat(e.target.value) || 0 }))} className="text-right" />
              </div>
              <div className="space-y-1">
                <Label>السعر السنوي (ريال)</Label>
                <Input type="number" value={subForm.price_yearly ?? ""} onChange={(e) => setSubForm(f => ({ ...f, price_yearly: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="اختياري" className="text-right" />
              </div>
            </div>

            {/* Period */}
            <div className="space-y-1">
              <Label>وصف الفترة</Label>
              <Input value={subForm.period} onChange={(e) => setSubForm(f => ({ ...f, period: e.target.value }))} placeholder="ريال / شهرياً" className="text-right" />
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <Label>وصف إضافي (اختياري)</Label>
              <Input value={subForm.subtitle ?? ""} onChange={(e) => setSubForm(f => ({ ...f, subtitle: e.target.value || null }))} className="text-right" />
            </div>

            {/* Toggles */}
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={subForm.is_popular} onCheckedChange={(v) => setSubForm(f => ({ ...f, is_popular: v }))} />
                <span className="text-sm">الأكثر طلباً</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={subForm.has_billing} onCheckedChange={(v) => setSubForm(f => ({ ...f, has_billing: v }))} />
                <span className="text-sm">دوري (شهري/سنوي)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={subForm.is_active} onCheckedChange={(v) => setSubForm(f => ({ ...f, is_active: v }))} />
                <span className="text-sm">مفعّل</span>
              </label>
            </div>

            {/* Features */}
            <FeatureEditor
              label="الميزات المتضمنة"
              items={subForm.features}
              onChange={(items) => setSubForm(f => ({ ...f, features: items }))}
            />
            <FeatureEditor
              label="غير متضمن (يظهر مشطوباً)"
              items={subForm.not_included}
              onChange={(items) => setSubForm(f => ({ ...f, not_included: items }))}
            />

            {/* Sort order */}
            <div className="space-y-1">
              <Label>الترتيب</Label>
              <Input type="number" value={subForm.sort_order} onChange={(e) => setSubForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="text-right" />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSubDialog(false)}>إلغاء</Button>
            <Button onClick={saveSub} className="gap-2"><Save className="w-4 h-4" />حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Gift Dialog ── */}
      <Dialog open={giftDialog} onOpenChange={setGiftDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingGift ? "تعديل باقة الإهداء" : "إضافة باقة إهداء جديدة"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1">
              <Label>اسم الباقة *</Label>
              <Input value={giftForm.name} onChange={(e) => setGiftForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: هدية الانطلاقة" className="text-right" />
            </div>

            {/* Icon */}
            <div className="space-y-1">
              <Label>الأيقونة</Label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((ic) => {
                  const Ic = iconMap[ic];
                  return (
                    <button key={ic} onClick={() => setGiftForm(f => ({ ...f, icon: ic }))}
                      className={`p-2.5 rounded-xl border-2 transition-all ${giftForm.icon === ic ? "border-primary bg-primary/10" : "border-border"}`}>
                      <Ic className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>السعر (ريال) *</Label>
                <Input type="number" value={giftForm.price} onChange={(e) => setGiftForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="text-right" />
              </div>
              <div className="space-y-1">
                <Label>السعر الأصلي (قبل الخصم)</Label>
                <Input type="number" value={giftForm.original_price ?? ""} onChange={(e) => setGiftForm(f => ({ ...f, original_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="اختياري" className="text-right" />
              </div>
            </div>

            {/* Duration + hours */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>المدة (نص)</Label>
                <Input value={giftForm.duration} onChange={(e) => setGiftForm(f => ({ ...f, duration: e.target.value }))} placeholder="شهر واحد" className="text-right" />
              </div>
              <div className="space-y-1">
                <Label>المدة (أشهر)</Label>
                <Input type="number" value={giftForm.duration_months} onChange={(e) => setGiftForm(f => ({ ...f, duration_months: parseInt(e.target.value) || 1 }))} className="text-right" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>الساعات</Label>
                <Input value={giftForm.hours} onChange={(e) => setGiftForm(f => ({ ...f, hours: e.target.value }))} placeholder="10 ساعات" className="text-right" />
              </div>
              <div className="space-y-1">
                <Label>نص الخصم (اختياري)</Label>
                <Input value={giftForm.discount ?? ""} onChange={(e) => setGiftForm(f => ({ ...f, discount: e.target.value || null }))} placeholder="توفير 17%" className="text-right" />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={giftForm.is_popular} onCheckedChange={(v) => setGiftForm(f => ({ ...f, is_popular: v }))} />
                <span className="text-sm">الأكثر طلباً</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={giftForm.is_active} onCheckedChange={(v) => setGiftForm(f => ({ ...f, is_active: v }))} />
                <span className="text-sm">مفعّل</span>
              </label>
            </div>

            {/* Features */}
            <FeatureEditor
              label="الميزات المتضمنة"
              items={giftForm.features}
              onChange={(items) => setGiftForm(f => ({ ...f, features: items }))}
            />

            {/* Sort */}
            <div className="space-y-1">
              <Label>الترتيب</Label>
              <Input type="number" value={giftForm.sort_order} onChange={(e) => setGiftForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="text-right" />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setGiftDialog(false)}>إلغاء</Button>
            <Button onClick={saveGift} className="gap-2"><Save className="w-4 h-4" />حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlans;
