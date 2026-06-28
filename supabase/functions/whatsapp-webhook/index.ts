// Meta WhatsApp Webhook receiver
// - GET: verification handshake (Meta calls with hub.mode/hub.verify_token/hub.challenge)
// - POST: receives status updates (sent/delivered/read/failed) and inbound messages (replies)
//         Signed with HMAC-SHA256 using META_WHATSAPP_APP_SECRET; validated on every POST.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const VERIFY_TOKEN = Deno.env.get("META_WHATSAPP_VERIFY_TOKEN");
const APP_SECRET = Deno.env.get("META_WHATSAPP_APP_SECRET");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // ── Verification handshake ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (VERIFY_TOKEN && mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // ── Signature verification (required) ──
  if (!APP_SECRET) {
    console.error("META_WHATSAPP_APP_SECRET not configured");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get("x-hub-signature-256") || "";
  const provided = sigHeader.replace(/^sha256=/, "");
  const expected = await hmacSha256Hex(rawBody, APP_SECRET);
  if (!provided || !timingSafeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = JSON.parse(rawBody);
    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value || {};

        const statuses = value?.statuses || [];
        for (const s of statuses) {
          const wamid = s?.id;
          const status = s?.status;
          const recipient = s?.recipient_id;
          const errMsg = s?.errors?.[0]?.title || s?.errors?.[0]?.message;

          await supabase.from("whatsapp_message_events").insert({
            wamid, phone: recipient, event_type: status, payload: s,
          });

          if (!wamid) continue;
          const update: Record<string, unknown> = { status };
          if (status === "delivered") update.delivered_at = new Date().toISOString();
          if (status === "read") update.read_at = new Date().toISOString();
          if (status === "failed") {
            update.failed_at = new Date().toISOString();
            if (errMsg) update.error_message = errMsg;
          }
          await supabase.from("whatsapp_message_recipients").update(update).eq("wamid", wamid);
        }

        const messages = value?.messages || [];
        for (const m of messages) {
          const from = m?.from;
          const ctxId = m?.context?.id;

          await supabase.from("whatsapp_message_events").insert({
            wamid: ctxId || m?.id, phone: from, event_type: "replied", payload: m,
          });

          if (ctxId) {
            await supabase.from("whatsapp_message_recipients")
              .update({ replied_at: new Date().toISOString() }).eq("wamid", ctxId);
          } else if (from) {
            const { data: latest } = await supabase
              .from("whatsapp_message_recipients")
              .select("id").eq("phone", from)
              .order("sent_at", { ascending: false }).limit(1).maybeSingle();
            if (latest?.id) {
              await supabase.from("whatsapp_message_recipients")
                .update({ replied_at: new Date().toISOString() }).eq("id", latest.id);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-webhook error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
