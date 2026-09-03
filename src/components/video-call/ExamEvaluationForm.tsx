import { ClipboardList, FileText, CheckCircle2 } from 'lucide-react';
import { RubricScoring } from './RubricScoring';

interface ExamEvaluationFormProps {
  scores: Record<string, number>;
  notes: string;
  onScoresChange: (scores: Record<string, number>) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export function ExamEvaluationForm({
  scores,
  notes,
  onScoresChange,
  onNotesChange,
  onSave,
  onCancel,
  saveLabel = 'حفظ التقييم',
  cancelLabel = 'رجوع',
  title = 'تقييم الاختبار',
  subtitle = 'أدخل معايير التقييم والملاحظات',
  hideHeader = false,
}: ExamEvaluationFormProps) {
  return (
    <div className="space-y-4" dir="rtl">
      {!hideHeader && (
        <div className="text-center space-y-1.5">
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--gold) / 0.15))" }}
          >
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-primary" />
          معايير التقييم
        </label>
        <RubricScoring scores={scores} onChange={onScoresChange} />
      </div>

      <div className="space-y-1.5">
        <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" />
          ملاحظات
        </label>
        <textarea
          placeholder="ملاحظات على أداء الطالب..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onSave}
          className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 shadow-lg"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
        >
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-xl font-semibold text-sm text-foreground bg-muted hover:bg-muted/80 transition-colors border border-border"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
