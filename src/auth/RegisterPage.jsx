import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import { useBarbershop } from '../shared/hooks/useBarbershop';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [shopName, setShopName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp, isDemoMode } = useAuth();
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
        setLoading(true);

        const { error: signUpError } = await signUp(email, password, name);

        if (signUpError) {
            setError(signUpError.message || 'Erro ao criar conta');
            setLoading(false);
            return;
        }

        // Create the barbershop
        const slug = generateSlug(shopName);
        await createBarbershop(isDemoMode ? 'demo-user-001' : undefined, shopName, slug);

        navigate('/dashboard');
    };

    return (
        <>
            <h2>Criar Conta</h2>
            {isDemoMode && (
                <div className="auth-demo-banner">
                    🎯 <strong>Modo Demo</strong> — Preencha qualquer dado para testar
                </div>
            )}
            {error && <div className="auth-error">{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="name">Seu nome</label>
                    <input
                        id="name"
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
                    <input
                        id="reg-password"
                        className="input"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />
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
