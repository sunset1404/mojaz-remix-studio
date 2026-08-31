import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ReciterPickerOption {
  user_id: string;
  full_name: string;
  gender?: string | null;
  status?: string | null;
}

interface Props {
  reciters: ReciterPickerOption[];
  value?: string | null;
  onChange: (userId: string) => void;
  placeholder?: string;
  className?: string;
}

export const ReciterPicker = ({ reciters, value, onChange, placeholder = "اختر المقرئ", className }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = reciters.find((r) => r.user_id === value);
  const q = query.trim();
  const filtered = q ? reciters.filter((r) => (r.full_name || "").includes(q)) : reciters;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs",
            className
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.full_name || placeholder}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0 z-[100]">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم المقرئ أو المقرئة..."
              className="h-8 pr-7 text-xs"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground text-center">لا توجد نتائج</div>
          ) : (
            filtered.map((r) => (
              <button
                key={r.user_id}
                type="button"
                onClick={() => { onChange(r.user_id); setOpen(false); setQuery(""); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-right"
              >
                <Check className={cn("w-3.5 h-3.5 shrink-0", value === r.user_id ? "opacity-100 text-primary" : "opacity-0")} />
                <span className="flex-1 truncate text-right">{r.full_name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {r.gender === "female" || r.gender === "أنثى" ? "مقرئة" : "مقرئ"}
                  {r.status && r.status !== "approved" ? " • غير معتمد" : ""}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
