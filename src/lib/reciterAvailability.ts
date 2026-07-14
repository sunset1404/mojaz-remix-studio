export const RECITER_HEARTBEAT_MS = 25_000;
export const RECITER_STALE_AFTER_MS = 60_000;

export interface ReciterPresenceMeta {
    user_id: string;
    online_at: string;
    is_available: boolean;
    busy: boolean;
}

export interface ReciterPresenceAvailability {
    availableIds: string[];
    unavailableIds: string[];
}

export const computeEffectiveAvailability = (
    manualEnabled: boolean,
    isForeground: boolean,
    isBusy: boolean,
) => manualEnabled && isForeground && !isBusy;

export const collectPresenceAvailability = (
    state: Record<string, ReciterPresenceMeta[]>,
): ReciterPresenceAvailability => {
    const availableIds = new Set<string>();
    const unavailableIds = new Set<string>();
    Object.values(state).forEach((presences) => {
        presences.forEach((presence) => {
            if (!presence.user_id) return;
            if (presence.is_available && !presence.busy) availableIds.add(presence.user_id);
            else unavailableIds.add(presence.user_id);
        });
    });
    return {
        availableIds: Array.from(availableIds).sort(),
        unavailableIds: Array.from(unavailableIds).sort(),
    };
};

export const isFreshAvailability = (
    isAvailable: boolean,
    lastSeenAt: string | null,
    now = Date.now(),
) => {
    if (!isAvailable || !lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt).getTime();
    return Number.isFinite(lastSeen) && now - lastSeen <= RECITER_STALE_AFTER_MS;
};
