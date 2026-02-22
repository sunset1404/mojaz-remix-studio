// Video Call Session Types
export interface VideoCallSession {
    id: string;
    room_id: string;
    caller_id: string;
    callee_id: string | null;
    status: 'waiting' | 'active' | 'ended' | 'failed';
    caller_joined_at: string | null;  // stored as reciter_joined_at in DB
    callee_joined_at: string | null;  // stored as student_joined_at in DB
    started_at: string | null;
    ended_at: string | null;
    access_token: string | null;
    student_name: string | null;
    link_used: boolean;
    rating: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// WebRTC Signaling Types
export interface WebRTCSignal {
    type: 'offer' | 'answer' | 'ice-candidate';
    data: RTCSessionDescriptionInit | RTCIceCandidateInit;
    from: 'caller' | 'callee';
}

// Call State Management
export interface CallState {
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;
    isMuted: boolean;
    isVideoEnabled: boolean;
    error: string | null;
}
