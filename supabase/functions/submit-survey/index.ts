import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const code = String(body?.code || "").trim();
    const answers = body?.answers as Record<string, unknown> | undefined;
    if (!code || !answers || typeof answers !== "object") {
      return json({ error: "invalid_payload" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: survey, error: surveyErr } = await supabase
      .from("surveys")
      .select("id, is_active")
      .eq("external_link_code", code)
      .maybeSingle();

    if (surveyErr || !survey) return json({ error: "survey_not_found" }, 404);
    if (!survey.is_active) return json({ error: "survey_inactive" }, 403);

    const { data: questions, error: qErr } = await supabase
      .from("survey_questions")
      .select("id, question_text, question_type, is_required")
      .eq("survey_id", survey.id)
      .order("order_index");

    if (qErr) return json({ error: "internal_error" }, 500);

    const toText = (v: unknown) => {
      if (v === null || v === undefined) return "";
      if (Array.isArray(v)) return v.join(", ");
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    };

    // Validate required
    for (const q of questions || []) {
      if (q.question_type === "info") continue;
      if (q.is_required && !toText(answers[q.id]).trim()) {
        return json({ error: "missing_required", question: q.question_text }, 400);
      }
    }

    const pick = (needles: string[]) => {
      for (const n of needles) {
        const q = (questions || []).find(
          (q) => q.question_text?.includes(n) && toText(answers[q.id]).trim()
        );
        if (q) return toText(answers[q.id]).slice(0, 200);
      }
      return null;
    };

    const firstText = (questions || []).find(
      (q) => (q.question_type === "text" || q.question_type === "textarea") && toText(answers[q.id]).trim()
    );

    const { data: submission, error: subErr } = await supabase
      .from("survey_submissions")
      .insert({
        survey_id: survey.id,
        full_name: pick(["الاسم"]) || (firstText ? toText(answers[firstText.id]).slice(0, 200) : null),
        email: pick(["البريد", "الإيميل", "Email"]),
        phone: pick(["الجوال", "الهاتف", "رقم الجوال"]),
      })
      .select("id")
      .single();

    if (subErr || !submission) {
      console.error("submit-survey submission error:", subErr);
      return json({ error: "internal_error" }, 500);
    }

    const rows = (questions || [])
      .filter((q) => q.question_type !== "info")
      .map((q) => ({
        submission_id: submission.id,
        question_id: q.id,
        answer_text: toText(answers[q.id]).slice(0, 5000),
      }));

    if (rows.length) {
      const { error: respErr } = await supabase.from("survey_responses").insert(rows);
      if (respErr) {
        console.error("submit-survey responses error:", respErr);
        return json({ error: "internal_error" }, 500);
      }
    }

    return json({ success: true });
  } catch (e) {
    console.error("submit-survey error:", e);
    return json({ error: "internal_error" }, 500);
  }
});
