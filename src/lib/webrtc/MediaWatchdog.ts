/**
 * Conservative media watchdog.
 *
 * Detects a genuinely stalled call while `connectionState` still reports
 * `connected`, and requests one bounded recovery action at a time. It never
 * treats intentional mute, disabled video, silence, or a backgrounded app as a
 * failure, and only the caller may trigger renegotiating recovery so the two
 * peers cannot produce competing offers.
 */

export type RecoveryAction =
    | 'retry_playback'
    | 'reacquire_video'
    | 'ice_restart'
    | 'rebuild_connection'
    | 'manual_retry_required';

export interface WatchdogTrackState {
    present: boolean;
    enabled: boolean;
    live: boolean;
    muted: boolean;
}

export interface WatchdogProbe {
    connectionState: RTCPeerConnectionState;
    inboundAudioPackets: number;
    outboundAudioPackets: number;
    localAudio: WatchdogTrackState;
    localVideo: WatchdogTrackState;
    /** Remote peer is expected to be sending audio (a live, unmuted remote audio track exists). */
    remoteAudioExpected: boolean;
    playbackBlocked: boolean;
    documentHidden: boolean;
    requireVideo: boolean;
    selectedRouteType: string | null;
}

export interface StallReport {
    action: RecoveryAction;
    reason: string;
    attempt: number;
    consecutiveSamples: number;
    details: Record<string, unknown>;
}

export const WATCHDOG_INTERVAL_MS = 5000;
const STALL_SAMPLES = 3;
const COOLDOWN_MS = 20_000;
const MAX_AUTOMATIC_ATTEMPTS = 3;

export interface MediaWatchdogOptions {
    probe: () => Promise<WatchdogProbe | null>;
    /**
     * Perform a recovery action. Resolving true only means the action ran; the
     * watchdog independently verifies that media actually flows again.
     */
    recover: (report: StallReport) => Promise<boolean>;
    onEvent?: (event: string, details: Record<string, unknown>) => void;
    canInitiateRenegotiation: boolean;
    now?: () => number;
    intervalMs?: number;
    /** How many verification probes to take after a recovery action. */
    verifyAttempts?: number;
    verifyIntervalMs?: number;
    wait?: (ms: number) => Promise<void>;
}


export class MediaWatchdog {
    private timer: ReturnType<typeof setInterval> | null = null;
    private prev: { inbound: number; outbound: number } | null = null;
    private inboundStalls = 0;
    private outboundStalls = 0;
    private busy = false;
    private attempts = 0;
    private lastRecoveryAt = 0;
    private manualRequired = false;

    constructor(private options: MediaWatchdogOptions) {}

    private get now(): number {
        return (this.options.now ?? Date.now)();
    }

    start(): void {
        if (this.timer) return;
        this.timer = setInterval(() => { void this.tick(); },
            this.options.intervalMs ?? WATCHDOG_INTERVAL_MS);
    }

    stop(): void {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.prev = null;
        this.inboundStalls = 0;
        this.outboundStalls = 0;
    }

    /** Called after a network change or app foreground: check health, never re-offer blindly. */
    async healthCheck(): Promise<void> {
        this.reset();
        await this.tick();
    }

    private reset(): void {
        this.prev = null;
        this.inboundStalls = 0;
        this.outboundStalls = 0;
    }

