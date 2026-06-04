// @ts-nocheck
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
    const body = await req.json();
    const {
      email, password, full_name, gender, nationality, phone,
      education_level, quran_certifications, preferred_riwaya,
      preferred_track, join_date, selected_exam_id,
    } = body || {};

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "missing_fields", message: "البريد وكلمة المرور والاسم مطلوبة" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const siteUrl = req.headers.get("origin") || Deno.env.get("SUPABASE_URL")!;

    // Create user (email confirmation required by default settings)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name },
    });

    if (createErr || !created?.user) {
      const msg = (createErr?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return new Response(JSON.stringify({ error: "email_exists", message: "هذا البريد الإلكتروني مسجل مسبقاً" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "create_failed", message: createErr?.message || "تعذر إنشاء الحساب" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = created.user.id;

    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: "student" });
    if (roleErr) console.error("role insert error", roleErr);

    const { error: profileErr } = await admin.from("student_profiles").insert({
      user_id: userId,
      full_name,
      gender,
      id_number: "",
      email,
      residence_country: "",
      nationality,
      phone,
      profession: "",
      education_level,
      quran_certifications: quran_certifications || "",
      preferred_riwaya,
      preferred_track,
      join_date,
      selected_exam_id: selected_exam_id || null,
    });

    if (profileErr) {
      // rollback user
      await admin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "profile_failed", message: profileErr.message }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send confirmation email link
    await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo: `${siteUrl}/` },
    }).catch((e) => console.error("generateLink error", e));

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signup-student error", e);
    return new Response(JSON.stringify({ error: "internal", message: String(e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
