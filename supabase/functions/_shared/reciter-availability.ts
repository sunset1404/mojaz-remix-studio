export const RECITER_AVAILABILITY_MAX_AGE_MS = 60_000;

export interface ReciterAvailabilityRecord {
    status: string;
    is_available: boolean;
    last_seen_at: string | null;
}

export const canAcceptStudentCall = (
    profile: ReciterAvailabilityRecord | null,
    now = Date.now(),
): boolean => {
    if (profile?.status !== "approved" || !profile.is_available || !profile.last_seen_at) {
        return false;
    }

    const lastSeen = Date.parse(profile.last_seen_at);
    return Number.isFinite(lastSeen) && now - lastSeen <= RECITER_AVAILABILITY_MAX_AGE_MS;
};
