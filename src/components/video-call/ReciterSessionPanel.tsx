import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp, FileText, BookOpen } from 'lucide-react';
import { SurahSelect } from './SurahSelect';
import { AyahSelect } from './AyahSelect';

interface ReciterSessionPanelProps {
  onDataChange?: (data: SessionNoteData) => void;
}

export interface SessionNoteData {
  rating: number;
  startSurah: string;
  startAyah: string;
  endSurah: string;
  endAyah: string;
  notes: string;
}

export function ReciterSessionPanel({ onDataChange }: ReciterSessionPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [startSurah, setStartSurah] = useState('');
  const [startAyah, setStartAyah] = useState('');
  const [endSurah, setEndSurah] = useState('');
  const [endAyah, setEndAyah] = useState('');
  const [notes, setNotes] = useState('');
  const [startMaxAyahs, setStartMaxAyahs] = useState(0);
  const [endMaxAyahs, setEndMaxAyahs] = useState(0);

  const updateData = (updates: Partial<SessionNoteData>) => {
    const data: SessionNoteData = {
      rating: updates.rating ?? rating,
      startSurah: updates.startSurah ?? startSurah,
      startAyah: updates.startAyah ?? startAyah,
      endSurah: updates.endSurah ?? endSurah,
      endAyah: updates.endAyah ?? endAyah,
      notes: updates.notes ?? notes,
    };
    onDataChange?.(data);
  };

  return (
    <div className="absolute bottom-28 left-3 right-3 z-[60]" dir="rtl">
      {/* Toggle */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="mr-auto mb-2 flex items-center gap-2 rounded-xl border border-primary/25 bg-card shadow-md px-4 py-2.5 text-sm font-semibold text-foreground backdrop-blur-sm"
        whileTap={{ scale: 0.96 }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        ملاحظات الجلسة
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl max-h-[55vh] overflow-y-auto"
          >
            {/* Top gradient bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))" }}
            />

            <div className="p-5 space-y-5">
              {/* Rating */}
              <div className="space-y-2">
                <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-gold" />
                  تقييم الجلسة
                </label>
                <div className="flex gap-1.5 justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        updateData({ rating: star });
                      }}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-all ${
                          star <= rating
                            ? 'fill-gold text-gold drop-shadow-sm'
                            : 'text-border hover:text-gold/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Start point */}
              <div className="space-y-2">
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
                      updateData({ startSurah: name });
                    }}
                  />
                  <AyahSelect
                    value={startAyah}
                    max={startMaxAyahs}
                    onChange={(v) => {
                      setStartAyah(v);
                      updateData({ startAyah: v });
                    }}
                  />
                </div>
              </div>

              {/* End point */}
              <div className="space-y-2">
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
                      updateData({ endSurah: name });
                    }}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={endMaxAyahs || undefined}
                    placeholder="الآية"
                    value={endAyah}
                    onChange={(e) => {
                      setEndAyah(e.target.value);
                      updateData({ endAyah: e.target.value });
                    }}
                    className="w-20 rounded-xl border border-border bg-background px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  ملاحظات
                </label>
                <textarea
                  placeholder="ملاحظات على أداء الطالب..."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    updateData({ notes: e.target.value });
                  }}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
