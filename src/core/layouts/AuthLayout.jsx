import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <div className="auth-bg-pattern"></div>
            <div className="auth-content">
                <div className="auth-brand">
                    <style>{`
                        @keyframes logoPulse {
                            0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.6), 0 8px 25px rgba(0,0,0,0.5); }
                            50% { box-shadow: 0 0 0 12px rgba(168,85,247,0), 0 8px 25px rgba(0,0,0,0.5); }
                        }
                        .auth-logo-pulse {
                            animation: logoPulse 2.4s ease-in-out infinite;
                        }
                    `}</style>
                    <img
                        src="/logo-pwa-app.jpg"
                        alt="Zeta Logo"
                        className="auth-logo-img auth-logo-pulse"
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', marginBottom: 'var(--space-4)' }}
                    />
                    <p className="auth-subtitle">Gerencie sua barbearia de forma inteligente</p>
                </div>
                <div className="auth-card card card-glass animate-scale-in">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
