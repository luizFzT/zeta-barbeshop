import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import { useTheme } from '../../shared/hooks/useTheme';
import './ShellLayout.css';

export default function ShellLayout() {
    const { user, signOut, isDemoMode } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [shareCopied, setShareCopied] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/auth/login');
    };

    const shareApp = async () => {
        const shareData = {
            title: 'Zeta Barbershop',
            text: 'Gerencie sua barbearia com fila inteligente, confirmação automática e fidelidade. Experimente grátis!',
            url: `${window.location.origin}/auth/register`,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch { /* dismissed */ }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
            } catch { /* ignore */ }
        }
    };

    return (
        <div className="shell-layout">
            <header className="shell-header">
                <div className="shell-header-inner">
                    <Link to="/dashboard" className="shell-brand">
                        <img src="/logo-zeta-neon.svg" alt="Zeta Logo" style={{ height: '28px', width: 'auto' }} />
                    </Link>
                    <div className="shell-user">
                        <button className="btn btn-ghost btn-sm" onClick={shareApp} title={shareCopied ? 'Link copiado!' : 'Compartilhar app'} style={{ fontSize: '1.2rem', padding: 'var(--space-1) var(--space-2)', position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: shareCopied ? 'var(--accent)' : undefined }}>
                                {shareCopied ? 'check_circle' : 'share'}
                            </span>
                        </button>
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
