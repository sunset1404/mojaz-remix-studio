import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HandHeart, Loader2 } from "lucide-react";

type Plan = { id: string; name: string };

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const GrantRequestDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [planId, setPlanId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [activeGrant, setActiveGrant] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setChecking(true);
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: pl }, { data: prof }, { data: pending }, { data: approved }] = await Promise.all([
        supabase.from("subscription_plans").select("id, name").eq("is_active", true).gt("price_monthly", 0).order("sort_order"),
        supabase.from("student_profiles").select("full_name, phone").eq("user_id", user.id).maybeSingle(),
        supabase.from("subscription_grant_requests" as any).select("id").eq("user_id", user.id).eq("status", "pending").maybeSingle(),
        supabase
          .from("subscription_grant_requests" as any)
          .select("id, approved_plan_name, approved_duration_months, approved_minutes, reviewed_at, approved_subscription_id")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .not("approved_subscription_id", "is", null)
          .order("reviewed_at", { ascending: false }),
      ]);
      setPlans((pl as any) || []);
      if (prof?.full_name && !fullName) setFullName(prof.full_name);
      if (prof?.phone && !phone) setPhone(prof.phone);
      setHasPending(!!pending);

      // Check if any approved grant's linked subscription is still active
      let active: any = null;
      const approvedList = (approved as any[]) || [];
      const subIds = approvedList.map((r) => r.approved_subscription_id).filter(Boolean);
      if (subIds.length) {
        const { data: subs } = await supabase
          .from("student_subscriptions")
          .select("id, status, end_date")
          .in("id", subIds);
        const activeSub = (subs || []).find(
          (s: any) => s.status === "active" && (!s.end_date || s.end_date >= today)
        );
        if (activeSub) active = approvedList.find((r) => r.approved_subscription_id === activeSub.id) || null;
      }
      setActiveGrant(active);
      setChecking(false);
    })();
  }, [open, user]);

  const submit = async () => {
    if (!user) return;
    if (!fullName.trim() || !reason.trim()) {
      toast.error("الرجاء تعبئة الاسم وسبب الطلب");
      return;
    }
    if (!planId) {
      toast.error("الرجاء اختيار الباقة المطلوبة");
      return;
    }
    setLoading(true);
    try {
      const plan = plans.find((p) => p.id === planId);
      const { error } = await supabase.from("subscription_grant_requests" as any).insert({
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: user.email,
        reason: reason.trim(),
        requested_plan_id: planId || null,
        requested_plan_name: plan?.name || null,
      });
      if (error) throw error;
      toast.success("تم إرسال طلب المنحة، سيتم مراجعته من قبل الإدارة");
      onOpenChange(false);
      setReason("");
      setPlanId("");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "تعذر إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <HandHeart className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle>طلب منحة اشتراك</DialogTitle>
          <DialogDescription>
            إذا كنت غير قادر على دفع الاشتراك، يمكنك تقديم طلب منحة وسيتم مراجعته من قبل الإدارة.
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : activeGrant ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl text-sm space-y-2">
            <p className="font-bold">لديك منحة فعّالة حالياً</p>
            <p>لا يمكن تقديم طلب منحة جديد ما دامت لديك منحة سارية.</p>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 mt-2 space-y-1">
              {activeGrant.approved_plan_name && <div>الباقة: <b>{activeGrant.approved_plan_name}</b></div>}
              {activeGrant.approved_duration_months != null && <div>المدة: <b>{activeGrant.approved_duration_months} شهر</b></div>}
              {activeGrant.approved_minutes != null && <div>الدقائق الممنوحة: <b>{activeGrant.approved_minutes} دقيقة</b></div>}
            </div>
          </div>
        ) : hasPending ? (
          <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-4 rounded-xl text-sm">
            لديك طلب منحة قيد المراجعة بالفعل. سيتم إشعارك عند صدور قرار الإدارة.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>الاسم الكامل</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>رقم الجوال للتواصل</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            </div>
            <div>
              <Label>الباقة المطلوبة *</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue placeholder="اختر الباقة" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>سبب الطلب وظروفك *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="اشرح ظروفك وسبب عدم قدرتك على دفع الاشتراك..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          {!hasPending && !activeGrant && !checking && (
            <Button onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال الطلب"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GrantRequestDialog;
