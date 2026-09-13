import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const CONFIRM_WORD = "حذف";

const DeleteAccountButton = () => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-own-account");
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message);
      }
      toast({ title: "تم حذف الحساب", description: "تم حذف حسابك وإيقاف الدخول إليه." });
      await signOut();
      navigate("/login");
    } catch (e) {
      toast({
        title: "تعذر حذف الحساب",
        description: "حدث خطأ أثناء الحذف، يرجى المحاولة مرة أخرى أو التواصل معنا.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setOpen(false);
      setConfirmText("");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        dir="rtl"
        className="rounded-xl p-4 flex items-center gap-3 w-full border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 active:scale-[0.98] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <Trash2 className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1 text-right">
          <p className="font-semibold text-destructive text-sm">حذف الحساب</p>
          <p className="text-[10px] text-destructive/70">حذف الحساب وجميع البيانات نهائيًا</p>
        </div>
      </button>

      <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmText(""); }}>
        <AlertDialogContent dir="rtl" className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <AlertDialogTitle className="text-right">حذف الحساب نهائيًا</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-right leading-relaxed">
              سيتم حذف حسابك وإيقاف الدخول إليه نهائيًا، ولن تظهر بياناتك في التطبيق بعد ذلك. إن رغبت لاحقًا بإرجاع حسابك يمكنك التواصل معنا لاستعادته.
              <br />
              للتأكيد اكتب كلمة «{CONFIRM_WORD}» في الحقل التالي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="text-right"
          />
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={confirmText.trim() !== CONFIRM_WORD || loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "جارٍ الحذف..." : "حذف نهائي"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteAccountButton;
