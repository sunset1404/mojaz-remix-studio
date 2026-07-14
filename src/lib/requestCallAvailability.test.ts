import { describe, expect, it } from 'vitest';
import {
    canAcceptStudentCall,
    RECITER_AVAILABILITY_MAX_AGE_MS,
    type ReciterAvailabilityRecord,
} from '../../supabase/functions/_shared/reciter-availability';

describe('request-call reciter availability guard', () => {
    const now = Date.parse('2026-07-14T09:01:00.000Z');
    const availableProfile = (overrides: Partial<ReciterAvailabilityRecord> = {}): ReciterAvailabilityRecord => ({
        status: 'approved',
        is_available: true,
        last_seen_at: new Date(now).toISOString(),
        ...overrides,
    });

    it('accepts an approved, available reciter with a fresh heartbeat', () => {
        expect(canAcceptStudentCall(availableProfile({
            last_seen_at: new Date(now - RECITER_AVAILABILITY_MAX_AGE_MS).toISOString(),
        }), now)).toBe(true);
    });

    it('rejects unavailable, stale, unapproved, missing, and malformed profiles', () => {
        expect(canAcceptStudentCall(availableProfile({ is_available: false }), now)).toBe(false);
        expect(canAcceptStudentCall(availableProfile({
            last_seen_at: new Date(now - RECITER_AVAILABILITY_MAX_AGE_MS - 1).toISOString(),
        }), now)).toBe(false);
        expect(canAcceptStudentCall(availableProfile({ status: 'pending' }), now)).toBe(false);
        expect(canAcceptStudentCall(availableProfile({ last_seen_at: null }), now)).toBe(false);
        expect(canAcceptStudentCall(availableProfile({ last_seen_at: 'invalid' }), now)).toBe(false);
        expect(canAcceptStudentCall(null, now)).toBe(false);
    });
});
