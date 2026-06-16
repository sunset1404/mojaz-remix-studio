import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText, BookOpen, ClipboardList } from 'lucide-react';
import { SurahSelect } from './SurahSelect';
import { AyahSelect } from './AyahSelect';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { RubricScoring } from './RubricScoring';
import { computeTotalScore, RUBRIC_PASS } from '@/data/examRubric';

interface ReciterSessionPanelProps {
  onDataChange?: (data: SessionNoteData) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideToggle?: boolean;
}

export interface SessionNoteData {
  rating: number;
  scores: Record<string, number>;
  startSurah: string;
  startAyah: string;
  endSurah: string;
  endAyah: string;
  notes: string;
}

export function ReciterSessionPanel({ onDataChange, isOpen: controlledOpen, onOpenChange, hideToggle }: ReciterSessionPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const [scores, setScores] = useState<Record<string, number>>({});
  const [startSurah, setStartSurah] = useState('');
  const [startAyah, setStartAyah] = useState('');
  const [endSurah, setEndSurah] = useState('');
  const [endAyah, setEndAyah] = useState('');
  const [notes, setNotes] = useState('');
  const [startMaxAyahs, setStartMaxAyahs] = useState(0);
  const [endMaxAyahs, setEndMaxAyahs] = useState(0);
  const { keyboardHeight, height: vvHeight } = useVisualViewport();
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll focused inputs into view when keyboard opens
  useEffect(() => {
    if (keyboardHeight > 0) {
      const t = setTimeout(() => {
        const el = document.activeElement as HTMLElement | null;
        if (el && panelRef.current?.contains(el)) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(t);
    }
  }, [keyboardHeight]);

  const updateData = (updates: Partial<SessionNoteData>) => {
    const nextScores = updates.scores ?? scores;
    const total = computeTotalScore(nextScores);
    const data: SessionNoteData = {
      rating: Math.max(0, Math.min(5, Math.round((total / 100) * 5))),
      scores: nextScores,
      startSurah: updates.startSurah ?? startSurah,
      startAyah: updates.startAyah ?? startAyah,
      endSurah: updates.endSurah ?? endSurah,
      endAyah: updates.endAyah ?? endAyah,
      notes: updates.notes ?? notes,
    };
    onDataChange?.(data);
  };


  return (
    <div
      ref={panelRef}
      className="absolute left-3 right-3 z-[60] transition-[bottom] duration-200"
      style={{ bottom: `calc(5rem + ${keyboardHeight}px)` }}
      dir="rtl"
    >
      {/* Toggle (hidden when controlled from outside, e.g. control bar button) */}
      {!hideToggle && (
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
      )}


      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl overflow-y-auto"
            style={{ maxHeight: Math.max(220, vvHeight - 180) }}
          >
            {/* Top gradient bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))" }}
            />

            <div className="p-4 space-y-4">
              {/* Rubric scoring */}
              <div className="space-y-2">
                <label className="text-foreground text-xs font-semibold flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-primary" />
                  معايير التقييم
                </label>
                <RubricScoring
                  scores={scores}
                  onChange={(s) => {
                    setScores(s);
                    updateData({ scores: s });
                  }}
                />
              </div>


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
                  <AyahSelect
                    value={endAyah}
                    max={endMaxAyahs}
                    onChange={(v) => {
                      setEndAyah(v);
                      updateData({ endAyah: v });
                    }}
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
