import { SURAHS } from "@/data/surahs";

export interface UnifiedSessionRecord {
  id?: string;
  user_id: string;
  date?: string | null;
  time?: string | null;
  duration?: string | null;
  status?: string | null;
  notes?: string | null;
  pages_reached?: number | null;
  parts_reached?: number | null;
  created_at?: string | null;
}

export interface UnifiedVideoCall {
  id?: string;
  student_id: string;
  status?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string | null;
}

export interface UnifiedCertificate {
  user_id: string;
  created_at?: string | null;
}

export interface StudentMetricEvent {
  id: string;
  studentId: string;
  date: string;
  completed: boolean;
  minutes: number;
  source: "session_record" | "video_call";
}

export interface UnifiedStudentMetrics {
  studentId: string;
  sessions: number;
  completed: number;
  minutes: number;
  pages: number;
  parts: number;
  certificates: number;
  events: StudentMetricEvent[];
  duplicateRecordsIgnored: number;
  invalidDurationsIgnored: number;
}

const PAGE_STARTS = [
0, 1, 8, 13, 24, 32, 37, 45, 56, 65, 69, 77, 84, 91, 96, 101, 109, 113, 120, 127, 134, 142, 149, 153, 161, 171, 177,
  184, 189, 194, 198, 204, 210, 218, 223, 227, 232, 238, 241, 245, 253, 256, 260, 264, 267, 272, 277, 282, 289, 290,
  294, 303, 309, 316, 323, 331, 339, 346, 355, 364, 371, 377, 385, 394, 402, 409, 415, 426, 434, 442, 447, 451, 459,
  467, 474, 480, 488, 494, 500, 505, 508, 513, 517, 520, 527, 531, 538, 545, 553, 559, 568, 573, 580, 585, 588, 595,
  599, 607, 615, 621, 628, 634, 641, 648, 656, 664, 669, 672, 675, 679, 683, 687, 693, 701, 706, 711, 715, 720, 727,
  734, 740, 746, 752, 759, 765, 773, 778, 783, 790, 798, 808, 817, 825, 834, 842, 849, 858, 863, 871, 880, 884, 891,
  900, 908, 914, 921, 927, 932, 936, 941, 947, 955, 966, 977, 985, 992, 998, 1006, 1012, 1022, 1028, 1036, 1042, 1050,
  1059, 1075, 1085, 1092, 1098, 1104, 1110, 1114, 1118, 1125, 1133, 1142, 1150, 1161, 1169, 1177, 1186, 1194, 1201,
  1206, 1213, 1222, 1230, 1236, 1242, 1249, 1256, 1262, 1267, 1272, 1276, 1283, 1290, 1297, 1304, 1308, 1315, 1322,
  1329, 1335, 1342, 1347, 1353, 1358, 1365, 1371, 1379, 1385, 1390, 1398, 1407, 1418, 1426, 1435, 1443, 1453, 1462,
  1471, 1479, 1486, 1493, 1502, 1511, 1519, 1527, 1536, 1545, 1555, 1562, 1571, 1582, 1591, 1601, 1611, 1619, 1627,
  1634, 1640, 1649, 1660, 1666, 1675, 1683, 1692, 1700, 1708, 1713, 1721, 1726, 1736, 1742, 1750, 1756, 1761, 1769,
  1775, 1784, 1793, 1803, 1818, 1834, 1854, 1873, 1893, 1908, 1916, 1928, 1936, 1944, 1956, 1966, 1974, 1981, 1989,
  1995, 2004, 2012, 2020, 2030, 2037, 2047, 2057, 2068, 2079, 2088, 2096, 2105, 2116, 2126, 2134, 2145, 2156, 2161,
  2168, 2175, 2186, 2194, 2202, 2215, 2224, 2238, 2251, 2262, 2276, 2289, 2302, 2315, 2327, 2346, 2361, 2386, 2400,
  2413, 2425, 2436, 2447, 2462, 2474, 2484, 2494, 2508, 2519, 2528, 2541, 2556, 2565, 2574, 2585, 2596, 2601, 2611,
  2619, 2626, 2634, 2642, 2651, 2660, 2668, 2674, 2691, 2701, 2716, 2733, 2748, 2763, 2778, 2792, 2802, 2812, 2819,
  2823, 2828, 2835, 2845, 2850, 2853, 2858, 2867, 2876, 2888, 2899, 2911, 2923, 2933, 2952, 2972, 2993, 3016, 3044,
  3069, 3092, 3116, 3139, 3160, 3173, 3182, 3195, 3204, 3215, 3223, 3236, 3248, 3258, 3266, 3274, 3281, 3288, 3296,
  3303, 3312, 3323, 3330, 3337, 3347, 3355, 3364, 3371, 3379, 3386, 3393, 3404, 3415, 3425, 3434, 3442, 3451, 3460,
  3470, 3481, 3489, 3498, 3504, 3515, 3524, 3534, 3540, 3549, 3556, 3564, 3569, 3577, 3584, 3588, 3596, 3607, 3614,
  3621, 3629, 3638, 3646, 3655, 3664, 3672, 3679, 3691, 3699, 3705, 3718, 3733, 3746, 3760, 3776, 3789, 3813, 3840,
  3865, 3891, 3915, 3942, 3971, 3987, 3997, 4013, 4032, 4054, 4064, 4069, 4080, 4090, 4099, 4106, 4115, 4126, 4133,
  4141, 4150, 4159, 4167, 4174, 4183, 4192, 4200, 4211, 4219, 4230, 4239, 4248, 4257, 4265, 4273, 4283, 4288, 4295,
  4304, 4317, 4324, 4336, 4348, 4359, 4373, 4386, 4399, 4415, 4433, 4454, 4474, 4487, 4496, 4506, 4516, 4525, 4531,
  4539, 4546, 4557, 4565, 4575, 4584, 4593, 4599, 4607, 4612, 4617, 4624, 4631, 4646, 4666, 4682, 4706, 4727, 4750,
  4767, 4785, 4811, 4829, 4853, 4874, 4896, 4918, 4942, 4969, 4996, 5030, 5056, 5079, 5087, 5094, 5100, 5105, 5111,
  5116, 5126, 5130, 5136, 5143, 5151, 5156, 5162, 5169, 5178, 5186, 5193, 5200, 5209, 5218, 5223, 5230, 5237, 5242,
  5254, 5268, 5287, 5314, 5332, 5358, 5386, 5415, 5430, 5448, 5461, 5476, 5495, 5513, 5543, 5571, 5597, 5617, 5642,
  5673, 5703, 5728, 5759, 5801, 5830, 5855, 5883, 5910, 5932, 5964, 5994, 6017, 6044, 6073, 6099, 6126, 6138, 6156,
  6177, 6194, 6208, 6222, 6237
] as const;

