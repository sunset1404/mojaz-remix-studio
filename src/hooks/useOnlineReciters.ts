import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { collectPresenceAvailability, ReciterPresenceMeta } from '@/lib/reciterAvailability';

const PRESENCE_CHANNEL = 'reciter-presence';

/**
 * useOnlineReciters
 * 
 * Student-facing hook that returns a live Set of online reciter user_ids.
 * Subscribes to the same Supabase Realtime Presence channel that reciters broadcast on.
 */
export function useOnlineReciters(): string[] {
    const [presenceReciterIds, setPresenceReciterIds] = useState<string[]>([]);
    const [unavailablePresenceIds, setUnavailablePresenceIds] = useState<string[]>([]);
    const [recentReciterIds, setRecentReciterIds] = useState<string[]>([]);

    useEffect(() => {
        // Find existing channel first to avoid rapid recreate in StrictMode
        let channel = supabase.getChannels().find(c => c.topic === `realtime:${PRESENCE_CHANNEL}`);

        if (!channel) {
            channel = supabase.channel(PRESENCE_CHANNEL);
        }

        const syncPresence = () => {
            const state = channel!.presenceState<ReciterPresenceMeta>();
            const { availableIds: idsArray, unavailableIds } = collectPresenceAvailability(state);
            console.log('[OnlineReciters] Online IDs:', idsArray);

            setPresenceReciterIds((prev) => {
                // Only update if the arrays are actually different to prevent infinite re-renders
                if (prev.length === idsArray.length && prev.every((id, index) => id === idsArray[index])) {
                    return prev;
                }
                return idsArray;
            });
            setUnavailablePresenceIds((prev) => {
                if (prev.length === unavailableIds.length && prev.every((id, index) => id === unavailableIds[index])) {
                    return prev;
                }
                return unavailableIds;
            });
        };

        channel
            .on('presence', { event: 'sync' }, syncPresence)
            .on('presence', { event: 'join' }, syncPresence)
            .on('presence', { event: 'leave' }, syncPresence);

        // Only trigger subscribe if it's not already joined
        let isMounted = true;

        if (channel.state !== 'joined' && channel.state !== 'joining') {
            channel.subscribe((status) => {
                console.log('[OnlineReciters] Status:', status);
                if (status === 'SUBSCRIBED' && isMounted) {
                    syncPresence();
                } else if (status === 'TIMED_OUT' && isMounted) {
                    // Force a retry if it timed out due to a rapid unmount/mount cycle
                    setTimeout(() => {
                        if (isMounted) channel.subscribe();
                    }, 2000);
                }
            });
        } else {
            syncPresence();
        }

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchRecent = async () => {
            const threshold = new Date(Date.now() - 60000).toISOString();
            const { data, error } = await supabase
                .from('reciter_profiles')
                .select('user_id, last_seen_at, is_available')
                .eq('is_available', true)
                .gte('last_seen_at', threshold)
                .eq('status', 'approved');

            if (error || !isMounted) return;

            const ids = (data || []).map((row) => row.user_id).filter(Boolean);
            ids.sort();
            setRecentReciterIds((prev) => {
                if (prev.length === ids.length && prev.every((id, index) => id === ids[index])) {
                    return prev;
                }
                return ids;
            });
        };

        fetchRecent();
        const interval = setInterval(fetchRecent, 5000);

        // Live updates: refetch immediately when any reciter profile changes.
        const changesChannel = supabase
            .channel('reciter-profiles-availability')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'reciter_profiles' },
                () => { void fetchRecent(); },
            )
            .subscribe();

        return () => {
            isMounted = false;
            clearInterval(interval);
            supabase.removeChannel(changesChannel);
        };
    }, []);

    const combined = useMemo(() => {
        const recentlyAvailable = new Set(recentReciterIds);
        const explicitlyUnavailable = new Set(unavailablePresenceIds);
        const livePresenceIds = presenceReciterIds.filter((id) => !explicitlyUnavailable.has(id));
        return Array.from(new Set([...recentlyAvailable, ...livePresenceIds]));
    }, [presenceReciterIds, recentReciterIds, unavailablePresenceIds]);

    return combined;
}
