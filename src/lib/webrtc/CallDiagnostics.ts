import { supabase } from '@/integrations/supabase/client';

export type DiagnosticSeverity = 'info' | 'warning' | 'critical';

export interface DiagnosticSnapshot {
    verdict: string;
    severity: DiagnosticSeverity;
    localCandidateType: string | null;
    remoteCandidateType: string | null;
    candidateProtocol: string | null;
    networkType: string | null;
    inboundAudioPackets: number | null;
    outboundAudioPackets: number | null;
    inboundAudioBytes: number | null;
    outboundAudioBytes: number | null;
    audioLevel: number | null;
    iceConnectionState: string | null;
    connectionState: string | null;
    gatheredCandidateTypes: string[];
    details: Record<string, unknown>;
}

interface Sample {
    inboundAudioPackets: number;
    outboundAudioPackets: number;
    inboundAudioBytes: number;
    outboundAudioBytes: number;
    remoteInboundPacketsReceived: number | null;
    audioLevel: number | null;
    remoteAudioLevel: number | null;
    packetsLost: number | null;
    jitter: number | null;
    roundTripTime: number | null;
    localCandidateType: string | null;
    remoteCandidateType: string | null;
    candidateProtocol: string | null;
    networkType: string | null;
    selectedPairFound: boolean;
}

const SAMPLE_INTERVAL_MS = 5000;
const GRACE_SAMPLES = 3; // ~15s before declaring a media failure

/**
 * CallDiagnostics
 *
 * Samples RTCPeerConnection stats during a call, classifies the *real* reason
 * a call is broken (one-way audio, no media at all, ICE never connected,
 * host/srflx-only path failure ...) and persists the verdict to
 * public.call_diagnostics so failures can be analysed without a TURN server.
 */
export class CallDiagnostics {
    private timer: ReturnType<typeof setInterval> | null = null;
    private prev: Sample | null = null;
    private sampleCount = 0;
    private stalledInbound = 0;
    private stalledOutbound = 0;
    private gathered = new Set<string>();
    private loggedVerdicts = new Set<string>();
    private lastSnapshot: DiagnosticSnapshot | null = null;

    constructor(
        private getPeerConnection: () => RTCPeerConnection | null,
        private roomId: string,
        private role: 'caller' | 'callee',
    ) {}

    start(): void {
        if (this.timer) return;
        const pc = this.getPeerConnection();
        pc?.addEventListener('icecandidate', this.trackCandidate);
        this.timer = setInterval(() => { void this.sample(); }, SAMPLE_INTERVAL_MS);
        void this.sample();
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.getPeerConnection()?.removeEventListener('icecandidate', this.trackCandidate);
    }

    /** Persist the final state of the call (called on hangup / failure). */
    async flush(reason: string): Promise<void> {
        await this.sample();
        const snapshot = this.lastSnapshot;
        if (!snapshot) return;
        await this.persist({
            ...snapshot,
            verdict: `${reason}:${snapshot.verdict}`,
            details: { ...snapshot.details, final: true },
        }, true);
    }

    getLastSnapshot(): DiagnosticSnapshot | null {
        return this.lastSnapshot;
    }

    private trackCandidate = (event: RTCPeerConnectionIceEvent) => {
        const type = event.candidate?.type;
        if (type) this.gathered.add(type);
    };

