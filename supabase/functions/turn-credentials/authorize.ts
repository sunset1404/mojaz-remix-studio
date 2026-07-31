// Pure authorization rules for TURN credential issuance.
// Kept separate from the HTTP handler so the rules are directly testable.

export interface CallRow {
    room_id: string;
    status: string;
    reciter_id: string | null;
    student_id: string | null;
}

export type TurnAuthResult =
    | { ok: true; identity: string; via: 'authenticated' | 'call_link' }
    | { ok: false; code: TurnErrorCode; status: number };

export type TurnErrorCode =
    | 'missing_room'
    | 'unauthorized'
    | 'call_not_found'
    | 'call_not_active'
    | 'not_a_participant'
    | 'rate_limited'
    | 'turn_not_configured'
    | 'invalid_request'
    | 'internal_error';

const JOINABLE_STATUSES = new Set(['waiting', 'active']);

export function authorizeTurnRequest(input: {
    call: CallRow | null;
    requestedRoomId: string;
    userId?: string | null;
    linkTokenValid?: boolean;
}): TurnAuthResult {
    if (!input.requestedRoomId) return { ok: false, code: 'missing_room', status: 400 };
    if (!input.call) return { ok: false, code: 'call_not_found', status: 404 };
    if (input.call.room_id !== input.requestedRoomId) {
        return { ok: false, code: 'call_not_found', status: 404 };
    }
    if (!JOINABLE_STATUSES.has(input.call.status)) {
        return { ok: false, code: 'call_not_active', status: 403 };
    }

    if (input.linkTokenValid) {
        return { ok: true, identity: shortIdentity(input.call.room_id), via: 'call_link' };
    }

    if (!input.userId) return { ok: false, code: 'unauthorized', status: 401 };
    const isParticipant = input.userId === input.call.reciter_id || input.userId === input.call.student_id;
    if (!isParticipant) return { ok: false, code: 'not_a_participant', status: 403 };

    return { ok: true, identity: shortIdentity(input.userId), via: 'authenticated' };
}

/** Never leak tokens into TURN usernames; a short opaque slice is enough. */
export function shortIdentity(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
}

export interface RateLimitState {
    hits: Map<string, number[]>;
}

export function createRateLimitState(): RateLimitState {
    return { hits: new Map() };
}

/**
 * Best-effort in-memory limiter. It exists so a leaked public call link cannot
 * be used as an unlimited TURN credential faucet; it is not a global quota.
 */
export function checkRateLimit(
    state: RateLimitState,
    key: string,
    options: { limit: number; windowMs: number; nowMs?: number },
): boolean {
    const now = options.nowMs ?? Date.now();
    const recent = (state.hits.get(key) ?? []).filter(ts => now - ts < options.windowMs);
    if (recent.length >= options.limit) {
        state.hits.set(key, recent);
        return false;
    }
    recent.push(now);
    state.hits.set(key, recent);
    if (state.hits.size > 5000) state.hits.clear();
    return true;
}
