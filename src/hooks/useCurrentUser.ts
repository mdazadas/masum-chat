import { useData } from '../context/DataContext';

/**
 * Custom hook to get the current user's ID.
 * Optimized to use the global DataContext.
 */
export const useCurrentUserId = (): string | null => {
    const { userId } = useData();
    return userId;
};

/**
 * Returns true if the user is currently logged in.
 * Optimized to use the global DataContext.
 */
export const useIsLoggedIn = (): boolean => {
    const { userId } = useData();
    return !!userId;
};
