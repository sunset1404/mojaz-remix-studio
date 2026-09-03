import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { ExamEvaluationForm } from './ExamEvaluationForm';

interface ExamScoringPanelProps {
  scores: Record<string, number>;
  notes?: string;
  onScoresChange: (scores: Record<string, number>) => void;
  onNotesChange?: (notes: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideToggle?: boolean;
}

export function ExamScoringPanel({
  scores,
  notes = '',
  onScoresChange,
  onNotesChange,
  isOpen: controlledOpen,
  onOpenChange,
  hideToggle,
}: ExamScoringPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const [localNotes, setLocalNotes] = useState(notes);
  const [localScores, setLocalScores] = useState(scores);

  const handleSave = () => {
    onScoresChange(localScores);
    onNotesChange?.(localNotes);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalScores(scores);
    setLocalNotes(notes);
    setIsOpen(false);
  };

  return (
    <div className="absolute left-3 right-3 z-[60]" style={{ bottom: '5rem' }} dir="rtl">
      {!hideToggle && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="mr-auto mb-2 flex items-center gap-2 rounded-xl border border-gold/25 bg-card shadow-md px-4 py-2.5 text-sm font-semibold text-foreground backdrop-blur-sm"
          whileTap={{ scale: 0.96 }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--primary)))" }}>
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          معايير التقييم
          {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl overflow-y-auto"
            style={{ maxHeight: '70vh' }}
          >
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--primary)))" }} />
            <div className="p-4">
              <ExamEvaluationForm
                scores={localScores}
                notes={localNotes}
                onScoresChange={setLocalScores}
                onNotesChange={setLocalNotes}
                onSave={handleSave}
                onCancel={handleCancel}
                title="تقييم الاختبار"
                subtitle="أدخل معايير التقييم والملاحظات"
                hideHeader
                saveLabel="حفظ التقييم"
                cancelLabel="رجوع"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
