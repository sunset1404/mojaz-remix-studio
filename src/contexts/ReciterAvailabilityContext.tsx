import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RECITER_HEARTBEAT_MS } from '@/lib/reciterAvailability';

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

/**
 * Availability is driven ONLY by the manual toggle:
 *   toggle ON  -> is_available=true + heartbeat every 25s keeps last_seen_at fresh
 *   toggle OFF -> is_available=false
 * No visibility / foreground / busy automation.
 */
export const ReciterAvailabilityProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, role } = useAuth();
    const userId = user?.id;
    const { toast } = useToast();
    const [manualEnabled, setManualEnabledState] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const enabledRef = useRef(false);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const writeAvailability = useCallback(async (available: boolean) => {
        if (!userId) return;
        const { error } = await supabase
            .from('reciter_profiles')
            .update({ is_available: available, last_seen_at: new Date().toISOString() })
            .eq('user_id', userId);
        if (error) throw error;
    }, [userId]);

    const setManualEnabled = useCallback(async (enabled: boolean) => {
        if (!userId || role !== 'reciter' || isSyncing) return;
        setIsSyncing(true);
        try {
            await writeAvailability(enabled);
            enabledRef.current = enabled;
            setManualEnabledState(enabled);
        } catch (error) {
            console.error('[Availability] Manual update failed:', error);
            toast({
                title: 'تعذر تحديث حالة التوفر',
                description: 'حاول مرة أخرى',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, role, toast, userId, writeAvailability]);

    // Load current availability from DB on mount (respect whatever the reciter left it as).
    useEffect(() => {
        if (!userId || role !== 'reciter') {
            enabledRef.current = false;
            setManualEnabledState(false);
            return;
        }
        let cancelled = false;
        void supabase
            .from('reciter_profiles')
            .select('is_available')
            .eq('user_id', userId)
            .maybeSingle()
            .then(({ data }) => {
                if (cancelled) return;
                const current = !!data?.is_available;
                enabledRef.current = current;
                setManualEnabledState(current);
            });
        return () => { cancelled = true; };
    }, [role, userId]);

    // Heartbeat only while enabled, to keep last_seen_at fresh for the 60s freshness window.
    useEffect(() => {
        if (!userId || role !== 'reciter') return;
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        if (!manualEnabled) return;
        heartbeatRef.current = setInterval(() => {
            if (!enabledRef.current) return;
            void writeAvailability(true).catch((error) => {
                console.warn('[Availability] Heartbeat failed:', error);
            });
        }, RECITER_HEARTBEAT_MS);
        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        };
    }, [manualEnabled, role, userId, writeAvailability]);

    const value = useMemo<ReciterAvailabilityValue>(() => ({
        manualEnabled,
        isAvailable: manualEnabled,
        isBusy: false,
        isSyncing,
        setManualEnabled,
        setCallBusy: () => {},
    }), [manualEnabled, isSyncing, setManualEnabled]);

    return (
        <ReciterAvailabilityContext.Provider value={value}>
            {children}
        </ReciterAvailabilityContext.Provider>
    );
};
