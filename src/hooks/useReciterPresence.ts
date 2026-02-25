import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

const PRESENCE_CHANNEL = 'reciter-presence';

/**
 * useReciterPresence
 * 
 * Tracks reciter's online presence via Realtime Presence.
 * Online only when app is truly active (foreground + visible).
 */
export function useReciterPresence() {
    const { user, role } = useAuth();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const isCleanedUp = useRef(false);
    const nativeAppActiveRef = useRef(true);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!user || role !== 'reciter') return;

        isCleanedUp.current = false;
        nativeAppActiveRef.current = true;

        const isNative = Capacitor.isNativePlatform();

        const isAppForeground = () => {
            if (isNative) {
                return nativeAppActiveRef.current;
            }
            const isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
            return isVisible;
        };

        const destroyChannel = async () => {
            if (!channelRef.current) return;
            try {
                await channelRef.current.untrack();
            } catch {
                // ignore untrack failures
            }
            await supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        };

        const trackOnline = async () => {
            if (!channelRef.current || isCleanedUp.current || !isAppForeground()) return;
            await channelRef.current.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
            });
            console.log('[Presence] Reciter is online');
        };

        const reconnectAndTrack = () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }

            reconnectTimerRef.current = setTimeout(async () => {
                if (isCleanedUp.current || !isAppForeground()) return;

                await destroyChannel();

                const channel = supabase.channel(PRESENCE_CHANNEL);
                channelRef.current = channel;

                channel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await trackOnline();
                    }
                });
            }, 300);
        };

        const goOffline = async () => {
            if (channelRef.current) {
                try {
                    await channelRef.current.untrack();
                    console.log('[Presence] Reciter is offline');
                } catch {
                    // ignore
                }
            }
        };

        const handleVisibilityChange = async () => {
            if (isCleanedUp.current) return;
            if (isAppForeground()) {
                reconnectAndTrack();
            } else {
                await goOffline();
            }
        };

        let appStateListener: PluginListenerHandle | null = null;

        const setup = async () => {
            reconnectAndTrack();

            if (!isNative) {
                document.addEventListener('visibilitychange', handleVisibilityChange);
            }

            if (isNative) {
                const state = await CapacitorApp.getState();
                nativeAppActiveRef.current = state.isActive;
                if (state.isActive) {
                    reconnectAndTrack();
                }

                appStateListener = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
                    nativeAppActiveRef.current = isActive;
                    if (isActive) {
                        reconnectAndTrack();
                    } else {
                        await goOffline();
                    }
                });
            }
        };

        setup();

        return () => {
            isCleanedUp.current = true;

            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }

            document.removeEventListener('visibilitychange', handleVisibilityChange);
            appStateListener?.remove();
            destroyChannel();
        };
    }, [user, role]);
}
