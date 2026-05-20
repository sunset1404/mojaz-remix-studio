import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await serviceClient
      .from("user_roles").select("role")
      .eq("user_id", callerUserId).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const clean = (value: unknown) => String(value ?? "").trim();
    const normalizeEmail = (value: unknown) => clean(value).toLowerCase();

    // Mode: fetch current email by user_id
    if (body?.action === "get_email" && body?.user_id) {
      const { data: u } = await serviceClient.auth.admin.getUserById(body.user_id);
      return new Response(JSON.stringify({ email: u?.user?.email || "" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      reciter_id, user_id, email, password, full_name, phone, gender, nationality, city,
      id_number, reciter_type, profession, qualifications,
      quran_certifications, teaching_experience, status,
    } = body;

    if (!reciter_id || !user_id || !email || !full_name || !phone || !gender || !nationality || !city || !id_number) {
      return new Response(JSON.stringify({ error: "الحقول المطلوبة ناقصة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Duplicate checks excluding current reciter
    const { data: dupPhone } = await serviceClient
      .from("reciter_profiles").select("id").eq("phone", clean(phone)).neq("id", reciter_id).maybeSingle();
    if (dupPhone) return new Response(JSON.stringify({ error: "رقم الجوال مكرر" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { data: dupId } = await serviceClient
      .from("reciter_profiles").select("id").eq("id_number", clean(id_number)).neq("id", reciter_id).maybeSingle();
    if (dupId) return new Response(JSON.stringify({ error: "رقم الهوية مكرر" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Email duplicate check (other auth user)
    const { data: list } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 500 });
    const emailOwner = list?.users?.find((u: any) => (u.email || "").toLowerCase() === normalizeEmail(email));
    if (emailOwner && emailOwner.id !== user_id) {
      return new Response(JSON.stringify({ error: "البريد الإلكتروني مكرر" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update auth user (email + optional password)
    const authUpdate: any = { email, email_confirm: true };
    if (password && String(password).length >= 6) authUpdate.password = password;
    const { error: authErr } = await serviceClient.auth.admin.updateUserById(user_id, authUpdate);
    if (authErr) {
      const msg = /already|exist|registered|email/i.test(authErr.message || "") ? "البريد الإلكتروني مكرر" : authErr.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: recErr } = await serviceClient
      .from("reciter_profiles")
      .update({
        full_name, phone, gender, nationality, city, id_number,
        reciter_type: reciter_type || "general",
        profession: profession || "-",
        qualifications: qualifications || "-",
        quran_certifications: quran_certifications || "-",
        teaching_experience: teaching_experience || "-",
        status: status || "approved",
      })
      .eq("id", reciter_id);

    if (recErr) {
      return new Response(JSON.stringify({ error: recErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await serviceClient.from("profiles").upsert(
      { user_id, full_name, phone },
      { onConflict: "user_id" } as any
    );

    return new Response(JSON.stringify({ success: true, message: "تم تحديث بيانات المقرئ بنجاح" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
