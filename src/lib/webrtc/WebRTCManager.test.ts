import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebRTCManager } from './WebRTCManager';

class FakePeerConnection extends EventTarget {
    iceGatheringState: RTCIceGatheringState = 'new';
    connectionState: RTCPeerConnectionState = 'new';
    iceConnectionState: RTCIceConnectionState = 'new';
    signalingState: RTCSignalingState = 'stable';
    localDescription: RTCSessionDescription | null = null;
    remoteDescription: RTCSessionDescription | null = null;
    ontrack: RTCPeerConnection['ontrack'] = null;
    ondatachannel: RTCPeerConnection['ondatachannel'] = null;
    onconnectionstatechange: RTCPeerConnection['onconnectionstatechange'] = null;
    oniceconnectionstatechange: RTCPeerConnection['oniceconnectionstatechange'] = null;

    createDataChannel = vi.fn(() => ({
        label: 'keepalive',
        readyState: 'connecting',
        close: vi.fn(),
        send: vi.fn(),
        onopen: null,
        onclose: null,
        onmessage: null,
    }));
    createOffer = vi.fn(async () => ({ type: 'offer' as RTCSdpType, sdp: 'partial-offer' }));
    createAnswer = vi.fn(async () => ({ type: 'answer' as RTCSdpType, sdp: 'partial-answer' }));
    setLocalDescription = vi.fn(async (description: RTCSessionDescriptionInit) => {
        this.localDescription = {
            type: description.type!,
            sdp: description.sdp || '',
            toJSON: () => ({ type: description.type!, sdp: description.sdp || '' }),
        } as RTCSessionDescription;
        this.iceGatheringState = 'gathering';
    });
    setRemoteDescription = vi.fn(async () => undefined);
    addIceCandidate = vi.fn(async () => undefined);
    addTrack = vi.fn();
    getSenders = vi.fn(() => []);
    restartIce = vi.fn();
    close = vi.fn();

    completeIce(sdp: string) {
        this.localDescription = {
            type: 'offer',
            sdp,
            toJSON: () => ({ type: 'offer', sdp }),
        } as RTCSessionDescription;
        this.iceGatheringState = 'complete';
        this.dispatchEvent(new Event('icegatheringstatechange'));
    }
}

describe('WebRTCManager non-trickle ICE', () => {
    const originalPeerConnection = globalThis.RTCPeerConnection;
    let peer: FakePeerConnection;

    beforeEach(() => {
        peer = new FakePeerConnection();
        globalThis.RTCPeerConnection = vi.fn(() => peer) as unknown as typeof RTCPeerConnection;
    });

    afterEach(() => {
        globalThis.RTCPeerConnection = originalPeerConnection;
        vi.restoreAllMocks();
    });

    it('waits for ICE gathering and returns SDP containing gathered candidates', async () => {
        const manager = new WebRTCManager(vi.fn(), vi.fn());
        await manager.initialize();

        let resolved = false;
        const offerPromise = manager.createOffer().then(offer => {
            resolved = true;
            return offer;
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(resolved).toBe(false);
        peer.completeIce('complete-offer-with-candidates');

        await expect(offerPromise).resolves.toEqual({
            type: 'offer',
            sdp: 'complete-offer-with-candidates',
        });
    });
});