    async tick(): Promise<void> {
        const probe = await this.options.probe();
        if (!probe) return;

        // Backgrounded apps legitimately stop producing/consuming media.
        if (probe.documentHidden || probe.connectionState !== 'connected') {
            this.reset();
            return;
        }

        const prev = this.prev;
        this.prev = { inbound: probe.inboundAudioPackets, outbound: probe.outboundAudioPackets };

        // A required camera that is missing or ended is actionable immediately;
        // it is a capture problem, not a media-flow stall.
        if (probe.requireVideo && (!probe.localVideo.present || !probe.localVideo.live)) {
            await this.attempt('reacquire_video', 'required_video_track_missing_or_ended', 0, {
                localVideo: probe.localVideo,
            }, probe);
            return;
        }


        if (!prev) return;

        const inboundDelta = probe.inboundAudioPackets - prev.inbound;
        const outboundDelta = probe.outboundAudioPackets - prev.outbound;

        const inboundExpected = probe.remoteAudioExpected;
        const outboundExpected = probe.localAudio.present
            && probe.localAudio.live
            && probe.localAudio.enabled
            && !probe.localAudio.muted;

        this.inboundStalls = inboundExpected && inboundDelta <= 0 ? this.inboundStalls + 1 : 0;
        this.outboundStalls = outboundExpected && outboundDelta <= 0 ? this.outboundStalls + 1 : 0;

        const stalled = this.inboundStalls >= STALL_SAMPLES || this.outboundStalls >= STALL_SAMPLES;
        if (!stalled) return;

        const consecutive = Math.max(this.inboundStalls, this.outboundStalls);
        const details = {
            inboundDelta,
            outboundDelta,
            inboundStalls: this.inboundStalls,
            outboundStalls: this.outboundStalls,
            selectedRouteType: probe.selectedRouteType,
            localAudio: probe.localAudio,
            localVideo: probe.localVideo,
        };

        // 1) RTP is arriving but the browser refused playback.
        if (probe.playbackBlocked && inboundDelta > 0) {
            await this.attempt('retry_playback', 'inbound_rtp_present_playback_blocked', consecutive, details, probe);
            return;
        }

        // 2) A required local track is not being sent.
        if (probe.requireVideo && probe.localVideo.present && !probe.localVideo.live) {
            await this.attempt('reacquire_video', 'required_video_track_not_live', consecutive, details, probe);
            return;
        }

        // 3) The route itself is stalled — caller-owned recovery only.
        if (!this.options.canInitiateRenegotiation) {
            this.options.onEvent?.('media_watchdog_stall_detected', {
                ...details,
                reason: 'media_stalled_awaiting_caller_recovery',
                consecutiveSamples: consecutive,
            });
            return;
        }

        if (this.attempts >= MAX_AUTOMATIC_ATTEMPTS) {
            await this.attempt(
                this.manualRequired ? 'manual_retry_required' : 'rebuild_connection',
                'bounded_ice_recovery_exhausted',
                consecutive,
                details,
                probe,
            );
            return;
        }

        await this.attempt('ice_restart', 'media_rtp_stalled_while_ice_connected', consecutive, details, probe);
    }

    /**
     * A recovery action is only "successful" once the connection is back to
     * `connected` and media actually moves again (or, for local-media actions,
     * the local track/playback is genuinely usable).
     */
    private async confirm(action: RecoveryAction, baseline: WatchdogProbe): Promise<boolean> {
        const attempts = this.options.verifyAttempts ?? 3;
        const intervalMs = this.options.verifyIntervalMs ?? 2000;
        const wait = this.options.wait ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));

        for (let i = 0; i < attempts; i += 1) {
            await wait(intervalMs);
            const probe = await this.options.probe();
            if (!probe) continue;
            if (action === 'reacquire_video') {
                if (probe.localVideo.present && probe.localVideo.live) return true;
                continue;
            }
            if (action === 'retry_playback') {
                if (!probe.playbackBlocked) return true;
                continue;
            }
            if (probe.connectionState !== 'connected') continue;
            const flowing = probe.inboundAudioPackets > baseline.inboundAudioPackets
                || probe.outboundAudioPackets > baseline.outboundAudioPackets;
            if (flowing) return true;
        }
        return false;
    }

    private async attempt(
        action: RecoveryAction,
        reason: string,
        consecutive: number,
        details: Record<string, unknown>,
        baseline: WatchdogProbe,
    ): Promise<void> {
        if (this.busy) return;
        if (this.now - this.lastRecoveryAt < COOLDOWN_MS) return;
        if (action === 'manual_retry_required') {
            this.options.onEvent?.('media_recovery_failed', { reason, action, manual: true, ...details });
            return;
        }

        this.busy = true;
        this.lastRecoveryAt = this.now;
        this.attempts += 1;
        const report: StallReport = { action, reason, attempt: this.attempts, consecutiveSamples: consecutive, details };

        this.options.onEvent?.('media_watchdog_stall_detected', { reason, action, ...details, consecutiveSamples: consecutive });
        this.options.onEvent?.('media_recovery_started', { reason, action, attempt: this.attempts });

        try {
            const ran = await this.options.recover(report);
            const confirmed = ran ? await this.confirm(action, baseline) : false;
            this.options.onEvent?.(
                confirmed ? 'media_recovery_succeeded' : 'media_recovery_failed',
                { reason, action, attempt: this.attempts, actionRan: ran, confirmed },
            );
            if (confirmed) {
                this.attempts = 0;
                this.manualRequired = false;
                this.reset();
            } else if (action === 'rebuild_connection') {
                this.manualRequired = true;
                this.options.onEvent?.('media_recovery_failed', {
                    reason: 'rebuild_connection_failed',
                    action: 'manual_retry_required',
                    manual: true,
                });
            }
        } catch (error) {
            if (action === 'rebuild_connection') this.manualRequired = true;
            this.options.onEvent?.('media_recovery_failed', {
                reason,
                action,
                attempt: this.attempts,
                manual: action === 'rebuild_connection',
                errorName: error instanceof Error ? error.name : 'UnknownError',
            });
        } finally {
            this.busy = false;
        }
    }

    isManualRetryRequired(): boolean {
        return this.manualRequired;
    }


    isRecovering(): boolean {
        return this.busy;
    }

    getAttempts(): number {
        return this.attempts;
    }
}

