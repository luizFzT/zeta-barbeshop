import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isDemoMode } from './shared/services/supabase';
import './InstallPromptPage.css';

export default function InstallPromptPage() {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isStandalone) {
            // App is running as PWA — check if user is already logged in
            const checkSession = async () => {
                if (isDemoMode) {
                    navigate('/auth/login');
                    return;
                }
                const { data: { session } } = await supabase.auth.getSession();
                navigate(session ? '/dashboard' : '/auth/login');
            };
            checkSession();
            return;
        }

        // Capture native install prompt (Android Chrome)
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [navigate]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        setInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
        setInstalling(false);
    };

    return (
        <div className="install-prompt-container">
            <div className="install-prompt-content">
                <div className="install-logo-wrapper">
                    <img
                        src="/logo-pwa-app.jpg"
                        alt="Zeta Barbershop"
                        className="install-logo"
                    />
                </div>

                <h1 className="install-title">Zeta Barbershop</h1>
                <p className="install-subtitle">
                    Este é um aplicativo privado.<br />
                    Para acessar o sistema, você precisa instalá-lo no seu dispositivo.
                </p>

                {deferredPrompt ? (
                    <div className="install-instructions">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleInstall}
                            disabled={installing}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.1rem' }}
                        >
                            <span className="material-symbols-outlined">download</span>
                            {installing ? 'Instalando...' : 'Instalar Agora'}
                        </button>
                    </div>
                ) : (
                    <div className="install-instructions">
                        <h3>Como Instalar:</h3>

                        <div className="instruction-step">
                            <span className="step-icon material-symbols-outlined">ios_share</span>
                            <p><strong>No iPhone (Safari):</strong> Toque no ícone de "Compartilhar" na barra inferior e selecione <strong>"Adicionar à Tela de Início"</strong>.</p>
                        </div>

                        <div className="instruction-step">
                            <span className="step-icon material-symbols-outlined">more_vert</span>
                            <p><strong>No Android (Chrome):</strong> Toque nos três pontinhos no canto superior e selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</p>
                        </div>
                    </div>
                )}

                <div className="install-footer">
                    <p>Após instalar, abra o ícone do Zeta na sua tela inicial para fazer login.</p>
                </div>
            </div>
        </div>
    );
}
