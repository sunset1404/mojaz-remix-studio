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

    // 1) All reciter profiles
    const { data: profiles, error: pErr } = await admin
      .from("reciter_profiles").select("*").order("created_at", { ascending: false });
    if (pErr) throw pErr;

    // 2) All user_roles (to identify orphans with no role and reciters)
    const { data: allRoles } = await admin
      .from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, Set<string>>();
    for (const r of allRoles || []) {
      const s = rolesByUser.get((r as any).user_id) || new Set<string>();
      s.add((r as any).role);
      rolesByUser.set((r as any).user_id, s);
    }
    const reciterRoleIds = new Set<string>();
    for (const [uid, roles] of rolesByUser) {
      if (roles.has("reciter")) reciterRoleIds.add(uid);
    }

    // 3) Load auth users (paginate up to 5000)
    const authMap = new Map<string, any>();
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 500 });
      const users = list?.users || [];
      for (const u of users) authMap.set(u.id, u);
      if (users.length < 500) break;
    }

    // Build unified list
    const result: any[] = [];
    const seenIds = new Set<string>();

    for (const p of profiles || []) {
      seenIds.add(p.user_id);
      const u = authMap.get(p.user_id);
      const emailConfirmed = !!u?.email_confirmed_at;
      let account_state: string;
      if (!emailConfirmed) account_state = "unconfirmed";
      else if (p.status === "approved") account_state = "approved";
      else if (p.status === "rejected") account_state = "rejected";
      else account_state = "pending";

      result.push({
        ...p,
        email: u?.email || null,
        email_confirmed_at: u?.email_confirmed_at || null,
        last_sign_in_at: u?.last_sign_in_at || null,
        account_state,
        is_orphan: false,
      });
    }

    // Orphans: have reciter role but no profile
    for (const uid of reciterRoleIds) {
      if (seenIds.has(uid)) continue;
      const u = authMap.get(uid);
      if (!u) continue;
      result.push({
        id: null,
        user_id: uid,
        full_name: u.user_metadata?.full_name || "(بدون بيانات)",
        gender: "",
        nationality: "",
        phone: "",
        city: "",
        profession: "",
        qualifications: "",
        teaching_experience: "",
        quran_certifications: "",
        preferred_track: "",
        preferred_days: [],
        preferred_times: [],
        id_number: "",
        status: "incomplete",
        reciter_type: "general",
        stamp_url: null,
        signature_url: null,
        created_at: u.created_at,
        email: u.email || null,
        email_confirmed_at: u.email_confirmed_at || null,
        last_sign_in_at: u.last_sign_in_at || null,
        account_state: "incomplete",
        is_orphan: true,
      });
    }

    return json({ accounts: result });
  } catch (e) {
    console.error("list-reciter-accounts error", e);
    return json({ error: e instanceof Error ? e.message : "internal" }, 500);
  }
});
