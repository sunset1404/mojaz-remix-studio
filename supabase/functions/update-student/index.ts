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

    // Activate (confirm email) action
    if (body?.action === "activate" && body?.user_id) {
      const { error } = await admin.auth.admin.updateUserById(body.user_id, { email_confirm: true });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (body?.action === "get_email" && body?.user_id) {
      const { data: u } = await admin.auth.admin.getUserById(body.user_id);
      return json({ email: u?.user?.email || "" });
    }

    const {
      student_id, user_id, email, password,
      full_name, phone, gender, nationality, residence_country,
      education_level, profession, preferred_track, preferred_riwaya,
      quran_certifications, id_number, ijazah_status,
    } = body;

    if (!user_id || !email || !full_name) {
      return json({ error: "الحقول المطلوبة ناقصة" }, 400);
    }

    // Duplicate phone (excluding self)
    if (clean(phone)) {
      const [{ data: dr }, { data: ds }] = await Promise.all([
        admin.from("reciter_profiles").select("id").eq("phone", clean(phone)).maybeSingle(),
        admin.from("student_profiles").select("id, user_id").eq("phone", clean(phone)).maybeSingle(),
      ]);
      if (dr) return json({ error: "رقم الجوال مكرر" }, 400);
      if (ds && (ds as any).user_id !== user_id) return json({ error: "رقم الجوال مكرر" }, 400);
    }
    // Duplicate id (excluding self)
    if (clean(id_number)) {
      const [{ data: dr }, { data: ds }] = await Promise.all([
        admin.from("reciter_profiles").select("id").eq("id_number", clean(id_number)).maybeSingle(),
        admin.from("student_profiles").select("id, user_id").eq("id_number", clean(id_number)).maybeSingle(),
      ]);
      if (dr) return json({ error: "رقم الهوية مكرر" }, 400);
      if (ds && (ds as any).user_id !== user_id) return json({ error: "رقم الهوية مكرر" }, 400);
    }

    // Duplicate email (other auth user)
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const owner = list?.users?.find((u: any) => (u.email || "").toLowerCase() === normalizeEmail(email));
    if (owner && owner.id !== user_id) return json({ error: "البريد الإلكتروني مكرر" }, 400);

    const authUpdate: any = { email, email_confirm: true };
    if (password && String(password).length >= 6) authUpdate.password = password;
    const { error: authErr } = await admin.auth.admin.updateUserById(user_id, authUpdate);
    if (authErr) {
      const msg = /already|exist|registered|email/i.test(authErr.message || "") ? "البريد الإلكتروني مكرر" : authErr.message;
      return json({ error: msg }, 400);
    }

    // Ensure role
    await admin.from("user_roles").upsert(
      { user_id, role: "student" },
      { onConflict: "user_id,role", ignoreDuplicates: true } as any
    );

    // Upsert student_profiles (in case orphan being completed)
    const profilePayload: any = {
      user_id,
      full_name,
      gender: gender || "",
      id_number: clean(id_number) || "",
      email,
      residence_country: clean(residence_country) || clean(nationality) || "",
      nationality: clean(nationality) || "",
      phone: clean(phone) || "",
      profession: clean(profession) || "",
      education_level: clean(education_level) || "",
      quran_certifications: clean(quran_certifications) || "",
      preferred_riwaya: clean(preferred_riwaya) || "",
      preferred_track: clean(preferred_track) || "",
    };
    if (ijazah_status !== undefined) profilePayload.ijazah_status = ijazah_status;

    if (student_id) {
      const { error } = await admin.from("student_profiles").update(profilePayload).eq("id", student_id);
      if (error) return json({ error: error.message }, 400);
    } else {
      // Orphan completion → insert
      const { error } = await admin.from("student_profiles").upsert(profilePayload, { onConflict: "user_id" } as any);
      if (error) return json({ error: error.message }, 400);
    }

    await admin.from("profiles").upsert(
      { user_id, full_name, phone: clean(phone) || "" },
      { onConflict: "user_id" } as any
    );

    return json({ success: true });
  } catch (e) {
    console.error("update-student error", e);
    return json({ error: e instanceof Error ? e.message : "internal" }, 500);
  }
});
