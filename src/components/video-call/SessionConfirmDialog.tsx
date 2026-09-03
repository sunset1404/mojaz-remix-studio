import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FileText, CheckCircle2, ClipboardList, Star } from 'lucide-react';
import { SessionNoteData } from './ReciterSessionPanel';
import { SurahSelect } from './SurahSelect';
import { RubricScoring } from './RubricScoring';
import { computeTotalScore } from '@/data/examRubric';

interface SessionConfirmDialogProps {
  data: SessionNoteData;
  onConfirm: (updatedData: SessionNoteData) => void;
  onCancel: () => void;
  isExam?: boolean;
}

export function SessionConfirmDialog({ data, onConfirm, onCancel, isExam }: SessionConfirmDialogProps) {
  const [scores, setScores] = useState<Record<string, number>>(data.scores || {});
  const [startSurah, setStartSurah] = useState(data.startSurah);
  const [startAyah, setStartAyah] = useState(data.startAyah);
  const [endSurah, setEndSurah] = useState(data.endSurah);
  const [endAyah, setEndAyah] = useState(data.endAyah);
  const [notes, setNotes] = useState(data.notes);
  const [startMaxAyahs, setStartMaxAyahs] = useState(0);
  const [endMaxAyahs, setEndMaxAyahs] = useState(0);
  const [rating, setRating] = useState<number>(data.rating || 0);

  const handleConfirm = () => {
    const finalRating = isExam
      ? Math.max(rating, Math.max(0, Math.min(5, Math.round((computeTotalScore(scores) / 100) * 5))))
      : rating;
    onConfirm({ rating: finalRating, scores, startSurah, startAyah, endSurah, endAyah, notes });
  };


  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Gradient top */}
        <div
          className="h-2 w-full"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))" }}
        />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--gold) / 0.15))" }}>
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">تقييم الجلسة</h3>
            <p className="text-xs text-muted-foreground">انتهى الاتصال، أدخل أو عدّل البيانات قبل حفظها</p>
          </div>

          {/* Rubric scoring — only for exams */}
          {isExam && (
            <div className="space-y-1.5">
              <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-primary" />
                معايير التقييم
              </label>
              <RubricScoring scores={scores} onChange={setScores} />
            </div>
          )}

          {/* Session star rating */}
          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-gold" />
              تقييم الجلسة
            </label>
            <div className="flex items-center gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`تقييم ${star} من 5`}
                >
                  <Star
                    className={`w-7 h-7 ${star <= rating ? 'fill-gold text-gold' : 'text-muted-foreground/40'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Start point */}

          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              بدأ من
            </label>
            <div className="flex gap-2">
              <SurahSelect
                value={startSurah}
                onChange={(name, maxAyahs) => {
                  setStartSurah(name);
                  setStartMaxAyahs(maxAyahs);
                }}
              />
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={startMaxAyahs || undefined}
                placeholder="الآية"
                value={startAyah}
                onChange={(e) => setStartAyah(e.target.value)}
                className="w-20 rounded-xl border border-border bg-background px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* End point */}
          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-gold" />
              انتهى عند
            </label>
            <div className="flex gap-2">
              <SurahSelect
                value={endSurah}
                onChange={(name, maxAyahs) => {
                  setEndSurah(name);
                  setEndMaxAyahs(maxAyahs);
                }}
              />
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={endMaxAyahs || undefined}
                placeholder="الآية"
                value={endAyah}
                onChange={(e) => setEndAyah(e.target.value)}
                className="w-20 rounded-xl border border-border bg-background px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              ملاحظات
            </label>
            <textarea
              placeholder="ملاحظات على أداء الطالب..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
             <button
               onClick={handleConfirm}
               className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 shadow-lg"
               style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
             >
               حفظ التقييم
             </button>
            <button
              onClick={onCancel}
              className="px-5 py-3 rounded-xl font-semibold text-sm text-foreground bg-muted hover:bg-muted/80 transition-colors border border-border"
            >
              رجوع
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
