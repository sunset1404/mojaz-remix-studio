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
        const interval = setInterval(fetchRecent, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const combined = useMemo(() => {
        const explicitlyUnavailable = new Set(unavailablePresenceIds);
        return Array.from(new Set([...presenceReciterIds, ...recentReciterIds]))
            .filter((id) => !explicitlyUnavailable.has(id));
    }, [presenceReciterIds, recentReciterIds, unavailablePresenceIds]);

    return combined;
}
