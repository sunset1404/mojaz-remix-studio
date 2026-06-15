import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, BookOpen } from 'lucide-react';
import { SURAHS } from '@/data/surahs';

interface SurahSelectProps {
  value: string;
  onChange: (surahName: string, maxAyahs: number) => void;
  placeholder?: string;
}

export function SurahSelect({ value, onChange, placeholder = "اختر السورة" }: SurahSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 320, openUp: false });

  const filtered = search
    ? SURAHS.filter(s => s.name.includes(search) || String(s.id).includes(search))
    : SURAHS;

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const spaceBelow = vh - r.bottom - 12;
      const spaceAbove = r.top - 12;
      const desired = 320;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(180, Math.min(desired, openUp ? spaceAbove : spaceBelow));
      setPos({
        top: openUp ? Math.max(8, r.top - maxHeight - 4) : r.bottom + 4,
        left: r.left,
        width: r.width,
        maxHeight,
        openUp,
      });
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex-1 flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground hover:border-primary/40 transition-colors"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
          style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 220), maxHeight: pos.maxHeight }}
          dir="rtl"
        >
          {/* Search */}
          <div className="p-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن السورة..."
                className="w-full pr-8 pl-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">لا توجد نتائج</div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.name, s.ayahs);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-primary/10 ${
                    value === s.name ? 'bg-primary/15 text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{s.id}</span>
                  </span>
                  <span className="flex-1 text-right">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.ayahs} آية</span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
