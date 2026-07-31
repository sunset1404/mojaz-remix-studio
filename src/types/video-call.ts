// Video Call Session Types
export interface VideoCallSession {
    id: string;
    room_id: string;
    reciter_id: string;
    student_id: string;
    status: 'waiting' | 'active' | 'ended' | 'failed';
    reciter_joined_at: string | null;
    student_joined_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    access_token: string | null;
    student_name: string | null;
    link_used: boolean;
    rating: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    signaling_generation: number;
    caller_ready_at: string | null;
    callee_ready_at: string | null;
    offer_sdp: RTCSessionDescriptionInit | null;
    answer_sdp: RTCSessionDescriptionInit | null;
    offer_generation: number | null;
    answer_generation: number | null;
    caller_connection_state: RTCPeerConnectionState | null;
    callee_connection_state: RTCPeerConnectionState | null;
    failure_code: string | null;
}

export interface CallSignalingState {
    room_id: string;
    status: VideoCallSession['status'];
    signaling_generation: number;
    caller_ready_at: string | null;
    callee_ready_at: string | null;
    offer_sdp: RTCSessionDescriptionInit | null;
    answer_sdp: RTCSessionDescriptionInit | null;
    offer_generation: number | null;
    answer_generation: number | null;
    caller_connection_state: RTCPeerConnectionState | null;
    callee_connection_state: RTCPeerConnectionState | null;
    failure_code: string | null;
}

// Call State Management
export interface CallState {
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;
    isMuted: boolean;
    isVideoEnabled: boolean;
    error: string | null;
    /** True when the call runs without any usable TURN relay available. */
    connectivityDegraded: boolean;
    /** True when the camera is required but could not be captured. */
    cameraUnavailable: boolean;
    /** True while an automatic media recovery attempt is in flight. */
    isRecoveringMedia: boolean;
}

