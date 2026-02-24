import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const navigate = useNavigate();
    const { initialized, authRestored } = useData();
    const tabSession = localStorage.getItem('masum_tab_session') || sessionStorage.getItem('masum_tab_session');

    useEffect(() => {
        if (authRestored && !tabSession) {
            navigate('/', { replace: true });
        }
    }, [authRestored, tabSession, navigate]);

    if (!authRestored || (!tabSession && !authRestored)) {
        return <div style={{ height: '100dvh', backgroundColor: 'var(--surface-color)' }} />;
    }

    if (!tabSession) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
