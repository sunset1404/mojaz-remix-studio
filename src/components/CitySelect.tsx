import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

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
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = cities.filter((c) => c.includes(search));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-12 rounded-xl border border-primary/20 bg-card px-3 flex items-center justify-between text-sm shadow-sm transition-colors focus:border-primary"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-primary/20 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="ابحث عن مدينة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pr-8 pl-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground text-center">لا توجد نتائج</li>
            ) : (
              filtered.map((c) => (
                <li
                  key={c}
                  onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-primary/10 ${value === c ? "bg-primary/15 text-primary font-semibold" : "text-foreground"}`}
                >
                  {c}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CitySelect;
