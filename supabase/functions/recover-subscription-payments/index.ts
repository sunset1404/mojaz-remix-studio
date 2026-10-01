import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { processMoyasarPayment } from "../_shared/payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const token = authHeader.slice(7);
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userError || !userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data: rows, error: rowsError } = await admin
      .from("payment_invoice_metadata")
      .select("id,amount_sar,status,processed,moyassar_payment_id,created_at")
      .eq("user_id", userId)
      .eq("source_type", "subscription")
      .eq("processed", false)
      .in("status", ["pending", "failed"])
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(25);

    if (rowsError) throw rowsError;

    let recovered = 0;
    let checked = 0;
    const errors: string[] = [];

    for (const row of rows || []) {
      checked += 1;

      const url = new URL(`${MOYASAR_API_BASE}/payments`);
      url.searchParams.set("metadata[payment_ref]", row.id);

      const moyasarRes = await fetch(url.toString(), {
        headers: { Authorization: basicAuthHeader(MOYASAR_SECRET_KEY) },
      });

      if (!moyasarRes.ok) {
        errors.push(`lookup_failed:${row.id}`);
        continue;
      }

      const payload = await moyasarRes.json();
      const payments = Array.isArray(payload?.payments) ? payload.payments : [];
      const expectedHalalas = Math.round(Number(row.amount_sar || 0) * 100);

      const paid = payments
        .filter((payment: any) =>
          ["paid", "captured"].includes(String(payment?.status || "")) &&
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
          expected_user_id: userId,
          allow_payment_id_recovery: true,
        });

        if (result?.success) recovered += 1;
      } catch (error) {
        console.error("recover-subscription-payments failed", row.id, error);
        errors.push(`process_failed:${row.id}`);
      }
    }

    return json({
      success: true,
      checked,
      recovered,
      has_errors: errors.length > 0,
    });
  } catch (error) {
    console.error("recover-subscription-payments error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
