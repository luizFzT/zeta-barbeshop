import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <div className="auth-bg-pattern"></div>
            <div className="auth-content">
                <div className="auth-brand">
                    <img src="/logo-new-hero.jpg" alt="Zeta Logo" className="auth-logo-img" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', boxShadow: '0 8px 25px rgba(0,0,0,0.5)', marginBottom: 'var(--space-4)' }} />
                    <p className="auth-subtitle">Gerencie sua barbearia de forma inteligente</p>
                </div>
                <div className="auth-card card card-glass animate-scale-in">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
