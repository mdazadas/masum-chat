import { insforge } from '../lib/insforge';

/**
 * Custom hook to get the current user's ID.
 * Reliably reads from the SDK's internal state.
 */
export const useCurrentUserId = (): string | null => {
    return insforge.auth.user?.id || null;
};

/**
 * Returns true if the user is currently logged in via the SDK.
 */
export const useIsLoggedIn = (): boolean => {
    return !!insforge.auth.user;
};
