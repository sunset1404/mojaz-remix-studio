import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const ACCESS_TOKEN = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID");
const WABA_ID = Deno.env.get("META_WHATSAPP_BUSINESS_ACCOUNT_ID");
const META_API = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID || !WABA_ID) {
      return json({ error: "Meta WhatsApp credentials not configured" }, 500);
    }

    // Auth + admin check
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // VERIFY connection (Phone Number info)
    if (action === "verify") {
      const r = await fetch(`${META_API}/${PHONE_NUMBER_ID}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      });
      const data = await r.json();
      if (!r.ok) return json({ connected: false, error: data.error?.message || "Failed" }, 200);
      return json({
        connected: true,
        phone_number: data.display_phone_number,
        verified_name: data.verified_name,
        quality_rating: data.quality_rating,
      });
    }

    // LIST templates from Meta
    if (action === "list" && req.method === "GET") {
      const r = await fetch(
        `${META_API}/${WABA_ID}/message_templates?limit=100&fields=name,status,category,language,components,id,rejected_reason`,
        { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
      );
      const data = await r.json();
      if (!r.ok) return json({ error: data.error?.message || "Failed" }, r.status);
      return json({ templates: data.data || [] });
    }

    // CREATE template
    if (action === "create" && req.method === "POST") {
      const body = await req.json();
      const { name, category, language, components } = body;
      if (!name || !category || !language || !components) {
        return json({ error: "Missing fields" }, 400);
      }
      const r = await fetch(`${META_API}/${WABA_ID}/message_templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category, language, components, allow_category_change: true }),
      });
      const data = await r.json();
      if (!r.ok) return json({ error: data.error?.message || "Failed", details: data.error }, r.status);
      return json({ success: true, template: data });
    }

    // DELETE template
    if (action === "delete" && req.method === "DELETE") {
      const name = url.searchParams.get("name");
      if (!name) return json({ error: "name required" }, 400);
      const r = await fetch(
        `${META_API}/${WABA_ID}/message_templates?name=${encodeURIComponent(name)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
      );
      const data = await r.json();
      if (!r.ok) return json({ error: data.error?.message || "Failed" }, r.status);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("whatsapp-templates error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