    private async collect(pc: RTCPeerConnection): Promise<Sample> {
        const stats = await pc.getStats();
        const sample: Sample = {
            inboundAudioPackets: 0,
            outboundAudioPackets: 0,
            inboundAudioBytes: 0,
            outboundAudioBytes: 0,
            remoteInboundPacketsReceived: null,
            audioLevel: null,
            remoteAudioLevel: null,
            packetsLost: null,
            jitter: null,
            roundTripTime: null,
            localCandidateType: null,
            remoteCandidateType: null,
            candidateProtocol: null,
            networkType: null,
            selectedPairFound: false,
        };

        const byId = new Map<string, any>();
        stats.forEach((report: any) => byId.set(report.id, report));

        stats.forEach((report: any) => {
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                sample.inboundAudioPackets += report.packetsReceived || 0;
                sample.inboundAudioBytes += report.bytesReceived || 0;
                if (typeof report.audioLevel === 'number') sample.remoteAudioLevel = report.audioLevel;
                if (typeof report.packetsLost === 'number') sample.packetsLost = report.packetsLost;
                if (typeof report.jitter === 'number') sample.jitter = report.jitter;
            }
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
                sample.outboundAudioPackets += report.packetsSent || 0;
                sample.outboundAudioBytes += report.bytesSent || 0;
            }
            if (report.type === 'remote-inbound-rtp' && report.kind === 'audio') {
                // What the *other* side reports about our outgoing audio.
                const received = (report.packetsReceived ?? null) as number | null;
                sample.remoteInboundPacketsReceived = received;
                if (typeof report.roundTripTime === 'number') sample.roundTripTime = report.roundTripTime;
                if (typeof report.packetsLost === 'number' && sample.packetsLost === null) {
                    sample.packetsLost = report.packetsLost;
                }
            }
            if (report.type === 'media-source' && report.kind === 'audio') {
                if (typeof report.audioLevel === 'number') sample.audioLevel = report.audioLevel;
            }
            if (report.type === 'candidate-pair' && (report.selected || report.state === 'succeeded')) {
                const local = byId.get(report.localCandidateId);
                const remote = byId.get(report.remoteCandidateId);
                if (local || remote) {
                    sample.selectedPairFound = true;
                    sample.localCandidateType = local?.candidateType ?? sample.localCandidateType;
                    sample.remoteCandidateType = remote?.candidateType ?? sample.remoteCandidateType;
                    sample.candidateProtocol = local?.protocol ?? sample.candidateProtocol;
                    sample.networkType = local?.networkType ?? sample.networkType;
                }
            }
            if (report.type === 'local-candidate' && report.candidateType) {
                this.gathered.add(report.candidateType);
            }
        });

        return sample;
    }

    private classify(current: Sample, pc: RTCPeerConnection): { verdict: string; severity: DiagnosticSeverity } {
        const prev = this.prev;
        const inboundDelta = prev ? current.inboundAudioPackets - prev.inboundAudioPackets : current.inboundAudioPackets;
        const outboundDelta = prev ? current.outboundAudioPackets - prev.outboundAudioPackets : current.outboundAudioPackets;

        if (pc.iceConnectionState === 'failed' || pc.connectionState === 'failed') {
            return {
                verdict: this.gathered.has('relay')
                    ? 'ice_failed_with_relay'
                    : 'ice_failed_no_relay_candidate_stun_only',
                severity: 'critical',
            };
        }

        if (!current.selectedPairFound) {
            if (this.sampleCount >= GRACE_SAMPLES) {
                return { verdict: 'no_selected_candidate_pair', severity: 'critical' };
            }
            return { verdict: 'connecting', severity: 'info' };
        }

        this.stalledInbound = inboundDelta <= 0 ? this.stalledInbound + 1 : 0;
        this.stalledOutbound = outboundDelta <= 0 ? this.stalledOutbound + 1 : 0;

        const inboundDead = this.stalledInbound >= GRACE_SAMPLES;
        const outboundDead = this.stalledOutbound >= GRACE_SAMPLES;
        const peerNotReceivingUs =
            current.remoteInboundPacketsReceived !== null &&
            prev?.remoteInboundPacketsReceived !== null &&
            prev !== null &&
            current.remoteInboundPacketsReceived - (prev.remoteInboundPacketsReceived ?? 0) <= 0 &&
            this.stalledOutbound === 0;

        if (inboundDead && outboundDead) {
            return { verdict: 'no_audio_both_directions_media_blocked', severity: 'critical' };
        }
        if (inboundDead) {
            // We send fine but receive nothing: remote RTP is being dropped on our path.
            return { verdict: 'one_way_audio_not_receiving_remote_rtp', severity: 'critical' };
        }
        if (outboundDead) {
            const micSilent = current.audioLevel !== null && current.audioLevel < 0.0001;
            return {
                verdict: micSilent ? 'outbound_audio_stalled_mic_silent' : 'outbound_audio_stalled_sender_blocked',
                severity: 'critical',
            };
        }
        if (peerNotReceivingUs) {
            // We emit RTP but the peer's receiver reports nothing arriving —
            // classic symmetric-NAT / firewall drop that only a relay can fix.
            return { verdict: 'one_way_audio_peer_not_receiving_our_rtp', severity: 'critical' };
        }

        const srflxOnly =
            current.localCandidateType === 'srflx' || current.remoteCandidateType === 'srflx';
        if ((inboundDelta < 10 || outboundDelta < 10) && this.sampleCount >= GRACE_SAMPLES) {
            return {
                verdict: srflxOnly ? 'degraded_audio_srflx_path' : 'degraded_audio_low_packet_rate',
                severity: 'warning',
            };
        }

        return { verdict: 'healthy', severity: 'info' };
    }

    private async sample(): Promise<void> {
        const pc = this.getPeerConnection();
        if (!pc) return;

        try {
            const current = await this.collect(pc);
            const { verdict, severity } = this.classify(current, pc);
            this.sampleCount += 1;

            const snapshot: DiagnosticSnapshot = {
                verdict,
                severity,
                localCandidateType: current.localCandidateType,
                remoteCandidateType: current.remoteCandidateType,
                candidateProtocol: current.candidateProtocol,
                networkType: current.networkType,
                inboundAudioPackets: current.inboundAudioPackets,
                outboundAudioPackets: current.outboundAudioPackets,
                inboundAudioBytes: current.inboundAudioBytes,
                outboundAudioBytes: current.outboundAudioBytes,
                audioLevel: current.audioLevel,
                iceConnectionState: pc.iceConnectionState,
                connectionState: pc.connectionState,
                gatheredCandidateTypes: Array.from(this.gathered),
                details: {
                    sampleIndex: this.sampleCount,
                    inboundDelta: this.prev ? current.inboundAudioPackets - this.prev.inboundAudioPackets : null,
                    outboundDelta: this.prev ? current.outboundAudioPackets - this.prev.outboundAudioPackets : null,
                    remoteInboundPacketsReceived: current.remoteInboundPacketsReceived,
                    remoteAudioLevel: current.remoteAudioLevel,
                    packetsLost: current.packetsLost,
                    jitter: current.jitter,
                    roundTripTime: current.roundTripTime,
                    signalingState: pc.signalingState,
                    iceGatheringState: pc.iceGatheringState,
                },
            };

            this.prev = current;
            this.lastSnapshot = snapshot;

            console.log('[CallDiagnostics]', verdict, snapshot);

            // Always persist the first sample so every call leaves a trace,
            // then only distinct non-healthy verdicts afterwards.
            if (severity !== 'info' || this.sampleCount === 1) {
                await this.persist(snapshot, false);
            }
        } catch (error) {
            console.warn('[CallDiagnostics] sampling failed:', error);
        }
    }

    private async persist(snapshot: DiagnosticSnapshot, force: boolean): Promise<void> {
        // De-duplicate: one row per distinct verdict per call, plus the final row.
        if (!force && this.loggedVerdicts.has(snapshot.verdict)) return;
        this.loggedVerdicts.add(snapshot.verdict);

        try {
            const { data } = await supabase.auth.getUser();
            await supabase.from('call_diagnostics').insert({
                room_id: this.roomId,
                user_id: data.user?.id ?? null,
                role: this.role,
                verdict: snapshot.verdict,
                severity: snapshot.severity,
                local_candidate_type: snapshot.localCandidateType,
                remote_candidate_type: snapshot.remoteCandidateType,
                candidate_protocol: snapshot.candidateProtocol,
                network_type: snapshot.networkType,
                inbound_audio_packets: snapshot.inboundAudioPackets,
                outbound_audio_packets: snapshot.outboundAudioPackets,
                inbound_audio_bytes: snapshot.inboundAudioBytes,
                outbound_audio_bytes: snapshot.outboundAudioBytes,
                audio_level: snapshot.audioLevel,
                ice_connection_state: snapshot.iceConnectionState,
                connection_state: snapshot.connectionState,
                gathered_candidate_types: snapshot.gatheredCandidateTypes,
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                details: snapshot.details as never,
            });
        } catch (error) {
            console.warn('[CallDiagnostics] persist failed:', error);
        }
    }
}
