import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp, FileText } from 'lucide-react';

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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="mr-auto mb-2 flex items-center gap-2 rounded-xl border border-primary/20 bg-card/95 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur"
        whileTap={{ scale: 0.96 }}
      >
        <FileText className="w-4 h-4 text-primary" />
        ملاحظات الجلسة
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-xl backdrop-blur-xl max-h-[52vh] overflow-y-auto"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))" }}
            />

            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-foreground/80 text-xs font-medium">تقييم الجلسة</label>
                <div className="flex gap-1 justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => {
                        setRating(star);
                        updateData({ rating: star });
                      }}
                      className="p-0.5"
                      type="button"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= rating ? 'fill-gold text-gold' : 'text-muted-foreground/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-foreground/80 text-xs font-medium">بدأ من</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="السورة"
                    value={startSurah}
                    onChange={(e) => {
                      setStartSurah(e.target.value);
                      updateData({ startSurah: e.target.value });
                    }}
                    className="flex-1 rounded-lg border border-border bg-background/70 px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    placeholder="الآية"
                    value={startAyah}
                    onChange={(e) => {
                      setStartAyah(e.target.value);
                      updateData({ startAyah: e.target.value });
                    }}
                    className="w-20 rounded-lg border border-border bg-background/70 px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-foreground/80 text-xs font-medium">انتهى عند</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="السورة"
                    value={endSurah}
                    onChange={(e) => {
                      setEndSurah(e.target.value);
                      updateData({ endSurah: e.target.value });
                    }}
                    className="flex-1 rounded-lg border border-border bg-background/70 px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    placeholder="الآية"
                    value={endAyah}
                    onChange={(e) => {
                      setEndAyah(e.target.value);
                      updateData({ endAyah: e.target.value });
                    }}
                    className="w-20 rounded-lg border border-border bg-background/70 px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-foreground/80 text-xs font-medium">ملاحظات</label>
                <textarea
                  placeholder="ملاحظات على أداء الطالب..."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    updateData({ notes: e.target.value });
                  }}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background/70 px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
