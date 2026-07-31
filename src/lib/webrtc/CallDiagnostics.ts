import { supabase } from '@/integrations/supabase/client';

export type DiagnosticSeverity = 'info' | 'warning' | 'critical';
export type MediaCaptureStage = 'audio_video' | 'audio_only_fallback';
export type RemoteAudioPlaybackState = 'not_attempted' | 'started' | 'blocked' | 'failed';

interface TrackSnapshot {
    kind: string;
    readyState: MediaStreamTrackState;
    enabled: boolean;
    muted: boolean;
    settings: Record<string, unknown>;
}

interface CandidateObservation {
    type: string | null;
    protocol: string | null;
    relayProtocol: string | null;
    tcpType: string | null;
}

interface WebRTCStatsRecord {
    id: string;
    type: string;
    kind?: string;
    mediaType?: string;
    isRemote?: boolean;
    packetsReceived?: number;
    packetsSent?: number;
    bytesReceived?: number;
    bytesSent?: number;
    packetsLost?: number;
    jitter?: number;
    audioLevel?: number;
    totalAudioEnergy?: number;
    framesDecoded?: number;
    framesEncoded?: number;
    roundTripTime?: number;
    currentRoundTripTime?: number;
    availableOutgoingBitrate?: number;
    availableIncomingBitrate?: number;
    codecId?: string;
    mimeType?: string;
    selected?: boolean;
    nominated?: boolean;
    state?: string;
    localCandidateId?: string;
    remoteCandidateId?: string;
    selectedCandidatePairId?: string;
    candidateType?: string;
    protocol?: string;
    relayProtocol?: string;
    tcpType?: string;
    networkType?: string;
}

interface Sample {
    inboundAudioPackets: number;
    outboundAudioPackets: number;
    inboundAudioBytes: number;
    outboundAudioBytes: number;
    inboundVideoPackets: number;
    outboundVideoPackets: number;
    inboundVideoBytes: number;
    outboundVideoBytes: number;
    framesDecoded: number;
    framesEncoded: number;
    remoteInboundAudioPackets: number | null;
    remoteInboundVideoPackets: number | null;
    audioLevel: number | null;
    totalAudioEnergy: number | null;
    remoteAudioLevel: number | null;
    audioPacketsLost: number | null;
    audioJitter: number | null;
    roundTripTime: number | null;
    availableOutgoingBitrate: number | null;
    availableIncomingBitrate: number | null;
    localCandidateType: string | null;
    remoteCandidateType: string | null;
    candidateProtocol: string | null;
    candidateRelayProtocol: string | null;
    candidatePairState: string | null;
    networkType: string | null;
    selectedPairFound: boolean;
    localAudioTrack: TrackSnapshot | null;
    localVideoTrack: TrackSnapshot | null;
    remoteAudioTrack: TrackSnapshot | null;
    remoteVideoTrack: TrackSnapshot | null;
    audioCodec: string | null;
    videoCodec: string | null;
}

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

const SAMPLE_INTERVAL_MS = 5000;
const GRACE_SAMPLES = 3;
const DIAGNOSTIC_VERSION = 3;

/**
 * Diagnostics are admin-readable. Anything that could carry a TURN credential,
 * call-link token, or authorization header is dropped before persisting, and
 * TURN URLs are reduced to their scheme+host so query data never leaks.
 */
const FORBIDDEN_DETAIL_KEYS = /^(username|credential|password|secret|sharedsecret|token|linktoken|accesstoken|access_token|authorization|apikey|api_key|jwt)$/i;

export const sanitizeDetails = (value: unknown, depth = 0): unknown => {
    if (depth > 8) return null;
    if (Array.isArray(value)) return value.map(item => sanitizeDetails(item, depth + 1));
    if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
            if (FORBIDDEN_DETAIL_KEYS.test(key)) continue;
            result[key] = sanitizeDetails(item, depth + 1);
        }
        return result;
    }
    if (typeof value === 'string' && /^turns?:/i.test(value)) {
        return value.replace(/[?#].*$/, '').replace(/^(turns?:\/\/?)?([^:/?#]+).*$/i, (_m, scheme, host) =>
            `${(scheme ?? '').toLowerCase()}${host}`);
    }
    return value;
};


const numberOrNull = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

const addNumber = (current: number, value: unknown): number =>
    current + (numberOrNull(value) ?? 0);

