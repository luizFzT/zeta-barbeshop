import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, isDemoMode } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError('Email ou senha incorretos');
            setLoading(false);
            return;
        }

        navigate('/dashboard');
    };

    return (
        <>
            <h2>Entrar</h2>
            {isDemoMode && (
                <div className="auth-demo-banner">
                    🎯 <strong>Modo Demo</strong> — Use qualquer email e senha para testar
                </div>
            )}
            {error && <div className="auth-error">{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="auth-email-login"
                        autoComplete="off"
                        spellCheck="false"
                        className="input"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Senha</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            id="password"
                            className="input"
                            style={{ paddingRight: '40px' }}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0
                            }}
                            title={showPassword ? "Ocultar senha" : "Ver senha"}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
            <div className="auth-footer">
                Não tem conta? <Link to="/auth/register">Criar conta</Link>
            </div>
        </>
    );
}
