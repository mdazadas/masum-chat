import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: ReactNode;
}

// This component gates access using our own tab session flag.
// We do NOT rely on the SDK's useUser() hook because the @insforge/react
// InsforgeProvider makes a background /auth/refresh call that returns 401
// in Incognito (no cross-origin cookie), which wipes the SDK's user state
// even when the user just logged in with a valid session in memory.
// The actual API security is still enforced by the backend.

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const navigate = useNavigate();
    const tabSession = localStorage.getItem('masum_tab_session') || sessionStorage.getItem('masum_tab_session');

    useEffect(() => {
        if (!tabSession) {
            navigate('/', { replace: true });
        }
    }, [tabSession, navigate]);

    if (!tabSession) {
        return <div style={{ height: '100dvh', backgroundColor: 'var(--surface-color)' }} />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
