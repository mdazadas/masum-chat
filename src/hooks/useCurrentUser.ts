import { insforge } from '../lib/insforge';

/**
 * Custom hook to get the current user's ID.
 * Prioritizes the SDK's in-memory state, falling back to localStorage (SDK's persistent store).
 */
export const useCurrentUserId = (): string | null => {
    // Check SDK in-memory first
    if (insforge.auth.user?.id) return insforge.auth.user.id;
    // Fallback to localStorage (where SDK persists the session)
    return localStorage.getItem('masum_user_id');
};

/**
 * Returns true if the user is currently logged in.
 */
export const useIsLoggedIn = (): boolean => {
    // User is logged in if SDK has a user OR we have a persistent tab session
    return !!insforge.auth.user || localStorage.getItem('masum_tab_session') === 'active';
};
