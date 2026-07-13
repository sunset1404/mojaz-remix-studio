import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    let subscribeCallback: ((status: string, error?: Error) => void) | null = null;
    const snapshot = {
        room_id: 'room-1',
        status: 'waiting',
        signaling_generation: 1,
        caller_ready_at: null,
        callee_ready_at: null,
        offer_sdp: null,
        answer_sdp: null,
        offer_generation: null,
        answer_generation: null,
        caller_connection_state: null,
        callee_connection_state: null,
        failure_code: null,
    };
    const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback: (status: string, error?: Error) => void) => {
            subscribeCallback = callback;
            return channel;
        }),
    };
    const selectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(async () => ({ data: snapshot, error: null })),
    };
    return {
        snapshot,
        channel,
        selectQuery,
        getSubscribeCallback: () => subscribeCallback,
        resetSubscribeCallback: () => { subscribeCallback = null; },
    };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        channel: vi.fn(() => mocks.channel),
        from: vi.fn(() => ({ select: vi.fn(() => mocks.selectQuery) })),
        removeChannel: vi.fn(async () => 'ok'),
    },
}));

import { SignalingService } from './SignalingService';

describe('SignalingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.resetSubscribeCallback();
    });

    it('does not report connected until Supabase confirms SUBSCRIBED', async () => {
        const service = new SignalingService('room-1', 'caller', vi.fn());
        let resolved = false;
        const connection = service.connect().then(state => {
            resolved = true;
            return state;
        });

        await Promise.resolve();
        expect(resolved).toBe(false);
        expect(service.isConnected()).toBe(false);

        mocks.getSubscribeCallback()?.('SUBSCRIBED');
        const state = await connection;

        expect(state).toEqual(mocks.snapshot);
        expect(service.isConnected()).toBe(true);
        expect(mocks.selectQuery.single).toHaveBeenCalledOnce();
    });

    it('rejects when the signaling subscription times out', async () => {
        const service = new SignalingService('room-1', 'callee', vi.fn());
        const connection = service.connect();
        await Promise.resolve();

        mocks.getSubscribeCallback()?.('TIMED_OUT');

        await expect(connection).rejects.toThrow('TIMED_OUT');
        expect(service.isConnected()).toBe(false);
    });
});
