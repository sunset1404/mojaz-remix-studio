import { describe, expect, it } from 'vitest';
import {
    collectPresenceAvailability,
    computeEffectiveAvailability,
    isFreshAvailability,
    RECITER_STALE_AFTER_MS,
    type ReciterPresenceMeta,
} from './reciterAvailability';

describe('reciter availability rules', () => {
    it('is effective only when manually enabled, foregrounded, and not busy', () => {
        expect(computeEffectiveAvailability(true, true, false)).toBe(true);
        expect(computeEffectiveAvailability(false, true, false)).toBe(false);
        expect(computeEffectiveAvailability(true, false, false)).toBe(false);
        expect(computeEffectiveAvailability(true, true, true)).toBe(false);
    });

    it('classifies available and explicitly unavailable presence entries', () => {
        const meta = (overrides: Partial<ReciterPresenceMeta>): ReciterPresenceMeta => ({
            user_id: 'reciter-a',
            online_at: '2026-07-14T09:00:00.000Z',
            is_available: true,
            busy: false,
            ...overrides,
        });
        const state = {
            first: [meta({ user_id: 'reciter-b' }), meta({ user_id: 'reciter-b' })],
            second: [meta({ user_id: 'reciter-a' })],
            third: [meta({ user_id: 'reciter-c', is_available: false })],
            fourth: [meta({ user_id: 'reciter-d', busy: true })],
        };

        expect(collectPresenceAvailability(state)).toEqual({
            availableIds: ['reciter-a', 'reciter-b'],
            unavailableIds: ['reciter-c', 'reciter-d'],
        });
    });

    it('requires an available profile with a heartbeat no older than 60 seconds', () => {
        const now = Date.parse('2026-07-14T09:01:00.000Z');
        expect(isFreshAvailability(true, new Date(now - RECITER_STALE_AFTER_MS).toISOString(), now)).toBe(true);
        expect(isFreshAvailability(true, new Date(now - RECITER_STALE_AFTER_MS - 1).toISOString(), now)).toBe(false);
        expect(isFreshAvailability(false, new Date(now).toISOString(), now)).toBe(false);
        expect(isFreshAvailability(true, null, now)).toBe(false);
        expect(isFreshAvailability(true, 'invalid', now)).toBe(false);
    });
});
