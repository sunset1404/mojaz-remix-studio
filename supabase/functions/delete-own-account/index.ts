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
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    // Only ever act on the caller's own account.
    const userId = claimsData.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const byUser = [
      "notification_settings",
      "notifications",
      "session_records",
      "weekly_plans",
      "certificates",
      "payment_cards",
      "transactions",
      "student_hour_credits",
      "payment_invoice_metadata",
      "popup_message_views",
      "student_profiles",
      "reciter_profiles",
      "partner_profiles",
      "profiles",
      "user_roles",
    ];
    for (const t of byUser) {
      try {
        await admin.from(t).delete().eq("user_id", userId);
      } catch (_) { /* ignore */ }
    }

    try {
      await admin.from("student_achievements").delete().eq("student_id", userId);
    } catch (_) { /* ignore */ }
    try {
      await admin.from("partner_students").delete().eq("student_id", userId);
    } catch (_) { /* ignore */ }
    try {
      await admin.from("reciter_certifications").delete().eq("reciter_id", userId);
    } catch (_) { /* ignore */ }

    // Remove stored avatar files (best effort)
    try {
      const { data: files } = await admin.storage.from("avatars").list(userId);
      if (files?.length) {
        await admin.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch (_) { /* ignore */ }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) return json({ error: deleteError.message }, 500);

    return json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});
