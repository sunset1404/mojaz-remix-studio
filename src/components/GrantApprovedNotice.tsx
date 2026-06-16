import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Gift, Clock, Calendar } from "lucide-react";

type ApprovedGrant = {
  id: string;
  approved_plan_name: string | null;
  approved_duration_months: number | null;
  approved_minutes: number | null;
  admin_notes: string | null;
  reviewed_at: string | null;
};

export const GrantApprovedNotice = () => {
  const { user, role } = useAuth();
  const [grant, setGrant] = useState<ApprovedGrant | null>(null);

  useEffect(() => {
    if (!user || role !== "student") return;
    let cancelled = false;

    const check = async () => {
      const { data, error } = await (supabase as any)
        .from("subscription_grant_requests")
        .select("id, approved_plan_name, approved_duration_months, approved_minutes, admin_notes, reviewed_at")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .is("student_notified_at", null)
        .order("reviewed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && !error && data) setGrant(data as ApprovedGrant);
    };

    check();

    // Listen for real-time updates while logged in
    const channel = supabase
      .channel(`grant-notice-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "subscription_grant_requests", filter: `user_id=eq.${user.id}` },
        () => check()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  const handleClose = async () => {
    if (!grant) return;
    await (supabase as any)
      .from("subscription_grant_requests")
      .update({ student_notified_at: new Date().toISOString() })
      .eq("id", grant.id);
    setGrant(null);
  };

  if (!grant) return null;

  return (
    <Dialog open={!!grant} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <PartyPopper className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">مبروك! تم قبول منحتك 🎉</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-center text-muted-foreground">
            تمت الموافقة على طلب المنحة الخاص بك، وتم تفعيل الباقة على حسابك الآن.
          </p>

          <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
            {grant.approved_plan_name && (
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">الباقة:</span>
                <b>{grant.approved_plan_name}</b>
              </div>
            )}
            {grant.approved_duration_months != null && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">المدة:</span>
                <b>{grant.approved_duration_months} شهر</b>
              </div>
            )}
            {grant.approved_minutes != null && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">الدقائق الممنوحة:</span>
                <b>{grant.approved_minutes} دقيقة</b>
              </div>
            )}
            {grant.admin_notes && (
              <div className="pt-2 border-t text-xs text-muted-foreground">
                ملاحظات الإدارة: {grant.admin_notes}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            نسأل الله لك التوفيق والإعانة على حفظ كتابه الكريم.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">ابدأ الآن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GrantApprovedNotice;
