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

    const { reciter_id, user_id } = await req.json();
    if (!reciter_id && !user_id) {
      return new Response(JSON.stringify({ error: "reciter_id or user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserId = user_id as string | undefined;
    if (!targetUserId && reciter_id) {
      const { data: rec } = await serviceClient
        .from("reciter_profiles").select("user_id").eq("id", reciter_id).maybeSingle();
      targetUserId = rec?.user_id;
    }

    // Delete dependent data
    if (targetUserId) {
      await serviceClient.from("reciter_certifications").delete().eq("reciter_id", targetUserId);
    }
    if (reciter_id) {
      await serviceClient.from("reciter_profiles").delete().eq("id", reciter_id);
    } else if (targetUserId) {
      await serviceClient.from("reciter_profiles").delete().eq("user_id", targetUserId);
    }

    if (targetUserId) {
      await serviceClient.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "reciter");
      // Try to delete auth user (best-effort)
      try {
        await serviceClient.auth.admin.deleteUser(targetUserId);
      } catch (_) { /* ignore */ }
    }

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
