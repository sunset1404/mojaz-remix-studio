import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    inserts: [] as Array<Record<string, unknown>>,
    insert: vi.fn(async (row: Record<string, unknown>) => {
        mocks.inserts.push(row);
        return { error: null };
    }),
    getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })),
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: { getUser: mocks.getUser },
        from: vi.fn(() => ({ insert: mocks.insert })),
    },
}));

import { CallDiagnostics } from './CallDiagnostics';

const fakeTrack = (kind: 'audio' | 'video', overrides: Record<string, unknown> = {}) => ({
    kind,
    readyState: 'live',
    enabled: true,
    muted: false,
    getSettings: () => kind === 'audio'
        ? { sampleRate: 48000, channelCount: 1 }
        : { width: 1280, height: 720, frameRate: 30 },
    ...overrides,
}) as unknown as MediaStreamTrack;

class FakePeerConnection extends EventTarget {
    connectionState: RTCPeerConnectionState = 'new';
    iceConnectionState: RTCIceConnectionState = 'new';
    iceGatheringState: RTCIceGatheringState = 'new';
    signalingState: RTCSignalingState = 'stable';
    localDescription: RTCSessionDescription | null = null;
    remoteDescription: RTCSessionDescription | null = null;
    audioTrack = fakeTrack('audio');
    videoTrack: MediaStreamTrack | null = null;
    remoteAudioTrack: MediaStreamTrack | null = null;
    remoteVideoTrack: MediaStreamTrack | null = null;

    getStats = vi.fn(async () => new Map() as unknown as RTCStatsReport);
    getSenders = vi.fn(() => [
        { track: this.audioTrack },
        ...(this.videoTrack ? [{ track: this.videoTrack }] : []),
    ] as RTCRtpSender[]);
    getReceivers = vi.fn(() => [
        ...(this.remoteAudioTrack ? [{ track: this.remoteAudioTrack }] : []),
        ...(this.remoteVideoTrack ? [{ track: this.remoteVideoTrack }] : []),
    ] as RTCRtpReceiver[]);
    getConfiguration = vi.fn(() => ({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    }));
}

