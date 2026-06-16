export interface RubricItem {
  id: string;
  label: string;
  max: number;
}

export interface RubricCategory {
  id: string;
  label: string;
  weightLabel: string; // e.g. "40%"
  total: number;
  color: "primary" | "gold" | "emerald" | "indigo";
  items: RubricItem[];
}

export const EXAM_RUBRIC: RubricCategory[] = [
  {
    id: "hifz",
    label: "الحفظ",
    weightLabel: "40%",
    total: 40,
    color: "primary",
    items: [
      { id: "hifz_itqan", label: "إتقان الحفظ", max: 30 },
      { id: "hifz_mutashabihat", label: "ضبط المتشابهات", max: 10 },
    ],
  },
  {
    id: "tajweed",
    label: "التجويد",
    weightLabel: "20%",
    total: 20,
    color: "gold",
    items: [
      { id: "tj_makharij", label: "مخارج الحروف", max: 4 },
      { id: "tj_sifat_aradiyya", label: "الصفات العرضية", max: 4 },
      { id: "tj_sifat_dhatiyya", label: "الصفات الذاتية", max: 4 },
      { id: "tj_waqf", label: "الوقف والابتداء", max: 4 },
      { id: "tj_matn", label: "إظهار متون التجويد", max: 4 },
    ],
  },
  {
    id: "ada",
    label: "الأداء",
    weightLabel: "20%",
    total: 20,
    color: "emerald",
    items: [
      { id: "ad_hamz", label: "تحقيق الهمز وإحكام السواكن", max: 4 },
      { id: "ad_nabr", label: "التسوية بين النظائر / النبر والتصوير الأدائي", max: 4 },
      { id: "ad_azmina", label: "أزمنة الحروف وضبط الأنفاس بين الجمل", max: 4 },
      { id: "ad_mad", label: "إخلاص حروف المد وإتمام الحركات", max: 4 },
      { id: "ad_tafkhim", label: "بيان الشدات / مراتب التفخيم وتخليص الحروف", max: 4 },
    ],
  },
  {
    id: "riwaya",
    label: "الرواية",
    weightLabel: "20%",
    total: 20,
    color: "indigo",
    items: [
      { id: "rw_khilaf", label: "ضبط الخلاف أصولاً وفرشاً", max: 10 },
      { id: "rw_shawahid", label: "استحضار الشواهد", max: 5 },
      { id: "rw_shatibiyya", label: "حفظ أصول الشاطبية", max: 5 },
    ],
  },
];

export const RUBRIC_TOTAL = 100;
export const RUBRIC_PASS = 70;

export function computeCategoryScore(catId: string, scores: Record<string, number>): number {
  const cat = EXAM_RUBRIC.find((c) => c.id === catId);
  if (!cat) return 0;
  return cat.items.reduce((sum, it) => sum + (Number(scores[it.id]) || 0), 0);
}

export function computeTotalScore(scores: Record<string, number>): number {
  return EXAM_RUBRIC.reduce((sum, c) => sum + computeCategoryScore(c.id, scores), 0);
}

export function rubricToNotesText(scores: Record<string, number>): string {
  const lines: string[] = [];
  EXAM_RUBRIC.forEach((cat) => {
    const catScore = computeCategoryScore(cat.id, scores);
    lines.push(`• ${cat.label} (${catScore}/${cat.total})`);
    cat.items.forEach((it) => {
      const v = Number(scores[it.id]) || 0;
      lines.push(`   - ${it.label}: ${v}/${it.max}`);
    });
  });
  const total = computeTotalScore(scores);
  lines.push(`الدرجة الكلية: ${total}/${RUBRIC_TOTAL} ${total >= RUBRIC_PASS ? "(مقبول)" : "(غير مقبول)"}`);
  return lines.join("\n");
}
