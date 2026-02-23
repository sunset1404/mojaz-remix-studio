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
}

// WebRTC Signaling Types
export interface WebRTCSignal {
    type: 'offer' | 'answer' | 'ice-candidate' | 'ready';
    data?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
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