const delta = (current: number, previous: number | undefined): number | null =>
    previous === undefined ? null : current - previous;

const serializeError = (error: unknown): Record<string, unknown> => {
    if (error instanceof DOMException || error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            constraint: 'constraint' in error ? String(error.constraint ?? '') : null,
        };
    }
    return { name: 'UnknownError', message: String(error) };
};

const safeTrackSettings = (track: MediaStreamTrack): Record<string, unknown> => {
    const settings = track.getSettings?.() ?? {};
    return {
        width: settings.width ?? null,
        height: settings.height ?? null,
        frameRate: settings.frameRate ?? null,
        facingMode: settings.facingMode ?? null,
        sampleRate: settings.sampleRate ?? null,
        sampleSize: settings.sampleSize ?? null,
        channelCount: settings.channelCount ?? null,
        echoCancellation: settings.echoCancellation ?? null,
        noiseSuppression: settings.noiseSuppression ?? null,
        autoGainControl: settings.autoGainControl ?? null,
    };
};

const serializeTrack = (track: MediaStreamTrack | null | undefined): TrackSnapshot | null => {
    if (!track) return null;
    return {
        kind: track.kind,
        readyState: track.readyState,
        enabled: track.enabled,
        muted: track.muted,
        settings: safeTrackSettings(track),
    };
};

const runtimeContext = (): Record<string, unknown> => {
    if (typeof navigator === 'undefined') return {};
    const connection = (navigator as Navigator & {
        connection?: {
            type?: string;
            effectiveType?: string;
            downlink?: number;
            rtt?: number;
            saveData?: boolean;
        };
    }).connection;

    return {
        online: navigator.onLine,
        visibilityState: typeof document !== 'undefined' ? document.visibilityState : null,
        connection: connection ? {
            type: connection.type ?? null,
            effectiveType: connection.effectiveType ?? null,
            downlink: connection.downlink ?? null,
            rtt: connection.rtt ?? null,
            saveData: connection.saveData ?? null,
        } : null,
    };
};

const permissionState = async (name: 'camera' | 'microphone'): Promise<string> => {
    try {
        if (!navigator.permissions?.query) return 'unsupported';
        const status = await navigator.permissions.query({ name } as PermissionDescriptor);
        return status.state;
    } catch {
        return 'unsupported';
    }
};

const mediaEnvironment = async (): Promise<Record<string, unknown>> => {
    const [cameraPermission, microphonePermission] = await Promise.all([
        permissionState('camera'),
        permissionState('microphone'),
    ]);

    let devices: MediaDeviceInfo[] = [];
    let deviceEnumerationError: string | null = null;
    try {
        devices = await navigator.mediaDevices?.enumerateDevices?.() ?? [];
    } catch (error) {
        deviceEnumerationError = error instanceof Error ? error.name : String(error);
    }

    return {
        permissions: {
            camera: cameraPermission,
            microphone: microphonePermission,
        },
        devices: {
            audioInputs: devices.filter(device => device.kind === 'audioinput').length,
            videoInputs: devices.filter(device => device.kind === 'videoinput').length,
            audioOutputs: devices.filter(device => device.kind === 'audiooutput').length,
            labelsAvailable: devices.some(device => Boolean(device.label)),
            enumerationError: deviceEnumerationError,
        },
    };
};

/**
 * Records observable WebRTC facts. NAT and firewall verdicts are deliberately
 * phrased as inferences: browsers expose candidates and selected routes, not an
 * authoritative NAT subtype or firewall rule set.
 */
export class CallDiagnostics {
    private timer: ReturnType<typeof setInterval> | null = null;
    private peerConnection: RTCPeerConnection | null = null;
    private prev: Sample | null = null;
    private sampleCount = 0;
    private stalledInboundAudio = 0;
    private stalledOutboundAudio = 0;
    private stalledOutboundVideo = 0;
    private gathered = new Set<string>();
    private candidateObservations = new Map<string, CandidateObservation>();
    private candidateErrors: Array<Record<string, unknown>> = [];
    private loggedVerdicts = new Set<string>();
    private lastSnapshot: DiagnosticSnapshot | null = null;
    private playbackState: RemoteAudioPlaybackState = 'not_attempted';
    private relayCandidateSeen = false;
    private reportedRouteVerdict: string | null = null;
    private startedAt = Date.now();

