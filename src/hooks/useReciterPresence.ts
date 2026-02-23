import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const PRESENCE_CHANNEL = 'reciter-presence';

/**
 * useReciterPresence
 * 
 * Tracks reciter's online presence via Supabase Realtime Presence.
 * Automatically goes offline when the app is backgrounded or closed.
 * Should only be used by reciters.
 */
export function useReciterPresence() {
    const { user, role } = useAuth();
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        // Only activate for reciters
        if (!user || role !== 'reciter') return;

        const channel = supabase.channel(PRESENCE_CHANNEL);
        channelRef.current = channel;

        const presencePayload = {
            user_id: user.id,
            online_at: new Date().toISOString(),
        };

        // Subscribe and track presence
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track(presencePayload);
                console.log('[Presence] Reciter is now online');
            }
        });

        // --- Visibility change (web / PWA / Capacitor WebView) ---
        const handleVisibility = async () => {
            if (!channelRef.current) return;

            if (document.visibilityState === 'visible') {
                await channelRef.current.track({
                    user_id: user.id,
                    online_at: new Date().toISOString(),
                });
                console.log('[Presence] App foregrounded – tracked');
            } else {
                await channelRef.current.untrack();
                console.log('[Presence] App backgrounded – untracked');
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        // --- Capacitor native lifecycle (if available) ---
        let removeNativeListener: (() => void) | null = null;

        if (Capacitor.isNativePlatform()) {
            // Dynamic import to avoid errors if @capacitor/app isn't installed
            // @ts-ignore — @capacitor/app may not be installed
            import('@capacitor/app').then(({ App }: any) => {
                App.addListener('appStateChange', async ({ isActive }) => {
                    if (!channelRef.current) return;

                    if (isActive) {
                        await channelRef.current.track({
                            user_id: user.id,
                            online_at: new Date().toISOString(),
                        });
                        console.log('[Presence] Native app active – tracked');
                    } else {
                        await channelRef.current.untrack();
                        console.log('[Presence] Native app inactive – untracked');
                    }
                });

                removeNativeListener = () => {
                    App.removeAllListeners();
                };
            }).catch(() => {
                // @capacitor/app not installed — web-only mode, visibilitychange is enough
                console.log('[Presence] @capacitor/app not available, using visibilitychange only');
            });
        }

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (removeNativeListener) removeNativeListener();
            if (channelRef.current) {
                channelRef.current.untrack();
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user, role]);
}
