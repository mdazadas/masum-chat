/**
 * Custom hook to get the current user's ID without relying on the SDK's useUser().
 *
 * The InsForge SDK's useUser() hook returns null in Incognito mode because the
 * InsforgeProvider makes a /auth/refresh call that returns 401 (no cross-origin
 * httpOnly cookie), which wipes the SDK's in-memory user state.
 *
 * Instead, we read from our own sessionStorage key 'masum_user_id', which is
 * set immediately after a successful signInWithPassword call and is not affected
 * by the SDK's refresh behavior.
 */
export const useCurrentUserId = (): string | null => {
    return sessionStorage.getItem('masum_user_id');
};

/**
 * Returns true if the user is currently logged in (has an active tab session).
 */
export const useIsLoggedIn = (): boolean => {
    return sessionStorage.getItem('masum_tab_session') === 'active';
};
