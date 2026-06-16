// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reciter_user_id = claimsData.claims.sub;
    const body = await req.json();
    const { exam_id } = body;

    if (!exam_id) {
      return new Response(JSON.stringify({ error: "exam_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get reciter profile
    const { data: reciterProfile } = await adminClient
      .from("reciter_profiles")
      .select("id")
      .eq("user_id", reciter_user_id)
      .maybeSingle();

    if (!reciterProfile) {
      return new Response(JSON.stringify({ error: "not_reciter", message: "حسابك ليس مقرئاً" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get exam and verify membership
    const { data: exam } = await adminClient
      .from("exams")
      .select("*")
      .eq("id", exam_id)
      .maybeSingle();

    if (!exam) {
      return new Response(JSON.stringify({ error: "exam_not_found", message: "لم يتم العثور على الاختبار" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isMember =
      exam.committee_member_1 === reciterProfile.id ||
      exam.committee_member_2 === reciterProfile.id ||
      exam.committee_member_3 === reciterProfile.id;

    if (!isMember) {
      return new Response(JSON.stringify({ error: "not_committee", message: "أنت لست عضواً في لجنة هذا الاختبار" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!exam.student_id) {
      return new Response(JSON.stringify({ error: "no_student", message: "لم يتم تحديد طالب لهذا الاختبار" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const student_name = exam.student_name || "طالب";

    // Create call session
    const { data: callSession, error: insertError } = await adminClient
      .from("video_call_sessions")
      .insert({
        reciter_id: reciter_user_id,
        student_id: exam.student_id,
        student_name,
        status: "waiting",
        caller_role: "reciter",
        reciter_joined_at: new Date().toISOString(),
        exam_id: exam_id,
      })
      .select("id, room_id")
      .single();

    if (insertError) {
      console.error("exam-call insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create call session", details: insertError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ room_id: callSession.room_id, session_id: callSession.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("exam-call unexpected:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
