import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { WebRTCSignal } from '@/types/video-call';

/**
 * SignalingService - Handles WebRTC signaling using Supabase Realtime
 * Exchanges offers, answers, and ICE candidates between peers
 */
export class SignalingService {
    private channel: RealtimeChannel | null = null;

    constructor(
        private roomId: string,
        private role: 'caller' | 'callee',
        private onSignal: (signal: WebRTCSignal) => void
    ) { }

    /**
     * Connect to the Supabase Realtime channel for this room
     */
    async connect(): Promise<void> {
        this.channel = supabase.channel(`video-call:${this.roomId}`, {
            config: {
                broadcast: { self: false },
                presence: { key: this.role },
            },
        });

        // Listen for WebRTC signals
        this.channel.on('broadcast', { event: 'webrtc-signal' }, (payload) => {
            const signal = payload.payload as WebRTCSignal;

            // Only process signals from the other party
            if (signal.from !== this.role) {
                console.log(`Received ${signal.type} from ${signal.from}`);
                this.onSignal(signal);
            }
        });

        // Track presence
        this.channel.on('presence', { event: 'sync' }, () => {
            const state = this.channel?.presenceState();
            console.log('Presence state:', state);
        });

        this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log(`${key} joined the room`, newPresences);
        });

        this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log(`${key} left the room`, leftPresences);
        });

        // Subscribe to the channel
        await this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await this.channel?.track({
                    online_at: new Date().toISOString(),
                    role: this.role,
                });
            }
        });

        console.log(`Connected to room ${this.roomId} as ${this.role}`);
    }

    /**
     * Send a WebRTC signal to the other peer
     */
    async sendSignal(signal: Omit<WebRTCSignal, 'from'>): Promise<void> {
        if (!this.channel) throw new Error('Channel not connected');

        console.log(`Sending ${signal.type} as ${this.role}`);

        await this.channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: {
                ...signal,
                from: this.role,
            },
        });
    }

    /**
     * Disconnect from the Realtime channel
     */
    async disconnect(): Promise<void> {
        if (this.channel) {
            await supabase.removeChannel(this.channel);
            this.channel = null;
            console.log(`Disconnected from room ${this.roomId}`);
        }
    }

    isConnected(): boolean {
        return this.channel !== null;
    }
}
