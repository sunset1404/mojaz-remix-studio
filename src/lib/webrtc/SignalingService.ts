import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { CallSignalingState } from '@/types/video-call';
import { Database, Json } from '@/integrations/supabase/types';

type VideoCallSessionUpdate = Database['public']['Tables']['video_call_sessions']['Update'];

const serializeDescription = (description: RTCSessionDescriptionInit): Json => ({
    type: description.type,
    sdp: description.sdp || '',
});

/**
 * Durable WebRTC signaling backed by video_call_sessions.
 * Realtime is an acceleration layer; Postgres remains the source of truth so
 * clients can recover state after missed events or reconnects.
 */
export class SignalingService {
    private channel: RealtimeChannel | null = null;
    private connected = false;

    private static readonly SELECT_COLUMNS = [
        'room_id',
        'status',
        'signaling_generation',
        'caller_ready_at',
        'callee_ready_at',
        'offer_sdp',
        'answer_sdp',
        'offer_generation',
        'answer_generation',
        'caller_connection_state',
        'callee_connection_state',
        'failure_code',
    ].join(',');

    constructor(
        private roomId: string,
        private role: 'caller' | 'callee',
        private onState: (state: CallSignalingState) => void
    ) { }

    /**
     * Connect to the Supabase Realtime channel for this room
     */
    async connect(): Promise<CallSignalingState> {
        this.channel = supabase.channel(`call-signaling:${this.roomId}`);
        this.channel.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'video_call_sessions',
                filter: `room_id=eq.${this.roomId}`,
            },
            (payload) => this.onState(payload.new as unknown as CallSignalingState)
        );

        await new Promise<void>((resolve, reject) => {
            let settled = false;
            this.channel!.subscribe((status, error) => {
                if (status === 'SUBSCRIBED' && !settled) {
                    settled = true;
                    this.connected = true;
                    resolve();
                } else if (
                    !settled &&
                    (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
                ) {
                    settled = true;
                    reject(error || new Error(`Signaling subscription failed: ${status}`));
                }
            }, 10_000);
        });

        // Reading after subscription closes the subscribe-vs-update race.
        const state = await this.refresh();
        console.log(`Connected to durable signaling for ${this.roomId} as ${this.role}`);
        return state;
    }

    async refresh(): Promise<CallSignalingState> {
        const { data, error } = await supabase
            .from('video_call_sessions')
            .select(SignalingService.SELECT_COLUMNS)
            .eq('room_id', this.roomId)
            .single();
        if (error || !data) throw error || new Error('Call signaling session not found');
        return data as unknown as CallSignalingState;
    }

    async markReady(): Promise<CallSignalingState> {
        return this.update({
            [this.role === 'caller' ? 'caller_ready_at' : 'callee_ready_at']: new Date().toISOString(),
            [this.role === 'caller' ? 'caller_connection_state' : 'callee_connection_state']: 'new',
            failure_code: null,
        });
    }

    async publishOffer(description: RTCSessionDescriptionInit, generation: number): Promise<CallSignalingState> {
        return this.update({
            offer_sdp: serializeDescription(description),
            offer_generation: generation,
            answer_sdp: null,
            answer_generation: null,
            caller_connection_state: 'connecting',
            failure_code: null,
        }, generation);
    }

    async publishAnswer(description: RTCSessionDescriptionInit, generation: number): Promise<CallSignalingState> {
        return this.update({
            answer_sdp: serializeDescription(description),
            answer_generation: generation,
            callee_connection_state: 'connecting',
            failure_code: null,
        }, generation);
    }

    async publishRestartOffer(description: RTCSessionDescriptionInit): Promise<CallSignalingState> {
        const current = await this.refresh();
        const nextGeneration = current.signaling_generation + 1;
        return this.update({
            signaling_generation: nextGeneration,
            offer_sdp: serializeDescription(description),
            offer_generation: nextGeneration,
            answer_sdp: null,
            answer_generation: null,
            caller_connection_state: 'connecting',
            callee_connection_state: 'connecting',
            failure_code: null,
        }, current.signaling_generation);
    }

    async updateConnectionState(state: RTCPeerConnectionState, failureCode?: string): Promise<CallSignalingState> {
        return this.update({
            [this.role === 'caller' ? 'caller_connection_state' : 'callee_connection_state']: state,
            ...(failureCode ? { failure_code: failureCode } : {}),
        });
    }

    private async update(
        patch: VideoCallSessionUpdate,
        expectedGeneration?: number,
    ): Promise<CallSignalingState> {
        let query = supabase
            .from('video_call_sessions')
            .update(patch)
            .eq('room_id', this.roomId);
        if (expectedGeneration !== undefined) {
            query = query.eq('signaling_generation', expectedGeneration);
        }
        const { data, error } = await query
            .select(SignalingService.SELECT_COLUMNS)
            .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Signaling generation changed; refresh required');
        const state = data as unknown as CallSignalingState;
        this.onState(state);
        return state;
    }

    /**
     * Disconnect from the Realtime channel
     */
    async disconnect(): Promise<void> {
        if (this.channel) {
            await supabase.removeChannel(this.channel);
            this.channel = null;
            this.connected = false;
            console.log(`Disconnected from room ${this.roomId}`);
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}
