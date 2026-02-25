import { motion } from 'framer-motion';
import { Star, BookOpen, FileText, Sparkles, X } from 'lucide-react';

interface StudentSessionPopupProps {
  rating: number;
  notes: string;
  onClose: () => void;
}

export function StudentSessionPopup({ rating, notes, onClose }: StudentSessionPopupProps) {
  // Parse notes to extract surah/ayah info
  const lines = notes ? notes.split('\n') : [];
  const startLine = lines.find(l => l.startsWith('بدأ من:'));
  const endLine = lines.find(l => l.startsWith('انتهى عند:'));
  const notesLine = lines.find(l => l.startsWith('ملاحظات:'));
  const reciterNotes = notesLine ? notesLine.replace('ملاحظات:', '').trim() : '';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.95 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed inset-0 z-[999] flex items-center justify-center px-5"
        dir="rtl"
      >
        <div
          className="p-0.5 rounded-3xl shadow-2xl w-full max-w-sm"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
        >
          <div className="bg-card rounded-3xl p-6 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full opacity-10 blur-xl" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }} />
            <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full opacity-10 blur-lg" style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--primary)))" }} />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute left-4 top-4 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center z-10"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <div className="text-center relative z-10 space-y-4">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h3 className="text-xl font-bold text-foreground">أحسنت! 🎉</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  لقد أتممت جلسة تلاوة بنجاح، بارك الله في جهودك!
                </p>
              </motion.div>

              {/* Session details card */}
              {(rating > 0 || startLine || endLine || reciterNotes) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="rounded-2xl border border-border bg-background/60 p-4 space-y-3 text-right"
                >
                  {/* Rating */}
                  {rating > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">تقييم المقرئ</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-5 h-5 ${s <= rating ? 'fill-gold text-gold' : 'text-border'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  {startLine && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        بدأ من
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {startLine.replace('بدأ من:', '').trim()}
                      </span>
                    </div>
                  )}

                  {endLine && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        انتهى عند
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {endLine.replace('انتهى عند:', '').trim()}
                      </span>
                    </div>
                  )}

                  {/* Reciter notes */}
                  {reciterNotes && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        ملاحظات المقرئ
                      </span>
                      <p className="text-sm text-foreground bg-card rounded-lg p-2.5 border border-border leading-relaxed">
                        {reciterNotes}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Motivational message */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                واصل مسيرتك في حفظ القرآن الكريم والتزم بخطتك الأسبوعية 📖✨
              </motion.p>

              {/* Button */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
              >
                رائع! بارك الله فيك 🎊
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
