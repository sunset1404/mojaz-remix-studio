/**
 * WebRTCManager - Manages WebRTC peer connections for video calls
 * Handles media streams, peer connection lifecycle, ICE candidates,
 * keepalive pings, and automatic ICE restart on disconnection.
 */
export class WebRTCManager {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;

    // Keepalive
    private keepaliveChannel: RTCDataChannel | null = null;
    private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
    private static readonly KEEPALIVE_INTERVAL_MS = 25_000; // 25 seconds

    // ICE restart / reconnection
    private reconnectAttempts = 0;
    private static readonly MAX_RECONNECT_ATTEMPTS = 3;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private static readonly DEFAULT_ICE_SERVERS: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
    ];

    private readonly iceServers: RTCIceServer[];

    constructor(
        private onRemoteStream: (stream: MediaStream) => void,
        private onConnectionStateChange: (state: RTCPeerConnectionState) => void,
        private onNeedsReOffer?: (offer: RTCSessionDescriptionInit) => void,
        private canInitiateRecovery = false,
        iceServers?: RTCIceServer[],
    ) {
        this.iceServers = iceServers?.length ? iceServers : WebRTCManager.DEFAULT_ICE_SERVERS;
    }

    /**
     * Initialize the peer connection with event handlers
     */
    async initialize(): Promise<void> {
        this.peerConnection = new RTCPeerConnection({
            iceServers: this.iceServers,
            iceCandidatePoolSize: 4,
        });
        console.log('WebRTC ICE servers configured:', {
            total: this.iceServers.length,
            hasTurn: this.iceServers.some((server) => {
                const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
                return urls.some((url) => typeof url === 'string' && url.startsWith('turn'));
            }),
        });

        // Remote tracks — accumulate audio & video into a single persistent MediaStream
        this.peerConnection.ontrack = (event) => {
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }
            // Prefer the track associated with the stream if available, otherwise the event track
            const incoming = event.track;
            if (incoming && !this.remoteStream.getTracks().some((t) => t.id === incoming.id)) {
                this.remoteStream.addTrack(incoming);
            }
            if (incoming) {
                console.log('Remote track received:', {
                    kind: incoming.kind,
                    readyState: incoming.readyState,
                    muted: incoming.muted,
                    enabled: incoming.enabled,
                });
                incoming.onunmute = () => console.log(`Remote ${incoming.kind} track unmuted`);
                incoming.onmute = () => console.log(`Remote ${incoming.kind} track muted`);
                incoming.onended = () => console.warn(`Remote ${incoming.kind} track ended`);
            }
            // Also fold in any tracks Safari attached to event.streams[0] (some browsers do this instead)
            const eventStream = event.streams && event.streams[0];
            if (eventStream) {
                eventStream.getTracks().forEach((t) => {
                    if (!this.remoteStream!.getTracks().some((x) => x.id === t.id)) {
                        this.remoteStream!.addTrack(t);
                    }
                });
            }
            console.log('ontrack:', incoming?.kind, '— remote tracks now:', this.remoteStream.getTracks().map(t => t.kind));
            this.onRemoteStream(this.remoteStream);
        };

        // Connection state management with auto-recovery
        this.peerConnection.onconnectionstatechange = () => {
            if (!this.peerConnection) return;
            const state = this.peerConnection.connectionState;
            console.log('Connection state:', state);
            this.onConnectionStateChange(state);

            if (state === 'disconnected' && this.canInitiateRecovery) {
                this.scheduleReconnect(3000);
            } else if (state === 'failed' && this.canInitiateRecovery) {
                this.scheduleReconnect(0);
            } else if (state === 'connected') {
                this.reconnectAttempts = 0;
                this.clearReconnectTimer();
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            if (this.peerConnection) {
                console.log('ICE connection state:', this.peerConnection.iceConnectionState);
            }
        };

        // Create keepalive DataChannel (must be before offer/answer)
        this.setupKeepaliveChannel();
    }

    /**
     * DataChannel keepalive to prevent NAT timeout (~5 min)
     */
    private setupKeepaliveChannel(): void {
        if (!this.peerConnection) return;

        this.keepaliveChannel = this.peerConnection.createDataChannel('keepalive', {
            ordered: false,
            maxRetransmits: 0,
        });

        this.keepaliveChannel.onopen = () => {
            console.log('Keepalive channel opened');
            this.startKeepalive();
        };

        this.keepaliveChannel.onclose = () => {
            console.log('Keepalive channel closed');
            this.stopKeepalive();
        };

        // Handle remote side creating a channel (for the answerer)
        this.peerConnection.ondatachannel = (event) => {
            if (event.channel.label === 'keepalive') {
                this.keepaliveChannel = event.channel;
                this.keepaliveChannel.onopen = () => {
                    console.log('Keepalive channel opened (remote)');
                    this.startKeepalive();
                };
                this.keepaliveChannel.onclose = () => {
                    console.log('Keepalive channel closed (remote)');
                    this.stopKeepalive();
                };
                this.keepaliveChannel.onmessage = (msg) => {
                    console.log('Keepalive ping received:', msg.data);
                };
            }
        };
    }

    private startKeepalive(): void {
        this.stopKeepalive();
        this.keepaliveInterval = setInterval(() => {
            if (this.keepaliveChannel?.readyState === 'open') {
                try {
                    this.keepaliveChannel.send('ping');
                    console.log('Keepalive ping sent');
                } catch (e) {
                    console.warn('Keepalive send failed:', e);
                }
            }
        }, WebRTCManager.KEEPALIVE_INTERVAL_MS);
    }

    private stopKeepalive(): void {
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            this.keepaliveInterval = null;
        }
    }

    private scheduleReconnect(delayMs: number): void {
        this.clearReconnectTimer();

        if (this.reconnectAttempts >= WebRTCManager.MAX_RECONNECT_ATTEMPTS) {
            console.error(`Max reconnect attempts (${WebRTCManager.MAX_RECONNECT_ATTEMPTS}) reached.`);
            this.onConnectionStateChange('failed');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Scheduling ICE restart in ${delayMs}ms (attempt ${this.reconnectAttempts}/${WebRTCManager.MAX_RECONNECT_ATTEMPTS})`);

        this.reconnectTimer = setTimeout(async () => {
            await this.restartIce();
        }, delayMs);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Restart ICE without tearing down the call
     */
    async restartIce(): Promise<void> {
        if (!this.peerConnection) {
            console.error('Cannot restart ICE: peer connection not initialized');
            return;
        }

        try {
            console.log('Restarting ICE...');
            this.peerConnection.restartIce();

            const offer = await this.peerConnection.createOffer({ iceRestart: true });
            await this.peerConnection.setLocalDescription(offer);
            await this.waitForIceGatheringComplete();

            const completeOffer = this.peerConnection.localDescription?.toJSON();
            if (!completeOffer) throw new Error('ICE restart offer was not created');

            if (this.onNeedsReOffer) {
                this.onNeedsReOffer(completeOffer);
            }

            console.log('ICE restart offer created and sent');
        } catch (error) {
            console.error('ICE restart failed:', error);
        }
    }

    /**
     * Get local media stream (camera and microphone)
     */
    async startLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
        const defaultConstraints: MediaStreamConstraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        };

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(
                constraints || defaultConstraints
            );

            this.localStream.getTracks().forEach((track) => {
                if (track.kind === 'audio') {
                    track.enabled = true;
                    console.log('Local audio track ready:', {
                        readyState: track.readyState,
                        muted: track.muted,
                        enabled: track.enabled,
                    });
                    track.onmute = () => console.warn('Local audio track muted by browser/device');
                    track.onunmute = () => console.log('Local audio track unmuted');
                    track.onended = () => console.warn('Local audio track ended');
                }
                if (this.peerConnection && this.localStream) {
                    this.peerConnection.addTrack(track, this.localStream);
                }
            });

            return this.localStream;
        } catch (error) {
            console.error('Error getting local stream:', error);
            throw error;
        }
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error('Peer connection not initialized');

        const offer = await this.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        });
        await this.peerConnection.setLocalDescription(offer);
        await this.waitForIceGatheringComplete();
        const completeOffer = this.peerConnection.localDescription?.toJSON();
        if (!completeOffer) throw new Error('Offer was not created');
        return completeOffer;
    }

    async createAnswer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error('Peer connection not initialized');

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        await this.waitForIceGatheringComplete();
        const completeAnswer = this.peerConnection.localDescription?.toJSON();
        if (!completeAnswer) throw new Error('Answer was not created');
        return completeAnswer;
    }

    /**
     * Non-trickle ICE: persist SDP only after candidates have been embedded.
     * This avoids losing candidates when either client subscribes late.
     */
    private async waitForIceGatheringComplete(timeoutMs = 10_000): Promise<void> {
        const pc = this.peerConnection;
        if (!pc || pc.iceGatheringState === 'complete') return;

        await new Promise<void>((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                pc.removeEventListener('icegatheringstatechange', handleStateChange);
                resolve();
            };
            const handleStateChange = () => {
                if (pc.iceGatheringState === 'complete') finish();
            };
            const timeout = setTimeout(() => {
                console.warn('ICE gathering timed out; using candidates gathered so far');
                finish();
            }, timeoutMs);
            pc.addEventListener('icegatheringstatechange', handleStateChange);
        });
    }

    async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) throw new Error('Peer connection not initialized');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
    }

    async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) throw new Error('Peer connection not initialized');

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    toggleMute(): boolean {
        if (!this.localStream) return false;
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            return !audioTrack.enabled;
        }
        return false;
    }

    toggleVideo(): boolean {
        if (!this.localStream) return false;
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            return videoTrack.enabled;
        }
        return false;
    }

    async switchCamera(): Promise<'user' | 'environment' | null> {
        if (!this.localStream || !this.peerConnection) return null;
        const oldTrack = this.localStream.getVideoTracks()[0];
        const currentFacing = (oldTrack?.getSettings?.().facingMode as string) || 'user';
        const newFacing: 'user' | 'environment' = currentFacing === 'user' ? 'environment' : 'user';

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: newFacing } },
                audio: false,
            });
            const newTrack = newStream.getVideoTracks()[0];
            if (!newTrack) return null;
            newTrack.enabled = oldTrack?.enabled ?? true;

            const sender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
            if (sender) await sender.replaceTrack(newTrack);

            if (oldTrack) {
                this.localStream.removeTrack(oldTrack);
                oldTrack.stop();
            }
            this.localStream.addTrack(newTrack);
            return newFacing;
        } catch (e) {
            console.error('switchCamera failed:', e);
            return null;
        }
    }

    cleanup(): void {
        this.stopKeepalive();
        this.clearReconnectTimer();

        if (this.keepaliveChannel) {
            this.keepaliveChannel.close();
            this.keepaliveChannel = null;
        }

        this.localStream?.getTracks().forEach(track => track.stop());
        this.remoteStream?.getTracks().forEach(track => track.stop());

        if (this.peerConnection) {
            this.peerConnection.close();
        }

        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.reconnectAttempts = 0;
    }

    getCurrentLocalStream(): MediaStream | null {
        return this.localStream;
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    getPeerConnection(): RTCPeerConnection | null {
        return this.peerConnection;
    }

    getConnectionState(): RTCPeerConnectionState | null {
        return this.peerConnection?.connectionState || null;
    }

}
