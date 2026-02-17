import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { COUNTRY_CODES } from "@/data/countries";

interface PhoneCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const codesToCountries: Record<string, string[]> = {};
Object.entries(COUNTRY_CODES).forEach(([country, code]) => {
  if (!codesToCountries[code]) codesToCountries[code] = [];
  codesToCountries[code].push(country);
});

const uniqueCodes = [...new Set(Object.values(COUNTRY_CODES))].sort();

const PhoneCodeSelect = ({ value, onChange }: PhoneCodeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = uniqueCodes.filter((code) => {
    if (code.includes(search)) return true;
    const countries = codesToCountries[code] || [];
    return countries.some((c) => c.includes(search));
  });

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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-12 w-24 rounded-xl border border-primary/20 bg-card px-2 flex items-center justify-between text-xs font-semibold text-foreground shadow-sm transition-colors focus:border-primary"
        dir="ltr"
      >
        <span>{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="fixed z-50 w-48 bg-card border border-primary/20 rounded-xl shadow-lg overflow-hidden" dir="ltr"
          style={{ top: ref.current ? ref.current.getBoundingClientRect().bottom + 4 : 0, left: ref.current ? ref.current.getBoundingClientRect().left : 0 }}>
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="ابحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/50 bg-background text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <ul className="max-h-40 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted-foreground text-center">لا توجد نتائج</li>
            ) : (
              filtered.map((code) => (
                <li
                  key={code}
                  onClick={() => { onChange(code); setOpen(false); setSearch(""); }}
                  className={`px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-primary/10 ${value === code ? "bg-primary/15 text-primary font-bold" : "text-foreground"}`}
                >
                  {code}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PhoneCodeSelect;
