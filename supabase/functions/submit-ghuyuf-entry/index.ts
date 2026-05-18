import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const reciter_name = String(body.reciter_name || "").trim();
    if (!reciter_name) {
      return new Response(JSON.stringify({ error: "اسم المقرئ مطلوب" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (reciter_name.length > 200) {
      return new Response(JSON.stringify({ error: "اسم طويل جداً" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = {
      reciter_name,
      country: body.country ? String(body.country).slice(0, 100) : null,
      nationality: body.nationality ? String(body.nationality).slice(0, 100) : null,
      riwaya: body.riwaya ? String(body.riwaya).slice(0, 100) : null,
      pages: Math.max(0, Math.min(100000, Number(body.pages) || 0)),
      juz: Math.max(0, Math.min(10000, Number(body.juz) || 0)),
      hours: Math.max(0, Math.min(100000, Number(body.hours) || 0)),
      students_count: Math.max(0, Math.min(100000, Number(body.students_count) || 0)),
      notes: body.notes ? String(body.notes).slice(0, 2000) : null,
      source: "survey",
    };

    const { error } = await supabase.from("ghuyuf_rahman_entries").insert(payload);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
