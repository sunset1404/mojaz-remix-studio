import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, BookOpen, FileText, CheckCircle2, X } from 'lucide-react';
import { SessionNoteData } from './ReciterSessionPanel';

interface SessionConfirmDialogProps {
  data: SessionNoteData;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SessionConfirmDialog({ data, onConfirm, onCancel }: SessionConfirmDialogProps) {
  const hasData = data.rating > 0 || data.startSurah || data.endSurah || data.notes;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Gradient top */}
        <div
          className="h-2 w-full"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))" }}
        />

        <div className="p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--gold) / 0.15))" }}>
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">تأكيد بيانات الجلسة</h3>
            <p className="text-sm text-muted-foreground">راجع البيانات قبل حفظها</p>
          </div>

          {hasData ? (
            <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
              {/* Rating */}
              {data.rating > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">التقييم</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${s <= data.rating ? 'fill-gold text-gold' : 'text-border'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Start */}
              {(data.startSurah || data.startAyah) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    بدأ من
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {data.startSurah} {data.startAyah && `- آية ${data.startAyah}`}
                  </span>
                </div>
              )}

              {/* End */}
              {(data.endSurah || data.endAyah) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    انتهى عند
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {data.endSurah} {data.endAyah && `- آية ${data.endAyah}`}
                  </span>
                </div>
              )}

              {/* Notes */}
              {data.notes && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    ملاحظات
                  </span>
                  <p className="text-sm text-foreground bg-card rounded-lg p-2 border border-border">
                    {data.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background/60 p-6 text-center">
              <p className="text-sm text-muted-foreground">لم يتم تسجيل أي ملاحظات للجلسة</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 shadow-lg"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
            >
              تأكيد وإنهاء
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
