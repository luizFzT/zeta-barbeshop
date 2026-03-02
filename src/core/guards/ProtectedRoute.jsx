import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
            }}>
                <div className="animate-pulse" style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>
                    ✂️ Carregando...
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    return children;
}
