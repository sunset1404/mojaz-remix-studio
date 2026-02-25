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
    <div className="absolute bottom-28 left-3 right-3 z-40" dir="rtl">
      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/25 transition-colors mb-2 mr-auto"
        whileTap={{ scale: 0.95 }}
      >
        <FileText className="w-4 h-4" />
        ملاحظات الجلسة
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-black/70 backdrop-blur-xl rounded-2xl p-4 space-y-4 border border-white/10 max-h-[50vh] overflow-y-auto"
          >
            {/* Rating */}
            <div className="space-y-2">
              <label className="text-white/80 text-xs font-medium">تقييم الجلسة</label>
              <div className="flex gap-1 justify-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      setRating(star);
                      updateData({ rating: star });
                    }}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-white/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Start point */}
            <div className="space-y-2">
              <label className="text-white/80 text-xs font-medium">بدأ من</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="السورة"
                  value={startSurah}
                  onChange={(e) => {
                    setStartSurah(e.target.value);
                    updateData({ startSurah: e.target.value });
                  }}
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
                <input
                  type="text"
                  placeholder="الآية"
                  value={startAyah}
                  onChange={(e) => {
                    setStartAyah(e.target.value);
                    updateData({ startAyah: e.target.value });
                  }}
                  className="w-20 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* End point */}
            <div className="space-y-2">
              <label className="text-white/80 text-xs font-medium">انتهى عند</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="السورة"
                  value={endSurah}
                  onChange={(e) => {
                    setEndSurah(e.target.value);
                    updateData({ endSurah: e.target.value });
                  }}
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
                <input
                  type="text"
                  placeholder="الآية"
                  value={endAyah}
                  onChange={(e) => {
                    setEndAyah(e.target.value);
                    updateData({ endAyah: e.target.value });
                  }}
                  className="w-20 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-white/80 text-xs font-medium">ملاحظات</label>
              <textarea
                placeholder="ملاحظات على أداء الطالب..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  updateData({ notes: e.target.value });
                }}
                rows={2}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