    constructor(
        private getPeerConnection: () => RTCPeerConnection | null,
        private roomId: string,
        private role: 'caller' | 'callee',
    ) {}

    start(): void {
        if (this.timer) return;
        this.startedAt = Date.now();
        this.peerConnection = this.getPeerConnection();
        this.peerConnection?.addEventListener('icecandidate', this.trackCandidate);
        this.peerConnection?.addEventListener('icecandidateerror', this.trackCandidateError);
        this.peerConnection?.addEventListener('icegatheringstatechange', this.trackIceGatheringState);
        this.timer = setInterval(() => { void this.sample(); }, SAMPLE_INTERVAL_MS);
        void this.recordEvent('diagnostics_started', 'info', {
            iceConfiguration: this.getIceConfiguration(),
        });
        void this.sample();
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.peerConnection?.removeEventListener('icecandidate', this.trackCandidate);
        this.peerConnection?.removeEventListener('icecandidateerror', this.trackCandidateError);
        this.peerConnection?.removeEventListener('icegatheringstatechange', this.trackIceGatheringState);
        this.peerConnection = null;
    }

    async recordMediaCaptureFailure(error: unknown, stage: MediaCaptureStage): Promise<void> {
        await this.recordEvent(
            stage === 'audio_only_fallback' ? 'media_capture_failed_all' : 'media_capture_audio_video_failed',
            stage === 'audio_only_fallback' ? 'critical' : 'warning',
            {
                stage,
                error: serializeError(error),
                mediaEnvironment: await mediaEnvironment(),
            },
            true,
        );
    }

    async recordLocalMedia(stream: MediaStream, mode: 'audio_video' | 'audio_only_fallback'): Promise<void> {
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        await this.recordEvent(
            mode === 'audio_only_fallback' ? 'media_capture_audio_only' : 'media_capture_succeeded',
            mode === 'audio_only_fallback' ? 'warning' : 'info',
            {
                mode,
                localTracks: {
                    audio: serializeTrack(audioTrack),
                    video: serializeTrack(videoTrack),
                },
                mediaEnvironment: await mediaEnvironment(),
            },
            true,
        );
    }

    async recordRemoteMedia(stream: MediaStream): Promise<void> {
        await this.recordEvent('remote_media_tracks_received', 'info', {
            remoteTracks: {
                audio: serializeTrack(stream.getAudioTracks()[0]),
                video: serializeTrack(stream.getVideoTracks()[0]),
            },
        }, true);
    }

    async recordPlayback(
        state: Exclude<RemoteAudioPlaybackState, 'not_attempted'>,
        details: Record<string, unknown> = {},
    ): Promise<void> {
        this.playbackState = state;
        await this.recordEvent(
            `remote_audio_playback_${state}`,
            state === 'started' ? 'info' : state === 'blocked' ? 'warning' : 'critical',
            { playbackState: state, ...details },
        );
    }

    async recordVideoPlayback(
        source: 'local' | 'remote',
        state: 'started' | 'failed',
        details: Record<string, unknown> = {},
    ): Promise<void> {
        await this.recordEvent(
            `${source}_video_playback_${state}`,
            state === 'started' ? 'info' : 'critical',
            { source, playbackState: state, ...details },
        );
    }

    async recordFailure(
        verdict: string,
        error: unknown,
        details: Record<string, unknown> = {},
    ): Promise<void> {
        await this.recordEvent(verdict, 'critical', {
            error: serializeError(error),
            ...details,
        }, true);
    }

    /** Persist the final state of the call (called on hangup / failure). */
    async flush(reason: string): Promise<void> {
        await this.sample();
        const snapshot = this.lastSnapshot ?? this.emptySnapshot('diagnostics_no_rtc_sample', 'warning', {});
        await this.persist({
            ...snapshot,
            verdict: `${reason}:${snapshot.verdict}`,
            details: { ...snapshot.details, final: true, reason },
        }, true);
    }

    getLastSnapshot(): DiagnosticSnapshot | null {
        return this.lastSnapshot;
    }

    /**
     * Public channel for TURN, camera and recovery events raised outside this
     * class. Details are scrubbed of credentials before they are persisted.
     */
    async record(
        verdict: string,
        severity: DiagnosticSeverity,
        details: Record<string, unknown> = {},
        force = false,
    ): Promise<void> {
        await this.recordEvent(verdict, severity, details, force);
    }

