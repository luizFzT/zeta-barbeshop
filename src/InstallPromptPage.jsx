import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './InstallPromptPage.css';

export default function InstallPromptPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Detect if the app is already installed and running in standalone mode (PWA)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isStandalone) {
            navigate('/auth/login');
        }
    }, [navigate]);

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

                <div className="install-footer">
                    <p>Após instalar, abra o ícone do Zeta na sua tela inicial para fazer login.</p>
                </div>
            </div>
        </div>
    );
}
