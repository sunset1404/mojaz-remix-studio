import { describe, expect, it } from "vitest";
import {
  buildUnifiedStudentMetrics,
  parseSessionDurationMinutes,
  type UnifiedSessionRecord,
  type UnifiedVideoCall,
} from "./studentAchievementMetrics";

const studentId = "student-1";

describe("student achievement metrics", () => {
  it("deduplicates repeated historical session rows", () => {
    const records: UnifiedSessionRecord[] = [
      {
        id: "a",
        user_id: studentId,
        date: "2026-08-31",
        time: "09:44",
        duration: "14 دقيقة",
        status: "مكتملة",
        created_at: "2026-08-31T06:44:30.896Z",
      },
      {
        id: "b",
        user_id: studentId,
        date: "2026-08-31",
        time: "09:44",
        duration: "14 دقيقة",
        status: "مكتملة",
        created_at: "2026-08-31T06:44:31.133Z",
      },
    ];

    const metric = buildUnifiedStudentMetrics(records, [], []).get(studentId)!;

    expect(metric.sessions).toBe(1);
    expect(metric.completed).toBe(1);
    expect(metric.minutes).toBe(14);
    expect(metric.duplicateRecordsIgnored).toBe(1);
  });

  it("counts every distinct manual progress entry as a completed session", () => {
    const records: UnifiedSessionRecord[] = [
      {
        id: "manual-1",
        user_id: studentId,
        date: "2026-09-01",
        time: "20:00",
        duration: "25 دقيقة",
        status: "مكتملة",
        notes: "بدأ من: البقرة آية 1\nانتهى عند: البقرة آية 40",
        created_at: "2026-09-01T17:00:00.000Z",
      },
      {
        id: "manual-2",
        user_id: studentId,
        date: "2026-09-01",
        time: "20:00",
        duration: "25 دقيقة",
        status: "مكتملة",
        notes: "بدأ من: البقرة آية 41\nانتهى عند: البقرة آية 80",
        created_at: "2026-09-01T17:00:30.000Z",
      },
    ];

    const metric = buildUnifiedStudentMetrics(records, [], []).get(studentId)!;

    expect(metric.sessions).toBe(2);
    expect(metric.completed).toBe(2);
    expect(metric.minutes).toBe(50);
    expect(metric.duplicateRecordsIgnored).toBe(0);
  });

  it("uses the real call duration when it matches the saved session", () => {
    const records: UnifiedSessionRecord[] = [
      {
        id: "record",
        user_id: studentId,
        date: "2026-10-05",
        time: "10:35",
        duration: "530 ساعة و 21 دقيقة",
        status: "مكتملة",
        created_at: "2026-10-05T07:35:39.826Z",
      },
    ];
    const calls: UnifiedVideoCall[] = [
      {
        id: "call",
        student_id: studentId,
        status: "ended",
        started_at: "2026-10-05T07:10:00.000Z",
        ended_at: "2026-10-05T07:35:38.000Z",
        created_at: "2026-10-05T07:09:00.000Z",
      },
    ];

    const metric = buildUnifiedStudentMetrics(records, calls, []).get(studentId)!;

    expect(metric.sessions).toBe(1);
    expect(metric.minutes).toBeCloseTo(25.63, 1);
    expect(metric.invalidDurationsIgnored).toBe(0);
  });

  it("ignores absurd historical durations when no real call can verify them", () => {
    expect(parseSessionDurationMinutes("530 ساعة و 21 دقيقة")).toBe(0);

    const metric = buildUnifiedStudentMetrics(
      [{
        id: "bad",
        user_id: studentId,
        date: "2026-09-08",
        time: "16:31",
        duration: "530 ساعة و 21 دقيقة",
        status: "مكتملة",
        created_at: "2026-09-08T08:31:20.463Z",
      }],
      [],
      [],
    ).get(studentId)!;

    expect(metric.sessions).toBe(1);
    expect(metric.completed).toBe(1);
    expect(metric.minutes).toBe(0);
    expect(metric.invalidDurationsIgnored).toBe(1);
  });

  it("adds a real completed call that has no historical session row", () => {
    const calls: UnifiedVideoCall[] = [
      {
        id: "call-only",
        student_id: studentId,
        status: "ended",
        started_at: "2026-10-01T06:00:00.000Z",
        ended_at: "2026-10-01T06:20:00.000Z",
        created_at: "2026-10-01T05:59:00.000Z",
      },
    ];

    const metric = buildUnifiedStudentMetrics([], calls, []).get(studentId)!;

    expect(metric.sessions).toBe(1);
    expect(metric.completed).toBe(1);
    expect(metric.minutes).toBe(20);
  });

  it("derives Quran pages and completed juz from the furthest historical endpoint", () => {
    const records: UnifiedSessionRecord[] = [
      {
        id: "q1",
        user_id: studentId,
        date: "2026-10-04",
        time: "08:36",
        duration: "13 دقيقة",
        status: "مكتملة",
        notes: "بدأ من: الإسراء آية 1\nانتهى عند: الإسراء آية 40",
        created_at: "2026-10-04T05:36:22.406Z",
      },
      {
        id: "q2",
        user_id: studentId,
        date: "2026-10-05",
        time: "09:01",
        duration: "30 دقيقة",
        status: "مكتملة",
        notes: "بدأ من: الإسراء آية 40\nانتهى عند: الإسراء آية 80",
        created_at: "2026-10-05T06:01:36.750Z",
      },
    ];

    const metric = buildUnifiedStudentMetrics(records, [], []).get(studentId)!;

    expect(metric.pages).toBeGreaterThan(250);
    expect(metric.pages).toBeLessThanOrEqual(604);
    expect(metric.parts).toBeGreaterThan(10);
    expect(metric.parts).toBeLessThanOrEqual(30);
  });

  it("counts certificates from the same source for every page", () => {
    const metric = buildUnifiedStudentMetrics([], [], [
      { user_id: studentId, created_at: "2026-01-01T00:00:00Z" },
      { user_id: studentId, created_at: "2026-02-01T00:00:00Z" },
    ]).get(studentId)!;

    expect(metric.certificates).toBe(2);
  });
});
