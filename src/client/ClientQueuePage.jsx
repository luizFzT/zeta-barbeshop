import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import { useBarbershop } from '../shared/hooks/useBarbershop';
import { useTheme } from '../shared/hooks/useTheme';
import './ClientQueuePage.css';

// Helper: send notification via Service Worker or fallback
function sendNotification(title, body, tag) {
    try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                body,
                tag: tag || 'zeta-queue',
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, tag: tag || 'zeta-queue' });
        }
    } catch { /* ignore */ }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw-notify.js').catch(() => { /* ignore */ });
    }
}

function requestNotifPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

export default function ClientQueuePage() {
    const { slug } = useParams();
    const { user, signInWithGoogle } = useAuth();
    const {
        barbershop,
        queue,
        loading,
        fetchBySlug,
        addToQueue,
        subscribeRealtime,
        getLoyaltyInfo,
        requestConfirmation,
        confirmPresence,
        expireEntry,
        sendFallbackWhatsApp,
    } = useBarbershop();
    const { theme, toggleTheme } = useTheme();

    const [joinedQueue, setJoinedQueue] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [myPosition, setMyPosition] = useState(null);
    const [myEntryId, setMyEntryId] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [guestName, setGuestName] = useState('');
    const prevTimeRef = useRef(null);

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);

    // Service selection
    const [showServiceSelection, setShowServiceSelection] = useState(false);
    const [selectedServices, setSelectedServices] = useState([]);
    const [targetTime, setTargetTime] = useState(null);
    const [displayTime, setDisplayTime] = useState({ m: 0, s: 0 });

    // Confirmation system
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmCountdown, setConfirmCountdown] = useState({ m: 0, s: 0 });
    const [toleranceCountdown, setToleranceCountdown] = useState(null); // { m, s } or null
    const [wasExpired, setWasExpired] = useState(false);
    const confirmRequestedRef = useRef(false);
    const fallbackSentRef = useRef(false);
    const [toleranceEnd, setToleranceEnd] = useState(null);

    useEffect(() => {
        const load = async () => {
            const data = await fetchBySlug(slug);
            if (!data) setNotFound(true);
        };
        load();
    }, [slug, fetchBySlug]);

    useEffect(() => {
        if (barbershop?.id) {
            const unsub = subscribeRealtime(barbershop.id);
            return unsub;
        }
    }, [barbershop?.id, subscribeRealtime]);

    // Calculate exact wait time target
    useEffect(() => {
        if (!barbershop) return;

        const baseMinutes = barbershop.wait_time_minutes || 0;
        const peopleAhead = myPosition ? queue.slice(0, myPosition - 1) : queue;
        // Injecting a 3-minute invisible buffer per person for physical transition/cleaning
        const sumDurationAhead = peopleAhead.reduce((acc, curr) => acc + (curr.total_duration || 25) + 3, 0);
        const totalMinutes = baseMinutes + sumDurationAhead;

        if (!targetTime) {
            const target = Date.now() + totalMinutes * 60000;
            setTargetTime(target);
            prevTimeRef.current = totalMinutes;
        } else if (prevTimeRef.current !== null && totalMinutes !== prevTimeRef.current) {
            // Only update target if the calculated total changes due to queue moving
            const diffMinutes = totalMinutes - prevTimeRef.current;
            setTargetTime(prev => prev + (diffMinutes * 60000));
            prevTimeRef.current = totalMinutes;
        }
    }, [barbershop, barbershop?.wait_time_minutes, queue, myPosition, targetTime]);

    // Derived State for Join Flow: Base Wait + Queue Duration + Selected Services Duration
    const joinFlowEstimatedMinutes = barbershop ? (() => {
        const baseMinutes = barbershop.wait_time_minutes || 0;
        const queueDuration = queue.reduce((acc, curr) => acc + (curr.total_duration || 25) + 3, 0);
        const selectedServicesDuration = selectedServices.reduce((acc, serviceId) => {
            const service = barbershop.services?.find(s => s.id === serviceId);
            return acc + (service?.duration_minutes || 0);
        }, 0);
        return baseMinutes + queueDuration + selectedServicesDuration;
    })() : 0;

    // Real-time countdown timer
    useEffect(() => {
        if (!targetTime) return;

        const updateTimer = () => {
            const now = Date.now();
            const diff = targetTime - now;
            if (diff <= 0) {
                setDisplayTime({ m: 0, s: 0 });
            } else {
                const totalSeconds = Math.floor(diff / 1000);
                setDisplayTime({
                    m: Math.floor(totalSeconds / 60),
                    s: totalSeconds % 60
                });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);

    // Track position in queue + confirmation logic
    useEffect(() => {
        if (myEntryId && queue.length > 0) {
            const myEntry = queue.find(e => e.id === myEntryId);
            if (myEntry) {
                setMyPosition(myEntry.position);
                // Position 1 notification
                if (myEntry.position === 1 && myEntry.confirmation_status === 'confirmed') {
                    setShowNotification(true);
                    playNotificationSound();
                    sendNotification('🎯 É sua vez!', `Você tem ${barbershop?.tolerance_minutes || 5} minutos para chegar!`, 'zeta-your-turn');
                    // Start tolerance countdown
                    if (!toleranceEnd) {
                        setToleranceEnd(Date.now() + (barbershop?.tolerance_minutes || 5) * 60000);
                    }
                }
            } else {
                // Entry removed from queue
                if (joinedQueue) {
                    setWasExpired(true);
                    sendNotification('❌ Você saiu da fila', 'Sua vez expirou. Entre novamente se desejar.', 'zeta-expired');
                }
                setJoinedQueue(false);
                setMyPosition(null);
                setMyEntryId(null);
                setShowConfirmModal(false);
                confirmRequestedRef.current = false;
                setToleranceEnd(null);
                setToleranceCountdown(null);
            }
        }
    }, [queue, myEntryId, joinedQueue, barbershop?.tolerance_minutes, toleranceEnd]);

    // Trigger confirmation when ≤15min estimated wait
    useEffect(() => {
        if (!myEntryId || !joinedQueue || confirmRequestedRef.current) return;
        const myEntry = queue.find(e => e.id === myEntryId);
        if (!myEntry || myEntry.confirmation_status !== 'none') return;

        // Already confirmed or pending? skip
        if (displayTime.m <= 15 && (displayTime.m > 0 || displayTime.s > 0)) {
            confirmRequestedRef.current = true;
            requestConfirmation(myEntryId);
            setShowConfirmModal(true);
            playNotificationSound();
            sendNotification('⏰ Confirme sua presença!', 'Faltam poucos minutos. Confirme que você está a caminho!', 'zeta-confirm');
        }
    }, [displayTime, myEntryId, joinedQueue, queue, requestConfirmation]);

    // Confirmation countdown timer
    useEffect(() => {
        if (!myEntryId || !joinedQueue) return;
        const myEntry = queue.find(e => e.id === myEntryId);
        if (!myEntry || myEntry.confirmation_status !== 'pending' || !myEntry.confirmation_deadline) return;

        const tick = () => {
            const now = Date.now();
            const deadline = new Date(myEntry.confirmation_deadline).getTime();
            const diff = deadline - now;
            if (diff <= 0) {
                // Time up! Apply Soft Skip
                expireEntry(myEntryId);
                return;
            }
            const totalSec = Math.floor(diff / 1000);

            // Disparo Multicanal: 3 minutos antes (180 segundos)
            if (totalSec <= 180 && !fallbackSentRef.current) {
                fallbackSentRef.current = true;
                sendFallbackWhatsApp(myEntry);
            }

            setConfirmCountdown({ m: Math.floor(totalSec / 60), s: totalSec % 60 });
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [queue, myEntryId, joinedQueue, expireEntry, sendFallbackWhatsApp]);

    // Tolerance countdown (when it's your turn)
    useEffect(() => {
        if (!toleranceEnd) return;

        const tick = () => {
            const diff = toleranceEnd - Date.now();
            if (diff <= 0) {
                setToleranceCountdown({ m: 0, s: 0 });
                return;
            }
            const totalSec = Math.floor(diff / 1000);
            setToleranceCountdown({ m: Math.floor(totalSec / 60), s: totalSec % 60 });
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [toleranceEnd]);

    // Notification when queue shrinks (someone leaves)
    const prevQueueLenRef = useRef(null);
    useEffect(() => {
        if (prevQueueLenRef.current !== null && queue.length < prevQueueLenRef.current && joinedQueue) {
            sendNotification('📢 Fila diminuiu!', `Agora há ${queue.length} pessoa(s) na fila. Sua posição pode ter mudado!`, 'zeta-queue-update');
        }
        prevQueueLenRef.current = queue.length;
    }, [queue.length, joinedQueue]);

    const handleConfirmPresence = useCallback(() => {
        if (myEntryId) {
            confirmPresence(myEntryId);
            setShowConfirmModal(false);
            sendNotification('✅ Presença confirmada!', 'Fique atento, em breve será sua vez!', 'zeta-confirmed');
        }
    }, [myEntryId, confirmPresence]);

    const handleGoogleLogin = async () => {
        await signInWithGoogle();
    };

    const handleJoinQueue = () => {
        if (barbershop?.services && barbershop.services.length > 0) {
            setShowServiceSelection(true);
        } else {
            confirmJoinQueue();
        }
    };

    const handleGuestJoin = (e) => {
        e.preventDefault();
        if (!guestName.trim()) return;
        if (barbershop?.services && barbershop.services.length > 0) {
            setShowServiceSelection(true);
        } else {
            confirmJoinQueue();
        }
    };

    const confirmJoinQueue = async () => {
        if (isJoining) return;
        const name = user?.user_metadata?.name || guestName.trim();
        if (!name) return;

        setIsJoining(true);
        try {
            const entry = await addToQueue(
                name,
                user?.id || null,
                user?.email || null,
                selectedServices
            );
            if (entry) {
                setMyEntryId(entry.id);
                setMyPosition(queue.length + 1);
                setJoinedQueue(true);
                setShowServiceSelection(false);
                setSelectedServices([]);
                setWasExpired(false);
                confirmRequestedRef.current = false;
                fallbackSentRef.current = false;
                setToleranceEnd(null);
                setToleranceCountdown(null);
                // Register SW and ask for notification permission
                registerServiceWorker();
                requestNotifPermission();
            }
        } finally {
            setIsJoining(false);
        }
    };

    const toggleService = (serviceId) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const loyaltyInfo = user ? getLoyaltyInfo(user.id) : null;

    // Formatting Helpers for Circular Progress
    const formatTimeDisplay = (m) => {
        if (m >= 60) {
            const hrs = Math.floor(m / 60);
            const mins = m % 60;
            return (
                <>
                    {hrs}<small>h</small> {String(mins).padStart(2, '0')}<small>m</small>
                </>
            );
        }
        return (
            <>{m}<small>m</small></>
        );
    };

    if (loading) {
        return (
            <div className="cq-loading">
                <div className="cq-loading-icon animate-pulse">✂️</div>
                <p>Carregando...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="cq-not-found">
                <div className="cq-not-found-icon">😕</div>
                <h1>Barbearia não encontrada</h1>
                <p>Verifique o endereço e tente novamente</p>
            </div>
        );
    }

    if (!barbershop) return null;

    return (
        <div className="client-queue">
            <div className="cq-bg-pattern"></div>

            {/* Notification Banner */}
            {showNotification && (
                <div className="cq-notification animate-fade-in" onClick={() => setShowNotification(false)}>
                    <div className="cq-notification-inner">
                        <span className="cq-notification-icon">🔔</span>
                        <div>
                            <strong>Sua vez chegou!</strong>
                            <p>Você é o próximo, prepare-se!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme Toggle Overlay */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 100 }}>
                <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Alternar Tema">
                    <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                </button>
            </div>

            <div className="cq-content">
                {!barbershop.is_open ? (
                    <div className="cq-closed-msg card card-glass">
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>nightlight</span>
                        <p>A barbearia está fechada no momento.</p>
                        <p className="cq-closed-sub">Volte mais tarde! 😊</p>
                    </div>
                ) : (
                    <>
                        {joinedQueue ? (
                            /* ===== LOGGED IN / JOINED DASHBOARD ===== */
                            <div className="cq-dashboard animate-fade-in">
                                <div className="cq-dash-header text-center" style={{ marginBottom: 'var(--space-6)' }}>
                                    <h1 className="cq-status-massive" style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '900', background: 'linear-gradient(135deg, var(--text-primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.2' }}>
                                        {myPosition === 1 ? (wasExpired ? 'Tempo Esgotado' : 'Sua vez!') : 'Na fila!'}
                                    </h1>
                                    <p className="cq-status-sub" style={{ color: 'var(--text-muted)' }}>
                                        {myPosition === 1 ? (wasExpired ? 'Você não confirmou a tempo.' : 'Dirija-se à cadeira do barbeiro.') : 'Fique de olho no tempo estimado para não perder a vez.'}
                                    </p>
                                </div>

                                {/* Barber Card & Wait Time */}
                                <div className="card card-glass cq-barber-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                                    <div className="cq-bc-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
                                        {barbershop.avatar_url ? (
                                            <img src={barbershop.avatar_url} alt="Shop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '24px' }}>✂️</div>
                                        )}
                                    </div>
                                    <div className="cq-bc-info" style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Barbearia</div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '4px 0' }}>{barbershop.name}</h3>
                                        <div className="cq-bc-time" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                                            Estimativa: <strong style={{ color: 'var(--text-primary)' }}>{formatTimeDisplay(displayTime.m, displayTime.s)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation Actions */}
                                {(() => {
                                    const myEntry = queue.find(e => e.id === myEntryId);
                                    if (!myEntry) return null;

                                    if (wasExpired) {
                                        return (
                                            <button className="btn btn-primary btn-block mb-4" onClick={() => { setJoinedQueue(false); setWasExpired(false); }}>
                                                Entrar Novamente
                                            </button>
                                        );
                                    }

                                    if (myPosition === 1 && toleranceCountdown) {
                                        return (
                                            <div className="card card-glass" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', border: '1px solid var(--neon-secondary)' }}>
                                                <div style={{ fontSize: '12px', color: 'var(--neon-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Tempo de Tolerância</div>
                                                <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'monospace' }}>
                                                    {String(toleranceCountdown.m).padStart(2, '0')}:{String(toleranceCountdown.s).padStart(2, '0')}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (myEntry.confirmation_status === 'confirmed') {
                                        return (
                                            <div className="card card-glass mb-4 text-center" style={{ background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                                                <span className="material-symbols-outlined" style={{ color: '#4ade80', fontSize: '32px', marginBottom: '8px' }}>check_circle</span>
                                                <p style={{ color: '#4ade80', fontWeight: '600' }}>Sua presença está confirmada!</p>
                                            </div>
                                        );
                                    }

                                    if (myEntry.confirmation_status === 'pending') {
                                        return (
                                            <div className="card card-glass mb-4 text-center" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                                                <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '32px', marginBottom: '8px' }}>hourglass_empty</span>
                                                <p style={{ color: '#fbbf24', fontWeight: '600', marginBottom: '16px' }}>Por favor, confirme sua presença or perderá a vez.</p>
                                                <button className="btn btn-primary btn-block" onClick={handleConfirmPresence}>
                                                    Confirmar Agora
                                                </button>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Position Details & Queue Timeline */}
                                <div className="card card-glass" style={{ marginBottom: 'var(--space-5)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Sua Posição na Fila</h3>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '800', color: 'var(--accent)' }}>
                                            {myPosition}º
                                        </div>
                                    </div>

                                    {/* Vertical Timeline showing only people ahead */}
                                    <div className="cq-timeline" style={{ position: 'relative', paddingLeft: '20px', marginTop: 'var(--space-4)' }}>
                                        {queue.slice(0, myPosition).map((entry, index) => {
                                            const isMe = entry.id === myEntryId;
                                            const isNext = index === 0;
                                            const initials = entry.customer_name.substring(0, 2).toUpperCase();

                                            return (
                                                <div key={entry.id} className="cq-tl-item" style={{ display: 'flex', gap: '16px', paddingBottom: index === myPosition - 1 ? '0' : '24px', position: 'relative' }}>
                                                    {/* Line */}
                                                    {index !== myPosition - 1 && (
                                                        <div style={{ position: 'absolute', top: '32px', bottom: '0', left: '16px', width: '2px', background: isNext ? 'linear-gradient(to bottom, var(--accent), var(--border))' : 'var(--border)', transform: 'translate(-50%, 0)' }}></div>
                                                    )}

                                                    {/* Node */}
                                                    <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isMe ? 'var(--accent)' : 'var(--bg-secondary)', border: `2px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: isMe ? '#fff' : 'var(--text-muted)' }}>
                                                            {isMe ? 'Eu' : initials}
                                                        </div>
                                                        {isNext && !isMe && <div style={{ position: 'absolute', top: '-4px', left: '-4px', right: '-4px', bottom: '-4px', borderRadius: '50%', border: '2px solid var(--accent)', animation: 'neonPulse 2s infinite', zIndex: -1 }}></div>}
                                                    </div>

                                                    {/* Content */}
                                                    <div style={{ flex: 1, paddingTop: '6px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ fontSize: '14px', fontWeight: isMe ? '700' : '500', color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>
                                                                {isMe ? `${entry.customer_name} (Você)` : entry.customer_name}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{entry.position}º</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Suggested Add-ons (Horizontal Scroll) */}
                                {barbershop.services && barbershop.services.length > 0 && (
                                    <div style={{ marginBottom: 'var(--space-6)' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>Serviços Sugeridos</h3>
                                        <div style={{ display: 'flex', overflowX: 'auto', gap: 'var(--space-3)', paddingBottom: 'var(--space-2)', scrollbarWidth: 'none' }}>
                                            {barbershop.services.map(s => (
                                                <div key={s.id} className="card card-glass" style={{ minWidth: '160px', padding: 'var(--space-3)', cursor: 'default' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⏳ {s.duration_minutes}m</div>
                                                    {s.price && <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '700', marginTop: '8px' }}>R$ {Number(s.price).toFixed(2)}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Loyalty */}
                                {user && loyaltyInfo && (
                                    <div className="card card-glass" style={{ marginBottom: 'var(--space-5)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                                <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>star</span>
                                                Fidelidade
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{loyaltyInfo.progress}/{loyaltyInfo.target} cortes</div>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                                            <div style={{ width: `${(loyaltyInfo.progress / loyaltyInfo.target) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--neon-secondary), var(--accent))', borderRadius: '4px' }}></div>
                                        </div>
                                        {loyaltyInfo.freeCutsAvailable > 0 ? (
                                            <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>🎁 {loyaltyInfo.freeCutsAvailable} corte(s) grátis disponível!</div>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Faltam {loyaltyInfo.target - loyaltyInfo.progress} cortes para seu brinde.</div>
                                        )}
                                    </div>
                                )}

                                {/* Cancel / Footer Actions */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                                    <button className="btn btn-secondary" onClick={() => setShowShareModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span className="material-symbols-outlined">share</span> Compartilhar
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => { if (window.confirm('Tem certeza que deseja sair da fila?')) setJoinedQueue(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f87171' }}>
                                        <span className="material-symbols-outlined">logout</span> Sair da fila
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ===== JOIN FLOW (Not in queue yet) ===== */
                            <div className="cq-join-flow animate-fade-in">
                                {/* Header Info */}
                                <div className="cq-header text-center" style={{ marginBottom: 'var(--space-6)' }}>
                                    <div className="cq-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--accent)', margin: '0 auto var(--space-4)', overflow: 'hidden' }}>
                                        {barbershop.avatar_url ? (
                                            <img src={barbershop.avatar_url} alt="Barber" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '32px' }}>✂️</div>
                                        )}
                                    </div>
                                    <h1 className="cq-name" style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{barbershop.name}</h1>
                                    {barbershop.description && <p className="cq-desc" style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>{barbershop.description}</p>}
                                </div>

                                {/* AI Studio Reactive Timer & Barbers */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', margin: 'var(--space-4) 0' }}>
                                    <div className="glass-card" style={{ padding: '8px 24px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-secondary)', boxShadow: '0 0 8px var(--neon-secondary)', animation: 'pulse 2s infinite' }}></div>
                                        <span style={{ color: 'var(--neon-secondary)', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Fila Aberta</span>
                                    </div>

                                    {(() => {
                                        const PERCENT_LIMIT = 120; // 2 hours fills the visual circle 100%
                                        const fillPercent = Math.min(100, Math.max(5, (joinFlowEstimatedMinutes / PERCENT_LIMIT) * 100));

                                        const dotRotation = (fillPercent / 100) * 360;

                                        return (
                                            <div className="relative cursor-pointer group" style={{ position: 'relative', width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {/* Background Track */}
                                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 260 260">
                                                    <circle cx="130" cy="130" fill="none" r="120" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8" transform="rotate(-90 130 130)"></circle>
                                                </svg>
                                                {/* Filled Progress Stroke */}
                                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.5))' }} viewBox="0 0 260 260">
                                                    <defs>
                                                        <linearGradient id="gradientReactive" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#a855f7"></stop>
                                                            <stop offset="100%" stopColor="#22D3EE"></stop>
                                                        </linearGradient>
                                                    </defs>
                                                    <circle
                                                        className="progress-ring__circle"
                                                        cx="130" cy="130" fill="none" r="120"
                                                        stroke="url(#gradientReactive)" strokeWidth="8" strokeLinecap="round"
                                                        pathLength="100"
                                                        strokeDasharray="100 100"
                                                        strokeDashoffset={100 - fillPercent}
                                                        transform="rotate(-90 130 130)"
                                                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                                                    ></circle>
                                                </svg>

                                                {/* Synchronized Glowing Dot */}
                                                <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', transform: `rotate(${dotRotation}deg)`, transition: 'transform 0.5s ease-in-out', zIndex: 10 }}>
                                                    {/* Magic number top: 2px aligns exactly with stroke center, radius=120, viewBox=260 */}
                                                    <div style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 20px #fff, 0 0 10px var(--neon-secondary)' }}></div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', zIndex: 20 }}>
                                                    <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '4.5rem', color: '#fff', letterSpacing: '-2px', textShadow: '0 0 15px rgba(255,255,255,0.3)', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                        {joinFlowEstimatedMinutes}<span style={{ fontSize: '1.5rem', opacity: 0.8, letterSpacing: '0', marginLeft: '-4px' }}>m</span>
                                                    </h1>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '12px' }}>Tempo Estimado</p>
                                                </div>
                                                <div className="breathe" style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.5 }}></div>
                                            </div>
                                        );
                                    })()}

                                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                                        <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '500' }}>Corte de Cabelo</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Temos <strong style={{ color: 'var(--accent)' }}>{queue.length}</strong> {queue.length === 1 ? 'cliente' : 'clientes'} na fila</p>
                                    </div>
                                </div>

                                {/* Professional Identity Card */}
                                <div style={{ width: '100%', marginBottom: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
                                    <div style={{ padding: '0 var(--space-4)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <h3 style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '500', letterSpacing: '1px' }}>Profissional</h3>
                                    </div>
                                    <div style={{ display: 'flex', padding: '0 var(--space-4) 16px', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'default', opacity: 1 }}>
                                            <div className="glass-card" style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '16px', padding: '4px', borderColor: 'rgba(168,85,247,0.5)', boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
                                                {barbershop.barber_avatar_url ? (
                                                    <img src={barbershop.barber_avatar_url} alt="Barber" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-muted)' }}>person</span>
                                                    </div>
                                                )}
                                                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid #0A0A0F', boxShadow: '0 0 8px #a855f7' }}></div>
                                            </div>
                                            <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '-0.5px' }}>{barbershop.barber_name || 'Barbeiro'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Discreet Queue Count */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 20px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', marginBottom: 'var(--space-6)' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '24px', marginBottom: '4px' }}>groups</span>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1' }}>{queue.length}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Na Fila</div>
                                </div>

                                {showServiceSelection ? (
                                    <div className="cq-service-selection card card-glass">
                                        <h4 className="cq-ssc-title" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Quais serviços?</h4>
                                        <p className="cq-ssc-sub" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Selecione para calcularmos o tempo estimado correto.</p>

                                        <div className="cq-services-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-5)', maxHeight: '40vh', overflowY: 'auto' }}>
                                            {barbershop.services.map(s => (
                                                <label key={s.id} className={`card ${selectedServices.includes(s.id) ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', border: `1px solid ${selectedServices.includes(s.id) ? 'var(--accent)' : 'var(--border)'}`, background: selectedServices.includes(s.id) ? 'rgba(168,85,247,0.1)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.includes(s.id)}
                                                        onChange={() => toggleService(s.id)}
                                                        style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{s.name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                                                            <span>⏳ {s.duration_minutes}m</span>
                                                            {s.price && <span style={{ color: 'var(--neon-secondary)' }}>R$ {Number(s.price).toFixed(2)}</span>}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        <div className="cq-ssc-actions">
                                            <button className="btn btn-primary btn-block mb-2" onClick={confirmJoinQueue} disabled={selectedServices.length === 0 || isJoining} style={{ padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                {isJoining ? <span className="cq-loading-icon" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>⏳</span> : 'Confirmar e Entrar'}
                                            </button>
                                            <button className="btn btn-ghost btn-block" onClick={() => { setShowServiceSelection(false); setSelectedServices([]); }} disabled={isJoining}>
                                                Voltar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="cq-join-options card card-glass" style={{ padding: 'var(--space-5)' }}>
                                        {user ? (
                                            <div className="text-center">
                                                <div style={{ width: '48px', height: '48px', background: 'var(--accent)', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', margin: '0 auto var(--space-3)' }}>
                                                    {user.user_metadata?.name?.substring(0, 1).toUpperCase() || user.email?.substring(0, 1).toUpperCase()}
                                                </div>
                                                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Olá, {user.user_metadata?.name || user.email.split('@')[0]}!</h3>
                                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Você está logado. Clique abaixo para entrar na fila agrora.</p>
                                                <button className="btn btn-primary btn-block" onClick={handleJoinQueue} style={{ padding: '16px', fontSize: '16px' }}>
                                                    Entrar na Fila
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <button className="btn btn-block" onClick={handleGoogleLogin} style={{ background: '#fff', color: '#000', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '15px', fontWeight: '600' }}>
                                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                    Entrar com Google
                                                </button>
                                                <p style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-muted)', margin: '8px 0 24px' }}>💡 Acumule pontos no programa de fidelidade.</p>

                                                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                                                    <span style={{ padding: '0 12px', fontSize: '12px', color: 'var(--text-muted)' }}>ou como visitante</span>
                                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                                                </div>

                                                <form onSubmit={handleGuestJoin}>
                                                    <input className="input" type="text" placeholder="Seu nome" value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={50} required style={{ marginBottom: '12px' }} disabled={isJoining} />
                                                    <button className="btn btn-secondary btn-block" type="submit" style={{ padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} disabled={isJoining}>
                                                        {isJoining ? <span className="cq-loading-icon" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>⏳</span> : 'Entrar na Fila'}
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Location & Info */}
                                {(barbershop.phone || barbershop.address) && (
                                    <div className="card card-glass text-center" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {barbershop.phone && <div style={{ marginBottom: '4px' }}>📞 {barbershop.phone}</div>}
                                        {barbershop.address && <div>📍 {barbershop.address}</div>}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            {
                showConfirmModal && (
                    <div className="cq-confirm-overlay animate-fade-in">
                        <div className="cq-confirm-modal">
                            <div className="cq-confirm-icon">⏰</div>
                            <h2 className="cq-confirm-title">Confirme sua presença!</h2>
                            <p className="cq-confirm-desc">Faltam poucos minutos para ser chamado.</p>
                            <p className="cq-confirm-desc">Confirme que está a caminho ou perderá sua vez.</p>
                            <div className="cq-confirm-countdown">
                                <span className="cq-confirm-clock">
                                    {String(confirmCountdown.m).padStart(2, '0')}:{String(confirmCountdown.s).padStart(2, '0')}
                                </span>
                                <span className="cq-confirm-clock-label">para confirmar</span>
                            </div>
                            <button className="btn btn-primary btn-lg cq-confirm-btn" onClick={handleConfirmPresence}>
                                ✅ Estou Chegando!
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Share Modal Overlay */}
            {
                showShareModal && (
                    <div className="cq-share-overlay animate-fade-in" onClick={() => setShowShareModal(false)}>
                        <div className="cq-share-modal" onClick={e => e.stopPropagation()}>
                            <button className="cq-share-close" onClick={() => setShowShareModal(false)}>✕</button>
                            <h2 className="cq-share-title">Compartilhar Fila</h2>
                            <p className="cq-share-desc">Mostre este código ou adicione à tela inicial do seu celular para acompanhar rápidos.</p>

                            <div className="cq-share-qr-box">
                                <QRCodeCanvas
                                    value={window.location.href}
                                    size={200}
                                    level="H"
                                    bgColor="#ffffff"
                                    fgColor="#1a1a2e"
                                    includeMargin={true}
                                    imageSettings={barbershop?.avatar_url ? {
                                        src: barbershop.avatar_url,
                                        height: 30,
                                        width: 30,
                                        excavate: true,
                                    } : undefined}
                                />
                            </div>

                            <div className="cq-share-tips">
                                <div className="cq-share-tip">
                                    <strong>📱 iOS (Safari):</strong> Toque em <kbd>Compartilhar</kbd> e depois <strong>"Adicionar à Tela de Início"</strong>.
                                </div>
                                <div className="cq-share-tip">
                                    <strong>🤖 Android (Chrome):</strong> Toque em <kbd>⋮</kbd> e depois <strong>"Adicionar à tela inicial"</strong>.
                                </div>
                            </div>

                            <button
                                className="btn btn-secondary btn-block mt-4"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert("Link copiado!");
                                }}
                            >
                                Copiar Link da Fila
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch { /* ignore audio errors */ }
}
