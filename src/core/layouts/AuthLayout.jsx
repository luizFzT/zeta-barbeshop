import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <div className="auth-bg-pattern"></div>
            <div className="auth-content">
                <div className="auth-brand">
                    <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'center' }}>
                        <img
                            src="/logo-pwa-app.jpg"
                            alt="Zeta Logo"
                            style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                boxShadow: '0 0 30px rgba(168,85,247,0.4), 0 10px 30px rgba(0,0,0,0.4)',
                                border: '2px solid var(--accent)',
                                animation: 'breathe 4s ease-in-out infinite',
                            }}
                        />
                    </div>
                    <p className="auth-subtitle">Gerencie sua barbearia de forma inteligente</p>
                </div>
                <div className="auth-card card card-glass animate-scale-in">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
