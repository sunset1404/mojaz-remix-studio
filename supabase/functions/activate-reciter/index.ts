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

    const { user_id, reciter_id } = await req.json();
    if (!user_id) return json({ error: "user_id required" }, 400);

    // Confirm email
    const { error: authErr } = await admin.auth.admin.updateUserById(user_id, { email_confirm: true });
    if (authErr) return json({ error: authErr.message }, 400);

    // Approve profile if exists
    let updateRes;
    if (reciter_id) {
      updateRes = await admin.from("reciter_profiles").update({ status: "approved" }).eq("id", reciter_id);
    } else {
      updateRes = await admin.from("reciter_profiles").update({ status: "approved" }).eq("user_id", user_id);
    }
    if (updateRes?.error) return json({ error: updateRes.error.message }, 400);

    return json({ success: true });
  } catch (e) {
    console.error("activate-reciter error", e);
    return json({ error: e instanceof Error ? e.message : "internal" }, 500);
  }
});
