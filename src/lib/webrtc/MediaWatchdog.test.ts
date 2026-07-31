import { describe, expect, it, vi } from 'vitest';
import { MediaWatchdog, type WatchdogProbe } from './MediaWatchdog';

const liveTrack = { present: true, enabled: true, live: true, muted: false };

const probe = (overrides: Partial<WatchdogProbe> = {}): WatchdogProbe => ({
    connectionState: 'connected',
    inboundAudioPackets: 100,
    outboundAudioPackets: 100,
    localAudio: liveTrack,
    localVideo: liveTrack,
    remoteAudioExpected: true,
    playbackBlocked: false,
    documentHidden: false,
    requireVideo: false,
    selectedRouteType: 'srflx',
    ...overrides,
});

const build = (probes: WatchdogProbe[], options: {
    canInitiateRenegotiation?: boolean;
    recover?: () => Promise<boolean>;
} = {}) => {
    const events: Array<{ event: string; details: Record<string, unknown> }> = [];
    const recover = vi.fn(options.recover ?? (async () => true));
    let index = 0;
    let clock = 10_000_000;
    const watchdog = new MediaWatchdog({
        probe: async () => probes[Math.min(index++, probes.length - 1)],
        recover,
        onEvent: (event, details) => events.push({ event, details }),
        canInitiateRenegotiation: options.canInitiateRenegotiation ?? true,
        now: () => clock,
    });
    return {
        watchdog,
        events,
        recover,
        advance: (ms: number) => { clock += ms; },
        async tick(times: number) {
            for (let i = 0; i < times; i += 1) await watchdog.tick();
        },
    };
};

describe('MediaWatchdog', () => {
    it('does nothing while media keeps flowing', async () => {
        const harness = build([
            probe({ inboundAudioPackets: 100, outboundAudioPackets: 100 }),
            probe({ inboundAudioPackets: 150, outboundAudioPackets: 150 }),
            probe({ inboundAudioPackets: 200, outboundAudioPackets: 200 }),
            probe({ inboundAudioPackets: 250, outboundAudioPackets: 250 }),
            probe({ inboundAudioPackets: 300, outboundAudioPackets: 300 }),
        ]);
        await harness.tick(5);
        expect(harness.recover).not.toHaveBeenCalled();
    });

    it('never treats an intentional mute as a stall', async () => {
        const muted = { ...liveTrack, enabled: false };
        const harness = build([
            probe({ localAudio: muted, inboundAudioPackets: 100 }),
            probe({ localAudio: muted, inboundAudioPackets: 150 }),
            probe({ localAudio: muted, inboundAudioPackets: 200 }),
            probe({ localAudio: muted, inboundAudioPackets: 250 }),
            probe({ localAudio: muted, inboundAudioPackets: 300 }),
        ]);
        await harness.tick(5);
        expect(harness.recover).not.toHaveBeenCalled();
    });

    it('never treats a backgrounded app as a stall', async () => {
        const harness = build([probe({ documentHidden: true })]);
        await harness.tick(6);
        expect(harness.recover).not.toHaveBeenCalled();
    });

    it('requests one ICE restart after three consecutive stalled samples', async () => {
        const harness = build([probe()]);
        await harness.tick(2);
        expect(harness.recover).not.toHaveBeenCalled();
        await harness.tick(3);
        expect(harness.recover).toHaveBeenCalledTimes(1);
        expect(harness.recover.mock.calls[0][0].action).toBe('ice_restart');
    });

    it('does not stack recovery attempts within the cooldown window', async () => {
        const harness = build([probe()]);
        await harness.tick(10);
        expect(harness.recover).toHaveBeenCalledTimes(1);
    });

    it('retries playback instead of ICE when RTP arrives but playback is blocked', async () => {
        const harness = build([
            probe({ playbackBlocked: true, inboundAudioPackets: 100 }),
            probe({ playbackBlocked: true, inboundAudioPackets: 200, outboundAudioPackets: 100 }),
            probe({ playbackBlocked: true, inboundAudioPackets: 300, outboundAudioPackets: 100 }),
            probe({ playbackBlocked: true, inboundAudioPackets: 400, outboundAudioPackets: 100 }),
            probe({ playbackBlocked: true, inboundAudioPackets: 500, outboundAudioPackets: 100 }),
        ]);
        await harness.tick(5);
        expect(harness.recover).toHaveBeenCalledTimes(1);
        expect(harness.recover.mock.calls[0][0].action).toBe('retry_playback');
    });

    it('reacquires a required camera track immediately when it has ended', async () => {
        const harness = build([probe({
            requireVideo: true,
            localVideo: { present: true, enabled: true, live: false, muted: false },
        })]);
        await harness.tick(1);
        expect(harness.recover).toHaveBeenCalledTimes(1);
        expect(harness.recover.mock.calls[0][0].action).toBe('reacquire_video');
    });

    it('never renegotiates from the callee side', async () => {
        const harness = build([probe()], { canInitiateRenegotiation: false });
        await harness.tick(6);
        expect(harness.recover).not.toHaveBeenCalled();
        expect(harness.events.some(e => e.event === 'media_watchdog_stall_detected')).toBe(true);
    });

    it('bounds automatic ICE recovery and escalates to a rebuild', async () => {
        const harness = build([probe()], { recover: async () => false });
        for (let attempt = 0; attempt < 4; attempt += 1) {
            await harness.tick(3);
            harness.advance(25_000);
        }
        const actions = harness.recover.mock.calls.map(call => call[0].action);
        expect(actions.filter(action => action === 'ice_restart')).toHaveLength(3);
        expect(actions).toContain('rebuild_connection');
    });

    it('emits recovery lifecycle events for diagnostics', async () => {
        const harness = build([probe()]);
        await harness.tick(3);
        const names = harness.events.map(e => e.event);
        expect(names).toContain('media_watchdog_stall_detected');
        expect(names).toContain('media_recovery_started');
        expect(names).toContain('media_recovery_succeeded');
    });
});
