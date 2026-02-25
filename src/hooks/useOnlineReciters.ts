import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const PRESENCE_CHANNEL = 'reciter-presence';

interface PresenceState {
    user_id: string;
    online_at: string;
}

/**
 * useOnlineReciters
 * 
 * Student-facing hook that returns a live Set of online reciter user_ids.
 * Subscribes to the same Supabase Realtime Presence channel that reciters broadcast on.
 */
export function useOnlineReciters(): string[] {
    const [presenceReciterIds, setPresenceReciterIds] = useState<string[]>([]);
    const [recentReciterIds, setRecentReciterIds] = useState<string[]>([]);

    useEffect(() => {
        // Find existing channel first to avoid rapid recreate in StrictMode
        let channel = supabase.getChannels().find(c => c.topic === `realtime:${PRESENCE_CHANNEL}`);

        if (!channel) {
            channel = supabase.channel(PRESENCE_CHANNEL);
        }

        const syncPresence = () => {
            const state = channel!.presenceState<PresenceState>();
            const ids = new Set<string>();
            for (const key in state) {
                const presences = state[key];
                presences.forEach((p) => {
                    if (p.user_id) ids.add(p.user_id);
                });
            }

            const idsArray = Array.from(ids);
            idsArray.sort();
            console.log('[OnlineReciters] Online IDs:', idsArray);

            setPresenceReciterIds((prev) => {
                // Only update if the arrays are actually different to prevent infinite re-renders
                if (prev.length === idsArray.length && prev.every((id, index) => id === idsArray[index])) {
                    return prev;
                }
                return idsArray;
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
                .select('user_id, last_seen_at' as any)
                .gte('last_seen_at' as any, threshold)
                .eq('status', 'approved');

            if (error || !isMounted) return;

            const ids = (data || []).map((row: any) => row.user_id).filter(Boolean);
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
        return Array.from(new Set([...presenceReciterIds, ...recentReciterIds]));
    }, [presenceReciterIds, recentReciterIds]);

    return combined;
}
