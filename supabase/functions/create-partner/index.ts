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

const clean = (value: unknown) => String(value ?? "").trim();
const normalizeEmail = (value: unknown) =>
  clean(value)
    .replace(/\s+/g, "")
    .toLowerCase();

const isReasonableEmail = (email: string) => {
  const at = email.indexOf("@");
  const dot = email.lastIndexOf(".");
  return at > 0 && dot > at + 1 && dot < email.length - 1;
};

const translateAuthError = (message: string) => {
  const m = String(message || "").toLowerCase();
  if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("least"))) {
    return "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
  }
  if (m.includes("already") || m.includes("registered") || m.includes("exists") || m.includes("email")) {
    return "البريد الإلكتروني مستخدم مسبقاً";
  }
  return message || "تعذر إنشاء حساب الشريك";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let createdUserId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("create-partner: missing required Supabase environment variables");
      return json({ error: "إعدادات الخادم غير مكتملة لإنشاء حساب الشريك" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "انتهت جلسة المدير أو لم يتم إرسال صلاحية الدخول" }, 401);
    }

    // Verify caller using the same proven flow used by the admin-account function.
    // getUser() is intentionally used here instead of getClaims() to avoid JWT/JWKS
    // compatibility failures that surface in the UI only as "non-2xx".
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    const caller = userData?.user;
    if (userError || !caller) {
      console.error("create-partner: caller auth failed", userError?.message);
      return json({ error: "تعذر التحقق من جلسة المدير، حدّث الصفحة وسجّل الدخول ثم أعد المحاولة" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("create-partner: admin role lookup failed", roleError);
      return json({ error: "تعذر التحقق من صلاحيات المدير" }, 500);
    }
    if (!roleData) return json({ error: "هذه العملية متاحة لمدير النظام فقط" }, 403);

    // Fail early with a clear diagnosis when the partner role/schema was
    // accidentally removed or a repair migration has not been applied yet.
    const { data: partnerHealth, error: partnerHealthError } = await admin.rpc("partner_account_health");
    if (partnerHealthError) {
      console.error("create-partner: partner health check failed", partnerHealthError);
      return json({
        error: "بنية حسابات الشركاء غير مهيأة على الخادم. طبّق آخر تحديثات قاعدة البيانات ثم أعد المحاولة.",
        code: "partner_schema_not_ready",
      }, 503);
    }

    const health = (partnerHealth || {}) as Record<string, boolean>;
    if (!health.partner_role || !health.partner_profiles) {
      console.error("create-partner: partner infrastructure incomplete", health);
      return json({
        error: "صلاحية الشريك أو جدول حسابات الشركاء مفقود. تم تجهيز إصلاح له في آخر تحديث لقاعدة البيانات.",
        code: "partner_schema_incomplete",
        health,
      }, 503);
    }

    const body = await req.json();
    const email = normalizeEmail(body?.email);
    const password = String(body?.password ?? "");
    const fullName = clean(body?.full_name);
    const phone = clean(body?.phone);
    const organizationName = clean(body?.organization_name);
    const parsedSupport = Number(body?.total_support_amount ?? 0);
    const totalSupportAmount = Number.isFinite(parsedSupport) && parsedSupport >= 0 ? parsedSupport : 0;

    if (!email || !password || !fullName) {
      return json({ error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة" }, 400);
    }
    if (!isReasonableEmail(email)) {
      return json({ error: "أدخل بريدًا إلكترونيًا مثل name@example.com" }, 400);
    }
    if (password.length < 6) {
      return json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, 400);
    }

    // Give a useful duplicate-email message and recycle only orphaned auth accounts.
    // This RPC already exists in this project and is used by create-student/create-reciter.
    const { data: emailStatus, error: emailStatusError } = await admin.rpc(
      "get_email_registration_status",
      { p_email: email }
    );

    if (!emailStatusError && emailStatus === "active") {
      return json({ error: "البريد الإلكتروني مستخدم مسبقاً - الحساب موجود ومفعل" }, 400);
    }

    if (!emailStatusError && emailStatus === "needs_activation") {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const orphan = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
      if (orphan) {
        await admin.from("partner_profiles").delete().eq("user_id", orphan.id);
        await admin.from("student_profiles").delete().eq("user_id", orphan.id);
        await admin.from("reciter_profiles").delete().eq("user_id", orphan.id);
        await admin.from("user_roles").delete().eq("user_id", orphan.id);
        await admin.from("profiles").delete().eq("user_id", orphan.id);
        try { await admin.auth.admin.deleteUser(orphan.id); } catch (_) {}
      }
    }

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !newUser?.user?.id) {
      console.error("create-partner: auth user creation failed", createError);
      return json({ error: translateAuthError(createError?.message || "تعذر إنشاء المستخدم") }, 400);
    }

    createdUserId = newUser.user.id;

    // Keep the generic profile in sync; handle_new_user may already have created it.
    const { error: baseProfileError } = await admin.from("profiles").upsert(
      { user_id: createdUserId, full_name: fullName, phone: phone || null },
      { onConflict: "user_id" } as any
    );
    if (baseProfileError) {
      console.error("create-partner: base profile failed", baseProfileError);
      throw new Error(`تعذر حفظ الملف الأساسي: ${baseProfileError.message}`);
    }

    const { error: partnerRoleError } = await admin.from("user_roles").upsert(
      { user_id: createdUserId, role: "partner" },
      { onConflict: "user_id,role", ignoreDuplicates: true } as any
    );
    if (partnerRoleError) {
      console.error("create-partner: role insert failed", partnerRoleError);
      const roleMessage = String(partnerRoleError.message || "");
      if (/app_role|enum|partner/i.test(roleMessage)) {
        throw new Error("تعذر إضافة صلاحية الشريك لأن role=partner غير مهيأ في قاعدة البيانات. طبّق آخر migration ثم أعد المحاولة.");
      }
      throw new Error(`تعذر إضافة صلاحية الشريك: ${roleMessage}`);
    }

    const { error: partnerProfileError } = await admin.from("partner_profiles").upsert(
      {
        user_id: createdUserId,
        full_name: fullName,
        email,
        phone: phone || null,
        organization_name: organizationName || null,
        total_support_amount: totalSupportAmount,
      },
      { onConflict: "user_id" } as any
    );

    if (partnerProfileError) {
      console.error("create-partner: partner profile failed", partnerProfileError);
      const profileMessage = String(partnerProfileError.message || "");
      if (/partner_profiles|relation .* does not exist|column .* does not exist/i.test(profileMessage)) {
        throw new Error("جدول حسابات الشركاء غير مكتمل في قاعدة البيانات. طبّق آخر migration ثم أعد المحاولة.");
      }
      throw new Error(`تعذر إنشاء ملف الشريك: ${profileMessage}`);
    }

    return json({
      success: true,
      user_id: createdUserId,
      email,
      message: "تم إنشاء حساب الشريك بنجاح",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير متوقع أثناء إنشاء حساب الشريك";
    console.error("create-partner error:", error);

    // Do not leave a half-created auth account if a downstream profile/role write fails.
    if (createdUserId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const admin = createClient(supabaseUrl, serviceRoleKey);
        await admin.from("partner_profiles").delete().eq("user_id", createdUserId);
        await admin.from("user_roles").delete().eq("user_id", createdUserId).eq("role", "partner");
        await admin.from("profiles").delete().eq("user_id", createdUserId);
        await admin.auth.admin.deleteUser(createdUserId);
      } catch (rollbackError) {
        console.error("create-partner rollback failed:", rollbackError);
      }
    }

    return json({ error: message }, 500);
  }
});
