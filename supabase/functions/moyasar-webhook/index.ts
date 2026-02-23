// Moyasar Webhook Edge Function
// Receives payment status updates from Moyasar and processes them

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-moyasar-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MOYASAR_WEBHOOK_SECRET = Deno.env.get("MOYASAR_WEBHOOK_SECRET") ?? "";
const ALLOW_INSECURE = Deno.env.get("MOYASAR_ALLOW_INSECURE_WEBHOOKS") === "true";

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function verifySignature(payload: string, signature: string): Promise<boolean> {
  if (!MOYASAR_WEBHOOK_SECRET) {
    if (ALLOW_INSECURE) {
      console.warn("⚠️ Skipping signature verification (MOYASAR_ALLOW_INSECURE_WEBHOOKS=true)");
      return true;
    }
    console.error("MOYASAR_WEBHOOK_SECRET not configured");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(MOYASAR_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const computed = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computed === signature;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
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
    const rawBody = await req.text();
    const signature = req.headers.get("x-moyasar-signature") || "";

    // Verify webhook signature (unless insecure mode for testing)
    if (!ALLOW_INSECURE && !(await verifySignature(rawBody, signature))) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);
    console.log("Webhook event received:", event.type, event.data?.id);

    // We only care about payment.paid events
    if (event.type !== "payment.paid" && event.data?.status !== "paid") {
      // For failed payments, update metadata
      if (event.data?.id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("payment_invoice_metadata")
          .update({ status: event.data.status || "failed", updated_at: new Date().toISOString() })
          .eq("moyassar_payment_id", event.data.id);
      }

      return new Response(JSON.stringify({ received: true, action: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = event.data;
    const paymentId = payment.id;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already processed
    const { data: existingMetadata } = await supabase
      .from("payment_invoice_metadata")
      .select("id, processed, user_id, source_type, metadata, amount_sar")
      .eq("moyassar_payment_id", paymentId)
      .maybeSingle();

    if (!existingMetadata) {
      console.log("No matching payment_invoice_metadata for payment:", paymentId);
      return new Response(
        JSON.stringify({ received: true, action: "no_matching_record" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingMetadata.processed) {
      console.log("Payment already processed:", paymentId);
      return new Response(
        JSON.stringify({ received: true, action: "already_processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process the payment based on source_type
    const { user_id, source_type, metadata: meta, amount_sar } = existingMetadata;
    const paymentMetadata = (meta as Record<string, any>) || {};

    if (source_type === "subscription") {
      const startDate = new Date();
      const months = paymentMetadata.duration_months || 1;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);

      await supabase.from("student_subscriptions").insert({
        student_id: user_id,
        student_name: paymentMetadata.student_name || "طالب",
        student_phone: paymentMetadata.student_phone || null,
        subscription_type: paymentMetadata.subscription_type || paymentMetadata.plan_name,
        amount: amount_sar,
        duration_months: months,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        status: "active",
        notes: `تم الاشتراك عبر الدفع الإلكتروني - ${paymentMetadata.plan_name || ""}`,
      });

      await supabase.from("transactions").insert({
        user_id,
        title: `اشتراك ${paymentMetadata.plan_name || ""}`,
        date: startDate.toISOString().split("T")[0],
        amount: `${amount_sar}`,
        status: "مكتمل",
      });
    } else if (source_type === "gift") {
      const giftCode = generateGiftCode();
      await supabase.from("gift_subscriptions").insert({
        sender_id: user_id,
        recipient_name: paymentMetadata.recipient_name,
        recipient_phone: paymentMetadata.recipient_phone,
        personal_message: paymentMetadata.personal_message || null,
        plan_id: paymentMetadata.plan_id,
        plan_name: paymentMetadata.plan_name,
        duration_months: paymentMetadata.duration_months || 1,
        amount: amount_sar,
        gift_code: giftCode,
        status: "pending",
      });

      await supabase.from("transactions").insert({
        user_id,
        title: `هدية اشتراك - ${paymentMetadata.plan_name || ""}`,
        date: new Date().toISOString().split("T")[0],
        amount: `${amount_sar}`,
        status: "مكتمل",
      });
    } else if (source_type === "extra_hours") {
      await supabase.from("transactions").insert({
        user_id,
        title: `ساعات إضافية - ${paymentMetadata.package_label || ""}`,
        date: new Date().toISOString().split("T")[0],
        amount: `${amount_sar}`,
        status: "مكتمل",
      });
    }

    // Mark as processed
    await supabase
      .from("payment_invoice_metadata")
      .update({ status: "paid", processed: true, updated_at: new Date().toISOString() })
      .eq("id", existingMetadata.id);

    console.log("Webhook processed successfully for payment:", paymentId);

    return new Response(
      JSON.stringify({ received: true, action: "processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

serve(handler);
