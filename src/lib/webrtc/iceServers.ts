import { supabase } from '@/integrations/supabase/client';

/**
 * Existing STUN defaults stay the baseline. TURN is merged on top when the
 * turn-credentials function is configured; if it is not, calls keep working
 * exactly as before and are flagged as degraded instead of failing.
 */
export const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
];

export interface TurnCredentialResult {
    iceServers: RTCIceServer[];
    expiresAt: string;
}

export interface TurnFetchOutcome {
    /** Merged STUN + TURN list, always safe to hand to RTCPeerConnection. */
    iceServers: RTCIceServer[];
    turnAvailable: boolean;
    expiresAt: string | null;
    latencyMs: number;
    /** Machine-readable failure reason; null on success. */
    errorCode: string | null;
    urlCount: number;
    protocols: { udp: boolean; tcp: boolean; tls: boolean };
}

const urlList = (server: RTCIceServer): string[] =>
    (Array.isArray(server.urls) ? server.urls : [server.urls]).filter(
        (url): url is string => typeof url === 'string' && url.length > 0,
    );

const isTurnUrl = (url: string) => /^turns?:/i.test(url);

/** Drops anything that is not a real turn:/turns: entry with a credential. */
export function sanitizeTurnServers(raw: unknown): RTCIceServer[] {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((entry): RTCIceServer[] => {
        if (!entry || typeof entry !== 'object') return [];
        const server = entry as RTCIceServer;
        const urls = urlList(server).filter(isTurnUrl);
        if (urls.length === 0) return [];
        if (typeof server.username !== 'string' || typeof server.credential !== 'string') return [];
        if (!server.username || !server.credential) return [];
        return [{ urls, username: server.username, credential: server.credential }];
    });
}

export function mergeIceServers(turnServers: RTCIceServer[]): RTCIceServer[] {
    return [...DEFAULT_STUN_SERVERS, ...turnServers];
}

/** Protocol availability only — never the URLs themselves (they carry no secrets, but stay out of diagnostics). */
export function describeTurnProtocols(turnServers: RTCIceServer[]): { udp: boolean; tcp: boolean; tls: boolean } {
    const urls = turnServers.flatMap(urlList).map(url => url.toLowerCase());
    return {
        udp: urls.some(url => url.startsWith('turn:') && !url.includes('transport=tcp')),
        tcp: urls.some(url => url.startsWith('turn:') && url.includes('transport=tcp')),
        tls: urls.some(url => url.startsWith('turns:')),
    };
}

const TIMEOUT_MS = 6000;

export async function fetchTurnCredentials(options: {
    roomId: string;
    linkToken?: string | null;
    timeoutMs?: number;
    invoke?: (body: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}): Promise<TurnFetchOutcome> {
    const startedAt = Date.now();
    const invoke = options.invoke ?? ((body: Record<string, unknown>) =>
        supabase.functions.invoke('turn-credentials', { body }) as Promise<{ data: unknown; error: unknown }>);

    const degraded = (errorCode: string): TurnFetchOutcome => ({
        iceServers: mergeIceServers([]),
        turnAvailable: false,
        expiresAt: null,
        latencyMs: Date.now() - startedAt,
        errorCode,
        urlCount: 0,
        protocols: { udp: false, tcp: false, tls: false },
    });

    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('turn_credentials_timeout')), options.timeoutMs ?? TIMEOUT_MS),
        );
        const result = await Promise.race([
            invoke({
                roomId: options.roomId,
                ...(options.linkToken ? { linkToken: options.linkToken } : {}),
            }),
            timeout,
        ]);

        if (result.error) {
            return degraded('turn_credentials_request_failed');
        }
        const payload = result.data as { iceServers?: unknown; expiresAt?: unknown } | null;
        const turnServers = sanitizeTurnServers(payload?.iceServers);
        if (turnServers.length === 0) {
            return degraded('turn_credentials_malformed_response');
        }
        const expiresAt = typeof payload?.expiresAt === 'string' ? payload.expiresAt : null;
        if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) {
            return degraded('turn_credentials_missing_expiry');
        }
        if (Date.parse(expiresAt) <= Date.now()) {
            return degraded('turn_credentials_expired');
        }

        return {
            iceServers: mergeIceServers(turnServers),
            turnAvailable: true,
            expiresAt,
            latencyMs: Date.now() - startedAt,
            errorCode: null,
            urlCount: turnServers.flatMap(urlList).length,
            protocols: describeTurnProtocols(turnServers),
        };
    } catch (error) {
        const name = error instanceof Error ? error.message : 'turn_credentials_request_failed';
        return degraded(name === 'turn_credentials_timeout' ? 'turn_credentials_timeout' : 'turn_credentials_request_failed');
    }
}

export function credentialsExpiringSoon(expiresAt: string | null, marginMs = 120_000): boolean {
    if (!expiresAt) return true;
    const parsed = Date.parse(expiresAt);
    if (Number.isNaN(parsed)) return true;
    return parsed - Date.now() <= marginMs;
}
