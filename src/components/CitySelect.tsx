import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  cities: string[];
  placeholder?: string;
  className?: string;
}

const CitySelect = ({ value, onChange, cities, placeholder = "اختر المدينة", className = "" }: CitySelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = cities.filter((c) => c.includes(search));

  const handleOpen = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setSearch("");
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      handleClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? handleClose() : handleOpen())}
        className={`w-full h-12 rounded-xl border border-primary/20 bg-card px-3 flex items-center justify-between text-sm shadow-sm transition-colors focus:border-primary ${className}`}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] border border-primary/20 rounded-xl shadow-xl overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: pos.width, backgroundColor: 'white' }}
        >
          <div className="p-2 border-b border-border/50 bg-white">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="ابحث عن مدينة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pr-8 pl-3 rounded-lg border border-border/50 bg-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1 bg-white">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground text-center">لا توجد نتائج</li>
            ) : (
              filtered.map((c) => (
                <li
                  key={c}
                  onClick={() => { onChange(c); handleClose(); setSearch(""); }}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-primary/10 ${value === c ? "bg-primary/15 text-primary font-semibold" : "text-foreground"}`}
                >
                  {c}
                </li>
              ))
            )}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
};

export default CitySelect;
