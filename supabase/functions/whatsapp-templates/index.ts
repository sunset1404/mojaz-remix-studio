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

      // For media headers, use Resumable Upload API to get header_handle
      const APP_ID = Deno.env.get("META_WHATSAPP_APP_ID");
      for (const comp of components) {
        if (comp.type === "HEADER" && ["DOCUMENT", "IMAGE", "VIDEO"].includes(comp.format) && !comp.example) {
          if (!APP_ID) return json({ error: "META_WHATSAPP_APP_ID required" }, 400);
          const sampleUrl = comp.format === "DOCUMENT"
            ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            : "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png";
          const sampleRes = await fetch(sampleUrl);
          if (!sampleRes.ok) return json({ error: "Failed to fetch sample file" }, 500);
          const sampleBytes = new Uint8Array(await sampleRes.arrayBuffer());
          const mime = comp.format === "DOCUMENT" ? "application/pdf" : "image/png";

          const sessRes = await fetch(
            `${META_API}/${APP_ID}/uploads?file_length=${sampleBytes.length}&file_type=${encodeURIComponent(mime)}&access_token=${ACCESS_TOKEN}`,
            { method: "POST" }
          );
          const sessData = await sessRes.json();
          if (!sessRes.ok || !sessData.id) {
            const metaError = sessData?.error || sessData;
            const isInvalidAppId = metaError?.code === 100 && metaError?.error_subcode === 33;
            return json({
              error: isInvalidAppId
                ? "تعذر رفع ملف المثال. تحقق من META_WHATSAPP_APP_ID وأن تطبيق Meta يملك صلاحية WhatsApp Business."
                : "Upload session failed",
              details: metaError,
              fallback: true,
              reason: isInvalidAppId ? "INVALID_META_APP_ID_OR_PERMISSIONS" : "META_UPLOAD_SESSION_FAILED",
            }, 200);
          }

          const upRes = await fetch(`${META_API}/${sessData.id}`, {
            method: "POST",
            headers: { Authorization: `OAuth ${ACCESS_TOKEN}`, file_offset: "0" },
            body: sampleBytes,
          });
          const upData = await upRes.json();
          if (!upRes.ok || !upData.h) {
            return json({
              error: "Upload failed",
              details: upData.error || upData,
              fallback: true,
              reason: "META_UPLOAD_FAILED",
            }, 200);
          }
          comp.example = { header_handle: [upData.h] };
        }
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
      if (!r.ok) {
        return json({
          error: data.error?.message || "Failed",
          details: data.error,
          fallback: true,
          reason: "META_TEMPLATE_CREATE_FAILED",
        }, 200);
      }
      return json({ success: true, template: data });
    }

    // DELETE template
    if (action === "delete" && req.method === "DELETE") {
      const name = url.searchParams.get("name");
      if (!name) return json({ error: "name required" }, 400);
      if (name === "hello_world") {
        return json({
          error: "قالب hello_world هو قالب افتراضي من Meta ولا يمكن حذفه عبر الـ API. يمكنك حذفه فقط من لوحة تحكم Meta Business Manager.",
          reason: "META_SAMPLE_TEMPLATE_PROTECTED",
        }, 400);
      }
      const r = await fetch(
        `${META_API}/${WABA_ID}/message_templates?name=${encodeURIComponent(name)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
      );
      const data = await r.json();
      if (!r.ok) {
        return json({
          error: data.error?.message || "فشل الحذف",
          details: data.error,
        }, 200);
      }
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
