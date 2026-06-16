import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, HandHeart, Clock, Phone, Mail, User, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

type Request = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  reason: string;
  requested_plan_name: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  approved_plan_name: string | null;
  approved_duration_months: number | null;
  approved_minutes: number | null;
  approved_subscription_id: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type Plan = {
  id: string;
  name: string;
  price_monthly: number;
};

const AdminGrantRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; req: Request | null; mode: "approve" | "reject" }>({
    open: false, req: null, mode: "approve",
  });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; req: Request | null; mode: "suspend" | "delete" }>({
    open: false, req: null, mode: "suspend",
  });
  const [planId, setPlanId] = useState<string>("");
  const [durationMonths, setDurationMonths] = useState<string>("1");
  const [minutes, setMinutes] = useState<string>("60");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [managing, setManaging] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: reqs }, { data: pl }] = await Promise.all([
      supabase.from("subscription_grant_requests" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("subscription_plans").select("id, name, price_monthly").eq("is_active", true).order("sort_order"),
    ]);
    setRequests((reqs as any) || []);
    setPlans((pl as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAction = (req: Request, mode: "approve" | "reject") => {
    setActionDialog({ open: true, req, mode });
    setPlanId("");
    setDurationMonths("1");
    setMinutes("60");
    setNotes("");
  };

  const openConfirm = (req: Request, mode: "suspend" | "delete") => {
    setConfirmDialog({ open: true, req, mode });
  };

  const handleSubmit = async () => {
    if (!actionDialog.req || !user) return;
    setSubmitting(true);
    try {
      if (actionDialog.mode === "approve") {
        if (!planId) {
          toast.error("اختر الباقة");
          setSubmitting(false);
          return;
        }
        const plan = plans.find((p) => p.id === planId);
        const months = Number(durationMonths) || 1;
        const mins = Number(minutes) || 60;

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);

        // Create active subscription
        const { data: subData, error: subErr } = await supabase.from("student_subscriptions").insert({
          student_id: actionDialog.req.user_id,
          student_name: actionDialog.req.full_name,
          student_phone: actionDialog.req.phone,
          subscription_type: `منحة - ${plan?.name || ""}`,
          amount: 0,
          duration_months: months,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          status: "active",
          notes: `منحة معتمدة من الإدارة. ${notes}`.trim(),
        }).select("id").single();
        if (subErr) throw subErr;

        // Add minutes
        const { data: existingCredit } = await (supabase as any).from("student_hour_credits")
          .select("id, remaining_minutes").eq("user_id", actionDialog.req.user_id).maybeSingle();
        if (existingCredit) {
          await (supabase as any).from("student_hour_credits")
            .update({ remaining_minutes: Number(existingCredit.remaining_minutes) + mins })
            .eq("id", existingCredit.id);
        } else {
          await (supabase as any).from("student_hour_credits")
            .insert({ user_id: actionDialog.req.user_id, remaining_minutes: mins });
        }

        const { error: updErr } = await supabase.from("subscription_grant_requests" as any).update({
          status: "approved",
          admin_notes: notes || null,
          approved_plan_id: planId,
          approved_plan_name: plan?.name || null,
          approved_duration_months: months,
          approved_minutes: mins,
          approved_subscription_id: subData?.id || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        }).eq("id", actionDialog.req.id);
        if (updErr) throw updErr;

        toast.success("تمت الموافقة على المنحة وتفعيل الاشتراك");
      } else {
        const { error } = await supabase.from("subscription_grant_requests" as any).update({
          status: "rejected",
          admin_notes: notes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        }).eq("id", actionDialog.req.id);
        if (error) throw error;
        toast.success("تم رفض الطلب");
      }
      setActionDialog({ open: false, req: null, mode: "approve" });
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManage = async () => {
    if (!confirmDialog.req) return;
    setManaging(true);
    try {
      if (confirmDialog.mode === "suspend") {
        const { error } = await supabase.from("student_subscriptions").update({ status: "suspended" }).eq("id", confirmDialog.req.approved_subscription_id);
        if (error) throw error;
        toast.success("تم تعليق الاشتراك");
      } else {
        const { error } = await supabase.from("student_subscriptions").delete().eq("id", confirmDialog.req.approved_subscription_id);
        if (error) throw error;
        toast.success("تم حذف الاشتراك");
      }
      setConfirmDialog({ open: false, req: null, mode: "suspend" });
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "حدث خطأ");
    } finally {
      setManaging(false);
    }
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const statusBadge = (s: string) => {
    if (s === "pending") return <Badge variant="outline" className="border-amber-500 text-amber-600"><Clock className="w-3 h-3 ml-1" />قيد المراجعة</Badge>;
    if (s === "approved") return <Badge className="bg-green-600"><Check className="w-3 h-3 ml-1" />مقبول</Badge>;
    return <Badge variant="destructive"><X className="w-3 h-3 ml-1" />مرفوض</Badge>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <HandHeart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">طلبات المنح</h1>
          <p className="text-sm text-muted-foreground">طلبات الطلاب للحصول على اشتراك مجاني</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {([
          { v: "pending", l: "قيد المراجعة" },
          { v: "approved", l: "مقبولة" },
          { v: "rejected", l: "مرفوضة" },
          { v: "all", l: "الكل" },
        ] as const).map((f) => (
          <Button key={f.v} variant={filter === f.v ? "default" : "outline"} size="sm" onClick={() => setFilter(f.v as any)}>
            {f.l} ({f.v === "all" ? requests.length : requests.filter((r) => r.status === f.v).length})
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">لا توجد طلبات</div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card border rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{r.full_name}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                      {r.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.email}</span>}
                      <span>{new Date(r.created_at).toLocaleString("ar-SA")}</span>
                    </div>
                  </div>
                </div>
                {statusBadge(r.status)}
              </div>

              <div className="text-sm mb-2 flex items-center gap-2">
                <span className="text-muted-foreground">الباقة المطلوبة:</span>
                <b className="text-foreground">{r.requested_plan_name || "— لم يحدد —"}</b>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-sm mb-3 whitespace-pre-wrap">{r.reason}</div>

              {r.status !== "pending" && (
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  {r.approved_plan_name && <div>الباقة المعتمدة: <b>{r.approved_plan_name}</b> — {r.approved_duration_months} شهر / {r.approved_minutes} دقيقة</div>}
                  {r.admin_notes && <div>ملاحظات الإدارة: {r.admin_notes}</div>}
                  {r.reviewed_at && <div>تمت المراجعة: {new Date(r.reviewed_at).toLocaleString("ar-SA")}</div>}
                </div>
              )}

              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => openAction(r, "approve")} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 ml-1" />موافقة ومنح اشتراك
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => openAction(r, "reject")}>
                    <X className="w-4 h-4 ml-1" />رفض
                  </Button>
                </div>
              )}

              {r.status === "approved" && r.approved_subscription_id && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => openConfirm(r, "suspend")}>
                    <Pause className="w-4 h-4 ml-1" />تعليق الاشتراك
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => openConfirm(r, "delete")}>
                    <Trash2 className="w-4 h-4 ml-1" />حذف الاشتراك
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={actionDialog.open} onOpenChange={(o) => !o && setActionDialog({ open: false, req: null, mode: "approve" })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{actionDialog.mode === "approve" ? "الموافقة على المنحة" : "رفض الطلب"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.mode === "approve" && (
              <>
                <div>
                  <Label>الباقة الممنوحة</Label>
                  <Select value={planId} onValueChange={setPlanId}>
                    <SelectTrigger><SelectValue placeholder="اختر الباقة" /></SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>المدة (أشهر)</Label>
                    <Input type="number" min="1" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} />
                  </div>
                  <div>
                    <Label>الدقائق الممنوحة</Label>
                    <Input type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label>ملاحظات الإدارة (اختياري)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, req: null, mode: "approve" })}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={submitting} className={actionDialog.mode === "approve" ? "bg-green-600 hover:bg-green-700" : ""} variant={actionDialog.mode === "reject" ? "destructive" : "default"}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : actionDialog.mode === "approve" ? "تأكيد المنح" : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog.open} onOpenChange={(o) => !o && setConfirmDialog({ open: false, req: null, mode: "suspend" })}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmDialog.mode === "suspend" ? "تعليق الاشتراك" : "حذف الاشتراك"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDialog.mode === "suspend"
              ? "هل أنت متأكد من تعليق هذا الاشتراك؟ لن يتمكن الطالب من استخدامه حتى يتم تفعيله مرة أخرى."
              : "هل أنت متأكد من حذف هذا الاشتراك نهائيًا؟ لا يمكن التراجع عن هذا الإجراء."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, req: null, mode: "suspend" })}>إلغاء</Button>
            <Button onClick={handleManage} disabled={managing} variant={confirmDialog.mode === "delete" ? "destructive" : "default"}>
              {managing ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmDialog.mode === "suspend" ? "تعليق" : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGrantRequests;
