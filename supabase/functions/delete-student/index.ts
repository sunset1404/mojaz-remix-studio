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

    const { student_id, user_id } = await req.json();
    if (!student_id && !user_id) {
      return new Response(JSON.stringify({ error: "student_id or user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserId = user_id as string | undefined;
    if (!targetUserId && student_id) {
      const { data: sp } = await serviceClient
        .from("student_profiles").select("user_id").eq("id", student_id).maybeSingle();
      targetUserId = sp?.user_id;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort delete from related tables
    const tables = [
      "student_achievements",
      "session_records",
      "certificates",
      "weekly_plans",
      "subscriptions",
      "gift_subscriptions",
      "ghuyuf_entries",
      "notifications",
      "call_requests",
      "profiles",
    ];
    for (const t of tables) {
      try {
        if (t === "student_achievements") {
          await serviceClient.from(t).delete().eq("student_id", targetUserId);
        } else {
          await serviceClient.from(t).delete().eq("user_id", targetUserId);
        }
      } catch (_) { /* ignore */ }
    }

    await serviceClient.from("student_profiles").delete().eq("user_id", targetUserId);
    await serviceClient.from("user_roles").delete().eq("user_id", targetUserId);

    try {
      await serviceClient.auth.admin.deleteUser(targetUserId);
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
