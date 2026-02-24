import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { insforge } from '../lib/insforge';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const navigate = useNavigate();
    const { authRestored, userId } = useData();
    const isLoggedIn = !!userId;

    useEffect(() => {
        if (authRestored && !isLoggedIn) {
            navigate('/', { replace: true });
        }
    }, [authRestored, isLoggedIn, navigate]);

    if (!authRestored) {
        return <div style={{ height: '100dvh', backgroundColor: 'var(--surface-color)' }} />;
    }

    if (!isLoggedIn) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
