// Create Payment Edge Function
// Creates a payment record in payment_invoice_metadata with server-validated amount

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Price lookup for extra hours packages
const HOUR_PACKAGES: Record<number, number> = {
  1: 15,
  3: 40,
  5: 60,
  10: 100,
};

async function handler(req: Request): Promise<Response> {
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      source_type,
      plan_name,
      duration_months,
      metadata = {},
      hours,
      package_label,
    } = body;

    if (!source_type || !plan_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: source_type, plan_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side price validation
    let amountSar = 0;

    if (source_type === "extra_hours") {
      // Validate hours package price
      const h = Number(hours);
      if (!HOUR_PACKAGES[h]) {
        return new Response(
          JSON.stringify({ error: "Invalid hours package" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      amountSar = HOUR_PACKAGES[h];
    } else if (source_type === "subscription" || source_type === "gift") {
      // Look up plan price from database
      const months = Number(duration_months) || 1;
      const priceColumn = months >= 12 ? "price_yearly" : "price_monthly";

      // Try subscription_plans first
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select(`name, price_monthly, price_yearly`)
        .eq("name", plan_name)
        .eq("is_active", true)
        .maybeSingle();

      if (plan) {
        amountSar = months >= 12
          ? (plan.price_yearly || plan.price_monthly * 12)
          : plan.price_monthly;
      } else if (source_type === "gift") {
        // Try gift_plans
        const { data: giftPlan } = await supabase
          .from("gift_plans")
          .select("name, price")
          .eq("name", plan_name)
          .eq("is_active", true)
          .maybeSingle();

        if (giftPlan) {
          amountSar = giftPlan.price;
        }
      }

      if (amountSar <= 0) {
        return new Response(
          JSON.stringify({ error: "Plan not found or invalid price" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid source_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending payment to avoid duplicates
    const { data: existing } = await supabase
      .from("payment_invoice_metadata")
      .select("id, amount_sar")
      .eq("user_id", userId)
      .eq("source_type", source_type)
      .eq("amount_sar", amountSar)
      .eq("status", "pending")
      .eq("processed", false)
      .maybeSingle();

    if (existing) {
      console.log("Returning existing pending payment:", existing.id);
      return new Response(
        JSON.stringify({
          payment_ref: existing.id,
          amount_sar: existing.amount_sar,
          metadata: { ...metadata, plan_name, duration_months },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new payment metadata record
    const paymentMetadata = {
      ...metadata,
      plan_name,
      duration_months: duration_months || 1,
      source_type,
      ...(hours ? { hours } : {}),
      ...(package_label ? { package_label } : {}),
    };

    const { data: record, error } = await supabase
      .from("payment_invoice_metadata")
      .insert({
        user_id: userId,
        source_type,
        amount_sar: amountSar,
        metadata: paymentMetadata,
        status: "pending",
        processed: false,
      })
      .select("id, amount_sar")
      .single();

    if (error) {
      console.error("Failed to create payment metadata:", error);
      throw error;
    }

    console.log("Payment created:", record.id, "amount:", amountSar, "SAR");

    return new Response(
      JSON.stringify({
        payment_ref: record.id,
        amount_sar: record.amount_sar,
        metadata: paymentMetadata,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create payment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

serve(handler);
