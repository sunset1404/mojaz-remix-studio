// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const callerUserId = claimsData.claims.sub;
    const { data: roleData } = await admin
      .from("user_roles").select("role")
      .eq("user_id", callerUserId).eq("role", "admin").maybeSingle();
    if (!roleData) return json({ error: "Admin access required" }, 403);

    const body = await req.json();
    const clean = (v: unknown) => String(v ?? "").trim();
    const normalizeEmail = (v: unknown) => clean(v).toLowerCase();
    const {
      email, password, full_name, phone, gender, nationality,
      residence_country, education_level, profession,
      preferred_track, preferred_riwaya, quran_certifications,
      id_number, ijazah_status,
    } = body;

    if (!email || !password || !full_name || !phone || !gender) {
      return json({ error: "الحقول المطلوبة: الاسم، البريد، كلمة المرور، الجوال، الجنس" }, 400);
    }

    // Duplicate phone
    if (clean(phone)) {
      const [{ data: dr }, { data: ds }] = await Promise.all([
        admin.from("reciter_profiles").select("id").eq("phone", clean(phone)).maybeSingle(),
        admin.from("student_profiles").select("id").eq("phone", clean(phone)).maybeSingle(),
      ]);
      if (dr || ds) return json({ error: "رقم الجوال مكرر" }, 400);
    }
    // Duplicate id_number
    if (clean(id_number)) {
      const [{ data: dr }, { data: ds }] = await Promise.all([
        admin.from("reciter_profiles").select("id").eq("id_number", clean(id_number)).maybeSingle(),
        admin.from("student_profiles").select("id").eq("id_number", clean(id_number)).maybeSingle(),
      ]);
      if (dr || ds) return json({ error: "رقم الهوية مكرر" }, 400);
    }

    // Email status — recycle orphans
    const emailNorm = normalizeEmail(email);
    const { data: emailStatus } = await admin.rpc("get_email_registration_status", { p_email: emailNorm });
    if (emailStatus === "active") {
      return json({ error: "البريد الإلكتروني مكرر - الحساب موجود ومفعل" }, 400);
    }
    if (emailStatus === "needs_activation") {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const orphan = list?.users?.find((u: any) => (u.email || "").toLowerCase() === emailNorm);
      if (orphan) {
        await admin.from("student_profiles").delete().eq("user_id", orphan.id);
        await admin.from("reciter_profiles").delete().eq("user_id", orphan.id);
        await admin.from("user_roles").delete().eq("user_id", orphan.id);
        await admin.from("profiles").delete().eq("user_id", orphan.id);
        try { await admin.auth.admin.deleteUser(orphan.id); } catch (_) {}
      }
    }

    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name },
    });
    if (createErr) {
      const m = createErr.message || "";
      if (/already|exist|registered/i.test(m)) return json({ error: "البريد الإلكتروني مكرر" }, 400);
      return json({ error: m }, 400);
    }
    const userId = newUser.user.id;

    await admin.from("user_roles").upsert(
      { user_id: userId, role: "student" },
      { onConflict: "user_id,role", ignoreDuplicates: true } as any
    );
    await admin.from("profiles").upsert(
      { user_id: userId, full_name, phone },
      { onConflict: "user_id" } as any
    );

    const { error: spErr } = await admin.from("student_profiles").insert({
      user_id: userId,
      full_name,
      gender,
      id_number: clean(id_number) || "",
      email,
      residence_country: clean(residence_country) || clean(nationality) || "",
      nationality: clean(nationality) || "",
      phone,
      profession: clean(profession) || "",
      education_level: clean(education_level) || "",
      quran_certifications: clean(quran_certifications) || "",
      preferred_riwaya: clean(preferred_riwaya) || "",
      preferred_track: clean(preferred_track) || "",
      ijazah_status: ijazah_status || null,
    });
    if (spErr) {
      const s = (spErr.message || "").toLowerCase();
      let msg = spErr.message;
      if (s.includes("phone")) msg = "رقم الجوال مكرر";
      else if (s.includes("id_number")) msg = "رقم الهوية مكرر";
      else if (s.includes("email")) msg = "البريد مكرر";
      return json({ error: msg }, 400);
    }

    return json({ success: true, user_id: userId });
  } catch (e) {
    console.error("create-student error", e);
    return json({ error: e instanceof Error ? e.message : "internal" }, 500);
  }
});
