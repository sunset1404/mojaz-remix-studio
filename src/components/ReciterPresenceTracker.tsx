import { useReciterPresence } from '@/hooks/useReciterPresence';

/**
 * ReciterPresenceTracker
 * 
 * Invisible component that activates reciter presence tracking.
 * Only does anything if the current user's role is 'reciter'.
 * Mount this inside <AuthProvider> so it has access to auth context.
 */
export const ReciterPresenceTracker = () => {
    useReciterPresence();
    return null;
};
