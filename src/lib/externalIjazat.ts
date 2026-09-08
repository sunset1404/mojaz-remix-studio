// Read-only integration with the external ijaza (licenses) system.
// We only read data and render the original certificate HTML as-is.
const IQRAA_URL = "https://grawyggtjajrgllelgrj.supabase.co";
const IQRAA_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYXd5Z2d0amFqcmdsbGVsZ3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTA1ODksImV4cCI6MjA3MjI4NjU4OX0.W4B1BM8_jhf1om8bAiR83r8EDCwv0iApPZBZ3WNzHI0";

export type ExternalIjaza = {
  id: string;
  student_name: string;
  student_email: string | null;
  student_phone: string | null;
  license_number: string;
  issue_date: string;
  status: string;
  notes: string | null;
  barcode_data: string | null;
  qiraa: string | null;
  riwaya: string | null;
};

export const externalIjazaViewUrl = (code: string) =>
  `${IQRAA_URL}/functions/v1/certificate-view?code=${encodeURIComponent(code)}`;

export async function fetchExternalIjazat(): Promise<ExternalIjaza[]> {
  const select =
    "id,student_name,student_email,student_phone,license_number,issue_date,status,notes,barcode_data,reciter_licenses(qiraa,riwaya)";
  const res = await fetch(
    `${IQRAA_URL}/rest/v1/student_licenses?select=${encodeURIComponent(select)}&order=issue_date.desc`,
    { headers: { apikey: IQRAA_ANON_KEY, Authorization: `Bearer ${IQRAA_ANON_KEY}` } }
  );
  if (!res.ok) throw new Error("failed to load external ijazat");
  const rows = (await res.json()) as any[];
  return rows.map((r) => ({
    id: r.id,
    student_name: r.student_name,
    student_email: r.student_email ?? null,
    student_phone: r.student_phone ?? null,
    license_number: r.license_number,
    issue_date: r.issue_date,
    status: r.status,
    notes: r.notes ?? null,
    barcode_data: r.barcode_data ?? null,
    qiraa: r.reciter_licenses?.qiraa ?? null,
    riwaya: r.reciter_licenses?.riwaya ?? null,
  }));
}

export async function fetchExternalIjazaHtml(code: string): Promise<string> {
  const res = await fetch(externalIjazaViewUrl(code));
  if (!res.ok) throw new Error("failed to load ijaza html");
  return await res.text();
}
