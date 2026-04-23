import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACCESS_TOKEN = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID");
const META_API = "https://graph.facebook.com/v21.0";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Normalize Saudi phone numbers to E.164 (no '+' for Meta)
function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("0")) p = "966" + p.slice(1);
  if (p.startsWith("5") && p.length === 9) p = "966" + p;
  return p;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return json({ error: "Meta WhatsApp credentials not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const {
      to,
      template_name,
      language = "ar",
      variables = [],          // string[] for body {{1}}, {{2}}...
      header_media_url,        // optional public URL for IMAGE/DOCUMENT/VIDEO header
      header_media_type,       // "image" | "document" | "video"
      header_filename,         // optional, for documents
    } = body || {};

    if (!to || !template_name) {
      return json({ error: "to and template_name are required" }, 400);
    }

    const phone = normalizePhone(to);

    const components: any[] = [];

    if (header_media_url && header_media_type) {
      const mediaObj: any = { link: header_media_url };
      if (header_media_type === "document" && header_filename) {
        mediaObj.filename = header_filename;
      }
      components.push({
        type: "header",
        parameters: [{ type: header_media_type, [header_media_type]: mediaObj }],
      });
    }

    if (Array.isArray(variables) && variables.length > 0) {
      components.push({
        type: "body",
        parameters: variables.map((v: string) => ({ type: "text", text: String(v ?? "") })),
      });
    }

    const payload: any = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: template_name,
        language: { code: language },
        ...(components.length > 0 ? { components } : {}),
      },
    };

    const r = await fetch(`${META_API}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Meta send error:", data);
      return json({
        error: data?.error?.message || "Failed to send",
        details: data?.error,
      }, r.status);
    }

    return json({ success: true, message_id: data?.messages?.[0]?.id, to: phone });
  } catch (e) {
    console.error("send-whatsapp-template error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
