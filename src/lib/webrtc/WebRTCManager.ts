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

    private readonly iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
    ];

    constructor(
        private onRemoteStream: (stream: MediaStream) => void,
        private onIceCandidate: (candidate: RTCIceCandidate) => void,
        private onConnectionStateChange: (state: RTCPeerConnectionState) => void,
        private onNeedsReOffer?: (offer: RTCSessionDescriptionInit) => void
    ) { }

    /**
     * Initialize the peer connection with event handlers
     */
    async initialize(): Promise<void> {
        this.peerConnection = new RTCPeerConnection({
            iceServers: this.iceServers,
            iceCandidatePoolSize: 4,
        });

        // ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.onIceCandidate(event.candidate);
            }
        };

        // Remote tracks
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            this.onRemoteStream(event.streams[0]);
        };

        // Connection state management with auto-recovery
        this.peerConnection.onconnectionstatechange = () => {
            if (!this.peerConnection) return;
            const state = this.peerConnection.connectionState;
            console.log('Connection state:', state);
            this.onConnectionStateChange(state);

            if (state === 'disconnected') {
                this.scheduleReconnect(3000);
            } else if (state === 'failed') {
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

            if (this.onNeedsReOffer) {
                this.onNeedsReOffer(offer);
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
        return offer;
    }

    async createAnswer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error('Peer connection not initialized');

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
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

    getConnectionState(): RTCPeerConnectionState | null {
        return this.peerConnection?.connectionState || null;
    }
}
