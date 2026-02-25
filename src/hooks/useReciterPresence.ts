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
    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isTrackingRef = useRef(false);
    const lastSeenSyncRef = useRef(0);

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

        const syncLastSeen = async () => {
            const now = Date.now();
            if (now - lastSeenSyncRef.current < 20000) return;
            lastSeenSyncRef.current = now;
            try {
                await supabase
                    .from('reciter_profiles')
                    .update({ last_seen_at: new Date().toISOString() } as any)
                    .eq('user_id', user.id);
            } catch {
                // ignore last_seen update failures
            }
        };

        const trackOnline = async () => {
            if (!channelRef.current || isCleanedUp.current || !isAppForeground()) return;
            if (channelRef.current.state !== 'joined') return;
            if (isTrackingRef.current) return;
            isTrackingRef.current = true;
            try {
                await channelRef.current.track({
                    user_id: user.id,
                    online_at: new Date().toISOString(),
                });
                await syncLastSeen();
                console.log('[Presence] Reciter is online');
            } finally {
                isTrackingRef.current = false;
            }
        };

        const startHeartbeat = () => {
            if (heartbeatTimerRef.current) return;
            heartbeatTimerRef.current = setInterval(() => {
                if (isCleanedUp.current || !isAppForeground()) return;
                if (!channelRef.current || channelRef.current.state !== 'joined') {
                    reconnectAndTrack();
                    return;
                }
                trackOnline();
            }, 25000);
        };

        const stopHeartbeat = () => {
            if (heartbeatTimerRef.current) {
                clearInterval(heartbeatTimerRef.current);
                heartbeatTimerRef.current = null;
            }
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
                        startHeartbeat();
                    } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
                        reconnectAndTrack();
                    }
                });
            }, 300);
        };

        const goOffline = async () => {
            stopHeartbeat();
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
                startHeartbeat();
            } else {
                await goOffline();
            }
        };

        let appStateListener: PluginListenerHandle | null = null;
        let resumeListener: PluginListenerHandle | null = null;
        let pauseListener: PluginListenerHandle | null = null;

        const setup = async () => {
            reconnectAndTrack();
            startHeartbeat();

            if (!isNative) {
                if (typeof document !== 'undefined') {
                    document.addEventListener('visibilitychange', handleVisibilityChange);
                }
            }

            if (isNative) {
                const state = await CapacitorApp.getState();
                nativeAppActiveRef.current = state.isActive;
                if (state.isActive) {
                    reconnectAndTrack();
                    startHeartbeat();
                }

                appStateListener = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
                    nativeAppActiveRef.current = isActive;
                    if (isActive) {
                        reconnectAndTrack();
                        startHeartbeat();
                    } else {
                        await goOffline();
                    }
                });

                resumeListener = await CapacitorApp.addListener('resume', () => {
                    nativeAppActiveRef.current = true;
                    reconnectAndTrack();
                    startHeartbeat();
                });

                pauseListener = await CapacitorApp.addListener('pause', async () => {
                    nativeAppActiveRef.current = false;
                    await goOffline();
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

            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
            appStateListener?.remove();
            resumeListener?.remove();
            pauseListener?.remove();
            stopHeartbeat();
            destroyChannel();
        };
    }, [user, role]);
}
