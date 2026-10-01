import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { processMoyasarPayment } from "../_shared/payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-internal-secret",
};

const MOYASAR_API_BASE = Deno.env.get("MOYASAR_API_BASE") ?? "https://api.moyasar.com/v1";
const MOYASAR_SECRET_KEY =
  Deno.env.get("MOYASSAR_SECRET_KEY") ?? Deno.env.get("MOYASAR_SECRET_KEY") ?? "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function basicAuthHeader(secretKey: string): string {
  return "Basic " + btoa(`${secretKey}:`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!MOYASAR_SECRET_KEY) return json({ error: "Moyasar secret key is not configured" }, 503);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    const providedSecret = req.headers.get("x-internal-secret") || "";
    const { data: tokenRow, error: tokenError } = await db
      .from("internal_task_tokens")
      .select("token")
      .eq("name", "subscription-payment-reconcile")
      .maybeSingle();

    if (tokenError || !tokenRow?.token || providedSecret !== tokenRow.token) {
      return json({ error: "Unauthorized" }, 401);
    }

    const cutoff = new Date(Date.now() - 45 * 86400_000).toISOString();
    const { data: rows, error: rowsError } = await db
      .from("payment_invoice_metadata")
      .select("id,user_id,amount_sar,status,processed,moyassar_payment_id,created_at")
      .eq("source_type", "subscription")
      .eq("processed", false)
      .in("status", ["pending", "failed"])
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(200);

    if (rowsError) throw rowsError;

    let checked = 0;
    let recovered = 0;
    let paidNotRecovered = 0;
    let lookupFailures = 0;

    for (const row of rows || []) {
      checked += 1;

      const url = new URL(`${MOYASAR_API_BASE}/payments`);
      url.searchParams.set("metadata[payment_ref]", row.id);

      const response = await fetch(url.toString(), {
        headers: { Authorization: basicAuthHeader(MOYASAR_SECRET_KEY) },
      });

      if (!response.ok) {
        lookupFailures += 1;
        continue;
      }

      const payload = await response.json();
      const payments = Array.isArray(payload?.payments) ? payload.payments : [];
      const expectedHalalas = Math.round(Number(row.amount_sar || 0) * 100);

      const paid = payments
        .filter((payment: any) =>
          ["paid", "captured"].includes(String(payment?.status || "")) &&
          String(payment?.currency || "SAR").toUpperCase() === "SAR" &&
          Number(payment?.amount) === expectedHalalas
        )
        .sort((a: any, b: any) =>
          new Date(b?.updated_at || b?.created_at || 0).getTime() -
          new Date(a?.updated_at || a?.created_at || 0).getTime()
        )[0];

      if (!paid?.id) continue;

      try {
        const result = await processMoyasarPayment({
          payment_id: String(paid.id),
          payment_ref: row.id,
          expected_user_id: row.user_id,
          allow_payment_id_recovery: true,
        });

        if (result?.success) recovered += 1;
        else paidNotRecovered += 1;
      } catch (error) {
        console.error("subscription reconciliation failed", row.id, error);
        paidNotRecovered += 1;
      }
    }

    return json({
      success: true,
      checked,
      recovered,
      paid_not_recovered: paidNotRecovered,
      lookup_failures: lookupFailures,
    });
  } catch (error) {
    console.error("reconcile-subscription-payments error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
