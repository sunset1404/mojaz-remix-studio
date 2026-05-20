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

    // Pre-check duplicates with clear Arabic messages
    const { data: dupPhone } = await serviceClient
      .from("reciter_profiles").select("id").eq("phone", phone).maybeSingle();
    if (dupPhone) {
      return new Response(JSON.stringify({ error: "رقم الجوال مستخدم مسبقاً لمقرئ آخر" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: dupId } = await serviceClient
      .from("reciter_profiles").select("id").eq("id_number", id_number).maybeSingle();
    if (dupId) {
      return new Response(JSON.stringify({ error: "رقم الهوية مستخدم مسبقاً لمقرئ آخر" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translateErr = (m: string) => {
      const s = (m || "").toLowerCase();
      if (s.includes("phone")) return "رقم الجوال مستخدم مسبقاً";
      if (s.includes("id_number")) return "رقم الهوية مستخدم مسبقاً";
      if (s.includes("email")) return "البريد الإلكتروني مستخدم مسبقاً";
      if (s.includes("user_id")) return "هذا المستخدم مسجّل مسبقاً كمقرئ";
      if (s.includes("duplicate") || s.includes("unique")) return "هذه البيانات مكررة، الرجاء التحقق من الحقول";
      return m;
    };

    let userId: string;
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      const msg = createError.message || "";
      if (!/already|exist|registered/i.test(msg)) {
        return new Response(JSON.stringify({ error: msg }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Find existing user by email
      const { data: list } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase());
      if (!existing) {
        return new Response(JSON.stringify({ error: "البريد مستخدم مسبقاً" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: existingRec } = await serviceClient
        .from("reciter_profiles").select("id").eq("user_id", existing.id).maybeSingle();
      await serviceClient.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
      userId = existing.id;

      if (existingRec) {
        await serviceClient.from("user_roles").upsert(
          { user_id: userId, role: "reciter" },
          { onConflict: "user_id,role", ignoreDuplicates: true } as any
        );

        await serviceClient.from("profiles").upsert(
          { user_id: userId, full_name, phone },
          { onConflict: "user_id" } as any
        );

        const { error: updateErr } = await serviceClient
          .from("reciter_profiles")
          .update({
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
          })
          .eq("id", existingRec.id);

        if (updateErr) {
          return new Response(JSON.stringify({ error: updateErr.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({ success: true, user_id: userId, email, updated: true, message: "تم تحديث حساب المقرئ بنجاح" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      userId = newUser.user.id;
    }

    // Ensure reciter role (ignore duplicates)
    await serviceClient.from("user_roles").upsert(
      { user_id: userId, role: "reciter" },
      { onConflict: "user_id,role", ignoreDuplicates: true } as any
    );

    // Upsert profile (may already exist via handle_new_user trigger)
    await serviceClient.from("profiles").upsert(
      { user_id: userId, full_name, phone },
      { onConflict: "user_id" } as any
    );

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
        JSON.stringify({ error: translateErr(recErr.message) }),
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
