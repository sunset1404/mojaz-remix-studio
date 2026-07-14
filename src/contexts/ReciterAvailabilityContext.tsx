import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
    computeEffectiveAvailability,
    RECITER_HEARTBEAT_MS,
} from '@/lib/reciterAvailability';

const PRESENCE_CHANNEL = 'reciter-presence';
const PRESENCE_JOIN_TIMEOUT_MS = 15_000;
const PRESENCE_JOIN_POLL_MS = 150;

interface ReciterAvailabilityValue {
    manualEnabled: boolean;
    isAvailable: boolean;
    isBusy: boolean;
    isSyncing: boolean;
    setManualEnabled: (enabled: boolean) => Promise<void>;
    setCallBusy: (busy: boolean) => void;
}

const DEFAULT_VALUE: ReciterAvailabilityValue = {
    manualEnabled: false,
    isAvailable: false,
    isBusy: false,
    isSyncing: false,
    setManualEnabled: async () => undefined,
    setCallBusy: () => {},
};

const ReciterAvailabilityContext = createContext<ReciterAvailabilityValue>(DEFAULT_VALUE);

// eslint-disable-next-line react-refresh/only-export-components
export const useReciterAvailability = () => useContext(ReciterAvailabilityContext);

export const ReciterAvailabilityProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, role } = useAuth();
    const userId = user?.id;
    const { toast } = useToast();
    const [manualEnabled, setManualEnabledState] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const manualEnabledRef = useRef(false);
    const isBusyRef = useRef(false);
    const isForegroundRef = useRef(true);
    const cleanedUpRef = useRef(false);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const syncInFlightRef = useRef<Promise<boolean> | null>(null);
    const connectPresenceRef = useRef<() => void>(() => undefined);

    const waitForJoinedPresence = useCallback(async (): Promise<RealtimeChannel> => {
        const deadline = Date.now() + PRESENCE_JOIN_TIMEOUT_MS;

        while (!cleanedUpRef.current && Date.now() < deadline) {
            const channel = channelRef.current;
            if (channel?.state === 'joined') return channel;
            if (!channel) connectPresenceRef.current();
            await new Promise<void>((resolve) => setTimeout(resolve, PRESENCE_JOIN_POLL_MS));
        }

        throw new Error('Presence channel did not connect in time');
    }, []);

    const syncAdvertisement = useCallback(async (forceAvailable?: boolean): Promise<boolean> => {
        if (!userId || role !== 'reciter' || cleanedUpRef.current) return false;
        if (syncInFlightRef.current) await syncInFlightRef.current;

        const desired = forceAvailable ?? computeEffectiveAvailability(
            manualEnabledRef.current,
            isForegroundRef.current,
            isBusyRef.current,
        );
        const now = new Date().toISOString();

        const operation = (async () => {
            const track = async (available: boolean) => {
                const currentChannel = channelRef.current;
                const channel = available
                    ? await waitForJoinedPresence()
                    : currentChannel?.state === 'joined' ? currentChannel : null;
                if (!channel) return;
                const result = await channel.track({
                    user_id: userId,
                    online_at: now,
                    is_available: available,
                    busy: isBusyRef.current,
                });
                if (result !== 'ok') throw new Error(`Presence track failed: ${result}`);
            };
            const updateProfile = async (available: boolean) => {
                const { data, error } = await supabase
                    .from('reciter_profiles')
                    .update({ is_available: available, last_seen_at: now })
                    .eq('user_id', userId)
                    .select('user_id')
                    .maybeSingle();
                if (error) throw error;
                if (!data) throw new Error('Reciter availability profile was not updated');
            };

            // When going offline, update Presence first but keep the channel
            // joined. The database update is still attempted if Presence fails.
            if (!desired) {
                let trackError: unknown = null;
                try {
                    await track(false);
                } catch (error) {
                    trackError = error;
                }

                let profileError: unknown = null;
                try {
                    await updateProfile(false);
                } catch (error) {
                    profileError = error;
                }
                setIsAvailable(false);
                if (profileError) throw profileError;
                if (trackError) throw trackError;
                return true;
            }

            // Do not expose the database fallback unless the live channel can
            // first advertise the same state. Roll Presence back if DB sync fails.
            await track(true);

            try {
                await updateProfile(true);
            } catch (error) {
                await track(false).catch(() => undefined);
                setIsAvailable(false);
                throw error;
            }

            setIsAvailable(true);
            return true;
        })();

        syncInFlightRef.current = operation;
        try {
            return await operation;
        } finally {
            if (syncInFlightRef.current === operation) syncInFlightRef.current = null;
        }
    }, [role, userId, waitForJoinedPresence]);

    const setManualEnabled = useCallback(async (enabled: boolean) => {
        if (!userId || role !== 'reciter' || isSyncing) return;
        setIsSyncing(true);
        manualEnabledRef.current = enabled;
        setManualEnabledState(enabled);
        if (!enabled) setIsAvailable(false);

        try {
            await syncAdvertisement();
        } catch (error) {
            console.error('[Availability] Manual update failed:', error);
            if (enabled) {
                manualEnabledRef.current = false;
                setManualEnabledState(false);
                setIsAvailable(false);
                await syncAdvertisement(false).catch(() => undefined);
            }
            toast({
                title: 'تعذر تحديث حالة التوفر',
                description: enabled
                    ? 'بقيت غير متاح للطلاب. حاول مرة أخرى'
                    : 'سيتم إعادة محاولة إخفاء حالتك تلقائياً',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, role, syncAdvertisement, toast, userId]);

    const setCallBusy = useCallback((busy: boolean) => {
        if (role !== 'reciter') return;
        isBusyRef.current = busy;
        setIsBusy(busy);
        if (busy) setIsAvailable(false);
        void syncAdvertisement().catch(error => {
            console.warn('[Availability] Failed to synchronize busy state:', error);
        });
    }, [role, syncAdvertisement]);

    useEffect(() => {
        if (!userId || role !== 'reciter') {
            manualEnabledRef.current = false;
            isBusyRef.current = false;
            setManualEnabledState(false);
            setIsAvailable(false);
            setIsBusy(false);
            return;
        }

        cleanedUpRef.current = false;
        manualEnabledRef.current = false;
        isBusyRef.current = false;
        const isNative = Capacitor.isNativePlatform();
        isForegroundRef.current = isNative || document.visibilityState === 'visible';
        setManualEnabledState(false);
        setIsAvailable(false);
        setIsBusy(false);

        const setForeground = (foreground: boolean) => {
            isForegroundRef.current = foreground;
            if (!foreground) setIsAvailable(false);
            void syncAdvertisement().catch(error => {
                console.warn('[Availability] Foreground synchronization failed:', error);
            });
        };
        const handleVisibility = () => setForeground(document.visibilityState === 'visible');

        let appStateListener: PluginListenerHandle | null = null;
        let resumeListener: PluginListenerHandle | null = null;
        let pauseListener: PluginListenerHandle | null = null;
        let effectActive = true;

        const connectPresence = () => {
            if (cleanedUpRef.current || channelRef.current) return;
            const channel = supabase.channel(PRESENCE_CHANNEL, {
                config: { presence: { key: userId } },
            });
            channelRef.current = channel;
            channel.subscribe((status) => {
                if (cleanedUpRef.current || channelRef.current !== channel) return;
                if (status === 'SUBSCRIBED') {
                    void syncAdvertisement().catch(error => {
                        console.warn('[Availability] Failed to advertise after subscribe:', error);
                    });
                    return;
                }
                if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
                    channelRef.current = null;
                    void supabase.removeChannel(channel).catch(() => undefined);
                    if (reconnectRef.current) clearTimeout(reconnectRef.current);
                    reconnectRef.current = setTimeout(() => connectPresenceRef.current(), 1_000);
                }
            });
        };

        connectPresenceRef.current = connectPresence;
        connectPresence();
        // A fresh launch is always offline, including before the channel joins.
        void syncAdvertisement(false).catch(error => {
            console.warn('[Availability] Initial offline synchronization failed:', error);
        });
        heartbeatRef.current = setInterval(() => {
            if (!isForegroundRef.current) return;
            if (!channelRef.current || channelRef.current.state !== 'joined') {
                connectPresence();
                return;
            }
            void syncAdvertisement().catch(error => {
                console.warn('[Availability] Heartbeat failed:', error);
            });
        }, RECITER_HEARTBEAT_MS);

        if (isNative) {
            void CapacitorApp.getState().then(state => {
                if (effectActive) setForeground(state.isActive);
            });
            void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
                if (effectActive) setForeground(isActive);
            })
                .then(handle => {
                    if (effectActive) appStateListener = handle;
                    else void handle.remove();
                });
            void CapacitorApp.addListener('resume', () => {
                if (effectActive) setForeground(true);
            })
                .then(handle => {
                    if (effectActive) resumeListener = handle;
                    else void handle.remove();
                });
            void CapacitorApp.addListener('pause', () => {
                if (effectActive) setForeground(false);
            })
                .then(handle => {
                    if (effectActive) pauseListener = handle;
                    else void handle.remove();
                });
        } else {
            document.addEventListener('visibilitychange', handleVisibility);
        }

        return () => {
            effectActive = false;
            cleanedUpRef.current = true;
            manualEnabledRef.current = false;
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            heartbeatRef.current = null;
            reconnectRef.current = null;
            connectPresenceRef.current = () => undefined;
            document.removeEventListener('visibilitychange', handleVisibility);
            void appStateListener?.remove();
            void resumeListener?.remove();
            void pauseListener?.remove();

            const channel = channelRef.current;
            channelRef.current = null;
            if (channel) {
                void channel.track({
                    user_id: userId,
                    online_at: new Date().toISOString(),
                    is_available: false,
                    busy: false,
                }).catch(() => undefined);
                void supabase.removeChannel(channel);
            }
            void supabase
                .from('reciter_profiles')
                .update({ is_available: false })
                .eq('user_id', userId);
        };
    }, [role, syncAdvertisement, userId]);

    const value = useMemo<ReciterAvailabilityValue>(() => ({
        manualEnabled,
        isAvailable,
        isBusy,
        isSyncing,
        setManualEnabled,
        setCallBusy,
    }), [isAvailable, isBusy, isSyncing, manualEnabled, setCallBusy, setManualEnabled]);

    return (
        <ReciterAvailabilityContext.Provider value={value}>
            {children}
        </ReciterAvailabilityContext.Provider>
    );
};
