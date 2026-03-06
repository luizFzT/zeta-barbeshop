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

    // Role-based access control: Only barbers can access the dashboard.
    // If a client tries to access it, redirect them to the home page.
    const isBarber = user?.user_metadata?.role === 'barber';
    if (!isBarber) {
        return <Navigate to="/" replace />;
    }

    return children;
}