describe('CallDiagnostics evidence capture', () => {
    beforeEach(() => {
        mocks.inserts.length = 0;
        vi.clearAllMocks();
    });

    it('persists the exact media-capture failure stage and browser error', async () => {
        const diagnostics = new CallDiagnostics(() => null, 'room-1', 'caller');

        await diagnostics.recordMediaCaptureFailure(
            new DOMException('Permission denied', 'NotAllowedError'),
            'audio_only_fallback',
        );

        expect(mocks.inserts).toHaveLength(1);
        expect(mocks.inserts[0]).toMatchObject({
            room_id: 'room-1',
            role: 'caller',
            verdict: 'media_capture_failed_all',
            severity: 'critical',
        });
        expect(mocks.inserts[0].details).toMatchObject({
            stage: 'audio_only_fallback',
            error: {
                name: 'NotAllowedError',
                message: 'Permission denied',
            },
        });
    });

    it('persists local audio/video track state and media settings', async () => {
        const diagnostics = new CallDiagnostics(() => null, 'room-2', 'callee');
        const audio = fakeTrack('audio');
        const video = fakeTrack('video', { enabled: false });
        const stream = {
            getAudioTracks: () => [audio],
            getVideoTracks: () => [video],
        } as unknown as MediaStream;

        await diagnostics.recordLocalMedia(stream, 'audio_video');

        expect(mocks.inserts[0]).toMatchObject({
            verdict: 'media_capture_succeeded',
            severity: 'info',
        });
        expect(mocks.inserts[0].details).toMatchObject({
            localTracks: {
                audio: { readyState: 'live', enabled: true, muted: false },
                video: { readyState: 'live', enabled: false, muted: false },
            },
        });
    });

    it('distinguishes STUN reachability failure from a blocked P2P path', async () => {
        const peer = new FakePeerConnection();
        const diagnostics = new CallDiagnostics(() => peer as unknown as RTCPeerConnection, 'room-3', 'caller');
        diagnostics.start();

        const candidateEvent = new Event('icecandidate');
        Object.defineProperty(candidateEvent, 'candidate', {
            value: {
                type: 'srflx',
                protocol: 'udp',
                relayProtocol: null,
                tcpType: null,
            },
        });
        peer.dispatchEvent(candidateEvent);
        peer.connectionState = 'failed';
        peer.iceConnectionState = 'failed';

        await diagnostics.flush('test');
        diagnostics.stop();

        expect(mocks.inserts.some(row =>
            row.verdict === 'ice_failed_peer_to_peer_path_blocked_stun_only',
        )).toBe(true);
        const failure = mocks.inserts.find(row =>
            row.verdict === 'ice_failed_peer_to_peer_path_blocked_stun_only',
        );
        expect(failure?.gathered_candidate_types).toEqual(['srflx']);
    });

    it('records whether received audio actually started playing', async () => {
        const diagnostics = new CallDiagnostics(() => null, 'room-4', 'callee');

        await diagnostics.recordPlayback('blocked', {
            errorName: 'NotAllowedError',
            paused: true,
        });

        expect(mocks.inserts[0]).toMatchObject({
            verdict: 'remote_audio_playback_blocked',
            severity: 'warning',
            details: {
                playbackState: 'blocked',
                errorName: 'NotAllowedError',
                paused: true,
            },
        });
    });

    it('records the selected route plus audio and video RTP flow', async () => {
        const peer = new FakePeerConnection();
        peer.connectionState = 'connected';
        peer.iceConnectionState = 'connected';
        peer.iceGatheringState = 'complete';
        peer.videoTrack = fakeTrack('video');
        peer.remoteAudioTrack = fakeTrack('audio');
        peer.remoteVideoTrack = fakeTrack('video');
        peer.localDescription = { type: 'offer', sdp: 'local' } as RTCSessionDescription;
        peer.remoteDescription = { type: 'answer', sdp: 'remote' } as RTCSessionDescription;
        peer.getStats.mockResolvedValue(new Map([
            ['transport-1', {
                id: 'transport-1',
                type: 'transport',
                selectedCandidatePairId: 'pair-1',
            }],
            ['pair-1', {
                id: 'pair-1',
                type: 'candidate-pair',
                state: 'succeeded',
                localCandidateId: 'local-1',
                remoteCandidateId: 'remote-1',
                currentRoundTripTime: 0.08,
            }],
            ['local-1', {
                id: 'local-1',
                type: 'local-candidate',
                candidateType: 'srflx',
                protocol: 'udp',
                networkType: 'wifi',
            }],
            ['remote-1', {
                id: 'remote-1',
                type: 'remote-candidate',
                candidateType: 'srflx',
                protocol: 'udp',
            }],
            ['audio-codec', {
                id: 'audio-codec',
                type: 'codec',
                mimeType: 'audio/opus',
            }],
            ['video-codec', {
                id: 'video-codec',
                type: 'codec',
                mimeType: 'video/VP8',
            }],
            ['audio-in', {
                id: 'audio-in',
                type: 'inbound-rtp',
                kind: 'audio',
                packetsReceived: 200,
                bytesReceived: 16000,
                codecId: 'audio-codec',
            }],
            ['audio-out', {
                id: 'audio-out',
                type: 'outbound-rtp',
                kind: 'audio',
                packetsSent: 220,
                bytesSent: 18000,
                codecId: 'audio-codec',
            }],
            ['video-in', {
                id: 'video-in',
                type: 'inbound-rtp',
                kind: 'video',
                packetsReceived: 300,
                bytesReceived: 500000,
                framesDecoded: 150,
                codecId: 'video-codec',
            }],
            ['video-out', {
                id: 'video-out',
                type: 'outbound-rtp',
                kind: 'video',
                packetsSent: 320,
                bytesSent: 520000,
                framesEncoded: 160,
                codecId: 'video-codec',
            }],
        ]) as unknown as RTCStatsReport);

        const diagnostics = new CallDiagnostics(
            () => peer as unknown as RTCPeerConnection,
            'room-5',
            'caller',
        );
        diagnostics.start();

        await vi.waitFor(() => {
            expect(mocks.inserts.some(row => row.verdict === 'healthy_media_flow')).toBe(true);
        });
        diagnostics.stop();

        const healthy = mocks.inserts.find(row => row.verdict === 'healthy_media_flow');
        expect(healthy).toMatchObject({
            local_candidate_type: 'srflx',
            remote_candidate_type: 'srflx',
            candidate_protocol: 'udp',
            inbound_audio_packets: 200,
            outbound_audio_packets: 220,
        });
        expect(healthy?.details).toMatchObject({
            video: {
                inboundPackets: 300,
                outboundPackets: 320,
                framesDecoded: 150,
                framesEncoded: 160,
                codec: 'video/VP8',
            },
            candidatePair: {
                selected: true,
                localType: 'srflx',
                remoteType: 'srflx',
                protocol: 'udp',
            },
        });
    });
});
