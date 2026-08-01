import { describe, expect, it, vi } from 'vitest';
import { MediaWatchdog, type RecoveryAction, type StallReport, type WatchdogProbe } from './MediaWatchdog';

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

interface BuildOptions {
    canInitiateRenegotiation?: boolean;
    /** Runs the recovery action. Return false to simulate an action that failed to run. */
    recover?: () => Promise<boolean> | boolean;
    /** Probe used during post-recovery verification; defaults to the stalled probe. */
    verifyProbe?: () => WatchdogProbe;
}

const build = (probes: WatchdogProbe[], options: BuildOptions = {}) => {
    const events: Array<{ event: string; details: Record<string, unknown> }> = [];
    const actions: RecoveryAction[] = [];
    const baseRecover = options.recover ?? (async () => true);
    let verifying = false;
    const recover = vi.fn(async (report: StallReport) => {
        actions.push(report.action);
        const ran = await baseRecover();
        verifying = true;
        return ran;
    });
    let index = 0;
    let clock = 10_000_000;
    const watchdog = new MediaWatchdog({
        probe: async () => {
            if (verifying && options.verifyProbe) return options.verifyProbe();
            return probes[Math.min(index++, probes.length - 1)];
        },
        recover,
        onEvent: (event, details) => events.push({ event, details }),
        canInitiateRenegotiation: options.canInitiateRenegotiation ?? true,
        now: () => clock,
        verifyAttempts: 2,
        verifyIntervalMs: 0,
        wait: async () => {},
    });
    return {
        watchdog,
        events,
        recover,
        actions,
        eventNames: () => events.map(e => e.event),
        advance: (ms: number) => { clock += ms; },
        endVerification: () => { verifying = false; },
        async tick(times: number) {
            for (let i = 0; i < times; i += 1) await watchdog.tick();
        },
    };
};

/** A verification probe whose packet counters keep climbing (media restored). */
const flowingVerifyProbe = () => {
    let counter = 1000;
    return () => {
        counter += 100;
        return probe({ inboundAudioPackets: counter, outboundAudioPackets: counter });
    };
};

describe('MediaWatchdog stall detection', () => {
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

    it('never treats an intentional local mute as a stall', async () => {
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

    it('never treats an intentional remote mute as a stall', async () => {
        // remoteAudioExpected is false while the remote peer is muted, so a flat
        // inbound counter must not be reported as a broken call.
        const harness = build([probe({ remoteAudioExpected: false, localAudio: { ...liveTrack, enabled: false } })]);
        await harness.tick(6);
        expect(harness.recover).not.toHaveBeenCalled();
        expect(harness.eventNames()).not.toContain('media_watchdog_stall_detected');
    });

    it('never treats silence on a live track as a stall (RTP still flows)', async () => {
        let packets = 100;
        const harness = build([]);
        // Silence keeps sending RTP (comfort noise / DTX packets still increment).
        const silent = () => {
            packets += 20;
            return probe({ inboundAudioPackets: packets, outboundAudioPackets: packets });
        };
        const wd = new MediaWatchdog({
            probe: async () => silent(),
            recover: harness.recover,
            canInitiateRenegotiation: true,
            wait: async () => {},
        });
        for (let i = 0; i < 6; i += 1) await wd.tick();
        expect(harness.recover).not.toHaveBeenCalled();
    });

    it('never treats a backgrounded app as a stall', async () => {
        const harness = build([probe({ documentHidden: true })]);
        await harness.tick(6);
        expect(harness.recover).not.toHaveBeenCalled();
    });

    it('requests one ICE restart after three consecutive stalled samples', async () => {
        const harness = build([probe()], { verifyProbe: flowingVerifyProbe() });
        await harness.tick(2);
        expect(harness.recover).not.toHaveBeenCalled();
        await harness.tick(3);
        expect(harness.recover).toHaveBeenCalledTimes(1);
        expect(harness.actions[0]).toBe('ice_restart');
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
        ], { verifyProbe: () => probe({ playbackBlocked: false }) });
        await harness.tick(5);
        expect(harness.recover).toHaveBeenCalledTimes(1);
        expect(harness.actions[0]).toBe('retry_playback');
        expect(harness.eventNames()).toContain('media_recovery_succeeded');
    });
});

