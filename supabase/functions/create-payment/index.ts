// Create Payment Edge Function
// Creates a payment record in payment_invoice_metadata before redirecting to Moyassar

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreatePaymentRequest {
  user_id: string;
  source_type: "subscription" | "gift" | "extra_hours";
  amount_sar: number;
  metadata: Record<string, any>;
}

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreatePaymentRequest = await req.json();
    const { user_id, source_type, amount_sar, metadata } = body;

    if (!user_id || !source_type || !amount_sar) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, source_type, amount_sar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending payment with same parameters to avoid duplicates
    const { data: existing } = await supabase
      .from("payment_invoice_metadata")
      .select("id")
      .eq("user_id", user_id)
      .eq("source_type", source_type)
      .eq("amount_sar", amount_sar)
      .eq("status", "pending")
      .eq("processed", false)
      .maybeSingle();

    if (existing) {
      console.log("Returning existing pending payment:", existing.id);
      return new Response(
        JSON.stringify({ success: true, payment_metadata_id: existing.id, duplicate: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new payment metadata record
    const { data: record, error } = await supabase
      .from("payment_invoice_metadata")
      .insert({
        user_id,
        source_type,
        amount_sar,
        metadata: metadata || {},
        status: "pending",
        processed: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create payment metadata:", error);
      throw error;
    }

    console.log("Payment metadata created:", record.id);

    return new Response(
      JSON.stringify({ success: true, payment_metadata_id: record.id }),
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
