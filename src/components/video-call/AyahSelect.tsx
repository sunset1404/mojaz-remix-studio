import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';

interface AyahSelectProps {
  value: string;
  max: number;
  onChange: (ayah: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AyahSelect({ value, max, onChange, placeholder = "الآية", disabled }: AyahSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 320, openUp: false });

  const ayahs = max > 0 ? Array.from({ length: max }, (_, i) => i + 1) : [];
  const filtered = search ? ayahs.filter(n => String(n).includes(search)) : ayahs;

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const spaceBelow = vh - r.bottom - 12;
      const spaceAbove = r.top - 12;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(180, Math.min(320, openUp ? spaceAbove : spaceBelow));
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

  const isDisabled = disabled || max <= 0;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        className="w-24 flex items-center justify-between gap-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 140), maxHeight: pos.maxHeight }}
          dir="rtl"
        >
          <div className="p-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                inputMode="numeric"
                value={search}
                onChange={(e) => setSearch(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="رقم الآية..."
                className="w-full pr-8 pl-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">لا توجد نتائج</div>
            ) : (
              filtered.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    onChange(String(n));
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-sm text-right transition-colors hover:bg-primary/10 ${
                    value === String(n) ? 'bg-primary/15 text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  آية {n}
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