const JUZ_STARTS = [
0, 1, 149, 260, 386, 517, 641, 751, 900, 1042, 1201, 1328, 1479, 1649, 1803, 2030, 2215, 2484, 2674, 2876, 3215, 3386,
  3564, 3733, 4090, 4265, 4511, 4706, 5105, 5242, 5673, 6237
] as const;

const MAX_REASONABLE_SESSION_MINUTES = 8 * 60;
const DUPLICATE_WINDOW_MS = 90 * 1000;
const CALL_MATCH_WINDOW_MS = 3 * 60 * 1000;

const normalizeDigits = (value: string) =>
  String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));

const normalizeArabic = (value: string) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

const surahNameToId = new Map(
  SURAHS.flatMap((surah) => {
    const normalized = normalizeArabic(surah.name);
    const withoutAl = normalized.startsWith("ال") ? normalized.slice(2) : normalized;
    return [
      [normalized, surah.id] as const,
      [withoutAl, surah.id] as const,
    ];
  }),
);

const surahStartAyahId = (() => {
  const starts = new Map<number, number>();
  let ayahId = 1;
  for (const surah of SURAHS) {
    starts.set(surah.id, ayahId);
    ayahId += surah.ayahs;
  }
  return starts;
})();

const metricNumber = (value: unknown) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export function parseSessionDurationMinutes(value?: string | null) {
  const normalized = normalizeDigits(String(value || "")).trim();
  if (!normalized) return 0;

  const hours = normalized.match(/(\d+(?:\.\d+)?)\s*(?:ساعة|ساعه|hour|hours|hr|hrs)/i);
  const mins = normalized.match(/(\d+(?:\.\d+)?)\s*(?:دقيقة|دقيقه|minute|minutes|min|mins)/i);
  let total = 0;
  if (hours) total += Number(hours[1]) * 60;
  if (mins) total += Number(mins[1]);

  if (!hours && !mins) {
    const clock = normalized.match(/^(\d{1,3}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (clock) {
      total = clock[3] !== undefined
        ? Number(clock[1]) * 60 + Number(clock[2]) + Number(clock[3]) / 60
        : Number(clock[1]) * 60 + Number(clock[2]);
    } else {
      const numeric = Number(normalized.replace(/[^0-9.]/g, ""));
      total = Number.isFinite(numeric) ? numeric : 0;
    }
  }

  if (!Number.isFinite(total) || total < 0 || total > MAX_REASONABLE_SESSION_MINUTES) return 0;
  return total;
}

function callMinutes(call: UnifiedVideoCall) {
  if (!call.started_at || !call.ended_at) return 0;
  const start = new Date(call.started_at).getTime();
  const end = new Date(call.ended_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const minutes = (end - start) / 60000;
  return minutes <= MAX_REASONABLE_SESSION_MINUTES ? minutes : 0;
}

function callEndedAt(call: UnifiedVideoCall) {
  if (!call.ended_at) return 0;
  const value = new Date(call.ended_at).getTime();
  return Number.isFinite(value) ? value : 0;
}

function recordCreatedAt(record: UnifiedSessionRecord) {
  if (!record.created_at) return 0;
  const value = new Date(record.created_at).getTime();
  return Number.isFinite(value) ? value : 0;
}

function recordSignature(record: UnifiedSessionRecord) {
  // Progress content is part of the signature so two intentional manual
  // achievement entries on the same day/time are not collapsed together.
  // Exact duplicate submits still collapse inside the short duplicate window.
  return [
    record.user_id,
    record.date || "",
    record.time || "",
    normalizeDigits(record.duration || ""),
    normalizeArabic(record.notes || ""),
    metricNumber(record.pages_reached),
    metricNumber(record.parts_reached),
  ].join("|");
}

function canonicalizeSessionRecords(records: UnifiedSessionRecord[]) {
  const sorted = [...records].sort((a, b) => recordCreatedAt(a) - recordCreatedAt(b));
  const groups: Array<{
    signature: string;
    firstAt: number;
    lastAt: number;
    preferred: UnifiedSessionRecord;
    count: number;
  }> = [];

  for (const record of sorted) {
    const signature = recordSignature(record);
    const createdAt = recordCreatedAt(record);
    const previous = groups[groups.length - 1];

    if (
      previous &&
      previous.signature === signature &&
      createdAt > 0 &&
      previous.lastAt > 0 &&
      createdAt - previous.lastAt <= DUPLICATE_WINDOW_MS
    ) {
      previous.lastAt = createdAt;
      previous.count += 1;
      const previousQuality =
        Number(Boolean(previous.preferred.notes)) +
        Number(metricNumber(previous.preferred.pages_reached) > 0) +
        Number(metricNumber(previous.preferred.parts_reached) > 0);
      const currentQuality =
        Number(Boolean(record.notes)) +
        Number(metricNumber(record.pages_reached) > 0) +
        Number(metricNumber(record.parts_reached) > 0);
      if (currentQuality > previousQuality) previous.preferred = record;
      continue;
    }

    groups.push({
      signature,
      firstAt: createdAt,
      lastAt: createdAt,
      preferred: record,
      count: 1,
    });
  }

  return groups;
}

function toGlobalAyahId(surahId: number, ayah: number) {
  const surah = SURAHS.find((item) => item.id === surahId);
  const start = surahStartAyahId.get(surahId);
  if (!surah || !start || ayah < 1 || ayah > surah.ayahs) return null;
  return start + ayah - 1;
}

function parseEndpoint(value: string) {
  const normalized = normalizeDigits(value);
  const match = normalized.match(/^(.+?)\s+آي(?:ة|ه)\s+(\d+)/);
  if (!match) return null;

  const name = normalizeArabic(match[1]);
  const withoutAl = name.startsWith("ال") ? name.slice(2) : name;
  const surahId = surahNameToId.get(name) || surahNameToId.get(withoutAl);
  const ayah = Number(match[2]);
  if (!surahId || !Number.isFinite(ayah)) return null;

  return toGlobalAyahId(surahId, ayah);
}

function furthestAyahFromNotes(notes?: string | null) {
  if (!notes) return 0;
  const normalized = normalizeDigits(notes);
  const endMatch = normalized.match(/انتهى\s+عند:\s*([^\n]+)/);
  if (!endMatch) return 0;
  return parseEndpoint(endMatch[1].trim()) || 0;
}

function boundaryIndex(boundaries: readonly number[], ayahId: number) {
  let low = 1;
  let high = boundaries.length - 1;
  let answer = 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (boundaries[mid] <= ayahId) {
      answer = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return answer;
}

function completedBoundaryCount(boundaries: readonly number[], ayahId: number, maxValue: number) {
  if (ayahId <= 0) return 0;
  const current = Math.min(maxValue, Math.max(1, boundaryIndex(boundaries, ayahId)));
  const nextBoundary = boundaries[current + 1];
  const completed = nextBoundary && ayahId >= nextBoundary - 1 ? current : current - 1;
  return Math.min(maxValue, Math.max(0, completed));
}

function calculateQuranProgress(records: UnifiedSessionRecord[]) {
  let explicitPages = 0;
  let explicitParts = 0;
  let furthestAyahId = 0;

  for (const record of records) {
    if (record.status && record.status !== "مكتملة") continue;
    explicitPages = Math.max(explicitPages, metricNumber(record.pages_reached));
    explicitParts = Math.max(explicitParts, metricNumber(record.parts_reached));
    furthestAyahId = Math.max(furthestAyahId, furthestAyahFromNotes(record.notes));
  }

  const historicalPages = furthestAyahId
    ? completedBoundaryCount(PAGE_STARTS, furthestAyahId, 604)
    : 0;
  const historicalParts = furthestAyahId
    ? completedBoundaryCount(JUZ_STARTS, furthestAyahId, 30)
    : 0;

  return {
    pages: Math.min(604, Math.max(explicitPages, historicalPages)),
    parts: Math.min(30, Math.max(explicitParts, historicalParts)),
  };
}

export function buildUnifiedStudentMetrics(
  sessionRecords: UnifiedSessionRecord[],
  calls: UnifiedVideoCall[],
  certificates: UnifiedCertificate[],
) {
  const studentIds = new Set<string>();
  sessionRecords.forEach((row) => studentIds.add(row.user_id));
  calls.forEach((row) => studentIds.add(row.student_id));
  certificates.forEach((row) => studentIds.add(row.user_id));

  const metrics = new Map<string, UnifiedStudentMetrics>();

  for (const studentId of studentIds) {
    const rawRecords = sessionRecords.filter((row) => row.user_id === studentId);
    const canonicalGroups = canonicalizeSessionRecords(rawRecords);
    const canonicalRecords = canonicalGroups.map((group) => group.preferred);
    const studentCalls = calls
      .filter((call) => call.student_id === studentId)
      .filter((call) => call.started_at && call.ended_at && callMinutes(call) > 0);
    const studentCertificates = certificates.filter((row) => row.user_id === studentId);

    const usedCalls = new Set<string>();
    const events: StudentMetricEvent[] = [];
    let invalidDurationsIgnored = 0;

    canonicalGroups.forEach((group, index) => {
      const record = group.preferred;
      const createdAt = group.firstAt || recordCreatedAt(record);
      let bestCall: UnifiedVideoCall | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const call of studentCalls) {
        const callId = call.id || `${call.student_id}:${call.ended_at}`;
        if (usedCalls.has(callId)) continue;
        const endedAt = callEndedAt(call);
        if (!createdAt || !endedAt) continue;
        const distance = Math.abs(createdAt - endedAt);
        if (distance <= CALL_MATCH_WINDOW_MS && distance < bestDistance) {
          bestDistance = distance;
          bestCall = call;
        }
      }

      let minutes = 0;
      if (bestCall) {
        minutes = callMinutes(bestCall);
        usedCalls.add(bestCall.id || `${bestCall.student_id}:${bestCall.ended_at}`);
      } else {
        minutes = parseSessionDurationMinutes(record.duration);
        if (record.duration && minutes === 0 && /\d/.test(normalizeDigits(record.duration))) {
          invalidDurationsIgnored += 1;
        }
      }

      const completed = !record.status || record.status === "مكتملة";
      events.push({
        id: record.id || `record:${studentId}:${index}:${group.firstAt}`,
        studentId,
        date: record.date || record.created_at?.slice(0, 10) || "",
        completed,
        minutes: completed ? minutes : 0,
        source: "session_record",
      });
    });

    for (const call of studentCalls) {
      const callId = call.id || `${call.student_id}:${call.ended_at}`;
      if (usedCalls.has(callId)) continue;
      const minutes = callMinutes(call);
      if (minutes <= 0) continue;
      events.push({
        id: callId,
        studentId,
        date: (call.started_at || call.created_at || "").slice(0, 10),
        completed: true,
        minutes,
        source: "video_call",
      });
    }

    const quran = calculateQuranProgress(canonicalRecords);
    metrics.set(studentId, {
      studentId,
      sessions: events.length,
      completed: events.filter((event) => event.completed).length,
      minutes: events.reduce((sum, event) => sum + event.minutes, 0),
      pages: quran.pages,
      parts: quran.parts,
      certificates: studentCertificates.length,
      events: events.sort((a, b) => a.date.localeCompare(b.date)),
      duplicateRecordsIgnored: canonicalGroups.reduce((sum, group) => sum + Math.max(0, group.count - 1), 0),
      invalidDurationsIgnored,
    });
  }

  return metrics;
}

export function emptyStudentMetrics(studentId: string): UnifiedStudentMetrics {
  return {
    studentId,
    sessions: 0,
    completed: 0,
    minutes: 0,
    pages: 0,
    parts: 0,
    certificates: 0,
    events: [],
    duplicateRecordsIgnored: 0,
    invalidDurationsIgnored: 0,
  };
}
