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
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const emailValue = String(email).trim().toLowerCase();
    const { data: emailStatus } = await admin.rpc("get_email_registration_status", {
      p_email: emailValue,
    });

    if (emailStatus === "active") {
      return new Response(JSON.stringify({ error: "active", message: "هذا الحساب موجود ومفعل بالفعل، يمكنك تسجيل الدخول بهذا البريد." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Purge any abandoned/unconfirmed prior account with same email
    if (emailStatus === "needs_activation") {
      const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const stale = (usersList?.users || []).filter((u: any) => (u.email || "").toLowerCase() === emailValue && !u.email_confirmed_at);
      for (const u of stale) {
        await admin.from("student_profiles").delete().eq("user_id", u.id);
        await admin.from("reciter_profiles").delete().eq("user_id", u.id);
        await admin.from("user_roles").delete().eq("user_id", u.id);
        await admin.from("profiles").delete().eq("user_id", u.id);
        await admin.auth.admin.deleteUser(u.id);
      }
    }

    // signUp triggers OTP email (template uses {{ .Token }})
    const { data: created, error: createErr } = await authClient.auth.signUp({
      email: emailValue,
      password,
      options: { data: { full_name } },
    });

    if (createErr || !created?.user) {
      const msg = (createErr?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return new Response(JSON.stringify({ error: "email_exists", message: "هذا الحساب موجود بالفعل. إذا لم تتمكن من الدخول فقد يحتاج إلى تفعيل أو استكمال بياناته." }), {
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

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signup-student error", e);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
