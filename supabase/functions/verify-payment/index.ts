// Moyassar Payment Verification Edge Function
// Verifies payment status with Moyassar API and activates subscriptions/gifts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const MOYASAR_API_BASE = Deno.env.get("MOYASAR_API_BASE") ?? "https://api.moyasar.com/v1";
const MOYASAR_SECRET_KEY = Deno.env.get("MOYASAR_SECRET_KEY") ?? "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function basicAuthHeader(secretKey: string): string {
    return "Basic " + btoa(`${secretKey}:`);
}

function generateGiftCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "GIFT-";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

interface VerifyRequest {
    payment_id: string;
    user_id: string;
    source_type: "subscription" | "gift" | "extra_hours";
    metadata: Record<string, any>;
}

async function handler(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!MOYASAR_SECRET_KEY) {
        console.error("Missing MOYASAR_SECRET_KEY");
        return new Response(JSON.stringify({ error: "Payment service not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body: VerifyRequest = await req.json();
        const { payment_id, user_id, source_type, metadata } = body;

        console.log("Verifying payment:", { payment_id, user_id, source_type });

        if (!payment_id || !user_id || !source_type) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 1. Verify payment with Moyassar API
        const moyasarRes = await fetch(`${MOYASAR_API_BASE}/payments/${payment_id}`, {
            headers: {
                Authorization: basicAuthHeader(MOYASAR_SECRET_KEY),
            },
        });

        if (!moyasarRes.ok) {
            const errData = await moyasarRes.json();
            console.error("Moyassar verification failed:", errData);
            return new Response(JSON.stringify({ error: "Payment verification failed", details: errData }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const payment = await moyasarRes.json();
        console.log("Moyassar payment data:", { status: payment.status, amount: payment.amount });

        if (payment.status !== "paid") {
            // Update metadata status
            await supabase
                .from("payment_invoice_metadata")
                .update({ status: "failed", updated_at: new Date().toISOString() })
                .eq("moyassar_payment_id", payment_id);

            return new Response(JSON.stringify({ error: "Payment not completed", status: payment.status }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Verify amount matches
        const expectedAmountHalalas = Math.round((metadata.amount_sar || 0) * 100);
        if (payment.amount !== expectedAmountHalalas) {
            console.error("Amount mismatch:", { expected: expectedAmountHalalas, received: payment.amount });
            return new Response(JSON.stringify({ error: "Amount mismatch" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 3. Check for duplicate processing
        const { data: existingMetadata } = await supabase
            .from("payment_invoice_metadata")
            .select("processed")
            .eq("moyassar_payment_id", payment_id)
            .single();

        if (existingMetadata?.processed) {
            console.log("Payment already processed, returning success");
            return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 4. Process based on source_type
        let result: any = {};

        if (source_type === "subscription") {
            const startDate = new Date();
            const months = metadata.duration_months || 1;
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + months);

            const { data: subscription, error: subError } = await supabase
                .from("student_subscriptions")
                .insert({
                    student_id: user_id,
                    student_name: metadata.student_name || "طالب",
                    student_phone: metadata.student_phone || null,
                    subscription_type: metadata.subscription_type || metadata.plan_name,
                    amount: metadata.amount_sar,
                    duration_months: months,
                    start_date: startDate.toISOString().split("T")[0],
                    end_date: endDate.toISOString().split("T")[0],
                    status: "active",
                    notes: `تم الاشتراك عبر الدفع الإلكتروني - ${metadata.plan_name || ""}`,
                })
                .select()
                .single();

            if (subError) {
                console.error("Error creating subscription:", subError);
                throw subError;
            }

            // Record transaction
            await supabase.from("transactions").insert({
                user_id: user_id,
                title: `اشتراك ${metadata.plan_name || ""}`,
                date: startDate.toISOString().split("T")[0],
                amount: `${metadata.amount_sar}`,
                status: "مكتمل",
            });

            result = { subscription_id: subscription.id };
            console.log("Subscription created:", subscription.id);

        } else if (source_type === "gift") {
            const giftCode = generateGiftCode();
            const months = metadata.duration_months || 1;

            const { data: gift, error: giftError } = await supabase
                .from("gift_subscriptions")
                .insert({
                    sender_id: user_id,
                    recipient_name: metadata.recipient_name,
                    recipient_phone: metadata.recipient_phone,
                    personal_message: metadata.personal_message || null,
                    plan_id: metadata.plan_id,
                    plan_name: metadata.plan_name,
                    duration_months: months,
                    amount: metadata.amount_sar,
                    gift_code: giftCode,
                    status: "pending",
                })
                .select()
                .single();

            if (giftError) {
                console.error("Error creating gift:", giftError);
                throw giftError;
            }

            // Record transaction
            await supabase.from("transactions").insert({
                user_id: user_id,
                title: `هدية اشتراك - ${metadata.plan_name || ""}`,
                date: new Date().toISOString().split("T")[0],
                amount: `${metadata.amount_sar}`,
                status: "مكتمل",
            });

            result = { gift_id: gift.id, gift_code: giftCode };
            console.log("Gift created:", gift.id, "code:", giftCode);

        } else if (source_type === "extra_hours") {
            // Record transaction for extra hours
            await supabase.from("transactions").insert({
                user_id: user_id,
                title: `ساعات إضافية - ${metadata.package_label || ""}`,
                date: new Date().toISOString().split("T")[0],
                amount: `${metadata.amount_sar}`,
                status: "مكتمل",
            });

            result = { hours_added: metadata.hours || 0 };
            console.log("Extra hours recorded:", metadata.hours);
        }

        // 5. Mark metadata as processed
        await supabase
            .from("payment_invoice_metadata")
            .update({
                status: "paid",
                processed: true,
                updated_at: new Date().toISOString(),
            })
            .eq("moyassar_payment_id", payment_id);

        return new Response(
            JSON.stringify({ success: true, ...result }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Verification error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", details: String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
}

serve(handler);
