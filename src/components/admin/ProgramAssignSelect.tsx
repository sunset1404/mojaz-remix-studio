import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export interface ProgramOption {
  id: string;
  name: string;
  status?: string;
}

export const useProgramsList = () => {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  useEffect(() => {
    supabase
      .from("programs" as any)
      .select("id, name, status")
      .order("created_at", { ascending: false })
      .then(({ data }) => setPrograms(((data as any[]) || []) as ProgramOption[]));
  }, []);
  return programs;
};

interface Props {
  userId: string;
  value: string | null | undefined;
  programs: ProgramOption[];
  onChanged?: (programId: string | null) => void;
}

const ProgramAssignSelect = ({ userId, value, programs, onChanged }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<string>(value || "none");

  useEffect(() => setCurrent(value || "none"), [value]);

  const handleChange = async (val: string) => {
    const programId = val === "none" ? null : val;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("student_profiles")
        .update({ program_id: programId } as any)
        .eq("user_id", userId);
      if (error) throw error;
      setCurrent(val);
      onChanged?.(programId);
      toast({ title: programId ? "تم تسكين الطالب على البرنامج ✅" : "تم إلغاء تسكين البرنامج" });
    } catch (e: any) {
      toast({ title: "تعذّر الحفظ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select value={current} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger className="h-9 text-xs" dir="rtl">
        <SelectValue placeholder="اختر برنامجًا" />
      </SelectTrigger>
      <SelectContent dir="rtl">
        <SelectItem value="none" className="text-xs">بدون برنامج (كما هو)</SelectItem>
        {programs.map((p) => (
          <SelectItem key={p.id} value={p.id} className="text-xs">
            {p.name}{p.status === "archived" ? " (مؤرشف)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProgramAssignSelect;
