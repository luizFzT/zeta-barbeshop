import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import { useBarbershop } from '../shared/hooks/useBarbershop';
import { QRCodeCanvas } from 'qrcode.react';
import { SVGSoundwaves } from '../core/components/SVGSoundwaves';
import { SVGMagnetLine } from '../core/components/SVGMagnetLine';
import './DashboardPage.css';

const TABS = [
    { id: 'queue', label: 'Fila', icon: 'schedule' },
    { id: 'finance', label: 'Ganhos', icon: 'payments' },
    { id: 'new', label: 'Novo', icon: 'add' }, // Center action
    { id: 'stats', label: 'Métricas', icon: 'bar_chart' },
    { id: 'settings', label: 'Perfil', icon: 'person' },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const {
        barbershop,
        queue,
        loading,
        loyalty,
        history,
        stats,
        financialData,
        fetchOwnerBarbershop,
        createBarbershop,
        toggleOpen,
        updateWaitTime,
        resetWaitTime,
        callNext,
        removeFromQueue,
        addToQueue,
        subscribeRealtime,
        redeemFreeCut,
        updateBarbershopSettings,
        regenerateFinancial,
        skipEntry,
    } = useBarbershop();

    const [activeTab, setActiveTab] = useState('queue');
    const [timeAnimation, setTimeAnimation] = useState(false);
    const [calledCustomer, setCalledCustomer] = useState(null);
    const [manualName, setManualName] = useState('');
    const [manualServices, setManualServices] = useState([]);
    const [settingsForm, setSettingsForm] = useState({});
    const [settingsSaved, setSettingsSaved] = useState(false);

    useEffect(() => {
        if (user) fetchOwnerBarbershop(user.id);
    }, [user]);

    useEffect(() => {
        if (barbershop?.id) {
            const unsub = subscribeRealtime(barbershop.id);
            return unsub;
        }
    }, [barbershop?.id]);

    useEffect(() => {
        if (barbershop) {
            setSettingsForm({
                name: barbershop.name || '',
                slug: barbershop.slug || '',
                description: barbershop.description || '',
                phone: barbershop.phone || '',
                address: barbershop.address || '',
                avatar_url: barbershop.avatar_url || '',
                barber_name: barbershop.barber_name || '',
                barber_avatar_url: barbershop.barber_avatar_url || '',
                loyalty_target: barbershop.loyalty_target || 10,
                tolerance_minutes: barbershop.tolerance_minutes ?? 5,
                confirmation_window: barbershop.confirmation_window ?? 10,
                services: barbershop.services || [],
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [barbershop]);

    const handleTimeChange = (delta) => {
        setTimeAnimation(true);
        updateWaitTime(delta);
        setTimeout(() => setTimeAnimation(false), 400);
    };

    const handleCallNext = async () => {
        const called = await callNext();
        if (called) {
            setCalledCustomer(called.customer_name);
            setTimeout(() => setCalledCustomer(null), 3000);
        }
    };

    const handleAddManual = async (e) => {
        e.preventDefault();
        if (!manualName.trim()) return;
        await addToQueue(manualName.trim(), null, null, manualServices);
        setManualName('');
        setManualServices([]);
    };

    const toggleManualService = (serviceId) => {
        setManualServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        await updateBarbershopSettings(settingsForm);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
    };

    if (loading) {
        return (
            <div className="animate-pulse">Carregando dashboard...</div>
        );
    }

    if (!barbershop) {
        return (
            <BarbershopOnboarding
                createBarbershop={createBarbershop}
                user={user}
                fetchOwnerBarbershop={fetchOwnerBarbershop}
            />
        );
    }

    return (
        <div className="dash-command-center">
            {/* Top Navigation */}
            <header className="dash-header">
                <div className="dash-header-inner">
                    <div className="dash-header-left">
                        <h1 className="dash-title">Dashboard</h1>
                    </div>
                    <div className="dash-header-right">
                        <button onClick={toggleOpen} className={`dash-power-btn ${barbershop.is_open ? 'is-open' : 'is-closed'}`} title={barbershop.is_open ? 'Fechar Loja' : 'Abrir Loja'}>
                            <div className="dash-power-dot"></div>
                        </button>
                        <button className="dash-icon-btn notifications">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="dash-badge-dot"></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dash-main-scroll">
                {calledCustomer && (
                    <div className="dash-called-notification animate-fade-in">
                        Chamando: <strong>{calledCustomer}</strong>
                    </div>
                )}

                {activeTab === 'queue' && (
                    <QueueSection
                        barbershop={barbershop}
                        queue={queue}
                        timeAnimation={timeAnimation}
                        handleTimeChange={handleTimeChange}
                        resetWaitTime={resetWaitTime}
                        handleCallNext={handleCallNext}
                        removeFromQueue={removeFromQueue}
                        skipEntry={skipEntry}
                        manualName={manualName}
                        setManualName={setManualName}
                        manualServices={manualServices}
                        toggleManualService={toggleManualService}
                        handleAddManual={handleAddManual}
                        history={history}
                        financialData={financialData}
                    />
                )}

                {activeTab === 'finance' && (
                    <FinanceSection
                        financialData={financialData}
                        barbershop={barbershop}
                        updateBarbershopSettings={updateBarbershopSettings}
                        regenerateFinancial={regenerateFinancial}
                        setSettingsForm={setSettingsForm}
                        stats={stats}
                    />
                )}

                {activeTab === 'stats' && (
                    <StatsSection
                        stats={stats}
                        history={history}
                        queue={queue}
                    />
                )}

                {activeTab === 'new' && (
                    <div className="dash-new-actions">
                        <QRCodeSection barbershop={barbershop} />
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="dash-settings-wrapper">
                        <SettingsSection
                            form={settingsForm}
                            setForm={setSettingsForm}
                            onSave={handleSaveSettings}
                            saved={settingsSaved}
                            avatarUrl={barbershop.avatar_url}
                        />
                        <LoyaltySection
                            loyalty={loyalty}
                            barbershop={barbershop}
                            redeemFreeCut={redeemFreeCut}
                        />
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="dash-bottom-nav">
                <div className="dash-nav-items">
                    {TABS.map(tab => {
                        if (tab.id === 'new') {
                            return (
                                <button
                                    key={tab.id}
                                    className={`dash-nav-fab ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <div className="dash-fab-circle">
                                        <span className="material-symbols-outlined">add</span>
                                    </div>
                                    <span className="dash-nav-label">Novo</span>
                                </button>
                            );
                        }

                        return (
                            <button
                                key={tab.id}
                                className={`dash-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="material-symbols-outlined">{tab.icon}</span>
                                <span className="dash-nav-label">{tab.label}</span>
                                {tab.id === 'queue' && queue.length > 0 && (
                                    <div className="dash-nav-indicator"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

/* ===== ONBOARDING SECTION ===== */
function BarbershopOnboarding({ createBarbershop, user, fetchOwnerBarbershop }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const generateSlug = (n) => {
        return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const slug = generateSlug(name);
        await createBarbershop(user?.id, name, slug);
        await fetchOwnerBarbershop(user?.id);
        setLoading(false);
    };

    return (
        <div className="container container-md" style={{ marginTop: 'var(--space-8)' }}>
            <div className="card animate-fade-in" style={{ padding: 'var(--space-8)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--accent)', marginBottom: 'var(--space-4)' }}>storefront</span>
                    <h2>Bem-vindo ao Zeta Barbershop</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                        Para começar a gerenciar sua fila, você precisa criar o seu Espaço (Barbearia).
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="onboardShopName">Nome da Barbearia</label>
                        <input
                            id="onboardShopName"
                            className="input"
                            type="text"
                            placeholder="Ex: Barbearia do João"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        {name && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                URL do cliente: <strong style={{ color: 'var(--accent)' }}>/view/{generateSlug(name)}</strong>
                            </span>
                        )}
                    </div>
                    <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-4)' }}>
                        {loading ? 'Criando...' : 'Criar minha Barbearia'}
                    </button>
                </form>
            </div>
        </div>
    );
}

/* ===== QUEUE SECTION (Command Center) ===== */
function QueueSection({
    barbershop, queue, timeAnimation, handleTimeChange,
    resetWaitTime, handleCallNext, removeFromQueue, skipEntry,
    manualName, setManualName, handleAddManual,
    manualServices, toggleManualService, history, financialData
}) {
    const todayRevenue = financialData
        ? financialData
            .filter(d => {
                const dateMs = new Date(d.date).getTime();
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                return dateMs >= startOfToday.getTime();
            })
            .reduce((sum, item) => sum + (Number(item.price) || 0), 0)
        : 0;

    return (
        <div className="dash-section stagger">
            {/* Stats Dashboard */}
            <div className="dash-stats-grid">
                <div className="dash-stat-card">
                    <div className="dash-stat-header">
                        <span className="material-symbols-outlined stat-icon highlight">payments</span>
                        <span className="stat-label">Hoje</span>
                    </div>
                    <div className="stat-value">R$ {todayRevenue.toFixed(0)}</div>
                    <div className="stat-trend positive">
                        <span className="material-symbols-outlined">trending_up</span>
                        <span>+12%</span>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-header">
                        <span className="material-symbols-outlined stat-icon primary">groups</span>
                        <span className="stat-label">Restantes</span>
                    </div>
                    <div className="stat-value">{queue.length}</div>
                    <div className="stat-subtext">na fila agora</div>
                </div>
            </div>

            {/* Quick Actions / Add Manual */}
            <div className="dash-card dash-quick-actions relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full opacity-30 pointer-events-none" style={{ height: '40px' }}>
                    <SVGMagnetLine />
                </div>
                <div className="dash-card-header relative z-10 pt-2">
                    <h2 className="dash-card-title">Ações Rápidas</h2>
                </div>
                <form className="dash-add-row relative z-10" onSubmit={handleAddManual}>
                    <input
                        className="input"
                        type="text"
                        placeholder="Nome do cliente (Manual)"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        maxLength={50}
                        required
                    />
                    <button className="btn btn-primary" type="submit">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </form>
                {barbershop?.services && barbershop.services.length > 0 && manualName.trim().length > 0 && (
                    <div className="dash-manual-services" style={{ marginTop: 'var(--space-4)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>
                            Serviços:
                        </span>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            {barbershop.services.map(s => (
                                <label key={s.id} className={`dash-chip ${manualServices.includes(s.id) ? 'active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={manualServices.includes(s.id)}
                                        onChange={() => toggleManualService(s.id)}
                                        style={{ display: 'none' }}
                                    />
                                    {s.name}
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Time Control Card (Collapsible or subtle) */}
            <div className="dash-card dash-time-control">
                <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="dash-card-title" style={{ fontSize: '13px' }}>Atraso Geral (+/-)</h2>
                    <div className="dash-time-tag">
                        <span className={`dash-time-val ${timeAnimation ? 'dash-time-animate' : ''}`}>{barbershop.wait_time_minutes}</span> min
                    </div>
                </div>
                <div className="dash-time-controls" style={{ marginTop: 'var(--space-3)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTimeChange(-5)}>-5</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTimeChange(5)}>+5</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTimeChange(15)}>+15</button>
                    <button className="btn btn-danger btn-sm" onClick={resetWaitTime}>Zerar</button>
                </div>
            </div>

            {/* Timeline (Queue) */}
            <div className="dash-timeline-section">
                <div className="dash-timeline-header">
                    <h2 className="dash-timeline-title">Fila de Espera</h2>
                    {queue.length > 0 && (
                        <button className="btn btn-primary btn-sm dash-call-btn" onClick={handleCallNext}>
                            <span className="material-symbols-outlined">notifications_active</span>
                            Chamar
                        </button>
                    )}
                </div>

                {queue.length === 0 ? (
                    <div className="dash-empty">
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5, marginBottom: 'var(--space-3)', display: 'block' }}>weekend</span>
                        <p>Nenhum cliente na fila</p>
                    </div>
                ) : (
                    <div className="dash-timeline">
                        {queue.map((entry, index) => {
                            const isNext = index === 0 && entry.confirmation_status === 'none';
                            const isConfirmed = entry.confirmation_status === 'confirmed';
                            const isPending = entry.confirmation_status === 'pending';
                            const isSkipped = entry.confirmation_status === 'skipped';

                            // Initials logic
                            const initials = entry.customer_name.substring(0, 2).toUpperCase();

                            return (
                                <div key={entry.id} className={`dash-tl-item ${index === 0 ? 'is-next' : ''}`}>
                                    {/* Line connecting nodes */}
                                    {index !== queue.length - 1 && <div className="dash-tl-line"></div>}

                                    {/* Avatar / Position Node */}
                                    <div className="dash-tl-node">
                                        {entry.user_id ? (
                                            <div className="dash-tl-avatar google-auth" style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${entry.customer_name}&background=1a1a2e&color=a855f7')` }}></div>
                                        ) : (
                                            <div className="dash-tl-avatar manual-auth">{initials}</div>
                                        )}
                                        {index === 0 ? (
                                            <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%) translateX(100%)', zIndex: 10 }}>
                                                <SVGSoundwaves className="opacity-90 animate-fade-in" />
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Content Card */}
                                    <div className="dash-tl-content">
                                        <div className="dash-tl-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="dash-tl-pos">{entry.position}º</span>
                                                <h3 className="dash-tl-name">{entry.customer_name}</h3>
                                            </div>
                                            <span className="dash-tl-time">{getTimeAgo(entry.created_at)}</span>
                                        </div>

                                        <div className="dash-tl-body">
                                            {/* Status Badges */}
                                            <div className="dash-tl-badges">
                                                {isConfirmed && <span className="dash-badge confirmed">Confirmado</span>}
                                                {isPending && <span className="dash-badge pending">Aguardando</span>}
                                                {isNext && <span className="dash-badge accent">Próximo</span>}
                                                {isSkipped && <span className="dash-badge warning">Atrasado</span>}
                                                {entry.user_id && <span className="dash-badge neutral">App</span>}
                                            </div>

                                            {/* Actions */}
                                            <div className="dash-tl-actions">
                                                {isPending && (
                                                    <button className="dash-icon-action danger" onClick={() => skipEntry(entry.id)} title="Pular">
                                                        <span className="material-symbols-outlined">skip_next</span>
                                                    </button>
                                                )}
                                                <button className="dash-icon-action neutral" onClick={() => removeFromQueue(entry.id)} title="Remover">
                                                    <span className="material-symbols-outlined">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent History */}
            {history.length > 0 && (
                <div className="dash-card dash-history-compact">
                    <div className="dash-card-header">
                        <h2 className="dash-card-title" style={{ fontSize: '13px' }}>Últimos Atendidos</h2>
                    </div>
                    <div className="dash-history-list">
                        {history.slice(0, 3).map(h => (
                            <div key={h.id} className="dash-history-item">
                                <span className="dash-history-name">{h.customer_name}</span>
                                <span className="dash-history-time">{getTimeAgo(h.served_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ===== LOYALTY SECTION ===== */
function LoyaltySection({ loyalty, barbershop, redeemFreeCut }) {
    const target = barbershop?.loyalty_target || 10;

    return (
        <div className="dash-section stagger">
            <div className="dash-section-header">
                <h1 className="dash-page-title">Programa de Fidelidade</h1>
                <span className="dash-loyalty-rule">{target} cortes = 1 grátis</span>
            </div>

            <div className="dash-card">
                <div className="dash-card-label">Clientes Fidelidade ({loyalty.length})</div>

                {loyalty.length === 0 ? (
                    <div className="dash-empty">
                        <span>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </span>
                        <p>Nenhum cliente registrado ainda</p>
                    </div>
                ) : (
                    <div className="dash-loyalty-table">
                        <div className="dash-loyalty-header-row">
                            <span>Cliente</span>
                            <span>Visitas</span>
                            <span>Progresso</span>
                            <span>Ação</span>
                        </div>
                        {loyalty.map(client => {
                            const progress = client.visits % target;
                            const totalEarned = Math.floor(client.visits / target);
                            const freeCutsAvailable = totalEarned - (client.free_cuts_used || 0);

                            return (
                                <div key={client.user_id} className="dash-loyalty-row">
                                    <div className="dash-loyalty-client">
                                        <span className="dash-loyalty-name">{client.customer_name}</span>
                                        <span className="dash-loyalty-email">{client.email}</span>
                                    </div>
                                    <div className="dash-loyalty-visits">
                                        <span className="dash-loyalty-count">{client.visits}</span>
                                    </div>
                                    <div className="dash-loyalty-progress">
                                        <div className="dash-progress-bar">
                                            <div
                                                className="dash-progress-fill"
                                                style={{ width: `${(progress / target) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="dash-progress-text">{progress}/{target}</span>
                                    </div>
                                    <div className="dash-loyalty-action">
                                        {freeCutsAvailable > 0 ? (
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => redeemFreeCut(client.user_id)}
                                            >
                                                Dar Corte Grátis ({freeCutsAvailable})
                                            </button>
                                        ) : (
                                            <span className="dash-loyalty-pending">
                                                Falta {target - progress}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ===== STATS SECTION ===== */
function StatsSection({ stats, history, queue }) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date().getDay();
    const maxVal = Math.max(...stats.weeklyData, 1);

    return (
        <div className="dash-section stagger">
            <div className="dash-section-header">
                <h1 className="dash-page-title">Estatísticas</h1>
            </div>

            <div className="dash-stats-grid">
                <div className="dash-stat-card">
                    <span className="dash-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>
                    <span className="dash-stat-value">{stats.todayServed}</span>
                    <span className="dash-stat-label">Atendidos Hoje</span>
                </div>
                <div className="dash-stat-card">
                    <span className="dash-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span>
                    <span className="dash-stat-value">{stats.avgTime}<small>min</small></span>
                    <span className="dash-stat-label">Tempo Médio</span>
                </div>
                <div className="dash-stat-card">
                    <span className="dash-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></span>
                    <span className="dash-stat-value">{queue.length}</span>
                    <span className="dash-stat-label">Na Fila Agora</span>
                </div>
                <div className="dash-stat-card">
                    <span className="dash-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg></span>
                    <span className="dash-stat-value">{stats.totalClients}</span>
                    <span className="dash-stat-label">Total de Clientes</span>
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="dash-card">
                <div className="dash-card-label">Clientes por Dia (Última Semana)</div>
                <div className="dash-chart">
                    {stats.weeklyData.map((val, i) => {
                        const dayIndex = (today - 6 + i + 7) % 7;
                        return (
                            <div key={i} className="dash-chart-bar-container">
                                <div className="dash-chart-value">{val}</div>
                                <div className="dash-chart-bar-bg">
                                    <div
                                        className="dash-chart-bar"
                                        style={{ height: `${(val / maxVal) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="dash-chart-label">{days[dayIndex]}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent History */}
            <div className="dash-card">
                <div className="dash-card-label">Histórico Recente</div>
                {history.length === 0 ? (
                    <div className="dash-empty">
                        <span>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </span>
                        <p>Nenhum atendimento registrado</p>
                    </div>
                ) : (
                    <div className="dash-history-list">
                        {history.map(h => (
                            <div key={h.id} className="dash-history-item">
                                <span className="dash-history-name">{h.customer_name}</span>
                                <span className="dash-history-time">{getTimeAgo(h.served_at)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ===== SETTINGS SECTION ===== */
function SettingsSection({ form, setForm, onSave, saved, avatarUrl }) {
    const [newService, setNewService] = useState({ name: '', duration_minutes: 30, price: '' });

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem (PNG, JPG)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setForm(f => ({ ...f, avatar_url: event.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleBarberPhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem (PNG, JPG)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setForm(f => ({ ...f, barber_avatar_url: event.target.result }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="dash-section stagger">
            <div className="dash-section-header">
                <h1 className="dash-page-title">Configurações</h1>
            </div>

            <form className="dash-card dash-settings-form" onSubmit={onSave}>
                <div className="dash-card-label">Dados da Barbearia</div>

                {/* Logo Upload */}
                <div className="dash-logo-upload">
                    <div className="dash-logo-preview">
                        {(form.avatar_url || avatarUrl) ? (
                            <img src={form.avatar_url || avatarUrl} alt="Logo" />
                        ) : (
                            <span className="dash-logo-placeholder">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                            </span>
                        )}
                    </div>
                    <div className="dash-logo-info">
                        <label className="btn btn-secondary btn-sm dash-logo-btn">
                            {(form.avatar_url || avatarUrl) ? 'Trocar Logo' : 'Enviar Logo'}
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleLogoUpload}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <span className="dash-logo-hint">.PNG, .JPG — máx 2MB</span>
                    </div>
                </div>

                <div className="dash-settings-grid">
                    {/* Barber Profile */}
                    <div className="dash-section-subtitle" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-2)', marginBottom: '-8px', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Perfil do Barbeiro</div>
                    <div className="input-group">
                        <label>Seu Nome</label>
                        <input
                            className="input"
                            type="text"
                            value={form.barber_name || ''}
                            onChange={e => setForm(f => ({ ...f, barber_name: e.target.value }))}
                            placeholder="Seu nome ou apelido"
                        />
                    </div>
                    <div className="dash-logo-upload" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                        <div className="dash-logo-preview" style={{ borderRadius: '50%' }}>
                            {form.barber_avatar_url ? (
                                <img src={form.barber_avatar_url} alt="Barbeiro" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <span className="dash-logo-placeholder" style={{ borderRadius: '50%' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </span>
                            )}
                        </div>
                        <div className="dash-logo-info">
                            <label className="btn btn-secondary btn-sm dash-logo-btn">
                                {form.barber_avatar_url ? 'Trocar Foto' : 'Enviar Foto'}
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleBarberPhotoUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <span className="dash-logo-hint">.PNG, .JPG — máx 2MB</span>
                        </div>
                    </div>

                    <div className="dash-section-subtitle" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-4)', marginBottom: '-8px', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>Dados da Barbearia</div>
                    <div className="input-group">
                        <label>Nome da Barbearia</label>
                        <input
                            className="input"
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    <div className="input-group">
                        <label>Slug (URL)</label>
                        <input
                            className="input"
                            type="text"
                            value={form.slug}
                            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                        />
                    </div>
                    <div className="input-group full-width">
                        <label>Descrição</label>
                        <input
                            className="input"
                            type="text"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                    </div>
                    <div className="input-group">
                        <label>Telefone</label>
                        <input
                            className="input"
                            type="text"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        />
                    </div>
                    <div className="input-group">
                        <label>Endereço</label>
                        <input
                            className="input"
                            type="text"
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        />
                    </div>
                    <div className="input-group full-width">
                        <label>Cortes para Fidelidade Grátis</label>
                        <input
                            className="input"
                            type="number"
                            min="1"
                            max="100"
                            value={form.loyalty_target === '' ? '' : form.loyalty_target}
                            onChange={e => setForm(f => ({ ...f, loyalty_target: e.target.value === '' ? '' : (parseInt(e.target.value) || 10) }))}
                        />
                    </div>

                    {/* Tolerance & Confirmation Settings */}
                    <div className="input-group">
                        <label>Tolerância para chegar (min)</label>
                        <input
                            className="input"
                            type="number"
                            min="1"
                            max="15"
                            value={form.tolerance_minutes === '' ? '' : form.tolerance_minutes}
                            onChange={e => setForm(f => ({ ...f, tolerance_minutes: e.target.value === '' ? '' : (parseInt(e.target.value) || 5) }))}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tempo que o cliente tem pra chegar após ser chamado</span>
                    </div>
                    <div className="input-group">
                        <label>Janela de confirmação (min)</label>
                        <input
                            className="input"
                            type="number"
                            min="3"
                            max="30"
                            value={form.confirmation_window === '' ? '' : form.confirmation_window}
                            onChange={e => setForm(f => ({ ...f, confirmation_window: e.target.value === '' ? '' : (parseInt(e.target.value) || 10) }))}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tempo que o cliente tem pra confirmar presença</span>
                    </div>

                    {/* Services Manager */}
                    <div className="input-group full-width dash-services-config" style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
                        <label>Serviços Oferecidos</label>
                        <div className="dash-services-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {(form.services || []).map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px' }}>
                                    <span>{s.name} — {s.duration_minutes} min {s.price ? `(R$ ${Number(s.price).toFixed(2)})` : ''}</span>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                                        setForm(f => ({ ...f, services: (f.services || []).filter(srv => srv.id !== s.id) }));
                                    }}>✕</button>
                                </div>
                            ))}
                            {(!form.services || form.services.length === 0) && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nenhum serviço cadastrado.</p>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px auto', gap: '8px', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: '12px' }}>Nome do Serviço</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={newService.name}
                                    onChange={e => setNewService({ ...newService, name: e.target.value })}
                                    placeholder="Ex: Corte Degrade"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px' }}>Minutos</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={newService.duration_minutes}
                                    onChange={e => setNewService({ ...newService, duration_minutes: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px' }}>Preço R$</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={newService.price}
                                    onChange={e => setNewService({ ...newService, price: e.target.value })}
                                />
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    if (!newService.name.trim()) return;
                                    const serviceToAdd = {
                                        id: 's' + Date.now(),
                                        name: newService.name.trim(),
                                        duration_minutes: parseInt(newService.duration_minutes) || 30,
                                        price: parseFloat(newService.price) || 0
                                    };
                                    setForm(f => ({ ...f, services: [...(f.services || []), serviceToAdd] }));
                                    setNewService({ name: '', duration_minutes: 30, price: '' });
                                }}
                            >
                                + Adicionar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dash-settings-actions">
                    <button className="btn btn-primary" type="submit">
                        {saved ? 'Salvo!' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}


/* ===== FINANCE SECTION ===== */
function buildDonutPaths(slices, radius, center, inner) {
    let angle = -90;
    return slices.map((slice) => {
        if (slice.pct === 0) return null;
        const sweep = (slice.pct / 100) * 360;
        const startAngle = angle;
        const endAngle = angle + sweep;
        angle = endAngle;

        const startRadO = (startAngle * Math.PI) / 180;
        const endRadO = (endAngle * Math.PI) / 180;

        const x1O = center + radius * Math.cos(startRadO);
        const y1O = center + radius * Math.sin(startRadO);
        const x2O = center + radius * Math.cos(endRadO);
        const y2O = center + radius * Math.sin(endRadO);

        const x1I = center + inner * Math.cos(endRadO);
        const y1I = center + inner * Math.sin(endRadO);
        const x2I = center + inner * Math.cos(startRadO);
        const y2I = center + inner * Math.sin(startRadO);

        const large = sweep > 180 ? 1 : 0;
        const d = [
            `M ${x1O} ${y1O}`,
            `A ${radius} ${radius} 0 ${large} 1 ${x2O} ${y2O}`,
            `L ${x1I} ${y1I}`,
            `A ${inner} ${inner} 0 ${large} 0 ${x2I} ${y2I}`,
            'Z',
        ].join(' ');

        return { d, color: slice.color, name: slice.name, pct: slice.pct, key: slice.id };
    }).filter(Boolean);
}

const PIE_COLORS = [
    '#a855f7', '#22d3ee', '#f472b6', '#34d399', '#fb923c',
    '#818cf8', '#facc15', '#f87171', '#2dd4bf', '#c084fc',
];

function FinanceSection({ financialData, barbershop, updateBarbershopSettings, regenerateFinancial, setSettingsForm }) {
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [editPrice, setEditPrice] = useState('');

    const services = barbershop?.services || [];

    // Aggregate data by service
    const serviceAgg = {};
    financialData.forEach(record => {
        if (!serviceAgg[record.service_id]) {
            serviceAgg[record.service_id] = {
                name: record.service_name,
                id: record.service_id,
                count: 0,
                revenue: 0,
            };
        }
        serviceAgg[record.service_id].count += 1;
        serviceAgg[record.service_id].revenue += Number(record.price) || 0;
    });

    const aggList = Object.values(serviceAgg).sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = aggList.reduce((sum, s) => sum + s.revenue, 0);
    const totalCount = aggList.reduce((sum, s) => sum + s.count, 0);
    const ticketMedio = totalCount > 0 ? totalRevenue / totalCount : 0;
    const champion = aggList[0] || null;

    // Pie chart slices
    const slices = aggList.map((item, i) => ({
        ...item,
        pct: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
        color: PIE_COLORS[i % PIE_COLORS.length],
    }));

    // Build SVG donut paths
    const pieRadius = 90;
    const pieCenter = 110;
    const pieInner = 55;

    const piePaths = buildDonutPaths(slices, pieRadius, pieCenter, pieInner);

    const handleStartEdit = (serviceId, currentPrice) => {
        setEditingServiceId(serviceId);
        setEditPrice(String(currentPrice));
    };

    const handleSavePrice = async (serviceId) => {
        const newPrice = parseFloat(editPrice);
        if (isNaN(newPrice) || newPrice < 0) return;
        const updatedServices = services.map(s =>
            s.id === serviceId ? { ...s, price: newPrice } : s
        );
        await updateBarbershopSettings({ services: updatedServices });
        setSettingsForm(f => ({ ...f, services: updatedServices }));
        setEditingServiceId(null);
    };

    const handlePromotion = async (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;
        const discountedPrice = Math.round(service.price * 0.8 * 100) / 100;
        const updatedServices = services.map(s =>
            s.id === serviceId ? { ...s, price: discountedPrice } : s
        );
        await updateBarbershopSettings({ services: updatedServices });
        setSettingsForm(f => ({ ...f, services: updatedServices }));
    };

    return (
        <div className="dash-section stagger">
            <div className="dash-section-header">
                <h1 className="dash-page-title">Financeiro</h1>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => regenerateFinancial(services)}
                    title="Gerar novos dados simulados"
                >
                    ↻ Regenerar Dados
                </button>
            </div>

            {financialData.length === 0 ? (
                <div className="dash-card">
                    <div className="dash-empty">
                        <span>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </span>
                        <p>Nenhum dado financeiro. Cadastre serviços e clique em &quot;Regenerar Dados&quot;.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="dash-stats-grid">
                        <div className="dash-stat-card">
                            <span className="dash-stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </span>
                            <span className="dash-stat-value">R$ {totalRevenue.toFixed(0)}</span>
                            <span className="dash-stat-label">Receita da Semana</span>
                        </div>
                        <div className="dash-stat-card">
                            <span className="dash-stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                            </span>
                            <span className="dash-stat-value">{totalCount}</span>
                            <span className="dash-stat-label">Atendimentos</span>
                        </div>
                        <div className="dash-stat-card">
                            <span className="dash-stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </span>
                            <span className="dash-stat-value">R$ {ticketMedio.toFixed(0)}</span>
                            <span className="dash-stat-label">Ticket Médio</span>
                        </div>
                        <div className="dash-stat-card">
                            <span className="dash-stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </span>
                            <span className="dash-stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>{champion?.name || '—'}</span>
                            <span className="dash-stat-label">Serviço Campeão</span>
                        </div>
                    </div>

                    {/* Pie Chart + Legend */}
                    <div className="dash-card">
                        <div className="dash-card-label">Receita por Serviço</div>
                        <div className="fin-chart-container">
                            <div className="fin-pie-wrapper">
                                <svg viewBox={`0 0 ${pieCenter * 2} ${pieCenter * 2}`} className="fin-pie-svg">
                                    {piePaths.map((p) => (
                                        <path
                                            key={p.key}
                                            d={p.d}
                                            fill={p.color}
                                            stroke="var(--bg-primary)"
                                            strokeWidth="2"
                                            className="fin-pie-slice"
                                        >
                                            <title>{p.name}: {p.pct.toFixed(1)}%</title>
                                        </path>
                                    ))}
                                    <text x={pieCenter} y={pieCenter - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="800">
                                        R$ {totalRevenue.toFixed(0)}
                                    </text>
                                    <text x={pieCenter} y={pieCenter + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="500">
                                        receita total
                                    </text>
                                </svg>
                            </div>
                            <div className="fin-legend">
                                {slices.map(s => (
                                    <div key={s.id} className="fin-legend-item">
                                        <span className="fin-legend-dot" style={{ background: s.color }}></span>
                                        <span className="fin-legend-name">{s.name}</span>
                                        <span className="fin-legend-pct">{s.pct.toFixed(0)}%</span>
                                        <span className="fin-legend-value">R$ {s.revenue.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Service Performance Table */}
                    <div className="dash-card">
                        <div className="dash-card-label">Desempenho por Serviço</div>
                        <div className="fin-table">
                            <div className="fin-table-header">
                                <span>Serviço</span>
                                <span>Atend.</span>
                                <span>Receita</span>
                                <span>Preço Atual</span>
                                <span>Ações</span>
                            </div>
                            {aggList.map((item, i) => {
                                const currentService = services.find(s => s.id === item.id);
                                const currentPrice = currentService?.price || item.revenue / item.count;
                                const isLowSales = item.count <= 2;

                                return (
                                    <div key={item.id} className={`fin-table-row ${isLowSales ? 'fin-row-warning' : ''}`}>
                                        <div className="fin-table-service">
                                            <span className="fin-table-color" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                                            <span>{item.name}</span>
                                            {isLowSales && <span className="fin-badge-low">⚠ Pouca saída</span>}
                                        </div>
                                        <span className="fin-table-count">{item.count}</span>
                                        <span className="fin-table-revenue">R$ {item.revenue.toFixed(0)}</span>
                                        <div className="fin-table-price">
                                            {editingServiceId === item.id ? (
                                                <div className="fin-edit-price">
                                                    <input
                                                        className="input fin-price-input"
                                                        type="number"
                                                        value={editPrice}
                                                        onChange={e => setEditPrice(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={e => e.key === 'Enter' && handleSavePrice(item.id)}
                                                    />
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleSavePrice(item.id)}>✓</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingServiceId(null)}>✕</button>
                                                </div>
                                            ) : (
                                                <span className="fin-current-price">R$ {Number(currentPrice).toFixed(2)}</span>
                                            )}
                                        </div>
                                        <div className="fin-table-actions">
                                            {editingServiceId !== item.id && currentService && (
                                                <>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleStartEdit(item.id, currentPrice)}
                                                    >
                                                        Ajustar
                                                    </button>
                                                    {isLowSales && (
                                                        <button
                                                            className="btn btn-accent btn-sm fin-promo-btn"
                                                            onClick={() => handlePromotion(item.id)}
                                                            title="Aplicar -20% de desconto"
                                                        >
                                                            -20%
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ===== QR CODE SECTION ===== */
function QRCodeSection({ barbershop }) {
    const qrRef = useRef(null);
    const printRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const publicUrl = `${window.location.origin}/queue/${barbershop.slug}`;

    const handleDownload = useCallback(() => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        // Build a branded image
        const size = 600;
        const padding = 60;
        const total = size + padding * 2;
        const offscreen = document.createElement('canvas');
        offscreen.width = total;
        offscreen.height = total + 100;
        const ctx = offscreen.getContext('2d');
        // Background
        ctx.fillStyle = '#0a061e';
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);
        // Border glow
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.roundRect(10, 10, offscreen.width - 20, offscreen.height - 20, 20);
        ctx.stroke();
        // QR white background
        ctx.fillStyle = '#ffffff';
        ctx.roundRect(padding - 10, padding - 10, size + 20, size + 20, 12);
        ctx.fill();
        // QR code
        ctx.drawImage(canvas, padding, padding, size, size);
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(barbershop.name, offscreen.width / 2, size + padding + 50);
        ctx.fillStyle = '#a855f7';
        ctx.font = '16px sans-serif';
        ctx.fillText('Escaneie para entrar na fila', offscreen.width / 2, size + padding + 80);
        // Download
        const link = document.createElement('a');
        link.download = `qrcode-${barbershop.slug}.png`;
        link.href = offscreen.toDataURL('image/png');
        link.click();
    }, [barbershop]);

    const handlePrint = useCallback(() => {
        const content = printRef.current;
        if (!content) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>QR Code - ${barbershop.name}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; font-family: sans-serif; }
                .print-card { text-align: center; padding: 40px; border: 3px solid #a855f7; border-radius: 20px; max-width: 400px; }
                .print-card h2 { font-size: 28px; margin-bottom: 8px; color: #1a1a2e; }
                .print-card p { color: #666; font-size: 14px; margin-bottom: 24px; }
                .print-card canvas, .print-card img { width: 280px; height: 280px; }
                .print-footer { margin-top: 20px; color: #a855f7; font-weight: 600; font-size: 16px; }
                .print-url { font-size: 11px; color: #999; margin-top: 8px; word-break: break-all; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style></head><body>
            <div class="print-card">
                <h2>${barbershop.name}</h2>
                <p>Escaneie o QR Code para entrar na fila</p>
                <img src="${qrRef.current?.querySelector('canvas')?.toDataURL()}" />
                <div class="print-footer">📱 Aponte a câmera aqui</div>
                <div class="print-url">${publicUrl}</div>
            </div>
            </body></html>
        `);
        win.document.close();
        setTimeout(() => { win.print(); }, 300);
    }, [barbershop, publicUrl]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [publicUrl]);

    return (
        <div className="dash-section stagger">
            <div className="dash-section-header">
                <h1 className="dash-page-title">QR Code da Fila</h1>
            </div>

            {/* QR Preview Card */}
            <div className="dash-card qr-card">
                <div className="qr-preview" ref={qrRef}>
                    <QRCodeCanvas
                        value={publicUrl}
                        size={280}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#1a1a2e"
                        includeMargin={true}
                        imageSettings={barbershop.avatar_url ? {
                            src: barbershop.avatar_url,
                            height: 40,
                            width: 40,
                            excavate: true,
                        } : undefined}
                    />
                </div>
                <div className="qr-info">
                    <h3 className="qr-shop-name">{barbershop.name}</h3>
                    <p className="qr-shop-desc">Escaneie para entrar na fila</p>
                    <div className="qr-url-box">
                        <span className="qr-url">{publicUrl}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="qr-actions">
                <button className="btn btn-primary qr-action-btn" onClick={handleDownload}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Baixar PNG
                </button>
                <button className="btn btn-secondary qr-action-btn" onClick={handlePrint}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Imprimir
                </button>
                <button className={`btn ${copied ? 'btn-primary' : 'btn-secondary'} qr-action-btn`} onClick={handleCopy}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    {copied ? '✅ Copiado!' : 'Copiar Link'}
                </button>
            </div>

            {/* Print Preview Card */}
            <div className="dash-card qr-print-card" ref={printRef}>
                <div className="qr-print-header">
                    <div className="qr-print-logo">
                        {barbershop.avatar_url ? (
                            <img src={barbershop.avatar_url} alt={barbershop.name} />
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                        )}
                    </div>
                    <div>
                        <h3>{barbershop.name}</h3>
                        <p>Escaneie o QR Code para entrar na fila</p>
                    </div>
                </div>
                <div className="qr-print-qr">
                    <QRCodeCanvas value={publicUrl} size={200} level="H" bgColor="#ffffff" fgColor="#1a1a2e" includeMargin={true} />
                </div>
                <div className="qr-print-footer">
                    <span>📱 Aponte a câmera aqui</span>
                    <span className="qr-print-url">{publicUrl}</span>
                </div>
            </div>

            {/* Usage Tips */}
            <div className="dash-card qr-tips">
                <div className="dash-card-label">💡 Dicas de uso</div>
                <ul className="qr-tips-list">
                    <li>📋 Imprima e cole na entrada da barbearia</li>
                    <li>📱 Fixe no celular para mostrar aos clientes</li>
                    <li>📲 Compartilhe nas redes sociais e WhatsApp</li>
                    <li>🪧 Coloque em um display na recepção</li>
                </ul>
            </div>
        </div>
    );
}

/* ===== HELPERS ===== */
function getTimeAgo(dateString) {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diff = Math.floor((now - then) / 60000);
    if (diff < 1) return 'agora';
    if (diff === 1) return '1 min atrás';
    if (diff < 60) return `${diff} min atrás`;
    const hours = Math.floor(diff / 60);
    if (hours === 1) return '1h atrás';
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
}
