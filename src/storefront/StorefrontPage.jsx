import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBarbershop } from '../shared/hooks/useBarbershop';
import './StorefrontPage.css';

export default function StorefrontPage() {
    const { slug } = useParams();
    const {
        barbershop,
        queue,
        loading,
        fetchBySlug,
        addToQueue,
        subscribeRealtime,
    } = useBarbershop();

    const [customerName, setCustomerName] = useState('');
    const [joinedQueue, setJoinedQueue] = useState(false);
    const [myPosition, setMyPosition] = useState(null);
    const [myEntryId, setMyEntryId] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [timeChanged, setTimeChanged] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const prevTimeRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            const data = await fetchBySlug(slug);
            if (!data) setNotFound(true);
        };
        load();
    }, [slug]);

    useEffect(() => {
        if (barbershop?.id) {
            const unsub = subscribeRealtime(barbershop.id);
            return unsub;
        }
    }, [barbershop?.id]);

    // Detect time changes for animation
    useEffect(() => {
        if (barbershop && prevTimeRef.current !== null && prevTimeRef.current !== barbershop.wait_time_minutes) {
            setTimeChanged(true);
            setTimeout(() => setTimeChanged(false), 500);
        }
        if (barbershop) {
            prevTimeRef.current = barbershop.wait_time_minutes;
        }
    }, [barbershop?.wait_time_minutes]);

    // Track position in queue
    useEffect(() => {
        if (myEntryId && queue.length > 0) {
            const myEntry = queue.find(e => e.id === myEntryId);
            if (myEntry) {
                setMyPosition(myEntry.position);
                if (myEntry.position === 1) {
                    setShowNotification(true);
                    // Play notification sound
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
                    } catch (e) { /* ignore audio errors */ }
                }
            } else {
                // Was removed from queue (called or removed)
                setJoinedQueue(false);
                setMyPosition(null);
                setMyEntryId(null);
            }
        }
    }, [queue, myEntryId]);

    const handleJoinQueue = async (e) => {
        e.preventDefault();
        if (!customerName.trim()) return;

        const entry = await addToQueue(customerName.trim());
        if (entry) {
            setMyEntryId(entry.id);
            setMyPosition(queue.length + 1);
            setJoinedQueue(true);
        }
    };

    if (loading) {
        return (
            <div className="sf-loading">
                <div className="sf-loading-icon animate-pulse"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
                <p>Carregando...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="sf-not-found">
                <div className="sf-not-found-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
                <h1>Barbearia não encontrada</h1>
                <p>Verifique o endereço e tente novamente</p>
            </div>
        );
    }

    if (!barbershop) return null;

    return (
        <div className="storefront">
            <div className="sf-bg-pattern"></div>

            {/* Notification Banner */}
            {showNotification && (
                <div className="sf-notification animate-fade-in" onClick={() => setShowNotification(false)}>
                    <div className="sf-notification-inner">
                        <span className="sf-notification-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span>
                        <div>
                            <strong>Sua vez se aproxima!</strong>
                            <p>Prepare-se, você é o próximo!</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="sf-content">
                {/* Header */}
                <div className="sf-header animate-fade-in">
                    <div className="sf-avatar">
                        {barbershop.avatar_url ? (
                            <img src={barbershop.avatar_url} alt={barbershop.name} />
                        ) : (
                            <span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg></span>
                        )}
                    </div>
                    <h1 className="sf-name">{barbershop.name}</h1>
                    {barbershop.description && (
                        <p className="sf-desc">{barbershop.description}</p>
                    )}
                </div>

                {/* Status */}
                <div className={`sf-status-card card card-glass ${barbershop.is_open ? 'sf-open' : 'sf-closed'}`}>
                    <div className="sf-status-badge">
                        <span className={`sf-status-dot ${barbershop.is_open ? 'sf-dot-open' : 'sf-dot-closed'}`}></span>
                        <span className="sf-status-text">
                            {barbershop.is_open ? 'Aberto agora' : 'Fechado'}
                        </span>
                    </div>

                    {barbershop.is_open ? (
                        <div className="sf-wait-section">
                            <p className="sf-wait-label">Tempo estimado de espera</p>
                            <div className={`sf-wait-time ${timeChanged ? 'sf-time-pulse' : ''}`}>
                                <span className="sf-wait-number">{barbershop.wait_time_minutes}</span>
                                <span className="sf-wait-unit">min</span>
                            </div>
                            {barbershop.wait_time_minutes >= 60 && (
                                <div className="sf-busy-banner">
                                    Alta demanda — considere voltar mais tarde
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="sf-closed-msg">
                            <p>A barbearia está fechada no momento.</p>
                            <p className="sf-closed-sub">Volte mais tarde!</p>
                        </div>
                    )}
                </div>

                {/* Queue Section */}
                {barbershop.is_open && (
                    <div className="sf-queue-section card card-glass animate-fade-in">
                        <h3 className="sf-queue-title">
                            Fila de Espera
                            <span className="sf-queue-count">{queue.length} pessoa{queue.length !== 1 ? 's' : ''}</span>
                        </h3>

                        {/* Queue List */}
                        {queue.length > 0 && (
                            <div className="sf-queue-list">
                                {queue.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={`sf-queue-item ${entry.id === myEntryId ? 'sf-queue-me' : ''}`}
                                    >
                                        <span className="sf-queue-pos">{entry.position}º</span>
                                        <span className="sf-queue-name">
                                            {entry.customer_name}
                                            {entry.id === myEntryId && <span className="sf-you-badge">Você</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Join Queue Form */}
                        {!joinedQueue ? (
                            <form className="sf-join-form" onSubmit={handleJoinQueue}>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Seu nome"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    maxLength={50}
                                    required
                                />
                                <button className="btn btn-primary" type="submit">
                                    Entrar na Fila
                                </button>
                            </form>
                        ) : (
                            <div className="sf-joined-info">
                                <div className="sf-joined-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                                <p><strong>{customerName}</strong>, você está na fila!</p>
                                <div className="sf-your-position">
                                    <span className="sf-pos-label">Sua posição</span>
                                    <span className="sf-pos-number">{myPosition}º</span>
                                </div>
                                <p className="sf-joined-hint">
                                    Fique nesta página — você receberá um aviso quando for sua vez!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="sf-footer">
                    <p>Powered by <strong>Zeta Barbershop</strong></p>
                </div>
            </div>
        </div>
    );
}
