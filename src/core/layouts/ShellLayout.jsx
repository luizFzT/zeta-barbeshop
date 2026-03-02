import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import { useTheme } from '../../shared/hooks/useTheme';
import './ShellLayout.css';

export default function ShellLayout() {
    const { user, signOut, isDemoMode } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/auth/login');
    };

    return (
        <div className="shell-layout">
            <header className="shell-header">
                <div className="shell-header-inner">
                    <Link to="/dashboard" className="shell-brand">
                        <img src="/logo-zeta-neon.svg" alt="Zeta Logo" style={{ height: '28px', width: 'auto' }} />
                    </Link>
                    <div className="shell-user">
                        <button className="btn btn-ghost btn-sm" onClick={toggleTheme} title="Alternar Tema" style={{ fontSize: '1.2rem', padding: 'var(--space-1) var(--space-2)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                        {isDemoMode && <span className="badge badge-accent">DEMO</span>}
                        <span className="shell-email">{user?.email || 'barbeiro@zeta.com'}</span>
                        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                            Sair
                        </button>
                    </div>
                </div>
            </header>
            <div className="shell-body">
                <Outlet />
            </div>
        </div>
    );
}