describe('MediaWatchdog camera reacquisition', () => {
    it('reacquires a required camera track immediately when it has ended', async () => {
        const harness = build([probe({
            requireVideo: true,
            localVideo: { present: true, enabled: true, live: false, muted: false },
        })], { verifyProbe: () => probe({ requireVideo: true }) });
        await harness.tick(1);
        expect(harness.recover).toHaveBeenCalledTimes(1);
        expect(harness.actions[0]).toBe('reacquire_video');
        expect(harness.eventNames()).toContain('media_recovery_succeeded');
    });

    it('reacquires a required camera that was never captured', async () => {
        const harness = build([probe({
            requireVideo: true,
            localVideo: { present: false, enabled: false, live: false, muted: false },
        })], { verifyProbe: () => probe({ requireVideo: true }) });
        await harness.tick(1);
        expect(harness.actions[0]).toBe('reacquire_video');
    });

    it('reports camera reacquisition as failed when no live track appears', async () => {
        const dead = { present: false, enabled: false, live: false, muted: false };
        const harness = build([probe({ requireVideo: true, localVideo: dead })], {
            verifyProbe: () => probe({ requireVideo: true, localVideo: dead }),
        });
        await harness.tick(1);
        expect(harness.eventNames()).toContain('media_recovery_failed');
        expect(harness.eventNames()).not.toContain('media_recovery_succeeded');
    });

    it('reacquires the camera on the callee side too', async () => {
        const harness = build([probe({
            requireVideo: true,
            localVideo: { present: true, enabled: true, live: false, muted: false },
        })], { canInitiateRenegotiation: false, verifyProbe: () => probe({ requireVideo: true }) });
        await harness.tick(1);
        expect(harness.actions[0]).toBe('reacquire_video');
    });
});

describe('MediaWatchdog roles and limits', () => {
    it('never renegotiates from the callee side', async () => {
        const harness = build([probe()], { canInitiateRenegotiation: false });
        await harness.tick(6);
        expect(harness.recover).not.toHaveBeenCalled();
        expect(harness.eventNames()).toContain('media_watchdog_stall_detected');
    });

    it('allows the caller to run route recovery', async () => {
        const harness = build([probe()], { canInitiateRenegotiation: true, verifyProbe: flowingVerifyProbe() });
        await harness.tick(4);
        expect(harness.actions[0]).toBe('ice_restart');
    });

    it('bounds automatic ICE recovery and escalates to a real rebuild', async () => {
        const harness = build([probe()], { recover: async () => false });
        for (let attempt = 0; attempt < 4; attempt += 1) {
            await harness.tick(4);
            harness.advance(25_000);
        }
        expect(harness.actions.filter(action => action === 'ice_restart')).toHaveLength(3);
        expect(harness.actions).toContain('rebuild_connection');
    });

    it('asks for a manual retry once the rebuild also fails', async () => {
        const harness = build([probe()], { recover: async () => false });
        for (let attempt = 0; attempt < 5; attempt += 1) {
            await harness.tick(4);
            harness.advance(25_000);
        }
        expect(harness.watchdog.isManualRetryRequired()).toBe(true);
        expect(harness.events.some(e => e.event === 'media_recovery_failed' && e.details.manual === true)).toBe(true);
    });

    it('reports success only after media actually flows again', async () => {
        const stalledVerify = build([probe()], { verifyProbe: () => probe() });
        await stalledVerify.tick(4);
        expect(stalledVerify.eventNames()).toContain('media_recovery_failed');
        expect(stalledVerify.eventNames()).not.toContain('media_recovery_succeeded');

        const restored = build([probe()], { verifyProbe: flowingVerifyProbe() });
        await restored.tick(4);
        expect(restored.eventNames()).toContain('media_recovery_succeeded');
    });

    it('does not report success while the connection is not connected', async () => {
        const harness = build([probe()], {
            verifyProbe: () => probe({
                connectionState: 'disconnected',
                inboundAudioPackets: 9000,
                outboundAudioPackets: 9000,
            }),
        });
        await harness.tick(4);
        expect(harness.eventNames()).toContain('media_recovery_failed');
    });

    it('emits recovery lifecycle events for diagnostics', async () => {
        const harness = build([probe()], { verifyProbe: flowingVerifyProbe() });
        await harness.tick(4);
        const names = harness.eventNames();
        expect(names).toContain('media_watchdog_stall_detected');
        expect(names).toContain('media_recovery_started');
        expect(names).toContain('media_recovery_succeeded');
    });
});
