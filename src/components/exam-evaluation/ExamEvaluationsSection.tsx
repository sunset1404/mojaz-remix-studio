import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award } from "lucide-react";
import { ExamEvaluationCard, ExamEvaluation } from "./ExamEvaluationCard";

interface Props {
  studentId: string;
  title?: string;
}

export function ExamEvaluationsSection({ studentId, title = "تقييمات اختبارات القبول والاستحقاق" }: Props) {
  const [items, setItems] = useState<ExamEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("exam_evaluations")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (active) {
        setItems((data as ExamEvaluation[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [studentId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center text-muted-foreground text-sm" dir="rtl">
        جارٍ التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-3">
      <h2 className="font-bold text-foreground flex items-center gap-2">
        <Award className="w-4 h-4 text-gold" />
        {title}
      </h2>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
          <Award className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">لا توجد تقييمات اختبارات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((ev) => (
            <ExamEvaluationCard key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}
