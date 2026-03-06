import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import { useBarbershop } from '../shared/hooks/useBarbershop';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [shopName, setShopName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const { createBarbershop } = useBarbershop();
    const navigate = useNavigate();

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const { error: signUpError, user: newUser, session } = await signUp(email, password, name);

        if (signUpError) {
            setError(signUpError.message || 'Erro ao criar conta');
            setLoading(false);
            return;
        }

        // Se o Supabase exigir confirmação de email, não haverá sessão ativa ainda.
        if (newUser && !session) {
            setSuccessMsg('Conta criada! Verifique seu email para confirmar antes de fazer login. Sua barbearia será configurada no primeiro acesso.');
            setLoading(false);
            return;
        }

        // Se logou direto (demo mode ou sem confirmação de email), cria a barbearia
        const slug = generateSlug(shopName);
        const userId = newUser?.id || 'demo-user-001';
        try {
            await createBarbershop(userId, shopName, slug);
        } catch (err) {
            console.error('Failed to create barbershop silently', err);
        }

        navigate('/dashboard');
    };

    return (
        <>
            <h2>Criar Conta</h2>
            {error && <div className="auth-error">{error}</div>}
            {successMsg && <div className="auth-error" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>{successMsg}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="name">Seu nome</label>
                    <input
                        id="name"
                        name="auth-name-register"
                        autoComplete="off"
                        spellCheck="false"
                        className="input"
                        type="text"
                        placeholder="João Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="shopName">Nome da barbearia</label>
                    <input
                        id="shopName"
                        name="auth-shopname-register"
                        autoComplete="off"
                        spellCheck="false"
                        className="input"
                        type="text"
                        placeholder="Barbearia do João"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        required
                    />
                    {shopName && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            🔗 Slug: <strong style={{ color: 'var(--accent)' }}>/view/{generateSlug(shopName)}</strong>
                        </span>
                    )}
                </div>
                <div className="input-group">
                    <label htmlFor="reg-email">Email</label>
                    <input
                        id="reg-email"
                        name="auth-email-register"
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
                    <label htmlFor="reg-password">Senha</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            id="reg-password"
                            className="input"
                            style={{ paddingRight: '40px' }}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
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
                    {loading ? 'Criando...' : 'Criar minha barbearia'}
                </button>
            </form>
            <div className="auth-footer">
                Já tem conta? <Link to="/auth/login">Fazer login</Link>
            </div>
        </>
    );
}
