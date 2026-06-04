// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const token = authHeader.replace("Bearer ", "");
        const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

        if (claimsError || !claimsData?.claims) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const body = await req.json();
        const { reciter_id } = body;

        if (!reciter_id) {
            return new Response(JSON.stringify({ error: "reciter_id is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const student_id = claimsData.claims.sub;

        // Use service role to check credits (bypasses RLS)
        const adminClient = createClient(supabaseUrl, serviceRoleKey);

        // Check active subscription
        const { data: activeSub } = await adminClient
            .from("student_subscriptions")
            .select("id, end_date")
            .eq("student_id", student_id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!activeSub) {
            return new Response(JSON.stringify({ 
                error: "no_subscription",
                message: "ليس لديك اشتراك نشط. يرجى الاشتراك أولاً." 
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Check remaining minutes
        const { data: credits } = await adminClient
            .from("student_hour_credits")
            .select("remaining_minutes")
            .eq("user_id", student_id)
            .maybeSingle();

        const remainingMinutes = credits?.remaining_minutes ?? 0;

        if (remainingMinutes <= 0) {
            return new Response(JSON.stringify({ 
                error: "no_credits",
                message: "نفذ رصيد ساعاتك. يرجى تجديد الاشتراك أو شراء ساعات إضافية." 
            }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Fetch student name
        const { data: studentProfile } = await supabaseClient
            .from('student_profiles')
            .select('full_name')
            .eq('user_id', student_id)
            .single();

        const student_name = studentProfile?.full_name || "طالب بدون اسم";

        // Insert the video call session using service role (bypasses RLS)
        const { data: callSession, error: insertError } = await adminClient
            .from('video_call_sessions')
            .insert({
                reciter_id,
                student_id,
                student_name,
                status: 'waiting',
                caller_role: 'student',
            })
            .select()
            .single();

        if (insertError) {
            console.error("Error creating call session:", insertError);
            return new Response(JSON.stringify({ error: "Failed to create call session", details: insertError }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Call requested by ${student_id} for reciter ${reciter_id}. Session ID: ${callSession.id}. Remaining minutes: ${remainingMinutes}`);

        return new Response(JSON.stringify(callSession), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", message: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
