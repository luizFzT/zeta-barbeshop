import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import { useBarbershop } from '../shared/hooks/useBarbershop';
import { useTheme } from '../shared/hooks/useTheme';
import { SVGCursorTimeline } from '../core/components/SVGCursorTimeline';
import { copyToClipboard } from '../shared/utils/clipboard';
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
    const { user, signInWithGoogle, signOut } = useAuth();
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
        removeFromQueue,
    } = useBarbershop();
    const { theme, toggleTheme } = useTheme();

    const isOwner = user?.id === barbershop?.owner_id;
    const [joinedQueue, setJoinedQueue] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [myPosition, setMyPosition] = useState(null);
    const [myEntryId, setMyEntryId] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [guestName, setGuestName] = useState('');

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [showAppBanner, setShowAppBanner] = useState(false);

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

        // Check if app is not installed (standalone) and user hasn't dismissed the banner
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const dismissed = localStorage.getItem('zeta_dismiss_install_banner');
        if (!isStandalone && !dismissed) {
            // Delay the banner slightly so it doesn't pop up immediately
            setTimeout(() => setShowAppBanner(true), 3000);
        }
    }, [slug, fetchBySlug]);

    // Auto-resume queue position if logged in user is already in the queue
    useEffect(() => {
        if (user && queue.length > 0 && !myEntryId) {
            const existingEntry = queue.find(e => e.user_id === user.id);
            if (existingEntry) {
                setMyEntryId(existingEntry.id);
                setMyPosition(existingEntry.position);
                setJoinedQueue(true);
            }
        }
    }, [user, queue, myEntryId]);

    // Auto-resume for GUEST users via localStorage
    useEffect(() => {
        if (user || myEntryId || !barbershop) return; // skip if logged in or already resumed
        try {
            const saved = localStorage.getItem('zeta-guest-queue');
            if (!saved) return;
            const session = JSON.parse(saved);
            if (session.barbershop_id !== barbershop.id) return; // different shop
            // Check if the entry still exists in the active queue
            const existingEntry = queue.find(e => e.id === session.entry_id && e.status === 'waiting');
            if (existingEntry) {
                setMyEntryId(existingEntry.id);
                setMyPosition(existingEntry.position);
                setJoinedQueue(true);
                setGuestName(existingEntry.customer_name);
            } else {
                // Entry no longer active, clear the stale session
                localStorage.removeItem('zeta-guest-queue');
            }
        } catch { /* ignore */ }
    }, [user, myEntryId, barbershop, queue]);

    useEffect(() => {
        if (barbershop?.id) {
            const unsub = subscribeRealtime(barbershop.id);
            return unsub;
        }
    }, [barbershop?.id, subscribeRealtime]);

    // Calculate precise target time using absolute epochs based on the active service update
    useEffect(() => {
        if (!barbershop) return;

        const configuredMinutes = barbershop.wait_time_minutes || 0;
        const updatedMs = barbershop.updated_at ? new Date(barbershop.updated_at).getTime() : Date.now();
        const chairEndEpoch = updatedMs + (configuredMinutes * 60000);

        // Prevent negative time on chair wait if it's overdue
        const effectiveChairEnd = Math.max(Date.now(), chairEndEpoch);

        if (myPosition === 1) {
            // Se sou o 1º da fila, meu tempo não depende mais de quem está na frente.
            if (toleranceEnd) {
                setTargetTime(toleranceEnd); // Seguir a regressiva da tolerância
            } else {
                setTargetTime(effectiveChairEnd);
            }
            return;
        }

        const peopleAhead = myPosition ? queue.slice(0, myPosition - 1) : queue;
        // Sum of actual durations + 3-minute transition buffer per person
        const queueMinutes = peopleAhead.reduce((acc, curr) => acc + (curr.total_duration || 25) + 3, 0);

        // Target is the absolute timestamp when everything ahead finishes
        const absoluteTarget = effectiveChairEnd + (queueMinutes * 60000);
        setTargetTime(absoluteTarget);

    }, [barbershop, queue, myPosition, toleranceEnd]);

    // Derived State for Join Flow: Queue Duration + Selected Services Duration
    const joinFlowEstimatedMinutes = barbershop ? (() => {
        const configuredMinutes = barbershop.wait_time_minutes || 0;
        const updatedMs = barbershop.updated_at ? new Date(barbershop.updated_at).getTime() : Date.now();
        // Calculate exact remaining minutes for the active chair
        const msRemaining = (configuredMinutes * 60000) - (Date.now() - updatedMs);
        const chairTime = Math.max(0, msRemaining / 60000);

        const queueDuration = queue.reduce((acc, curr) => acc + (curr.total_duration || 25) + 3, 0);
        const selectedServicesDuration = selectedServices.reduce((acc, serviceId) => {
            const service = barbershop.services?.find(s => s.id === serviceId);
            return acc + (service?.duration_minutes || 0);
        }, 0);

        return chairTime + queueDuration + selectedServicesDuration;
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

                // ✅ CORRECT FLOW: Tolerance only starts when barber explicitly calls the client
                // This is signaled by status === 'called' (set by callNext in the hook)
                if (myEntry.status === 'called') {
                    setShowNotification(true);
                    playNotificationSound();
                    sendNotification('É sua vez!', `Você tem ${barbershop?.tolerance_minutes || 5} minutos para chegar!`, 'zeta-your-turn');
                    // Start tolerance countdown only now
                    if (!toleranceEnd) {
                        setToleranceEnd(Date.now() + (barbershop?.tolerance_minutes || 5) * 60000);
                    }
                } else if (myEntry.position === 1 && myEntry.confirmation_status === 'confirmed') {
                    // Position 1 but waiting for barber to finish the current client — just notify once
                    sendNotification('Quase lá!', 'Você é o próximo! Aguarde o barbeiro chamar.', 'zeta-almost');
                }
            } else {
                // Entry removed from queue (expired or left)
                if (joinedQueue) {
                    setWasExpired(true);
                    sendNotification('Você saiu da fila', 'Sua vez expirou. Entre novamente se desejar.', 'zeta-expired');
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
        if (myPosition === null) return;

        // Regra de Ouro: Só peça confirmação se você for o Nº 1, OU se o tempo real do Nº 2+ for <= 15 min E o Número 1 já tiver confirmado/falhado
        // Isso evita que o App atropele o Nº 1 pedindo confirmação pro 2, 3 de uma vez se a fila for muito rápida.
        if (myPosition > 1) {
            const num1 = queue[0];
            if (num1 && num1.confirmation_status === 'none') {
                // O 1º da fila ainda nem respondeu o Zap dele, segure a onda do 2º.
                return;
            }
        }

        // Already confirmed or pending? skip
        if (displayTime.m <= 15 && (displayTime.m > 0 || displayTime.s > 0)) {
            confirmRequestedRef.current = true;
            requestConfirmation(myEntryId);
            setShowConfirmModal(true);
            playNotificationSound();
            sendNotification('Aviso Importante', 'Faltam poucos minutos. Confirme sua presença para não perder a vez!', 'zeta-confirm');
        }
    }, [displayTime, myEntryId, joinedQueue, queue, myPosition, requestConfirmation]);

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
            sendNotification('Fila Atualizada!', `Agora há ${queue.length} pessoa(s) estimadas na barbearia. Sua vez está mais perto.`, 'zeta-queue-update');
        }
        prevQueueLenRef.current = queue.length;
    }, [queue.length, joinedQueue]);

    const handleConfirmPresence = useCallback(() => {
        if (myEntryId) {
            confirmPresence(myEntryId);
            setShowConfirmModal(false);
            sendNotification('Presença Confirmada!', 'Fique atento, em breve será sua vez!', 'zeta-confirmed');
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
                setMyPosition(entry.position || queue.length + 1);
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

                // Save guest session to localStorage (for non-logged visitors)
                if (!user) {
                    try {
                        localStorage.setItem('zeta-guest-queue', JSON.stringify({
                            barbershop_id: barbershop.id,
                            entry_id: entry.id,
                        }));
                    } catch { /* ignore */ }
                }
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
                <span className="material-symbols-outlined cq-loading-icon animate-pulse" style={{ fontSize: '48px', color: 'var(--accent)' }}>content_cut</span>
                <p>Carregando...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="cq-not-found">
                <span className="material-symbols-outlined cq-not-found-icon" style={{ fontSize: '64px', color: 'var(--error-color)', marginBottom: '16px' }}>error</span>
                <h1>Barbearia não encontrada</h1>
                <p>Verifique o endereço e tente novamente</p>
            </div>
        );
    }

    if (!barbershop) return null;

    return (
        <div className="client-queue">
            {/* The global body::before provides the flow texture. We removed cq-bg-pattern. */}

            {/* Notification Banner */}
            {showNotification && (
                <div className="cq-notification animate-fade-in" onClick={() => setShowNotification(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)' }}>
                    <div className="cq-notification-inner">
                        <span className="material-symbols-outlined cq-notification-icon" style={{ color: 'var(--accent)' }}>notifications_active</span>
                        <div>
                            <strong>É sua vez!</strong>
                            <p>O barbeiro está te aguardando, prepare-se!</p>
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
                        <p className="cq-closed-sub">Volte mais tarde!</p>
                    </div>
                ) : (
                    <>
                        {joinedQueue ? (
                            /* ===== LOGGED IN / JOINED DASHBOARD ===== */
                            <div className="cq-dashboard animate-fade-in">
                                <div className="cq-dash-header text-center" style={{ marginBottom: 'var(--space-6)' }}>
                                    <h2 className="cq-status-massive" style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '900', background: 'linear-gradient(135deg, var(--text-primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.2' }}>
                                        {myPosition === 1 ? (wasExpired ? 'Tempo Esgotado' : 'Sua vez!') : 'Na fila!'}
                                    </h2>
                                    <p className="cq-status-sub" style={{ color: 'var(--text-muted)' }}>
                                        {myPosition === 1 ? (wasExpired ? 'Você não confirmou a tempo.' : 'Dirija-se à cadeira do barbeiro.') : 'Fique de olho no tempo estimado para não perder a vez.'}
                                    </p>
                                </div>

                                {/* Barber Card & Wait Time */}
                                <div className="card card-glass cq-barber-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                                    <div className="cq-bc-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--accent)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {barbershop.avatar_url ? (
                                            <img src={barbershop.avatar_url} alt="Shop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent)' }}>content_cut</span>
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
                                            <div className="card card-glass" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', border: '1px solid var(--accent)' }}>
                                                <div style={{ fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Tempo de Tolerância</div>
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

                                    {/* Prominent Countdown Timer - Styled to match the circular/neon app design */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'var(--space-6) 0' }}>
                                        <div style={{
                                            width: '180px', height: '180px', borderRadius: '50%',
                                            background: 'var(--bg-secondary)',
                                            border: '2px solid var(--accent)',
                                            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), inset 0 0 15px rgba(139, 92, 246, 0.1)',
                                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                            position: 'relative'
                                        }}>
                                            {/* Glowing ring behind */}
                                            <div style={{ position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px', borderRadius: '50%', border: '2px dashed var(--accent)', opacity: 0.3, animation: 'spin 15s linear infinite' }}></div>

                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px', fontWeight: '600', textAlign: 'center' }}>
                                                {myPosition === 1 && toleranceEnd ? 'Tolerância' : 'Estimativa'}
                                            </div>

                                            {myPosition === 1 && toleranceEnd ? (
                                                <div style={{ fontSize: '42px', fontWeight: '900', fontFamily: 'monospace', lineHeight: '1', color: toleranceCountdown && toleranceCountdown.m === 0 && toleranceCountdown.s === 0 ? '#ef4444' : 'var(--accent)', textShadow: toleranceCountdown && toleranceCountdown.m === 0 && toleranceCountdown.s === 0 ? '0 0 10px rgba(239, 68, 68, 0.5)' : '0 0 10px rgba(139, 92, 246, 0.5)' }}>
                                                    {toleranceCountdown ? (
                                                        <>{String(toleranceCountdown.m).padStart(2, '0')}<span style={{ opacity: 0.5, animation: 'pulse 2s infinite' }}>:</span>{String(toleranceCountdown.s).padStart(2, '0')}</>
                                                    ) : "00:00"}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '42px', fontWeight: '900', fontFamily: 'monospace', lineHeight: '1', color: 'var(--accent)', textShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}>
                                                    {String(displayTime.m).padStart(2, '0')}<span style={{ opacity: 0.5, animation: 'pulse 2s infinite' }}>:</span>{String(displayTime.s).padStart(2, '0')}
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    {/* The New SVG Narrative: Journey of Waiting */}
                                    <div className="py-4 my-2 opacity-90 relative z-10">
                                        <SVGCursorTimeline queueLength={queue.length} position={myPosition} />
                                    </div>

                                    {/* Vertical Timeline showing only people ahead */}
                                    <div className="cq-timeline" style={{ position: 'relative', paddingLeft: '20px', marginTop: 'var(--space-2)' }}>
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
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span> {s.duration_minutes}m
                                                    </div>
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
                                            <div style={{ width: `${(loyaltyInfo.progress / loyaltyInfo.target) * 100}%`, height: '100%', background: 'linear-gradient(135deg, var(--accent), var(--accent-hover)))', borderRadius: '4px' }}></div>
                                        </div>
                                        {loyaltyInfo.freeCutsAvailable > 0 ? (
                                            <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>redeem</span> {loyaltyInfo.freeCutsAvailable} corte(s) grátis disponível!
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Faltam {loyaltyInfo.target - loyaltyInfo.progress} cortes para seu brinde.</div>
                                        )}
                                    </div>
                                )}

                                {/* Cancel / Footer Actions */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                                    <button className="btn btn-secondary" onClick={() => setShowShareModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span className="material-symbols-outlined">share</span> Compartilhar
                                    </button>
                                    <button className="btn btn-secondary" onClick={async () => {
                                        if (myEntryId) {
                                            await removeFromQueue(myEntryId);
                                        }
                                        setJoinedQueue(false);
                                        setMyEntryId(null);
                                        setMyPosition(null);
                                        // Clear guest session from localStorage
                                        try { localStorage.removeItem('zeta-guest-queue'); } catch { /* ignore */ }
                                    }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f87171' }}>
                                        <span className="material-symbols-outlined">logout</span> Sair da fila
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-6)' }}>
                                    {isOwner && (
                                        <Link to="/dashboard" className="btn btn-ghost" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <span className="material-symbols-outlined">dashboard</span> Voltar ao Painel
                                        </Link>
                                    )}
                                    {user && (
                                        <button className="btn btn-ghost" onClick={signOut} style={{ flex: isOwner ? 1 : '1 1 100%', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <span className="material-symbols-outlined">close</span> Sair da Conta
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ===== JOIN FLOW (Not in queue yet) ===== */
                            <div className="cq-join-flow animate-fade-in">
                                {/* Header Info */}
                                <div className="cq-header text-center" style={{ marginBottom: 'var(--space-6)' }}>
                                    <div className="cq-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--accent)', margin: '0 auto var(--space-4)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {barbershop.avatar_url ? (
                                            <img src={barbershop.avatar_url} alt="Barber" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--accent)' }}>content_cut</span>
                                        )}
                                    </div>
                                    <h1 className="cq-name" style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{barbershop.name}</h1>
                                    {barbershop.description && <p className="cq-desc" style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>{barbershop.description}</p>}
                                </div>

                                {/* AI Studio Reactive Timer & Barbers */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', margin: 'var(--space-4) 0' }}>
                                    <div className="glass-card" style={{ padding: '8px 24px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'pulse 2s infinite' }}></div>
                                        <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Fila Aberta</span>
                                    </div>

                                    {(() => {
                                        const MAX_MINUTES = 300; // Limit for visual scale (5 hours = 100% full circle)
                                        const currentMinutes = joinFlowEstimatedMinutes || 0;
                                        // Calculate percentage (0 to 100), clamp to 100 max, keep at least 2% so dot is visible
                                        const fillPercent = Math.max(2, Math.min(100, (currentMinutes / MAX_MINUTES) * 100));

                                        // Stroke dash offset calculation. 
                                        // pathLength="100". offset=0 means fully drawn. offset=100 means fully empty.
                                        const strokeOffset = 100 - fillPercent;

                                        // Dot rotation. 0% = 0deg (top). 100% = 360deg.
                                        const dotRotation = (fillPercent / 100) * 360;

                                        return (
                                            <div className="relative cursor-pointer group" style={{ position: 'relative', width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {/* Background Track */}
                                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 260 260">
                                                    <circle cx="130" cy="130" fill="none" r="120" stroke="var(--border)" strokeWidth="8" transform="rotate(-90 130 130)"></circle>
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
                                                        cx="130" cy="130" fill="none" r="120"
                                                        stroke="url(#gradientReactive)" strokeWidth="8" strokeLinecap="round"
                                                        pathLength="100"
                                                        strokeDasharray="100 100"
                                                        strokeDashoffset={strokeOffset}
                                                        transform="rotate(-90 130 130)"
                                                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                                                    ></circle>
                                                </svg>

                                                {/* Synchronized Glowing Dot (Attached to the stroke tip) */}
                                                <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', transform: `rotate(${dotRotation}deg)`, transition: 'transform 1s ease-in-out', zIndex: 10 }}>
                                                    {/* Magic number top: 2px aligns exactly with stroke center, radius=120, viewBox=260 */}
                                                    <div style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', background: 'var(--text-primary)', borderRadius: '50%', boxShadow: '0 0 20px var(--text-primary), 0 0 10px var(--accent)' }}></div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', zIndex: 20 }}>
                                                    {(() => {
                                                        const totalMins = Math.ceil(joinFlowEstimatedMinutes || 0);
                                                        const h = Math.floor(totalMins / 60);
                                                        const m = totalMins % 60;
                                                        const isLong = totalMins >= 60;
                                                        return (
                                                            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: isLong ? (m > 0 ? '3.2rem' : '4rem') : '4.5rem', color: 'var(--text-primary)', letterSpacing: '-2px', textShadow: '0 0 15px rgba(168,85,247,0.3)', lineHeight: '1', display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                                                                {isLong ? (
                                                                    <>
                                                                        {h}<span style={{ fontSize: '1.5rem', opacity: 0.8, letterSpacing: '0', marginLeft: '2px', marginRight: '6px' }}>h</span>
                                                                        {m > 0 && <>{m}<span style={{ fontSize: '1.5rem', opacity: 0.8, letterSpacing: '0', marginLeft: '2px' }}>m</span></>}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {totalMins}<span style={{ fontSize: '1.5rem', opacity: 0.8, letterSpacing: '0', marginLeft: '2px' }}>m</span>
                                                                    </>
                                                                )}
                                                            </h2>
                                                        );
                                                    })()}
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '12px' }}>Tempo Estimado</p>
                                                </div>
                                                <div className="breathe" style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', borderRadius: '50%', border: '1px solid var(--border)', opacity: 0.5 }}></div>
                                            </div>
                                        );
                                    })()}

                                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                                        <h2 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '500' }}>Corte de Cabelo</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Temos <strong style={{ color: 'var(--accent)' }}>{queue.length}</strong> {queue.length === 1 ? 'cliente' : 'clientes'} na fila</p>
                                    </div>
                                </div>

                                {/* Professional Identity Card */}
                                <div style={{ width: '100%', marginBottom: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
                                    <div style={{ padding: '0 var(--space-4)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '500', letterSpacing: '1px' }}>Profissional</h3>
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
                                            <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '-0.5px' }}>{barbershop.barber_name || 'Barbeiro'}</span>
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
                                                        style={{ display: 'none' }}
                                                    />
                                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${selectedServices.includes(s.id) ? 'var(--accent)' : 'var(--border)'}`, background: selectedServices.includes(s.id) ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }}>
                                                        {selectedServices.includes(s.id) && (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{s.name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span> {s.duration_minutes}m</span>
                                                            {s.price && <span style={{ color: 'var(--accent)' }}>R$ {Number(s.price).toFixed(2)}</span>}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        <div className="cq-ssc-actions">
                                            <button className="btn btn-primary btn-block mb-2" onClick={confirmJoinQueue} disabled={selectedServices.length === 0 || isJoining} style={{ padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                                {isJoining ? <span className="material-symbols-outlined cq-loading-icon" style={{ animation: 'spin 1s linear infinite' }}>autorenew</span> : 'Confirmar e Entrar'}
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
                                                <button className="btn btn-primary btn-block" onClick={handleJoinQueue} style={{ padding: '16px', fontSize: '16px', marginBottom: '12px' }}>
                                                    Entrar na Fila
                                                </button>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {isOwner && (
                                                        <Link to="/dashboard" className="btn btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            Painel
                                                        </Link>
                                                    )}
                                                    <button className="btn btn-ghost" onClick={signOut} style={{ flex: isOwner ? 1 : '1 1 100%', color: '#f87171' }}>
                                                        Sair da Conta
                                                    </button>
                                                </div>
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
                                                        {isJoining ? <span className="material-symbols-outlined cq-loading-icon" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>autorenew</span> : 'Entrar na Fila'}
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
                                onClick={async () => {
                                    const success = await copyToClipboard(window.location.href);
                                    if (success) {
                                        alert("Link copiado!");
                                    } else {
                                        alert("Não foi possível copiar o link ativo. Copie manualmente da barra do seu navegador.");
                                    }
                                }}
                            >
                                Copiar Link da Fila
                            </button>
                        </div>
                    </div>
                )
            }

            {/* App Install Banner */}
            {
                showAppBanner && (
                    <div className="cq-app-banner animate-fade-in" style={{ position: 'fixed', bottom: '24px', left: '16px', right: '16px', zIndex: 900, background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #333' }}>
                            <img src="/logo-pwa-app.jpg" alt="Zeta" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Instale o App Zeta</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Adicione à tela inicial para acesso VIP.</div>
                        </div>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }} onClick={() => { setShowShareModal(true); setShowAppBanner(false); }}>
                            Instalar
                        </button>
                        <button className="btn btn-ghost btn-icon" style={{ padding: '4px', height: 'auto', minWidth: 'auto', color: 'var(--text-muted)' }} onClick={() => { localStorage.setItem('zeta_dismiss_install_banner', '1'); setShowAppBanner(false); }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                        </button>
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
