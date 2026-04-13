import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import LoadingOverlay from './LoadingOverlay';


interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const navigate = useNavigate();
    const { authRestored, userId } = useData();
    const isLoggedIn = !!userId;

    useEffect(() => {
        // Only redirect to landing when auth is FULLY restored AND user is NOT logged in
        // This prevents redirecting right after login (when userId is set but authRestored may briefly be false)
        if (authRestored && !isLoggedIn) {
            navigate('/', { replace: true });
        }
    }, [authRestored, isLoggedIn, navigate]);

    // If userId is already set (e.g., just logged in), render immediately — don't block on authRestored
    if (isLoggedIn) {
        return <>{children}</>;
    }

    // If auth hasn't been restored yet AND we have no userId, show loading
    if (!authRestored) {
        return <LoadingOverlay message="Authenticating" />;
    }

    // authRestored=true but no userId → redirect handled by useEffect above
    return null;
};

export default ProtectedRoute;
