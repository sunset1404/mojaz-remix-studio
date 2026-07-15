import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const defaultStunServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
];

const splitUrls = (value: string | undefined): string[] =>
  (value || "")
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.startsWith("turn:"));

serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const turnUrls = splitUrls(Deno.env.get("TURN_URLS") || Deno.env.get("TURN_URL"));
  const username = Deno.env.get("TURN_USERNAME") || "";
  const credential = Deno.env.get("TURN_PASSWORD") || Deno.env.get("TURN_CREDENTIAL") || "";

  const iceServers = [...defaultStunServers];
  if (turnUrls.length && username && credential) {
    iceServers.push({ urls: turnUrls, username, credential });
  }

  return new Response(JSON.stringify({ iceServers, hasTurn: turnUrls.length > 0 && Boolean(username && credential) }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});