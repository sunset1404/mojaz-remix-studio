// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      email, password, full_name, gender, nationality, id_number, phone, city,
      profession, qualifications, quran_certifications, teaching_experience,
      preferred_days, preferred_times, preferred_track, reciter_type,
    } = body || {};

    if (!email || !password || !full_name || !gender || !nationality || !id_number || !phone || !city) {
      return json({ error: "missing_fields", message: "يرجى إكمال بيانات التسجيل المطلوبة" });
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
    const siteUrl = req.headers.get("origin") || Deno.env.get("SUPABASE_URL")!;
    const { data: emailStatus } = await admin.rpc("get_email_registration_status", { p_email: emailValue });

    if (emailStatus && emailStatus !== "available") {
      const message = emailStatus === "active"
        ? "هذا الحساب موجود ومفعل بالفعل، يمكنك تسجيل الدخول بهذا البريد."
        : "هذا الحساب موجود لكنه يحتاج إلى تفعيل أو استكمال بياناته قبل استخدامه.";
      return json({ error: emailStatus, message });
    }

    const { data: created, error: createErr } = await authClient.auth.signUp({
      email: emailValue,
      password,
      options: { data: { full_name }, emailRedirectTo: siteUrl },
    });

    if (createErr || !created?.user) {
      const msg = (createErr?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return json({ error: "email_exists", message: "هذا الحساب موجود بالفعل. إذا لم تتمكن من الدخول فقد يحتاج إلى تفعيل أو استكمال بياناته." });
      }
      return json({ error: "create_failed", message: createErr?.message || "تعذر إنشاء الحساب" });
    }

    const userId = created.user.id;

    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: "reciter" });
    if (roleErr) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: "role_failed", message: "تعذر ربط نوع الحساب. يرجى المحاولة مرة أخرى." });
    }

    const { error: profileErr } = await admin.from("reciter_profiles").insert({
      user_id: userId,
      full_name,
      gender,
      nationality,
      id_number,
      phone,
      city,
      profession: profession || "",
      qualifications: qualifications || "",
      quran_certifications: quran_certifications || "",
      teaching_experience: teaching_experience || "",
      preferred_days: Array.isArray(preferred_days) ? preferred_days : [],
      preferred_times: Array.isArray(preferred_times) ? preferred_times : [],
      preferred_track: preferred_track || "",
      reciter_type: reciter_type || "general",
      status: "pending",
    });

    if (profileErr) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: "profile_failed", message: profileErr.message });
    }

    return json({ success: true, user_id: userId });
  } catch (e) {
    console.error("signup-reciter error", e);
    return json({ error: "internal", message: "حدث خطأ غير متوقع أثناء التسجيل" });
  }
});