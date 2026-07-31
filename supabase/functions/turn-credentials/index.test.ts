import { assertEquals, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createTurnCredential, normalizeTtl, parseTurnUrls } from "./credentials.ts";
import {
    authorizeTurnRequest,
    checkRateLimit,
    createRateLimitState,
    shortIdentity,
    type CallRow,
} from "./authorize.ts";

const call: CallRow = {
    room_id: "room-1",
    status: "waiting",
    reciter_id: "reciter-1",
    student_id: "student-1",
};

Deno.test("only turn:/turns: urls are advertised", () => {
    assertEquals(parseTurnUrls(undefined), []);
    assertEquals(parseTurnUrls("stun:stun.example.org"), []);
    assertEquals(
        parseTurnUrls(" turn:relay.example.org:3478 , stun:x , turns:relay.example.org:5349 "),
        ["turn:relay.example.org:3478", "turns:relay.example.org:5349"],
    );
    assertEquals(parseTurnUrls('["turn:relay.example.org:3478?transport=tcp"]'), [
        "turn:relay.example.org:3478?transport=tcp",
    ]);
});

Deno.test("ttl is clamped to a safe window", () => {
    assertEquals(normalizeTtl(undefined), 3600);
    assertEquals(normalizeTtl("not-a-number"), 3600);
    assertEquals(normalizeTtl(5), 60);
    assertEquals(normalizeTtl(999_999), 86_400);
    assertEquals(normalizeTtl("900"), 900);
});

Deno.test("coturn credential uses the expiry:identity username scheme", async () => {
    const nowMs = 1_700_000_000_000;
    const credential = await createTurnCredential({
        sharedSecret: "test-secret",
        identity: "user@id!",
        ttlSeconds: 600,
        nowMs,
    });
    assertEquals(credential.username, `${1_700_000_000 + 600}:userid`);
    assertEquals(credential.ttlSeconds, 600);
    assertEquals(credential.expiresAt, new Date((1_700_000_000 + 600) * 1000).toISOString());
    assertMatch(credential.credential, /^[A-Za-z0-9+/]+=*$/);

    // Deterministic for the same inputs, different for a different secret.
    const same = await createTurnCredential({ sharedSecret: "test-secret", identity: "user@id!", ttlSeconds: 600, nowMs });
    const other = await createTurnCredential({ sharedSecret: "other-secret", identity: "user@id!", ttlSeconds: 600, nowMs });
    assertEquals(credential.credential, same.credential);
    assertEquals(credential.credential === other.credential, false);
});

Deno.test("credential never embeds the full identity token", () => {
    assertEquals(shortIdentity("a-very-long-access-token-value-1234567890"), "averylongaccesst");
});

Deno.test("authorization allows only participants of a joinable call", () => {
    assertEquals(authorizeTurnRequest({ call, requestedRoomId: "", userId: "student-1" }).ok, false);
    assertEquals(authorizeTurnRequest({ call: null, requestedRoomId: "room-1" }).ok, false);
    assertEquals(authorizeTurnRequest({ call, requestedRoomId: "room-2", userId: "student-1" }).ok, false);
    assertEquals(
        authorizeTurnRequest({ call: { ...call, status: "ended" }, requestedRoomId: "room-1", userId: "student-1" }).ok,
        false,
    );
    assertEquals(authorizeTurnRequest({ call, requestedRoomId: "room-1" }).ok, false);
    assertEquals(authorizeTurnRequest({ call, requestedRoomId: "room-1", userId: "intruder" }).ok, false);

    const student = authorizeTurnRequest({ call, requestedRoomId: "room-1", userId: "student-1" });
    assertEquals(student.ok && student.via, "authenticated");
    const reciter = authorizeTurnRequest({ call, requestedRoomId: "room-1", userId: "reciter-1" });
    assertEquals(reciter.ok && reciter.via, "authenticated");
});

Deno.test("a valid call link authorizes without a session", () => {
    const result = authorizeTurnRequest({ call, requestedRoomId: "room-1", linkTokenValid: true });
    assertEquals(result.ok && result.via, "call_link");
});

Deno.test("rate limiter bounds credential issuance per key and window", () => {
    const state = createRateLimitState();
    const options = { limit: 3, windowMs: 60_000, nowMs: 1_000 };
    assertEquals(checkRateLimit(state, "k", options), true);
    assertEquals(checkRateLimit(state, "k", options), true);
    assertEquals(checkRateLimit(state, "k", options), true);
    assertEquals(checkRateLimit(state, "k", options), false);
    // Separate keys are independent.
    assertEquals(checkRateLimit(state, "other", options), true);
    // The window slides.
    assertEquals(checkRateLimit(state, "k", { ...options, nowMs: 70_000 }), true);
});
