import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

const PRESENCE_CHANNEL = 'reciter-presence';

/**
 * useReciterPresence
 * 
 * Tracks reciter's online presence via Supabase Realtime Presence.
 * Handles app backgrounding/foregrounding by fully reconnecting the channel.
 */
export function useReciterPresence() {
    const { user, role } = useAuth();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const isCleanedUp = useRef(false);

    useEffect(() => {
        if (!user || role !== 'reciter') return;
        isCleanedUp.current = false;

        const createAndTrack = () => {
            // Remove old channel if exists
            if (channelRef.current) {
                try {
                    channelRef.current.untrack();
                    supabase.removeChannel(channelRef.current);
                } catch (e) {
                    // ignore
                }
                channelRef.current = null;
            }

            if (isCleanedUp.current) return;

            const channel = supabase.channel(PRESENCE_CHANNEL);
            channelRef.current = channel;

            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && !isCleanedUp.current) {
                    await channel.track({
                        user_id: user.id,
                        online_at: new Date().toISOString(),
                    });
                    console.log('[Presence] Reciter is now online');
                }
            });
        };

        // Initial connection
        createAndTrack();

        // Visibility change handler - recreate channel on foreground
        const handleVisibility = () => {
            if (isCleanedUp.current) return;

            if (document.visibilityState === 'visible') {
                console.log('[Presence] App foregrounded – reconnecting channel');
                // Small delay to let the WebSocket reconnect first
                setTimeout(() => {
                    if (!isCleanedUp.current) {
                        createAndTrack();
                    }
                }, 500);
            } else {
                console.log('[Presence] App backgrounded – untracking');
                if (channelRef.current) {
                    channelRef.current.untrack();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            isCleanedUp.current = true;
            document.removeEventListener('visibilitychange', handleVisibility);
            if (channelRef.current) {
                channelRef.current.untrack();
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user, role]);
}
