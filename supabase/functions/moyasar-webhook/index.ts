import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processMoyasarPayment } from "../_shared/payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-moyasar-signature, moyasar-signature",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSha256Base64(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

  const rawBody = await req.text();

  const webhookSecret = Deno.env.get("MOYASAR_WEBHOOK_SECRET") ?? "";
  const allowInsecure = Deno.env.get("MOYASAR_ALLOW_INSECURE_WEBHOOKS") === "true";
  const signatureHeader =
    req.headers.get("x-moyasar-signature") ||
    req.headers.get("moyasar-signature") ||
    "";

  if (webhookSecret) {
    const expectedBase64 = await hmacSha256Base64(rawBody, webhookSecret);
    const expectedHex = await hmacSha256Hex(rawBody, webhookSecret);
    const provided = signatureHeader.replace(/^sha256=/, "");
    const ok =
      timingSafeEqual(provided, expectedBase64) ||
      timingSafeEqual(provided, expectedHex) ||
      timingSafeEqual(signatureHeader, expectedBase64) ||
      timingSafeEqual(signatureHeader, expectedHex);

    if (!ok) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else if (!allowInsecure) {
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = JSON.parse(rawBody);
    const payment = payload?.data ?? payload?.payment ?? payload;
    const paymentId = payment?.id;
    const paymentRef = payment?.metadata?.payment_ref || payment?.metadata?.paymentRef;

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Missing payment id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await processMoyasarPayment({
      payment_id: String(paymentId),
      payment_ref: paymentRef ? String(paymentRef) : null,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
