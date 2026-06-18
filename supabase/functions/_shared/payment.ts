import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type SourceType = "subscription" | "gift" | "extra_hours";

const MOYASAR_API_BASE = Deno.env.get("MOYASAR_API_BASE") ?? "https://api.moyasar.com/v1";
const MOYASAR_SECRET_KEY =
  Deno.env.get("MOYASSAR_SECRET_KEY") ?? Deno.env.get("MOYASAR_SECRET_KEY") ?? "";

const EXTRA_HOURS_PACKAGES = [
  { hours: 1, price: 15, label: "ساعة واحدة" },
  { hours: 3, price: 40, label: "٣ ساعات" },
  { hours: 5, price: 60, label: "٥ ساعات" },
  { hours: 10, price: 100, label: "١٠ ساعات" },
];

function basicAuthHeader(secretKey: string): string {
  return "Basic " + btoa(`${secretKey}:`);
}

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim() || null;
}

function safeNumber(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

export async function processMoyasarPayment(params: {
  payment_id: string;
  payment_ref?: string | null;
  expected_user_id?: string;
}) {
  if (!MOYASAR_SECRET_KEY) {
    throw new Error("Missing MOYASSAR_SECRET_KEY");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Verify payment with Moyasar API
  const moyasarRes = await fetch(`${MOYASAR_API_BASE}/payments/${params.payment_id}`, {
    headers: {
      Authorization: basicAuthHeader(MOYASAR_SECRET_KEY),
    },
  });

  if (!moyasarRes.ok) {
    const errData = await moyasarRes.text();
    throw new Error(`Moyasar verification failed: ${errData}`);
  }

  const payment = await moyasarRes.json();
  const paymentStatus = String(payment?.status || "");

  if (!["paid", "captured"].includes(paymentStatus)) {
    if (params.payment_ref) {
      await supabase
        .from("payment_invoice_metadata")
        .update({ status: "failed", moyassar_payment_id: params.payment_id, updated_at: nowIso() })
        .eq("id", params.payment_ref);
    }
    return { success: false, error: "Payment not completed", status: paymentStatus };
  }

  // 2. Resolve payment ref and metadata row
  const paymentRef =
    params.payment_ref ||
    safeString(payment?.metadata?.payment_ref) ||
    safeString(payment?.metadata?.paymentRef);

  if (!paymentRef) {
    return { success: false, error: "Missing payment reference" };
  }

  const { data: paymentRow, error: rowError } = await supabase
    .from("payment_invoice_metadata")
    .select("*")
    .eq("id", paymentRef)
    .maybeSingle();

  if (rowError || !paymentRow) {
    return { success: false, error: "Payment reference not found" };
  }

  if (params.expected_user_id && paymentRow.user_id !== params.expected_user_id) {
    return { success: false, error: "User mismatch" };
  }

  if (paymentRow.moyassar_payment_id && paymentRow.moyassar_payment_id !== params.payment_id) {
    return { success: false, error: "Payment ID mismatch" };
  }

  const expectedAmountHalalas = Math.round(Number(paymentRow.amount_sar) * 100);
  if (payment.amount !== expectedAmountHalalas) {
    await supabase
      .from("payment_invoice_metadata")
      .update({ status: "failed", moyassar_payment_id: params.payment_id, updated_at: nowIso() })
      .eq("id", paymentRow.id);
    return { success: false, error: "Amount mismatch" };
  }

  // Try to lock processing
  const { data: lockRow } = await supabase
    .from("payment_invoice_metadata")
    .update({ processed: true, updated_at: nowIso() })
    .eq("id", paymentRow.id)
    .eq("processed", false)
    .select("id")
    .maybeSingle();

  if (!lockRow) {
    return { success: true, message: "Already processed" };
  }

  const metadata = (paymentRow.metadata || {}) as Record<string, any>;

  try {
    // 3. Process based on source_type
    const sourceType = paymentRow.source_type as SourceType;
    let result: Record<string, any> = {};

    if (sourceType === "subscription") {
      const months = safeNumber(metadata.duration_months) ?? 1;
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // ملاحظة: نسمح بتعدد الاشتراكات النشطة - كل باقة لها مميزاتها الخاصة
      // لا يتم استبدال أو إنهاء أي اشتراك سابق
      const startDate = today;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      const prorationNote = "";


      const { data: subscription, error: subError } = await supabase
        .from("student_subscriptions")
        .insert({
          student_id: paymentRow.user_id,
          student_name: metadata.student_name || "طالب",
          student_phone: metadata.student_phone || null,
          subscription_type: metadata.subscription_type || metadata.plan_name || "اشتراك",
          amount: paymentRow.amount_sar,
          duration_months: months,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          status: "active",
          notes: `تم الاشتراك عبر الدفع الإلكتروني - ${metadata.plan_name || ""}${prorationNote}`,
        })
        .select()
        .single();

      if (subError) throw subError;

      // Add subscription minutes to student credits
      const monthlyMinutes = safeNumber(metadata.monthly_minutes) ?? 0;
      if (monthlyMinutes > 0) {
        const totalMinutes = monthlyMinutes * months;
        const { data: existingCredit } = await supabase
          .from("student_hour_credits")
          .select("id, remaining_minutes")
          .eq("user_id", paymentRow.user_id)
          .maybeSingle();

        if (existingCredit) {
          await supabase
            .from("student_hour_credits")
            .update({ remaining_minutes: Number(existingCredit.remaining_minutes) + totalMinutes, updated_at: nowIso() })
            .eq("id", existingCredit.id);
        } else {
          await supabase
            .from("student_hour_credits")
            .insert({ user_id: paymentRow.user_id, remaining_minutes: totalMinutes, updated_at: nowIso() });
        }
      }

      await supabase.from("transactions").insert({
        user_id: paymentRow.user_id,
        title: `اشتراك ${metadata.plan_name || ""}`,
        date: startDate.toISOString().split("T")[0],
        amount: `${paymentRow.amount_sar}`,
        status: "مكتمل",
      });

      result = { subscription_id: subscription.id };

    } else if (sourceType === "gift") {
      const months = safeNumber(metadata.duration_months) ?? 1;
      const giftCode = safeString(metadata.gift_code) || generateGiftCode();

      const { data: gift, error: giftError } = await supabase
        .from("gift_subscriptions")
        .insert({
          sender_id: paymentRow.user_id,
          recipient_name: metadata.recipient_name,
          recipient_phone: metadata.recipient_phone,
          personal_message: metadata.personal_message || null,
          plan_id: metadata.plan_id || metadata.plan_name,
          plan_name: metadata.plan_name,
          duration_months: months,
          amount: paymentRow.amount_sar,
          gift_code: giftCode,
          status: "pending",
        })
        .select()
        .single();

      if (giftError) throw giftError;

      await supabase.from("transactions").insert({
        user_id: paymentRow.user_id,
        title: `هدية اشتراك - ${metadata.plan_name || ""}`,
        date: new Date().toISOString().split("T")[0],
        amount: `${paymentRow.amount_sar}`,
        status: "مكتمل",
      });

      result = { gift_id: gift.id, gift_code: gift.gift_code };

    } else if (sourceType === "extra_hours") {
      const hours = safeNumber(metadata.hours) ?? 0;
      const minutesToAdd = hours * 60;

      const { data: existingCredit } = await supabase
        .from("student_hour_credits")
        .select("id, remaining_minutes")
        .eq("user_id", paymentRow.user_id)
        .maybeSingle();

      if (existingCredit) {
        await supabase
          .from("student_hour_credits")
          .update({ remaining_minutes: Number(existingCredit.remaining_minutes) + minutesToAdd, updated_at: nowIso() })
          .eq("id", existingCredit.id);
      } else {
        await supabase
          .from("student_hour_credits")
          .insert({ user_id: paymentRow.user_id, remaining_minutes: minutesToAdd, updated_at: nowIso() });
      }

      await supabase.from("transactions").insert({
        user_id: paymentRow.user_id,
        title: `ساعات إضافية - ${metadata.package_label || ""}`,
        date: new Date().toISOString().split("T")[0],
        amount: `${paymentRow.amount_sar}`,
        status: "مكتمل",
      });

      result = { hours_added: hours };
    }

    // 4. Mark metadata as processed
    await supabase
      .from("payment_invoice_metadata")
      .update({
        status: "paid",
        processed: true,
        moyassar_payment_id: params.payment_id,
        updated_at: nowIso(),
      })
      .eq("id", paymentRow.id);

    return { success: true, ...result };
  } catch (error) {
    await supabase
      .from("payment_invoice_metadata")
      .update({
        status: "failed",
        processed: false,
        moyassar_payment_id: params.payment_id,
        updated_at: nowIso(),
      })
      .eq("id", paymentRow.id);
    throw error;
  }
}

export async function computeExpectedAmount(params: {
  source_type: SourceType;
  plan_name?: string | null;
  duration_months?: number | null;
  hours?: number | null;
  package_label?: string | null;
}) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (params.source_type === "subscription") {
    const planName = safeString(params.plan_name);
    if (!planName) throw new Error("Missing plan_name");

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("name, price_monthly, price_yearly, has_billing, monthly_minutes")
      .eq("name", planName)
      .eq("is_active", true)
      .maybeSingle();

    if (!plan) throw new Error("Subscription plan not found");

    const months = params.duration_months && params.duration_months >= 12 ? 12 : 1;
    const amount = months === 12 && plan.price_yearly ? Number(plan.price_yearly) : Number(plan.price_monthly);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid subscription price");

    return {
      amount_sar: amount,
      metadata: {
        plan_name: plan.name,
        duration_months: months,
        monthly_minutes: plan.monthly_minutes ?? 0,
      },
    };
  }

  if (params.source_type === "gift") {
    const planName = safeString(params.plan_name);
    if (!planName) throw new Error("Missing plan_name");

    const { data: plan } = await supabase
      .from("gift_plans")
      .select("name, price, duration_months")
      .eq("name", planName)
      .eq("is_active", true)
      .maybeSingle();

    if (!plan) throw new Error("Gift plan not found");

    const amount = Number(plan.price);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid gift price");

    return {
      amount_sar: amount,
      metadata: {
        plan_name: plan.name,
        duration_months: Number(plan.duration_months),
      },
    };
  }

  const hours = safeNumber(params.hours);
  if (!hours) throw new Error("Missing hours");

  // Look up package from database
  const { data: pkg } = await supabase
    .from("extra_hour_packages")
    .select("hours, price, label")
    .eq("hours", hours)
    .eq("is_active", true)
    .maybeSingle();

  if (!pkg) {
    // Fallback to hardcoded packages
    const fallbackPkg = EXTRA_HOURS_PACKAGES.find((p) => p.hours === hours);
    if (!fallbackPkg) throw new Error("Unknown hours package");
    return {
      amount_sar: fallbackPkg.price,
      metadata: {
        hours: fallbackPkg.hours,
        package_label: params.package_label || fallbackPkg.label,
      },
    };
  }

  return {
    amount_sar: Number(pkg.price),
    metadata: {
      hours: Number(pkg.hours),
      package_label: params.package_label || pkg.label,
    },
  };
}
