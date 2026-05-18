import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      email, password, full_name, phone, gender, nationality, city,
      id_number, reciter_type, profession, qualifications,
      quran_certifications, teaching_experience, preferred_track, status,
    } = body;

    if (!email || !password || !full_name || !phone || !gender || !nationality || !city || !id_number) {
      return new Response(
        JSON.stringify({ error: "الحقول المطلوبة: الاسم، البريد، كلمة المرور، الجوال، الجنس، الجنسية، المدينة، رقم الهوية" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;

    const { error: roleErr } = await serviceClient
      .from("user_roles")
      .insert({ user_id: userId, role: "reciter" });
    if (roleErr) console.error("Role insert error:", roleErr);

    const { error: profileErr } = await serviceClient
      .from("profiles")
      .insert({ user_id: userId, full_name, phone });
    if (profileErr) console.error("Profile insert error:", profileErr);

    const { error: recErr } = await serviceClient
      .from("reciter_profiles")
      .insert({
        user_id: userId,
        full_name,
        phone,
        gender,
        nationality,
        city,
        id_number,
        reciter_type: reciter_type || "general",
        profession: profession || "-",
        qualifications: qualifications || "-",
        quran_certifications: quran_certifications || "-",
        teaching_experience: teaching_experience || "-",
        preferred_track: preferred_track || "",
        status: status || "approved",
      });

    if (recErr) {
      return new Response(
        JSON.stringify({ error: recErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, email, message: "تم إنشاء حساب المقرئ بنجاح" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
