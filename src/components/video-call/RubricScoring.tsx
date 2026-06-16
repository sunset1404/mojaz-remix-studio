import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Award } from "lucide-react";
import {
  EXAM_RUBRIC,
  RUBRIC_PASS,
  RUBRIC_TOTAL,
  computeCategoryScore,
  computeTotalScore,
  RubricCategory,
} from "@/data/examRubric";

interface RubricScoringProps {
  scores: Record<string, number>;
  onChange: (scores: Record<string, number>) => void;
  compact?: boolean;
}

const colorMap: Record<RubricCategory["color"], { bg: string; text: string; ring: string; dot: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/30", dot: "bg-primary" },
  gold: { bg: "bg-gold/10", text: "text-gold", ring: "ring-gold/30", dot: "bg-gold" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/30", dot: "bg-emerald-500" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", ring: "ring-indigo-500/30", dot: "bg-indigo-500" },
};

export function RubricScoring({ scores, onChange, compact }: RubricScoringProps) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EXAM_RUBRIC.map((c, i) => [c.id, i === 0]))
  );

  const total = computeTotalScore(scores);
  const passed = total >= RUBRIC_PASS;
  const pct = Math.min(100, Math.round((total / RUBRIC_TOTAL) * 100));

  const setItem = (id: string, max: number, val: string) => {
    let n = parseInt(val, 10);
    if (isNaN(n) || n < 0) n = 0;
    if (n > max) n = max;
    onChange({ ...scores, [id]: n });
  };

  const toggle = (id: string) => setOpenCats((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-3" dir="rtl">
      {/* Total score header */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border p-4"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--gold) / 0.08))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}>
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">الدرجة الكلية</div>
              <div className="text-foreground font-bold text-lg leading-tight">
                {total}<span className="text-muted-foreground text-sm font-medium">/{RUBRIC_TOTAL}</span>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            passed ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"
          }`}>
            {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {passed ? "مقبول" : `نسبة القبول ${RUBRIC_PASS}%`}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))" }}
          />
        </div>
      </div>

      {/* Categories */}
      {EXAM_RUBRIC.map((cat) => {
        const c = colorMap[cat.color];
        const catScore = computeCategoryScore(cat.id, scores);
        const isOpen = !!openCats[cat.id];
        return (
          <div key={cat.id} className={`rounded-2xl border border-border bg-card overflow-hidden`}>
            <button
              type="button"
              onClick={() => toggle(cat.id)}
              className={`w-full flex items-center justify-between gap-2 p-3 ${c.bg}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span className={`font-bold text-sm ${c.text}`}>{cat.label}</span>
                <span className="text-[10px] text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded-md">
                  {cat.weightLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {catScore}<span className="text-muted-foreground font-medium">/{cat.total}</span>
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={`p-3 space-y-2 ${compact ? "" : ""}`}>
                    {cat.items.map((it) => {
                      const val = Number(scores[it.id]) || 0;
                      const itemPct = it.max ? (val / it.max) * 100 : 0;
                      return (
                        <div
                          key={it.id}
                          className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-2.5"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium text-foreground leading-tight line-clamp-2">
                              {it.label}
                            </div>
                            <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.dot} transition-all`}
                                style={{ width: `${itemPct}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={it.max}
                              value={scores[it.id] ?? ""}
                              onChange={(e) => setItem(it.id, it.max, e.target.value)}
                              placeholder="0"
                              className={`w-12 text-center rounded-lg border border-border bg-card px-1 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 ${c.ring}`}
                            />
                            <span className="text-[11px] text-muted-foreground font-semibold">/{it.max}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
