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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--accent)', animation: 'spin 2s linear infinite' }}>content_cut</span>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Carregando...</h2>
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