    private trackCandidate = (event: RTCPeerConnectionIceEvent) => {
        const candidate = event.candidate;
        if (!candidate) return;
        const extendedCandidate = candidate as RTCIceCandidate & { relayProtocol?: string };
        const observation: CandidateObservation = {
            type: candidate.type ?? null,
            protocol: candidate.protocol ?? null,
            relayProtocol: extendedCandidate.relayProtocol ?? null,
            tcpType: candidate.tcpType ?? null,
        };
        if (observation.type) this.gathered.add(observation.type);
        this.candidateObservations.set(JSON.stringify(observation), observation);
        if (observation.type === 'relay') this.noteRelayCandidate(observation);
    };

    private trackCandidateError = (event: Event) => {
        const candidateError = event as Event & {
            errorCode?: number;
            errorText?: string;
            url?: string;
        };
        const detail = {
            errorCode: candidateError.errorCode ?? null,
            errorText: candidateError.errorText ?? null,
            url: candidateError.url?.replace(/[?#].*$/, '') ?? null,
        };
        this.candidateErrors.push(detail);
        void this.recordEvent('ice_candidate_error', 'warning', detail, true);
    };

    private trackIceGatheringState = () => {
        if (this.peerConnection?.iceGatheringState !== 'complete') return;
        const iceConfiguration = this.getIceConfiguration();
        void this.recordEvent('ice_gathering_complete', 'info', {
            gatheredCandidates: Array.from(this.candidateObservations.values()),
            gatheredCandidateTypes: Array.from(this.gathered),
            candidateErrors: this.candidateErrors,
            iceConfiguration,
        }, true);

        // TURN was offered to the browser but produced no relay candidate: the
        // exact condition that separates "no TURN" from "TURN unreachable".
        if (iceConfiguration.hasTurn && !this.gathered.has('relay')) {
            void this.recordEvent('turn_configured_but_no_relay_candidate', 'critical', {
                gatheredCandidateTypes: Array.from(this.gathered),
                candidateErrors: this.candidateErrors,
                iceConfiguration,
            }, true);
        }
    };

    private noteRelayCandidate(observation: CandidateObservation): void {
        if (this.relayCandidateSeen) return;
        this.relayCandidateSeen = true;
        void this.recordEvent('relay_candidate_gathered', 'info', {
            relayProtocol: observation.relayProtocol,
            protocol: observation.protocol,
            tcpType: observation.tcpType,
        }, true);
    }

    /** Distinguishes a direct route from a relayed one, and UDP/TCP/TLS relaying. */
    private noteSelectedRoute(current: Sample): void {
        if (current.localCandidateType !== 'relay') return;
        const relayProtocol = (current.candidateRelayProtocol ?? current.candidateProtocol ?? '').toLowerCase();
        const verdict = relayProtocol === 'tls'
            ? 'connected_via_turn_tls'
            : relayProtocol === 'tcp'
                ? 'connected_via_turn_tcp'
                : relayProtocol === 'udp'
                    ? 'connected_via_turn_udp'
                    : 'connected_via_turn_unknown_transport';
        if (this.reportedRouteVerdict === verdict) return;
        this.reportedRouteVerdict = verdict;
        void this.recordEvent(verdict, 'warning', {
            selectedRouteType: 'relay',
            relayProtocol: relayProtocol || null,
            remoteCandidateType: current.remoteCandidateType,
            networkType: current.networkType,
            roundTripTime: current.roundTripTime,
        }, true);
    }



    private getIceConfiguration(): Record<string, unknown> {
        const config = this.peerConnection?.getConfiguration?.();
        const servers = config?.iceServers ?? [];
        const urls = servers.flatMap(server =>
            (Array.isArray(server.urls) ? server.urls : [server.urls]).filter(Boolean),
        );
        return {
            serverCount: servers.length,
            hasStun: urls.some(url => url.startsWith('stun:')),
            hasTurn: urls.some(url => url.startsWith('turn:') || url.startsWith('turns:')),
            iceTransportPolicy: config?.iceTransportPolicy ?? 'all',
        };
    }

    private async collect(pc: RTCPeerConnection): Promise<Sample> {
        const stats = await pc.getStats();
        const sample: Sample = {
            inboundAudioPackets: 0,
            outboundAudioPackets: 0,
            inboundAudioBytes: 0,
            outboundAudioBytes: 0,
            inboundVideoPackets: 0,
            outboundVideoPackets: 0,
            inboundVideoBytes: 0,
            outboundVideoBytes: 0,
            framesDecoded: 0,
            framesEncoded: 0,
            remoteInboundAudioPackets: null,
            remoteInboundVideoPackets: null,
            audioLevel: null,
            totalAudioEnergy: null,
            remoteAudioLevel: null,
            audioPacketsLost: null,
            audioJitter: null,
            roundTripTime: null,
            availableOutgoingBitrate: null,
            availableIncomingBitrate: null,
            localCandidateType: null,
            remoteCandidateType: null,
            candidateProtocol: null,
            candidateRelayProtocol: null,
            candidatePairState: null,
            networkType: null,
            selectedPairFound: false,
            localAudioTrack: serializeTrack(pc.getSenders().find(sender => sender.track?.kind === 'audio')?.track),
            localVideoTrack: serializeTrack(pc.getSenders().find(sender => sender.track?.kind === 'video')?.track),
            remoteAudioTrack: serializeTrack(pc.getReceivers().find(receiver => receiver.track?.kind === 'audio')?.track),
            remoteVideoTrack: serializeTrack(pc.getReceivers().find(receiver => receiver.track?.kind === 'video')?.track),
            audioCodec: null,
            videoCodec: null,
        };

        const byId = new Map<string, WebRTCStatsRecord>();
        stats.forEach(report => {
            const typedReport = report as unknown as WebRTCStatsRecord;
            byId.set(typedReport.id, typedReport);
        });
        const selectedCandidatePairId = Array.from(byId.values())
            .find(report => report.type === 'transport' && report.selectedCandidatePairId)
            ?.selectedCandidatePairId;

        stats.forEach(rawReport => {
            const report = rawReport as unknown as WebRTCStatsRecord;
            const kind = report.kind ?? report.mediaType;
            if (report.type === 'inbound-rtp' && !report.isRemote) {
                if (kind === 'audio') {
                    sample.inboundAudioPackets = addNumber(sample.inboundAudioPackets, report.packetsReceived);
                    sample.inboundAudioBytes = addNumber(sample.inboundAudioBytes, report.bytesReceived);
                    sample.remoteAudioLevel = numberOrNull(report.audioLevel) ?? sample.remoteAudioLevel;
                    sample.audioPacketsLost = numberOrNull(report.packetsLost) ?? sample.audioPacketsLost;
                    sample.audioJitter = numberOrNull(report.jitter) ?? sample.audioJitter;
                } else if (kind === 'video') {
                    sample.inboundVideoPackets = addNumber(sample.inboundVideoPackets, report.packetsReceived);
                    sample.inboundVideoBytes = addNumber(sample.inboundVideoBytes, report.bytesReceived);
                    sample.framesDecoded = addNumber(sample.framesDecoded, report.framesDecoded);
                }
                const codec = byId.get(report.codecId);
                if (kind === 'audio') sample.audioCodec = codec?.mimeType ?? sample.audioCodec;
                if (kind === 'video') sample.videoCodec = codec?.mimeType ?? sample.videoCodec;
            }
            if (report.type === 'outbound-rtp' && !report.isRemote) {
                if (kind === 'audio') {
                    sample.outboundAudioPackets = addNumber(sample.outboundAudioPackets, report.packetsSent);
                    sample.outboundAudioBytes = addNumber(sample.outboundAudioBytes, report.bytesSent);
                } else if (kind === 'video') {
                    sample.outboundVideoPackets = addNumber(sample.outboundVideoPackets, report.packetsSent);
                    sample.outboundVideoBytes = addNumber(sample.outboundVideoBytes, report.bytesSent);
                    sample.framesEncoded = addNumber(sample.framesEncoded, report.framesEncoded);
                }
                const codec = byId.get(report.codecId);
                if (kind === 'audio') sample.audioCodec = codec?.mimeType ?? sample.audioCodec;
                if (kind === 'video') sample.videoCodec = codec?.mimeType ?? sample.videoCodec;
            }
            if (report.type === 'remote-inbound-rtp') {
                if (kind === 'audio') {
                    sample.remoteInboundAudioPackets = numberOrNull(report.packetsReceived);
                } else if (kind === 'video') {
                    sample.remoteInboundVideoPackets = numberOrNull(report.packetsReceived);
                }
                sample.roundTripTime = numberOrNull(report.roundTripTime) ?? sample.roundTripTime;
            }
            if (report.type === 'media-source' && kind === 'audio') {
                sample.audioLevel = numberOrNull(report.audioLevel) ?? sample.audioLevel;
                sample.totalAudioEnergy = numberOrNull(report.totalAudioEnergy) ?? sample.totalAudioEnergy;
            }
            const isSelectedCandidatePair =
                report.type === 'candidate-pair' &&
                (
                    report.id === selectedCandidatePairId ||
                    report.selected === true ||
                    (report.nominated === true && report.state === 'succeeded')
                );
            if (isSelectedCandidatePair) {
                const local = byId.get(report.localCandidateId);
                const remote = byId.get(report.remoteCandidateId);
                if (local || remote) {
                    sample.selectedPairFound = true;
                    sample.localCandidateType = local?.candidateType ?? sample.localCandidateType;
                    sample.remoteCandidateType = remote?.candidateType ?? sample.remoteCandidateType;
                    sample.candidateProtocol = local?.protocol ?? sample.candidateProtocol;
                    sample.candidateRelayProtocol = local?.relayProtocol ?? sample.candidateRelayProtocol;
                    sample.candidatePairState = report.state ?? sample.candidatePairState;
                    sample.networkType = local?.networkType ?? sample.networkType;
                    sample.roundTripTime = numberOrNull(report.currentRoundTripTime) ?? sample.roundTripTime;
                    sample.availableOutgoingBitrate =
                        numberOrNull(report.availableOutgoingBitrate) ?? sample.availableOutgoingBitrate;
                    sample.availableIncomingBitrate =
                        numberOrNull(report.availableIncomingBitrate) ?? sample.availableIncomingBitrate;
                }
            }
            if (report.type === 'local-candidate' && report.candidateType) {
                this.gathered.add(report.candidateType);
                const observation: CandidateObservation = {
                    type: report.candidateType ?? null,
                    protocol: report.protocol ?? null,
                    relayProtocol: report.relayProtocol ?? null,
                    tcpType: report.tcpType ?? null,
                };
                this.candidateObservations.set(JSON.stringify(observation), observation);
                if (observation.type === 'relay') this.noteRelayCandidate(observation);
            }
        });

        return sample;
    }

    private classify(current: Sample, pc: RTCPeerConnection): { verdict: string; severity: DiagnosticSeverity } {
        const prev = this.prev;
        const inboundAudioDelta = delta(current.inboundAudioPackets, prev?.inboundAudioPackets);
        const outboundAudioDelta = delta(current.outboundAudioPackets, prev?.outboundAudioPackets);
        const outboundVideoDelta = delta(current.outboundVideoPackets, prev?.outboundVideoPackets);
        const hasSrflx = this.gathered.has('srflx');
        const hasRelay = this.gathered.has('relay');

        if (pc.iceConnectionState === 'failed' || pc.connectionState === 'failed') {
            if (hasRelay) return { verdict: 'ice_failed_even_with_relay', severity: 'critical' };
            if (!hasSrflx) {
                return { verdict: 'ice_failed_stun_unreachable_or_udp_blocked', severity: 'critical' };
            }
            return { verdict: 'ice_failed_peer_to_peer_path_blocked_stun_only', severity: 'critical' };
        }

        if (!current.selectedPairFound) {
            if (!pc.localDescription || !pc.remoteDescription) {
                return { verdict: 'waiting_for_remote_description', severity: 'info' };
            }
            if (this.sampleCount >= GRACE_SAMPLES) {
                if (!hasSrflx && !hasRelay) {
                    return { verdict: 'no_candidate_pair_no_srflx_stun_blocked_or_unreachable', severity: 'critical' };
                }
                if (hasSrflx && !hasRelay) {
                    return { verdict: 'no_candidate_pair_p2p_blocked_stun_only', severity: 'critical' };
                }
                return { verdict: 'no_selected_candidate_pair', severity: 'critical' };
            }
            return { verdict: 'ice_checking_no_pair_yet', severity: 'info' };
        }

        if (pc.connectionState !== 'connected') {
            return { verdict: 'candidate_pair_selected_connection_pending', severity: 'info' };
        }

        if (!current.localAudioTrack || current.localAudioTrack.readyState === 'ended') {
            return { verdict: 'local_microphone_track_missing_or_ended', severity: 'critical' };
        }
        if (!current.localAudioTrack.enabled) {
            return { verdict: 'local_microphone_disabled_by_user', severity: 'info' };
        }
        if (current.localAudioTrack.muted) {
            return { verdict: 'local_microphone_track_muted_by_device', severity: 'critical' };
        }

        if (prev) {
            this.stalledInboundAudio = (inboundAudioDelta ?? 0) <= 0 ? this.stalledInboundAudio + 1 : 0;
            this.stalledOutboundAudio = (outboundAudioDelta ?? 0) <= 0 ? this.stalledOutboundAudio + 1 : 0;
            const videoExpected = Boolean(
                current.localVideoTrack?.enabled && current.localVideoTrack.readyState === 'live',
            );
            this.stalledOutboundVideo = videoExpected && (outboundVideoDelta ?? 0) <= 0
                ? this.stalledOutboundVideo + 1
                : 0;
        }

        if (this.playbackState === 'blocked' && (inboundAudioDelta ?? 0) > 0) {
            return { verdict: 'remote_audio_received_playback_blocked', severity: 'critical' };
        }
        if (this.playbackState === 'failed' && (inboundAudioDelta ?? 0) > 0) {
            return { verdict: 'remote_audio_received_playback_failed', severity: 'critical' };
        }
        if (this.stalledOutboundVideo >= GRACE_SAMPLES) {
            return { verdict: 'local_video_enabled_but_not_encoding', severity: 'critical' };
        }
        if (this.stalledInboundAudio >= GRACE_SAMPLES && this.stalledOutboundAudio >= GRACE_SAMPLES) {
            // A relayed pair that carries no RTP is a TURN route problem, not a NAT one.
            if (current.localCandidateType === 'relay' || current.remoteCandidateType === 'relay') {
                return { verdict: 'turn_route_failed', severity: 'critical' };
            }
            return { verdict: 'selected_pair_but_no_audio_rtp', severity: 'critical' };
        }

        if (this.stalledInboundAudio >= GRACE_SAMPLES) {
            return { verdict: 'no_inbound_audio_rtp', severity: 'critical' };
        }
        if (this.stalledOutboundAudio >= GRACE_SAMPLES) {
            const micSilent = current.audioLevel !== null && current.audioLevel < 0.0001;
            return {
                verdict: micSilent ? 'no_outbound_audio_rtp_mic_silent' : 'audio_capture_present_sender_not_emitting_rtp',
                severity: 'critical',
            };
        }

        const peerAudioDelta = current.remoteInboundAudioPackets !== null && prev?.remoteInboundAudioPackets !== null
            ? current.remoteInboundAudioPackets - prev.remoteInboundAudioPackets
            : null;
        if ((outboundAudioDelta ?? 0) > 0 && peerAudioDelta !== null && peerAudioDelta <= 0) {
            return { verdict: 'peer_reports_no_inbound_audio', severity: 'critical' };
        }

        return { verdict: 'healthy_media_flow', severity: 'info' };
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
                    diagnosticVersion: DIAGNOSTIC_VERSION,
                    elapsedMs: Date.now() - this.startedAt,
                    sampleIndex: this.sampleCount,
                    audio: {
                        inboundPackets: current.inboundAudioPackets,
                        outboundPackets: current.outboundAudioPackets,
                        inboundBytes: current.inboundAudioBytes,
                        outboundBytes: current.outboundAudioBytes,
                        inboundDelta: delta(current.inboundAudioPackets, this.prev?.inboundAudioPackets),
                        outboundDelta: delta(current.outboundAudioPackets, this.prev?.outboundAudioPackets),
                        remoteInboundPackets: current.remoteInboundAudioPackets,
                        audioLevel: current.audioLevel,
                        totalAudioEnergy: current.totalAudioEnergy,
                        remoteAudioLevel: current.remoteAudioLevel,
                        packetsLost: current.audioPacketsLost,
                        jitter: current.audioJitter,
                        codec: current.audioCodec,
                        playbackState: this.playbackState,
                    },
                    video: {
                        inboundPackets: current.inboundVideoPackets,
                        outboundPackets: current.outboundVideoPackets,
                        inboundBytes: current.inboundVideoBytes,
                        outboundBytes: current.outboundVideoBytes,
                        inboundDelta: delta(current.inboundVideoPackets, this.prev?.inboundVideoPackets),
                        outboundDelta: delta(current.outboundVideoPackets, this.prev?.outboundVideoPackets),
                        remoteInboundPackets: current.remoteInboundVideoPackets,
                        framesDecoded: current.framesDecoded,
                        framesEncoded: current.framesEncoded,
                        codec: current.videoCodec,
                    },
                    tracks: {
                        localAudio: current.localAudioTrack,
                        localVideo: current.localVideoTrack,
                        remoteAudio: current.remoteAudioTrack,
                        remoteVideo: current.remoteVideoTrack,
                    },
                    candidatePair: {
                        selected: current.selectedPairFound,
                        state: current.candidatePairState,
                        localType: current.localCandidateType,
                        remoteType: current.remoteCandidateType,
                        protocol: current.candidateProtocol,
                        relayProtocol: current.candidateRelayProtocol,
                        networkType: current.networkType,
                        roundTripTime: current.roundTripTime,
                        availableOutgoingBitrate: current.availableOutgoingBitrate,
                        availableIncomingBitrate: current.availableIncomingBitrate,
                    },
                    ice: {
                        gatheringState: pc.iceGatheringState,
                        connectionState: pc.iceConnectionState,
                        gatheredCandidates: Array.from(this.candidateObservations.values()),
                        candidateErrors: this.candidateErrors,
                        configuration: this.getIceConfiguration(),
                    },
                    signalingState: pc.signalingState,
                    runtime: runtimeContext(),
                },
            };

            this.prev = current;
            this.lastSnapshot = snapshot;
            console.log('[CallDiagnostics]', verdict, snapshot);
            await this.persist(snapshot, false);
        } catch (error) {
            console.warn('[CallDiagnostics] sampling failed:', error);
            await this.recordEvent('diagnostic_sampling_failed', 'warning', {
                error: serializeError(error),
            });
        }
    }

    private async recordEvent(
        verdict: string,
        severity: DiagnosticSeverity,
        details: Record<string, unknown>,
        force = false,
    ): Promise<void> {
        const snapshot = this.emptySnapshot(verdict, severity, {
            diagnosticVersion: DIAGNOSTIC_VERSION,
            elapsedMs: Date.now() - this.startedAt,
            ...details,
            runtime: runtimeContext(),
        });
        await this.persist(snapshot, force);
    }

    private emptySnapshot(
        verdict: string,
        severity: DiagnosticSeverity,
        details: Record<string, unknown>,
    ): DiagnosticSnapshot {
        const pc = this.getPeerConnection();
        return {
            verdict,
            severity,
            localCandidateType: this.lastSnapshot?.localCandidateType ?? null,
            remoteCandidateType: this.lastSnapshot?.remoteCandidateType ?? null,
            candidateProtocol: this.lastSnapshot?.candidateProtocol ?? null,
            networkType: this.lastSnapshot?.networkType ?? null,
            inboundAudioPackets: this.lastSnapshot?.inboundAudioPackets ?? null,
            outboundAudioPackets: this.lastSnapshot?.outboundAudioPackets ?? null,
            inboundAudioBytes: this.lastSnapshot?.inboundAudioBytes ?? null,
            outboundAudioBytes: this.lastSnapshot?.outboundAudioBytes ?? null,
            audioLevel: this.lastSnapshot?.audioLevel ?? null,
            iceConnectionState: pc?.iceConnectionState ?? this.lastSnapshot?.iceConnectionState ?? null,
            connectionState: pc?.connectionState ?? this.lastSnapshot?.connectionState ?? null,
            gatheredCandidateTypes: Array.from(this.gathered),
            details,
        };
    }

    private async persist(snapshot: DiagnosticSnapshot, force: boolean): Promise<void> {
        if (!force && this.loggedVerdicts.has(snapshot.verdict)) return;
        this.loggedVerdicts.add(snapshot.verdict);

        try {
            const { data } = await supabase.auth.getUser();
            const { error: insertError } = await supabase.from('call_diagnostics').insert({
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
            if (insertError) {
                this.loggedVerdicts.delete(snapshot.verdict);
                console.error('[CallDiagnostics] insert rejected:', insertError.message);
            }
        } catch (error) {
            this.loggedVerdicts.delete(snapshot.verdict);
            console.warn('[CallDiagnostics] persist failed:', error);
        }
    }
}
