import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { computeExpectedAmount, SourceType } from "../_shared/payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function nowIso(): string {
  return new Date().toISOString();
}

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const sourceType = body?.source_type as SourceType;
    if (!sourceType) {
      return new Response(JSON.stringify({ error: "Missing source_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metaInput = typeof body?.metadata === "object" && body?.metadata ? body.metadata : {};
    const planName = body?.plan_name || metaInput?.plan_name || metaInput?.planName;
    const durationMonths = body?.duration_months || metaInput?.duration_months;
    const hours = body?.hours || metaInput?.hours;
    const packageLabel = body?.package_label || metaInput?.package_label;

    const expected = await computeExpectedAmount({
      source_type: sourceType,
      plan_name: planName,
      duration_months: durationMonths,
      hours,
      package_label: packageLabel,
    });

    const normalizedMetadata: Record<string, any> = {
      ...metaInput,
      ...expected.metadata,
    };

    if (sourceType === "gift") {
      if (!normalizedMetadata.recipient_name || !normalizedMetadata.recipient_phone) {
        return new Response(JSON.stringify({ error: "Missing gift recipient details" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      normalizedMetadata.gift_code = normalizedMetadata.gift_code || generateGiftCode();
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: row, error: insertError } = await supabaseAdmin
      .from("payment_invoice_metadata")
      .insert({
        user_id: userData.user.id,
        source_type: sourceType,
        amount_sar: expected.amount_sar,
        metadata: normalizedMetadata,
        status: "pending",
        processed: false,
        updated_at: nowIso(),
      })
      .select("id")
      .single();

    if (insertError || !row) {
      return new Response(JSON.stringify({ error: "Failed to create payment record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        payment_ref: row.id,
        amount_sar: expected.amount_sar,
        metadata: normalizedMetadata,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
