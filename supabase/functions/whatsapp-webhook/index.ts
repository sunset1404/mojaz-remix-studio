// Meta WhatsApp Webhook receiver
// - GET: verification handshake (Meta calls with hub.mode/hub.verify_token/hub.challenge)
// - POST: receives status updates (sent/delivered/read/failed) and inbound messages (replies)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const VERIFY_TOKEN = Deno.env.get("META_WHATSAPP_VERIFY_TOKEN") || "mojaz_eqraa_verify";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // ── Verification handshake ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Meta sends entry[].changes[].value with statuses[] and/or messages[]
    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value || {};

        // ── Status updates (delivered / read / sent / failed) ──
        const statuses = value?.statuses || [];
        for (const s of statuses) {
          const wamid = s?.id;
          const status = s?.status; // sent | delivered | read | failed
          const recipient = s?.recipient_id;
          const errMsg = s?.errors?.[0]?.title || s?.errors?.[0]?.message;

          // Audit log
          await supabase.from("whatsapp_message_events").insert({
            wamid,
            phone: recipient,
            event_type: status,
            payload: s,
          });

          if (!wamid) continue;
          const update: Record<string, unknown> = { status };
          if (status === "delivered") update.delivered_at = new Date().toISOString();
          if (status === "read") update.read_at = new Date().toISOString();
          if (status === "failed") {
            update.failed_at = new Date().toISOString();
            if (errMsg) update.error_message = errMsg;
          }
          await supabase
            .from("whatsapp_message_recipients")
            .update(update)
            .eq("wamid", wamid);
        }

        // ── Inbound messages (replies) ──
        const messages = value?.messages || [];
        for (const m of messages) {
          const from = m?.from;
          const ctxId = m?.context?.id; // wamid of original message being replied to

          await supabase.from("whatsapp_message_events").insert({
            wamid: ctxId || m?.id,
            phone: from,
            event_type: "replied",
            payload: m,
          });

          if (ctxId) {
            await supabase
              .from("whatsapp_message_recipients")
              .update({ replied_at: new Date().toISOString() })
              .eq("wamid", ctxId);
          } else if (from) {
            // Mark latest sent message to that phone as replied
            const { data: latest } = await supabase
              .from("whatsapp_message_recipients")
              .select("id")
              .eq("phone", from)
              .order("sent_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (latest?.id) {
              await supabase
                .from("whatsapp_message_recipients")
                .update({ replied_at: new Date().toISOString() })
                .eq("id", latest.id);
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
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 200, // Meta wants 200 to avoid retries flooding
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
