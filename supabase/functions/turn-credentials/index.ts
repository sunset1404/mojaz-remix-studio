// Issues short-lived coturn REST credentials for an authorized call participant.
// The coturn relay itself runs on our own infrastructure; this function only signs
// temporary credentials. No TURN secret, session access_token, or JWT is returned.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createTurnCredential, normalizeTtl, parseTurnUrls } from "./credentials.ts";
import {
    authorizeTurnRequest,
    checkRateLimit,
    createRateLimitState,
    shortIdentity,
    type CallRow,
    type TurnErrorCode,
} from "./authorize.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

const fail = (code: TurnErrorCode, status: number) => json({ error: code }, status);

const rateLimitState = createRateLimitState();
const RATE_LIMIT = { limit: 12, windowMs: 60_000 };

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (req.method !== "POST") return fail("invalid_request", 405);

    try {
        const turnUrls = parseTurnUrls(Deno.env.get("TURN_URLS"));
        const sharedSecret = Deno.env.get("TURN_SHARED_SECRET") ?? "";
        if (turnUrls.length === 0 || !sharedSecret) {
            // Client keeps its STUN-only configuration and marks the call degraded.
            return fail("turn_not_configured", 503);
        }
        const ttlSeconds = normalizeTtl(Deno.env.get("TURN_TTL_SECONDS"));

        const body = await req.json().catch(() => ({}));
        const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
        const linkToken = typeof body?.linkToken === "string" ? body.linkToken.trim() : "";
        if (!roomId || roomId.length > 128 || linkToken.length > 256) {
            return fail("invalid_request", 400);
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

        let userId: string | null = null;
        const authHeader = req.headers.get("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
                global: { headers: { Authorization: authHeader } },
            });
            const accessToken = authHeader.replace("Bearer ", "");
            const { data: claims } = await anon.auth.getClaims(accessToken);
            userId = (claims?.claims?.sub as string | undefined) ?? null;
        }

        // access_token is only ever compared server-side and never returned.
        const { data: call } = await admin
            .from("video_call_sessions")
            .select("room_id, status, reciter_id, student_id, access_token, link_used")
            .eq("room_id", roomId)
            .maybeSingle();

        const linkTokenValid = Boolean(
            linkToken && call?.access_token && linkToken === call.access_token,
        );

        const decision = authorizeTurnRequest({
            call: (call as CallRow | null) ?? null,
            requestedRoomId: roomId,
            userId,
            linkTokenValid,
        });
        if (!decision.ok) return fail(decision.code, decision.status);

        const limiterKey = `${decision.via}:${userId ?? shortIdentity(roomId)}`;
        if (!checkRateLimit(rateLimitState, limiterKey, RATE_LIMIT)) {
            return fail("rate_limited", 429);
        }

        const credential = await createTurnCredential({
            sharedSecret,
            identity: decision.identity,
            ttlSeconds,
        });

        return json({
            iceServers: [
                {
                    urls: turnUrls,
                    username: credential.username,
                    credential: credential.credential,
                },
            ],
            expiresAt: credential.expiresAt,
        });
    } catch (error) {
        console.error("turn-credentials failed:", error instanceof Error ? error.name : "unknown");
        return fail("internal_error", 500);
    }
});
