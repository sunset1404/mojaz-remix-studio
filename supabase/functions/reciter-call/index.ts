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

        const reciter_id = claimsData.claims.sub;

        const body = await req.json();
        const { student_id } = body;

        if (!student_id) {
            return new Response(JSON.stringify({ error: "student_id is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const adminClient = createClient(supabaseUrl, serviceRoleKey);

        // Validate the student is assigned to this reciter
        const { data: studentProfile, error: studentError } = await adminClient
            .from("student_profiles")
            .select("full_name, assigned_reciter_id")
            .eq("user_id", student_id)
            .maybeSingle();

        if (!studentProfile) {
            return new Response(JSON.stringify({ error: "student_not_found", message: "لم يتم العثور على الطالب" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (studentProfile.assigned_reciter_id !== reciter_id) {
            return new Response(JSON.stringify({ error: "not_assigned", message: "هذا الطالب غير مسجل لديك" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const student_name = studentProfile.full_name || "طالب بدون اسم";

        // Insert call session using service role (bypasses RLS)
        const { data: callSession, error: insertError } = await adminClient
            .from("video_call_sessions")
            .insert({
                reciter_id,
                student_id,
                student_name,
                status: "waiting",
                caller_role: "reciter",
                reciter_joined_at: new Date().toISOString(),
            })
            .select("id, room_id")
            .single();

        if (insertError) {
            console.error("Error creating call session:", insertError);
            return new Response(JSON.stringify({ error: "Failed to create call session", details: insertError }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Reciter ${reciter_id} calling student ${student_id}. Session: ${callSession.id}, Room: ${callSession.room_id}`);

        return new Response(JSON.stringify({ room_id: callSession.room_id, session_id: callSession.id }), {
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
