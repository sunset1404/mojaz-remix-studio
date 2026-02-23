// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * request-call Edge Function
 * Invoked by the student to initiate a call with a reciter.
 * Inserts a video_call_sessions record, triggering Postgres Realtime listeners for the reciter.
 */
serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

        // Create client using the request's auth header to run as the calling user
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

        // Extract reciter_id from request body
        const body = await req.json();
        const { reciter_id } = body;

        if (!reciter_id) {
            return new Response(JSON.stringify({ error: "reciter_id is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Get the authenticated student user
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const student_id = user.id;

        // Optional: Fetch student name for the reciter's incoming call screen
        const { data: studentProfile } = await supabaseClient
            .from('student_profiles')
            .select('full_name')
            .eq('user_id', student_id)
            .single();

        const student_name = studentProfile?.full_name || "طالب بدون اسم";

        // Insert the video call session
        const { data: callSession, error: insertError } = await supabaseClient
            .from('video_call_sessions')
            .insert({
                reciter_id,
                student_id,
                student_name,
                status: 'waiting',
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

        console.log(`Call requested by ${student_id} for reciter ${reciter_id}. Session ID: ${callSession.id}`);

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
