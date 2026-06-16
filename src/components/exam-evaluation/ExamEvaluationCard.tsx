import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Award, CheckCircle2, XCircle, Download, Eye, Calendar, User as UserIcon, BookOpen, FileText } from "lucide-react";
import { EXAM_RUBRIC, computeCategoryScore, RUBRIC_PASS, RUBRIC_TOTAL } from "@/data/examRubric";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ExamEvaluation {
  id: string;
  exam_id: string | null;
  student_id: string;
  student_name: string | null;
  reciter_id: string;
  reciter_name: string | null;
  exam_type: string | null;
  scores: Record<string, number>;
  total_score: number;
  passed: boolean;
  start_surah: string | null;
  start_ayah: string | null;
  end_surah: string | null;
  end_ayah: string | null;
  notes: string | null;
  created_at: string;
}

function examTypeLabel(t: string | null) {
  if (t === "admission") return "اختبار قبول";
  if (t === "eligibility") return "اختبار استحقاق";
  return "اختبار";
}

export function ExamEvaluationCard({ ev }: { ev: ExamEvaluation }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        dir="rtl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--gold) / 0.15))" }}
            >
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-foreground text-sm truncate">{examTypeLabel(ev.exam_type)}</h4>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(ev.created_at).toLocaleDateString("ar-EG")}
              </p>
            </div>
          </div>
          <div
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
              ev.passed ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"
            }`}
          >
            {ev.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {ev.total_score}/{RUBRIC_TOTAL}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {EXAM_RUBRIC.map((cat) => {
            const v = computeCategoryScore(cat.id, ev.scores || {});
            return (
              <div key={cat.id} className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{cat.label}</span>
                  <span className="text-[11px] font-bold text-foreground">
                    {v}/{cat.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            استعراض
          </button>
          <button
            onClick={() => downloadPdf(ev)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
          >
            <Download className="w-3.5 h-3.5" />
            تحميل PDF
          </button>
        </div>
      </motion.div>

      <EvaluationDialog open={open} onOpenChange={setOpen} ev={ev} />
    </>
  );
}

function EvaluationDialog({ open, onOpenChange, ev }: { open: boolean; onOpenChange: (v: boolean) => void; ev: ExamEvaluation }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0" dir="rtl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-center">تقييم {examTypeLabel(ev.exam_type)}</DialogTitle>
        </DialogHeader>
        <div ref={ref} id={`eval-pdf-${ev.id}`} className="p-5 space-y-4 bg-card">
          <EvaluationSheet ev={ev} />
        </div>
        <div className="p-4 border-t">
          <button
            onClick={() => downloadPdf(ev)}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
          >
            <Download className="w-4 h-4" />
            تحميل PDF
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EvaluationSheet({ ev }: { ev: ExamEvaluation }) {
  return (
    <div dir="rtl" className="space-y-4">
      <div
        className="rounded-2xl p-5 text-center text-white"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))" }}
      >
        <Award className="w-10 h-10 mx-auto mb-2 opacity-90" />
        <h3 className="text-lg font-bold">{examTypeLabel(ev.exam_type)}</h3>
        <p className="text-xs opacity-90 mt-1">{new Date(ev.created_at).toLocaleString("ar-EG")}</p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
          {ev.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="font-bold">
            {ev.total_score}/{RUBRIC_TOTAL} • {ev.passed ? "مقبول" : "غير مقبول"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {ev.student_name && (
          <div className="rounded-lg bg-muted/40 px-3 py-2 flex items-center gap-2">
            <UserIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">الطالب:</span>
            <span className="font-semibold text-foreground truncate">{ev.student_name}</span>
          </div>
        )}
        {ev.reciter_name && (
          <div className="rounded-lg bg-muted/40 px-3 py-2 flex items-center gap-2">
            <UserIcon className="w-3.5 h-3.5 text-gold" />
            <span className="text-muted-foreground">المقرئ:</span>
            <span className="font-semibold text-foreground truncate">{ev.reciter_name}</span>
          </div>
        )}
      </div>

      {EXAM_RUBRIC.map((cat) => {
        const catTotal = computeCategoryScore(cat.id, ev.scores || {});
        const pct = (catTotal / cat.total) * 100;
        return (
          <div key={cat.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-foreground">
                {cat.label} <span className="text-[10px] text-muted-foreground">({cat.weightLabel})</span>
              </h4>
              <span className="text-sm font-bold text-primary">
                {catTotal}/{cat.total}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))",
                }}
              />
            </div>
            <div className="space-y-1">
              {cat.items.map((it) => {
                const v = Number(ev.scores?.[it.id]) || 0;
                return (
                  <div key={it.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{it.label}</span>
                    <span className="font-semibold text-foreground">
                      {v}/{it.max}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {(ev.start_surah || ev.end_surah) && (
        <div className="rounded-xl border border-border p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            مقطع الاختبار
          </div>
          {ev.start_surah && (
            <p className="text-muted-foreground">
              بدأ من: <span className="text-foreground font-semibold">{ev.start_surah} - آية {ev.start_ayah}</span>
            </p>
          )}
          {ev.end_surah && (
            <p className="text-muted-foreground">
              انتهى عند: <span className="text-foreground font-semibold">{ev.end_surah} - آية {ev.end_ayah}</span>
            </p>
          )}
        </div>
      )}

      {ev.notes && (
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center gap-1.5 font-bold text-foreground mb-1.5 text-xs">
            <FileText className="w-3.5 h-3.5 text-primary" />
            ملاحظات
          </div>
          <p className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{ev.notes}</p>
        </div>
      )}
    </div>
  );
}

async function downloadPdf(ev: ExamEvaluation) {
  const { default: jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  // Render an offscreen element to capture
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-10000px;top:0;width:480px;background:#fff;padding:20px;";
  container.dir = "rtl";
  document.body.appendChild(container);

  // Use ReactDOM render via portal-like injection — simpler: build static HTML mimic
  container.innerHTML = buildPrintHtml(ev);

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW - 20;
    const imgH = (canvas.height * imgW) / canvas.width;
    let heightLeft = imgH;
    let position = 10;
    pdf.addImage(imgData, "PNG", 10, position, imgW, imgH);
    heightLeft -= pageH - 20;
    while (heightLeft > 0) {
      pdf.addPage();
      position = heightLeft - imgH + 10;
      pdf.addImage(imgData, "PNG", 10, position, imgW, imgH);
      heightLeft -= pageH - 20;
    }
    pdf.save(`evaluation-${ev.student_name || ev.student_id}-${ev.id.slice(0, 6)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function buildPrintHtml(ev: ExamEvaluation): string {
  const rows = EXAM_RUBRIC.map((cat) => {
    const catTotal = computeCategoryScore(cat.id, ev.scores || {});
    const items = cat.items
      .map(
        (it) =>
          `<tr><td style="padding:4px 8px;color:#555;font-size:11px;">${it.label}</td><td style="padding:4px 8px;text-align:left;font-weight:700;font-size:11px;">${
            Number(ev.scores?.[it.id]) || 0
          }/${it.max}</td></tr>`
      )
      .join("");
    return `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:10px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:13px;color:#111;">${cat.label} <span style="color:#888;font-size:10px;">(${cat.weightLabel})</span></strong>
          <strong style="color:#0f766e;">${catTotal}/${cat.total}</strong>
        </div>
        <table style="width:100%;border-collapse:collapse;">${items}</table>
      </div>`;
  }).join("");

  const passColor = ev.passed ? "#10b981" : "#ef4444";
  const passLabel = ev.passed ? "مقبول" : "غير مقبول";

  return `
    <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#111;">
      <div style="background:linear-gradient(135deg,#14b8a6,#f59e0b);color:#fff;padding:20px;border-radius:16px;text-align:center;">
        <h2 style="margin:0;font-size:18px;">${examTypeLabel(ev.exam_type)}</h2>
        <p style="margin:6px 0 10px;font-size:11px;opacity:.9;">${new Date(ev.created_at).toLocaleString("ar-EG")}</p>
        <div style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.2);border-radius:999px;font-weight:700;">
          ${ev.total_score}/${RUBRIC_TOTAL} • ${passLabel}
        </div>
      </div>
      <div style="display:flex;gap:8px;margin:12px 0;font-size:11px;">
        ${ev.student_name ? `<div style="flex:1;background:#f3f4f6;padding:8px;border-radius:8px;"><b>الطالب:</b> ${ev.student_name}</div>` : ""}
        ${ev.reciter_name ? `<div style="flex:1;background:#f3f4f6;padding:8px;border-radius:8px;"><b>المقرئ:</b> ${ev.reciter_name}</div>` : ""}
      </div>
      ${rows}
      ${
        ev.start_surah || ev.end_surah
          ? `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:10px;margin-bottom:10px;font-size:11px;">
              <b>مقطع الاختبار</b><br/>
              ${ev.start_surah ? `بدأ من: ${ev.start_surah} - آية ${ev.start_ayah}<br/>` : ""}
              ${ev.end_surah ? `انتهى عند: ${ev.end_surah} - آية ${ev.end_ayah}` : ""}
            </div>`
          : ""
      }
      ${ev.notes ? `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:10px;font-size:11px;"><b>ملاحظات</b><br/><span style="color:#555;white-space:pre-wrap;">${ev.notes}</span></div>` : ""}
      <p style="text-align:center;color:#888;font-size:10px;margin-top:14px;">— تقييم رسمي صادر من تطبيق إقراء —</p>
    </div>`;
}
