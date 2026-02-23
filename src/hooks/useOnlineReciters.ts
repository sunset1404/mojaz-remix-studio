import { useEffect, useState } from 'react';
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
export function useOnlineReciters() {
    const [onlineReciterIds, setOnlineReciterIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const channel: RealtimeChannel = supabase.channel(PRESENCE_CHANNEL);

        const syncPresence = () => {
            const state = channel.presenceState<PresenceState>();
            const ids = new Set<string>();

            for (const key in state) {
                const presences = state[key] as PresenceState[];
                presences.forEach((p) => {
                    if (p.user_id) ids.add(p.user_id);
                });
            }

            setOnlineReciterIds(ids);
        };

        channel
            .on('presence', { event: 'sync' }, syncPresence)
            .on('presence', { event: 'join' }, syncPresence)
            .on('presence', { event: 'leave' }, syncPresence)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return onlineReciterIds;
}
