import { describe, expect, it } from 'vitest';
import {
    DEFAULT_STUN_SERVERS,
    credentialsExpiringSoon,
    describeTurnProtocols,
    fetchTurnCredentials,
    mergeIceServers,
    sanitizeTurnServers,
} from './iceServers';
import { sanitizeDetails } from './CallDiagnostics';

const validTurn = [
    { urls: ['turn:relay.example.org:3478', 'turn:relay.example.org:3478?transport=tcp'], username: 'u', credential: 'c' },
    { urls: 'turns:relay.example.org:5349', username: 'u', credential: 'c' },
];

describe('TURN credential handling', () => {
    it('keeps STUN as the baseline so calls never lose existing behaviour', () => {
        expect(mergeIceServers([]).slice(0, DEFAULT_STUN_SERVERS.length)).toEqual(DEFAULT_STUN_SERVERS);
    });

    it('rejects malformed or credential-less TURN entries', () => {
        expect(sanitizeTurnServers([
            { urls: 'stun:stun.example.org' },
            { urls: 'turn:relay.example.org' },
            { urls: 'turn:relay.example.org', username: 'u' },
            { urls: 'turn:relay.example.org', username: '', credential: 'c' },
            'nonsense',
        ])).toEqual([]);
        expect(sanitizeTurnServers(validTurn)).toHaveLength(2);
    });

    it('detects udp, tcp and tls transports', () => {
        expect(describeTurnProtocols(sanitizeTurnServers(validTurn))).toEqual({ udp: true, tcp: true, tls: true });
    });

    it('falls back to STUN-only and reports a reason when the function fails', async () => {
        const outcome = await fetchTurnCredentials({
            roomId: 'room-1',
            invoke: async () => ({ data: null, error: new Error('boom') }),
        });
        expect(outcome.turnAvailable).toBe(false);
        expect(outcome.errorCode).toBe('turn_credentials_request_failed');
        expect(outcome.iceServers).toEqual(DEFAULT_STUN_SERVERS);
    });

    it('falls back when the response carries no usable TURN server', async () => {
        const outcome = await fetchTurnCredentials({
            roomId: 'room-1',
            invoke: async () => ({ data: { iceServers: [{ urls: 'stun:x' }] }, error: null }),
        });
        expect(outcome.errorCode).toBe('turn_credentials_malformed_response');
        expect(outcome.turnAvailable).toBe(false);
    });

    it('rejects already expired credentials', async () => {
        const outcome = await fetchTurnCredentials({
            roomId: 'room-1',
            invoke: async () => ({
                data: { iceServers: validTurn, expiresAt: new Date(Date.now() - 1000).toISOString() },
                error: null,
            }),
        });
        expect(outcome.errorCode).toBe('turn_credentials_expired');
    });

    it('accepts valid credentials and merges them after STUN', async () => {
        const expiresAt = new Date(Date.now() + 600_000).toISOString();
        const outcome = await fetchTurnCredentials({
            roomId: 'room-1',
            invoke: async () => ({ data: { iceServers: validTurn, expiresAt }, error: null }),
        });
        expect(outcome.turnAvailable).toBe(true);
        expect(outcome.expiresAt).toBe(expiresAt);
        expect(outcome.iceServers).toHaveLength(DEFAULT_STUN_SERVERS.length + 2);
    });

    it('treats missing or near-expiry credentials as needing a refresh', () => {
        expect(credentialsExpiringSoon(null)).toBe(true);
        expect(credentialsExpiringSoon(new Date(Date.now() + 30_000).toISOString())).toBe(true);
        expect(credentialsExpiringSoon(new Date(Date.now() + 900_000).toISOString())).toBe(false);
    });

    it('never persists TURN credentials or link tokens in diagnostics details', () => {
        const sanitized = sanitizeDetails({
            iceConfiguration: { hasTurn: true },
            servers: [{ urls: 'turn:relay.example.org:3478?transport=tcp', username: 'u', credential: 'super-secret' }],
            linkToken: 'abc123',
            authorization: 'Bearer xyz',
            nested: { password: 'p', keep: 1 },
        });
        const serialized = JSON.stringify(sanitized);
        expect(serialized).not.toContain('super-secret');
        expect(serialized).not.toContain('abc123');
        expect(serialized).not.toContain('Bearer');
        expect(serialized).not.toContain('transport=tcp');
        expect(serialized).toContain('"keep":1');
    });
});