const trackState = (track: MediaStreamTrack | null | undefined): WatchdogTrackState => ({
    present: Boolean(track),
    enabled: Boolean(track?.enabled),
    live: track?.readyState === 'live',
    muted: Boolean(track?.muted),
});

/** Builds a watchdog probe from live getStats() output. */
export async function probeFromPeerConnection(
    pc: RTCPeerConnection,
    context: { requireVideo: boolean; playbackBlocked: boolean },
): Promise<WatchdogProbe> {
    let inboundAudioPackets = 0;
    let outboundAudioPackets = 0;
    let selectedRouteType: string | null = null;

    const stats = await pc.getStats();
    const byId = new Map<string, Record<string, unknown>>();
    stats.forEach(report => byId.set((report as { id: string }).id, report as unknown as Record<string, unknown>));

    const selectedPairId = Array.from(byId.values())
        .find(report => report.type === 'transport' && report.selectedCandidatePairId)
        ?.selectedCandidatePairId as string | undefined;

    stats.forEach(rawReport => {
        const report = rawReport as unknown as Record<string, unknown>;
        const kind = (report.kind ?? report.mediaType) as string | undefined;
        if (report.type === 'inbound-rtp' && kind === 'audio' && typeof report.packetsReceived === 'number') {
            inboundAudioPackets += report.packetsReceived;
        }
        if (report.type === 'outbound-rtp' && kind === 'audio' && typeof report.packetsSent === 'number') {
            outboundAudioPackets += report.packetsSent;
        }
        const isSelected = report.type === 'candidate-pair'
            && (report.id === selectedPairId || report.selected === true
                || (report.nominated === true && report.state === 'succeeded'));
        if (isSelected) {
            const local = byId.get(report.localCandidateId as string);
            selectedRouteType = (local?.candidateType as string | undefined) ?? selectedRouteType;
        }
    });

    const localAudio = pc.getSenders().find(sender => sender.track?.kind === 'audio')?.track ?? null;
    const localVideo = pc.getSenders().find(sender => sender.track?.kind === 'video')?.track ?? null;
    const remoteAudio = pc.getReceivers().find(receiver => receiver.track?.kind === 'audio')?.track ?? null;

    return {
        connectionState: pc.connectionState,
        inboundAudioPackets,
        outboundAudioPackets,
        localAudio: trackState(localAudio),
        localVideo: trackState(localVideo),
        remoteAudioExpected: Boolean(remoteAudio && remoteAudio.readyState === 'live'),
        playbackBlocked: context.playbackBlocked,
        documentHidden: typeof document !== 'undefined' && document.visibilityState === 'hidden',
        requireVideo: context.requireVideo,
        selectedRouteType,
    };
}
