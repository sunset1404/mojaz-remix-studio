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

const IJAZAH_TRACK = "الحصول على إجازة قرآنية";

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

    // track filter: "ijazah" | "general" | "all"
    let track = "all";
    try { const b = await req.json(); track = b?.track || "all"; } catch (_) {}

    // 1) All student profiles
    let q = admin.from("student_profiles").select("*").order("created_at", { ascending: false });
    if (track === "ijazah") q = q.eq("preferred_track", IJAZAH_TRACK);
    if (track === "general") q = q.neq("preferred_track", IJAZAH_TRACK);
    const { data: profiles, error: pErr } = await q;
    if (pErr) throw pErr;

    // 2) Roles map
    const { data: allRoles } = await admin.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, Set<string>>();
    for (const r of allRoles || []) {
      const s = rolesByUser.get((r as any).user_id) || new Set<string>();
      s.add((r as any).role);
      rolesByUser.set((r as any).user_id, s);
    }

    // 3) Auth users (paginate)
    const authMap = new Map<string, any>();
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 500 });
      const users = list?.users || [];
      for (const u of users) authMap.set(u.id, u);
      if (users.length < 500) break;
    }

    const result: any[] = [];
    const seenIds = new Set<string>();

    for (const p of profiles || []) {
      seenIds.add(p.user_id);
      const u = authMap.get(p.user_id);
      const emailConfirmed = !!u?.email_confirmed_at;
      const account_state = !emailConfirmed ? "unconfirmed" : "active";
      result.push({
        ...p,
        auth_email: u?.email || null,
        email_confirmed_at: u?.email_confirmed_at || null,
        last_sign_in_at: u?.last_sign_in_at || null,
        account_state,
        is_orphan: false,
      });
    }

    // Orphans: auth users that are NOT reciter/partner/admin and have no student profile
    // (likely abandoned student signups or unconfirmed emails)
    const NON_STUDENT_ROLES = new Set(["reciter", "partner", "admin"]);
    for (const [uid, u] of authMap) {
      if (seenIds.has(uid)) continue;
      const roles = rolesByUser.get(uid);
      if (roles && roles.size > 0) {
        const onlyOther = [...roles].every((r) => NON_STUDENT_ROLES.has(r));
        if (onlyOther) continue;
      }
      result.push({
        id: null,
        user_id: uid,
        full_name: u.user_metadata?.full_name || "(بدون بيانات)",
        gender: "",
        id_number: "",
        email: u.email || "",
        residence_country: "",
        nationality: "",
        phone: "",
        profession: "",
        education_level: "",
        quran_certifications: "",
        preferred_riwaya: "",
        preferred_track: "",
        ijazah_status: null,
        assigned_reciter_id: null,
        created_at: u.created_at,
        auth_email: u.email || null,
        email_confirmed_at: u.email_confirmed_at || null,
        last_sign_in_at: u.last_sign_in_at || null,
        account_state: "incomplete",
        is_orphan: true,
      });
    }

    return json({ accounts: result });
  } catch (e) {
    console.error("list-student-accounts error", e);
    return json({ error: e instanceof Error ? e.message : "internal" }, 500);
  }
});
