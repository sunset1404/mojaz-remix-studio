import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  onRestored?: () => void;
  className?: string;
}

/** Restores an account the user deleted from the app (data is kept, sign-in re-enabled). */
const RestoreAccountButton = ({ userId, onRestored, className }: Props) => {
  const [loading, setLoading] = useState(false);

  const restore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("restore-account", {
        body: { user_id: userId },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast({ title: "تم استعادة الحساب", description: "أصبح الحساب مفعّلًا بكل بياناته." });
      onRestored?.();
    } catch (err: any) {
      toast({ title: "تعذّر استعادة الحساب", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={restore}
      className={`h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50 gap-1 ${className || ""}`}
    >
      <RotateCcw className="w-4 h-4" />
      {loading ? "..." : "استعادة"}
    </Button>
  );
};

export default RestoreAccountButton;
