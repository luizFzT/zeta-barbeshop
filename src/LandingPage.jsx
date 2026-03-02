import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from './shared/hooks/useTheme';
import './LandingPage.css';

export default function LandingPage() {
    const [openFaq, setOpenFaq] = useState(null);
    const { theme, toggleTheme } = useTheme();

    const toggleFaq = (index) => {
        if (openFaq === index) {
            setOpenFaq(null);
        } else {
            setOpenFaq(index);
        }
    };

    return (
        <div className="landing">
            {/* Header */}
            <header className="landing-header">
                <nav className="landing-nav container">
                    <div className="landing-brand">
                        <img src="/logo-cyberpunk-image.png" alt="Zeta Logo" style={{ height: '40px', width: 'auto', borderRadius: '8px' }} />
                    </div>
                    <div>
                        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Alternar Tema" style={{ fontSize: '1.2rem' }}>
                            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                    </div>
                </nav>
            </header>

            {/* Hero Section - Split Layout */}
            <section className="hero">
                <div className="hero-bg"></div>
                <div className="hero-content container stagger">

                    {/* Left Column: Copy & CTA */}
                    <div className="hero-text-content">
                        <span className="hero-badge badge badge-accent">SaaS de Agendamentos Totalmente Vendável</span>
                        <h1 className="hero-title">
                            Sua barbearia na <br />
                            <span className="hero-highlight">palma da mão</span> do cliente.
                        </h1>
                        <p className="hero-subtitle">
                            Zeta Barbershop é o sistema para barbeiros que desejam dominar a gestão da fila e faturamento em tempo real, fidelizando clientes de forma automática.
                        </p>

                        <div className="hero-pricing-box">
                            <span className="pricing-original">DE R$ 149,00 POR</span>
                            <span className="pricing-current">R$17,00<small>/mês</small></span>
                        </div>

                        <div className="hero-cta">
                            <Link to="/auth/register" className="btn btn-primary btn-cta">
                                Quero meu acesso!
                            </Link>
                            <p className="cta-subtext">Sem necessidade de cartão de crédito para testar.</p>
                        </div>
                    </div>

                    {/* Right Column: Floating Phone Mockups with Real Prints */}
                    <div className="hero-visual-content">
                        <div className="phones-wrapper animate-float">
                            {/* Phone 1: Serviços */}
                            <div className="phone-mockup phone-left">
                                <div className="phone-notch"></div>
                                <img src="/images/mockup-1.png" alt="Tela de Serviços do Zeta" className="phone-screen-img" />
                            </div>

                            {/* Phone 2: Fila (Center) */}
                            <div className="phone-mockup phone-center">
                                <div className="phone-notch"></div>
                                <img src="/images/mockup-2.png" alt="Tela Fila em Tempo Real do Zeta" className="phone-screen-img" />
                            </div>

                            {/* Phone 3: Dashboard */}
                            <div className="phone-mockup phone-right">
                                <div className="phone-notch"></div>
                                <img src="/images/mockup-3.png" alt="Dashboard do Barbeiro do Zeta" className="phone-screen-img" />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Tech Strip / Core Pillars (Like the Logos section in reference) */}
            <section className="tech-strip">
                <div className="container">
                    <p className="tech-strip-title">O ÚNICO SISTEMA COM FOCO EM:</p>
                    <div className="tech-strip-items">
                        <div className="tech-item"><span className="tech-icon">⚡</span> Fila Realtime</div>
                        <div className="tech-item"><span className="tech-icon">📱</span> QR Code System</div>
                        <div className="tech-item"><span className="tech-icon">🔔</span> Alertas Anti No-Show</div>
                        <div className="tech-item"><span className="tech-icon">💰</span> Dash Financeiro</div>
                    </div>
                </div>
            </section>

            {/* Features Showcase (Neon Cards) */}
            <section className="features-showcase">
                <div className="container">
                    <h2 className="section-title">E não para por aí...</h2>
                    <p className="section-subtitle" style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-12)', marginTop: '-24px' }}>
                        Tudo que você precisa para tornar sua barbearia mais valiosa.
                    </p>

                    <div className="showcase-grid">
                        <div className="showcase-item card card-glass card-neon">
                            <h3 className="showcase-title">Fila Inteligente e Dinâmica</h3>
                            <p>Após criar sua conta, seus clientes entram na fila de onde estiverem. Eles visualizam o tempo de espera atualizado a cada minuto em tempo real.</p>
                        </div>

                        <div className="showcase-item card card-glass card-neon">
                            <h3 className="showcase-title">Anti No-Show (Notificações)</h3>
                            <p>Um sistema que avisa o cliente no celular quando a vez dele está próxima. Se ele não confirmar presença, a fila anda. Fim dos atrasos que quebram a agenda.</p>
                        </div>

                        <div className="showcase-item card card-glass card-neon">
                            <h3 className="showcase-title">Painel Financeiro Integrado</h3>
                            <p>Visualize as métricas que importam. Faturamento do dia, serviços mais lucrativos e relatórios simplificados.</p>
                        </div>

                        <div className="showcase-item card card-glass card-neon">
                            <h3 className="showcase-title">Estratégia de QR Code</h3>
                            <p>O sistema gera seu QR Code oficial e o cartaz pronto. Basta imprimir, colar no espelho e ver a barbearia fluir sozinha.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <div className="container">
                    <h2 className="section-title">O que os barbeiros falam do Zeta?</h2>
                    <div className="testimonial-grid stagger">

                        <div className="testimonial-card card">
                            <p className="testimonial-quote">"Cara, incrível essa plataforma! Eu usava agenda de papel e vivia com buracos porque o cliente marcava e não vinha. Com a fila em tempo real, a cadeira não esfria nunca mais."</p>
                            <div className="testimonial-author">
                                <strong>Marcos Silva</strong>
                                <span>Dono de Barbearia</span>
                            </div>
                        </div>

                        <div className="testimonial-card card">
                            <p className="testimonial-quote">"Meus clientes acham que eu gastei fortunas num app próprio. Eles chegam no balcão, leem o QR do Zeta e vão tomar um café na esquina enquanto acompanham a posição no celular."</p>
                            <div className="testimonial-author">
                                <strong>Felipe Oliveira</strong>
                                <span>Barbeiro Autônomo</span>
                            </div>
                        </div>

                        <div className="testimonial-card card">
                            <p className="testimonial-quote">"Cada dia eu vejo que assinar o Zeta foi o melhor investimento. O painel financeiro me mostra exatamente quais cortes dão mais lucro na semana. 100% recomendável."</p>
                            <div className="testimonial-author">
                                <strong>Carlos J.</strong>
                                <span>CEO Barbearias Prime</span>
                            </div>
                        </div>

                    </div>

                    <div className="cta-center">
                        <Link to="/auth/register" className="btn btn-primary btn-cta">
                            Quero esse sistema na minha Barbearia!
                        </Link>
                    </div>
                </div>
            </section>

            {/* Pricing Offer */}
            <section className="pricing-offer">
                <div className="container">
                    <div className="offer-box card-glass">
                        <h2 className="offer-headline">Sistema completo por um valor acessível para você!</h2>

                        <ul className="offer-list">
                            <li>Gestão de Fila Ilimitada <span className="strike">R$ 149,00</span></li>
                            <li>Notificações ao Cliente <span className="strike">R$ 89,00</span></li>
                            <li>Painel Financeiro <span className="strike">R$ 59,00</span></li>
                            <li>Bônus: Cartões QRCodes Prontos</li>
                        </ul>

                        <div className="offer-price-area">
                            <p className="offer-de">De R$297,00 por 12x de</p>
                            <div className="offer-price-highlight">
                                <span>R$</span>
                                <strong>4,99</strong>
                            </div>
                            <p className="offer-ou">ou R$ 49,90/mês no plano anual!</p>
                        </div>

                        <Link to="/auth/register" className="btn btn-accent btn-huge">
                            Pegar minha vaga agora!
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="faq-section">
                <div className="container">
                    <h2 className="section-title">Ficou alguma dúvida?</h2>

                    <div className="faq-list">
                        {[
                            { question: "Preciso baixar algum aplicativo?", answer: "Não! O Zeta roda 100% no navegador. É só acessar o link e usar, não gasta memória do celular nem do seu do cliente." },
                            { question: "Funciona se eu trabalhar sozinho?", answer: "Sim. Se você é autônomo, o Zeta é perfeito para você não precisar ficar parando toda hora para anotar clientes. Eles entram na fila sozinhos." },
                            { question: "Como funciona a garantia?", answer: "Você pode criar sua conta e testar a plataforma na prática sem inserir cartão de crédito. Risco zero." }
                        ].map((faq, i) => (
                            <div key={i} className={`faq-item card ${openFaq === i ? 'open' : ''}`} onClick={() => toggleFaq(i)}>
                                <div className="faq-question">
                                    <h3>{faq.question}</h3>
                                    <span>{openFaq === i ? '−' : '+'}</span>
                                </div>
                                {openFaq === i && <div className="faq-answer"><p>{faq.answer}</p></div>}
                            </div>
                        ))}
                    </div>

                    <div className="whatsapp-help">
                        <p>Ainda tem dúvidas? Fale conosco!</p>
                        <a href="#" className="btn btn-whatsapp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            Chamar no WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <p className="footer-text">
                        © 2026 Zeta Barbershop. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
