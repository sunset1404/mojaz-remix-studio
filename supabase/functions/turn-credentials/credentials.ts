// Pure, runtime-agnostic coturn REST shared-secret credential generation.
// Uses only Web Crypto so it runs in Deno (edge) and Node (vitest).

export interface TurnCredential {
    username: string;
    credential: string;
    expiresAt: string;
    ttlSeconds: number;
}

export const MIN_TTL_SECONDS = 60;
export const MAX_TTL_SECONDS = 86_400;
export const DEFAULT_TTL_SECONDS = 3600;

export function normalizeTtl(raw: unknown): number {
    const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : typeof raw === 'number' ? raw : NaN;
    if (!Number.isFinite(parsed)) return DEFAULT_TTL_SECONDS;
    return Math.min(MAX_TTL_SECONDS, Math.max(MIN_TTL_SECONDS, Math.trunc(parsed)));
}

/** Only turn:/turns: URLs may be advertised; STUN defaults stay in the client. */
export function parseTurnUrls(raw: string | undefined | null): string[] {
    if (!raw) return [];
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        parsed = raw.split(',');
    }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.trim())
        .filter(value => /^turns?:/i.test(value));
}

function base64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

/**
 * coturn `use-auth-secret` format:
 *   username   = "<unix-expiry>:<identity>"
 *   credential = base64(HMAC-SHA1(static-auth-secret, username))
 */
export async function createTurnCredential(options: {
    sharedSecret: string;
    identity: string;
    ttlSeconds?: number;
    nowMs?: number;
}): Promise<TurnCredential> {
    const ttlSeconds = normalizeTtl(options.ttlSeconds ?? DEFAULT_TTL_SECONDS);
    const nowMs = options.nowMs ?? Date.now();
    const expiryUnix = Math.floor(nowMs / 1000) + ttlSeconds;
    const identity = options.identity.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 48) || 'call';
    const username = `${expiryUnix}:${identity}`;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(options.sharedSecret),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(username));

    return {
        username,
        credential: base64(new Uint8Array(signature)),
        expiresAt: new Date(expiryUnix * 1000).toISOString(),
        ttlSeconds,
    };
}
