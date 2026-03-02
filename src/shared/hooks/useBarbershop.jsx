import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { supabase, isDemoMode } from '../services/supabase';

const BarbershopContext = createContext(null);

// Demo data
const DEMO_SERVICES = [
    { id: 's1', name: 'Corte Clássico', duration_minutes: 30, price: 40 },
    { id: 's2', name: 'Barba', duration_minutes: 20, price: 25 },
    { id: 's3', name: 'Sobrancelha', duration_minutes: 10, price: 15 },
    { id: 's4', name: 'Platinado', duration_minutes: 120, price: 150 },
];

const DEMO_BARBERSHOP = {
    id: 'demo-shop-001',
    name: 'Zeta Barbershop',
    slug: 'zeta-barbershop',
    is_open: true,
    wait_time_minutes: 0, // Now we rely more on the exact wait queue
    description: 'O melhor corte da cidade!',
    phone: '(11) 99999-9999',
    address: 'Rua Demo, 123',
    avatar_url: null,
    barber_name: 'Zeta',
    barber_avatar_url: null,
    loyalty_target: 10,
    tolerance_minutes: 5,
    confirmation_window: 10,
    services: DEMO_SERVICES,
};

// Persist demo settings in localStorage so both barber & client pages share data
const DEMO_SETTINGS_KEY = 'zeta-demo-settings';
const DEMO_SERVICES_KEY = 'zeta-demo-services';

function getDemoSettings() {
    try {
        const saved = localStorage.getItem(DEMO_SETTINGS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
}

function getDemoCustomServices() {
    try {
        const saved = localStorage.getItem(DEMO_SERVICES_KEY);
        return saved ? JSON.parse(saved) : null; // null means "use defaults"
    } catch { return null; }
}

function saveDemoSettings(updates) {
    try {
        const current = getDemoSettings();
        // Extract services to save separately — ensures they always persist
        if ('services' in updates) {
            localStorage.setItem(DEMO_SERVICES_KEY, JSON.stringify(updates.services));
        }
        // Save the rest of the settings (exclude services from main settings store)
        const { services: _services, ...rest } = updates;
        localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify({ ...current, ...rest }));
        window.dispatchEvent(new Event('storage-local'));
    } catch { /* ignore */ }
}

function getDemoBarbershop() {
    const customServices = getDemoCustomServices();
    return {
        ...DEMO_BARBERSHOP,
        ...getDemoSettings(),
        // Use custom services if they were ever saved, otherwise keep defaults
        services: customServices !== null ? customServices : DEMO_BARBERSHOP.services,
    };
}

const DEMO_QUEUE = [
    { id: '1', customer_name: 'João Silva', user_id: 'client-001', position: 1, status: 'waiting', created_at: new Date(Date.now() - 600000).toISOString() },
    { id: '2', customer_name: 'Maria Santos', user_id: 'client-002', position: 2, status: 'waiting', created_at: new Date(Date.now() - 300000).toISOString() },
];

const DEMO_LOYALTY = [
    { user_id: 'client-001', customer_name: 'João Silva', email: 'joao@gmail.com', visits: 8, free_cuts_used: 0, last_visit: new Date(Date.now() - 86400000).toISOString() },
    { user_id: 'client-002', customer_name: 'Maria Santos', email: 'maria@gmail.com', visits: 3, free_cuts_used: 0, last_visit: new Date(Date.now() - 172800000).toISOString() },
    { user_id: 'client-003', customer_name: 'Carlos Oliveira', email: 'carlos@gmail.com', visits: 10, free_cuts_used: 1, last_visit: new Date(Date.now() - 259200000).toISOString() },
    { user_id: 'client-004', customer_name: 'Ana Costa', email: 'ana@gmail.com', visits: 15, free_cuts_used: 1, last_visit: new Date(Date.now() - 345600000).toISOString() },
    { user_id: 'demo-client-001', customer_name: 'Cliente Demo', email: 'cliente@gmail.com', visits: 7, free_cuts_used: 0, last_visit: new Date(Date.now() - 432000000).toISOString() },
];

const DEMO_HISTORY = [
    { id: 'h1', customer_name: 'Pedro Lima', served_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'h2', customer_name: 'Lucas Mendes', served_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'h3', customer_name: 'Rafael Costa', served_at: new Date(Date.now() - 10800000).toISOString() },
    { id: 'h4', customer_name: 'Bruno Alves', served_at: new Date(Date.now() - 14400000).toISOString() },
    { id: 'h5', customer_name: 'Fernanda Rocha', served_at: new Date(Date.now() - 18000000).toISOString() },
];

const DEMO_QUEUE_KEY = 'zeta-demo-queue';
function getDemoQueue() {
    try { const saved = localStorage.getItem(DEMO_QUEUE_KEY); return saved ? JSON.parse(saved) : DEMO_QUEUE; } catch { return [...DEMO_QUEUE]; }
}
function saveDemoQueue(q) {
    try { localStorage.setItem(DEMO_QUEUE_KEY, JSON.stringify(q)); window.dispatchEvent(new Event('storage-local')); } catch { }
}

const DEMO_LOYALTY_KEY = 'zeta-demo-loyalty';
function getDemoLoyalty() {
    try { const saved = localStorage.getItem(DEMO_LOYALTY_KEY); return saved ? JSON.parse(saved) : DEMO_LOYALTY; } catch { return [...DEMO_LOYALTY]; }
}
function saveDemoLoyalty(l) {
    try { localStorage.setItem(DEMO_LOYALTY_KEY, JSON.stringify(l)); window.dispatchEvent(new Event('storage-local')); } catch { }
}

const DEMO_HISTORY_KEY = 'zeta-demo-history';
function getDemoHistory() {
    try { const saved = localStorage.getItem(DEMO_HISTORY_KEY); return saved ? JSON.parse(saved) : DEMO_HISTORY; } catch { return [...DEMO_HISTORY]; }
}
function saveDemoHistory(h) {
    try { localStorage.setItem(DEMO_HISTORY_KEY, JSON.stringify(h)); window.dispatchEvent(new Event('storage-local')); } catch { }
}

// Financial demo data — simulated weekly service records
const DEMO_FINANCIAL_KEY = 'zeta-demo-financial';
const DEMO_CUSTOMER_NAMES = [
    'João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa', 'Pedro Lima',
    'Lucas Mendes', 'Rafael Costa', 'Bruno Alves', 'Fernanda Rocha', 'Gabriel Souza',
    'Juliana Pereira', 'Diego Martins', 'Larissa Gomes', 'Thiago Ribeiro', 'Camila Ferreira',
];

function generateDemoFinancial(services) {
    if (!services || services.length === 0) return [];
    const records = [];
    const now = Date.now();
    const DAY = 86400000;
    // Weights: first service gets most, last gets least (realistic distribution)
    const weights = services.map((_, i) => Math.max(1, services.length * 2 - i * 2));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    // Generate 45-60 records over 7 days
    const totalRecords = 45 + Math.floor(Math.random() * 16);
    for (let i = 0; i < totalRecords; i++) {
        // Pick a service weighted by popularity
        let rand = Math.random() * totalWeight;
        let serviceIdx = 0;
        for (let j = 0; j < weights.length; j++) {
            rand -= weights[j];
            if (rand <= 0) { serviceIdx = j; break; }
        }
        const service = services[serviceIdx];
        const daysAgo = Math.floor(Math.random() * 7);
        const hourOffset = 8 + Math.floor(Math.random() * 10); // 8h-18h
        const date = new Date(now - daysAgo * DAY);
        date.setHours(hourOffset, Math.floor(Math.random() * 60), 0, 0);

        records.push({
            id: `fin-${i}-${Date.now()}`,
            service_name: service.name,
            service_id: service.id,
            price: Number(service.price) || 0,
            date: date.toISOString(),
            customer_name: DEMO_CUSTOMER_NAMES[Math.floor(Math.random() * DEMO_CUSTOMER_NAMES.length)],
        });
    }
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getDemoFinancial(services) {
    try {
        const saved = localStorage.getItem(DEMO_FINANCIAL_KEY);
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    // Generate fresh if nothing saved
    const data = generateDemoFinancial(services);
    try { localStorage.setItem(DEMO_FINANCIAL_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    return data;
}
function saveDemoFinancial(f) {
    try { localStorage.setItem(DEMO_FINANCIAL_KEY, JSON.stringify(f)); window.dispatchEvent(new Event('storage-local')); } catch { }
}
function regenerateDemoFinancial(services) {
    const data = generateDemoFinancial(services);
    saveDemoFinancial(data);
    return data;
}

export function BarbershopProvider({ children }) {
    const [barbershop, setBarbershop] = useState(null);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loyalty, setLoyalty] = useState([]);
    const [history, setHistory] = useState([]);
    const [financialData, setFinancialData] = useState([]);
    const [stats, setStats] = useState({
        todayServed: 5,
        avgTime: 22,
        totalClients: 47,
        weeklyData: [3, 7, 5, 8, 6, 4, 5],
    });

    // Listen for localStorage changes to sync demo data across tabs
    useEffect(() => {
        if (!isDemoMode) return;
        const handleStorage = () => {
            const rawShop = localStorage.getItem('zeta_demo_shop');
            if (rawShop) setBarbershop(JSON.parse(rawShop));

            const rawQueue = localStorage.getItem('zeta_demo_queue');
            if (rawQueue) setQueue(JSON.parse(rawQueue));

            const rawLoyalty = localStorage.getItem('zeta_demo_loyalty');
            if (rawLoyalty) setLoyalty(JSON.parse(rawLoyalty));

            const rawHistory = localStorage.getItem('zeta_demo_history');
            if (rawHistory) setHistory(JSON.parse(rawHistory));
        };
        window.addEventListener('storage', handleStorage);
        // Custom internal event for same-tab updates
        window.addEventListener('storage-local', handleStorage);
        window.addEventListener('storage-local', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('storage-local', handleStorage);
        };
    }, []);

    // Fetch queue
    async function fetchQueue(barbershopId) {
        if (isDemoMode) return;
        const { data } = await supabase
            .from('queue')
            .select('*')
            .eq('barbershop_id', barbershopId)
            .eq('status', 'waiting')
            .order('position', { ascending: true });
        if (data) setQueue(data);
    }

    // Fetch loyalty data
    async function fetchLoyalty(barbershopId) {
        if (isDemoMode) return;
        const { data } = await supabase
            .from('loyalty')
            .select('*')
            .eq('barbershop_id', barbershopId)
            .order('visits', { ascending: false });
        if (data) setLoyalty(data);
    }

    // Fetch history
    async function fetchHistory(barbershopId) {
        if (isDemoMode) return;
        const { data } = await supabase
            .from('service_history')
            .select('*')
            .eq('barbershop_id', barbershopId)
            .order('served_at', { ascending: false })
            .limit(20);
        if (data) setHistory(data);
    }

    // Fetch barbershop for owner
    const fetchOwnerBarbershop = useCallback(async (userId) => {
        if (isDemoMode) {
            const shop = { ...getDemoBarbershop(), owner_id: userId };
            setBarbershop(shop);
            setQueue(getDemoQueue());
            setLoyalty(getDemoLoyalty());
            setHistory(getDemoHistory());
            setFinancialData(getDemoFinancial(shop.services));
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('barbershops')
            .select('*')
            .eq('owner_id', userId)
            .single();

        if (!error && data) {
            setBarbershop(data);
            await fetchQueue(data.id);
            await fetchLoyalty(data.id);
            await fetchHistory(data.id);
        }
        setLoading(false);
    }, []);

    // Fetch barbershop by slug (public)
    const fetchBySlug = useCallback(async (slug) => {
        if (isDemoMode) {
            const demoShop = getDemoBarbershop();
            if (slug === demoShop.slug || slug === 'zeta-barbershop' || slug === 'demo') {
                setBarbershop(demoShop);
                setQueue(getDemoQueue());
                setLoyalty(getDemoLoyalty());
                setLoading(false);
                return demoShop;
            }
            setLoading(false);
            return null;
        }

        const { data, error } = await supabase
            .from('barbershops')
            .select('*')
            .eq('slug', slug)
            .single();

        if (!error && data) {
            setBarbershop(data);
            await fetchQueue(data.id);
        }
        setLoading(false);
        return data;
    }, []);



    // Toggle open/closed
    const toggleOpen = async () => {
        if (isDemoMode) {
            setBarbershop(prev => {
                const updated = { ...prev, is_open: !prev.is_open };
                localStorage.setItem('zeta_demo_shop', JSON.stringify(updated));
                window.dispatchEvent(new Event('storage-local')); // Trigger update across our hooks
                return updated;
            });
            return;
        }

        const newState = !barbershop.is_open;
        setBarbershop(prev => ({ ...prev, is_open: newState }));

        await supabase
            .from('barbershops')
            .update({ is_open: newState, updated_at: new Date().toISOString() })
            .eq('id', barbershop.id);
    };

    // Update wait time
    const updateWaitTime = async (delta) => {
        if (isDemoMode) {
            setBarbershop(prev => {
                const updated = { ...prev, wait_time_minutes: Math.max(0, prev.wait_time_minutes + delta) };
                localStorage.setItem('zeta_demo_shop', JSON.stringify(updated));
                window.dispatchEvent(new Event('storage-local'));
                return updated;
            });
            return;
        }

        const newTime = Math.max(0, barbershop.wait_time_minutes + delta);
        setBarbershop(prev => ({ ...prev, wait_time_minutes: newTime }));
        await supabase
            .from('barbershops')
            .update({ wait_time_minutes: newTime, updated_at: new Date().toISOString() })
            .eq('id', barbershop.id);
    };

    const resetWaitTime = async () => {
        if (isDemoMode) {
            setBarbershop(prev => {
                const updated = { ...prev, wait_time_minutes: 0 };
                localStorage.setItem('zeta_demo_shop', JSON.stringify(updated));
                window.dispatchEvent(new Event('storage-local'));
                return updated;
            });
            return;
        }

        setBarbershop(prev => ({ ...prev, wait_time_minutes: 0 }));
        await supabase
            .from('barbershops')
            .update({ wait_time_minutes: 0, updated_at: new Date().toISOString() })
            .eq('id', barbershop.id);
    };

    // Queue management
    const addToQueue = async (customerName, userId = null, email = null, selectedServicesIds = []) => {
        let totalDuration = 0;
        if (selectedServicesIds.length > 0 && barbershop?.services) {
            totalDuration = selectedServicesIds.reduce((sum, id) => {
                const s = barbershop.services.find(s => s.id === id);
                return sum + (s ? s.duration_minutes : 0);
            }, 0);
        }
        if (totalDuration === 0) totalDuration = barbershop?.wait_time_minutes || 25; // fallback

        const newEntry = {
            id: isDemoMode ? `demo-${Date.now()}` : undefined,
            barbershop_id: barbershop.id,
            customer_name: customerName,
            user_id: userId,
            email: email,
            position: queue.length + 1,
            status: 'waiting',
            confirmation_status: 'none', // none | pending | confirmed | expired
            confirmation_deadline: null,
            selected_services: selectedServicesIds,
            total_duration: totalDuration,
            created_at: new Date().toISOString(),
        };

        if (isDemoMode) {
            let newQ;
            setQueue(prev => {
                newQ = [...prev, newEntry];
                return newQ;
            });
            // Schedule the save for after the render cycle (or do it right away outside the updater)
            saveDemoQueue([...queue, newEntry]);

            // Update loyalty for this client
            if (userId) {
                setLoyalty(prev => {
                    const existing = prev.find(l => l.user_id === userId);
                    if (!existing) {
                        const newLoyalty = [...prev, {
                            user_id: userId,
                            customer_name: customerName,
                            email: email || '',
                            visits: 0,
                            free_cuts_used: 0,
                            last_visit: new Date().toISOString(),
                        }];
                        // We schedule the side effect with a timeout or useEffect
                        setTimeout(() => saveDemoLoyalty(newLoyalty), 0);
                        return newLoyalty;
                    }
                    return prev;
                });
            }
            return newEntry;
        }

        const { data, error } = await supabase
            .from('queue')
            .insert([{
                barbershop_id: barbershop.id,
                customer_name: customerName,
                user_id: userId,
                position: queue.length + 1,
                status: 'waiting',
                selected_services: selectedServicesIds,
                total_duration: totalDuration,
            }])
            .select()
            .single();

        if (!error && data) {
            setQueue(prev => [...prev, data]);
        }
        return data;
    };

    const callNext = async () => {
        if (queue.length === 0) return;
        const next = queue[0];

        if (isDemoMode) {
            // Remove from queue
            let newQ;
            setQueue(prev => {
                newQ = prev.slice(1).map((item, i) => ({ ...item, position: i + 1 }));
                return newQ;
            });
            setTimeout(() => saveDemoQueue(newQ), 0);

            // Add to history
            let newH;
            setHistory(prev => {
                newH = [{
                    id: `h-${Date.now()}`,
                    customer_name: next.customer_name,
                    served_at: new Date().toISOString(),
                }, ...prev];
                return newH;
            });
            setTimeout(() => saveDemoHistory(newH), 0);

            // Update loyalty — increment visits
            if (next.user_id) {
                let newLoyalty;
                setLoyalty(prev => {
                    newLoyalty = prev.map(l => {
                        if (l.user_id === next.user_id) {
                            return { ...l, visits: l.visits + 1, last_visit: new Date().toISOString() };
                        }
                        return l;
                    });
                    return newLoyalty;
                });
                setTimeout(() => saveDemoLoyalty(newLoyalty), 0);
            }

            // Update stats
            setStats(prev => ({ ...prev, todayServed: prev.todayServed + 1 }));

            return next;
        }

        await supabase
            .from('queue')
            .update({ status: 'called' })
            .eq('id', next.id);

        // Re-number positions
        const remaining = queue.slice(1);
        for (let i = 0; i < remaining.length; i++) {
            await supabase
                .from('queue')
                .update({ position: i + 1 })
                .eq('id', remaining[i].id);
        }

        // Increment loyalty visits
        if (next.user_id) {
            const { data: loyaltyData } = await supabase
                .from('loyalty')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .eq('user_id', next.user_id)
                .single();

            if (loyaltyData) {
                await supabase
                    .from('loyalty')
                    .update({
                        visits: loyaltyData.visits + 1,
                        last_visit: new Date().toISOString(),
                    })
                    .eq('id', loyaltyData.id);
            } else {
                await supabase
                    .from('loyalty')
                    .insert([{
                        barbershop_id: barbershop.id,
                        user_id: next.user_id,
                        customer_name: next.customer_name,
                        visits: 1,
                        last_visit: new Date().toISOString(),
                    }]);
            }
        }

        setQueue(remaining.map((item, i) => ({ ...item, position: i + 1 })));
        return next;
    };

    const removeFromQueue = async (entryId) => {
        if (isDemoMode) {
            let newQ;
            setQueue(prev => {
                newQ = prev.filter(e => e.id !== entryId).map((item, i) => ({ ...item, position: i + 1 }));
                return newQ;
            });
            setTimeout(() => saveDemoQueue(newQ), 0);
            return;
        }
        await supabase.from('queue').delete().eq('id', entryId);
        await fetchQueue(barbershop.id);
    };

    // Confirmation system
    const requestConfirmation = (entryId) => {
        const windowMin = barbershop?.confirmation_window || 10;
        const deadline = new Date(Date.now() + windowMin * 60000).toISOString();
        let newQ;
        setQueue(prev => {
            newQ = prev.map(e =>
                e.id === entryId
                    ? { ...e, confirmation_status: 'pending', confirmation_deadline: deadline }
                    : e
            );
            return newQ;
        });
        if (isDemoMode) setTimeout(() => saveDemoQueue(newQ), 0);
        return deadline;
    };

    const confirmPresence = async (entryId) => {
        let newQ;
        setQueue(prev => {
            newQ = prev.map(e =>
                e.id === entryId
                    ? { ...e, confirmation_status: 'confirmed', confirmation_deadline: null }
                    : e
            );
            return newQ;
        });
        if (isDemoMode) setTimeout(() => saveDemoQueue(newQ), 0);
    };

    // Fallback System (Multichannel)
    const sendFallbackWhatsApp = useCallback((entry) => {
        console.log(`[API MOCK] Disparando WhatsApp de Fallback para ${entry.customer_name} (ID: ${entry.id})...`);
        // Aqui chamaria uma Supabase Edge Function conectada ao Twilio/Z-API
    }, []);

    const expireEntry = async (entryId) => {
        // Soft Skip (Degradação Suave) em vez de Deletar
        let reordered;
        setQueue(prev => {
            const index = prev.findIndex(e => e.id === entryId);
            if (index === -1) return prev;

            const newQ = [...prev];
            const [skippedEntry] = newQ.splice(index, 1);
            skippedEntry.confirmation_status = 'skipped';
            skippedEntry.confirmation_deadline = null;

            // Cai 2 posições na fila (ou pro final se a fila for curta)
            const newIndex = Math.min(newQ.length, index + 2);
            newQ.splice(newIndex, 0, skippedEntry);

            // Reorganiza posições
            reordered = newQ.map((item, i) => ({ ...item, position: i + 1 }));
            return reordered;
        });
        if (reordered && isDemoMode) setTimeout(() => saveDemoQueue(reordered), 0);

        if (!isDemoMode) {
            // Lógica no Supabase: update status='waiting', confirmation_status='skipped'... reordenação.
        }
    };

    const skipEntry = async (entryId) => {
        // Barbeiro pula manualmente quem não confirmou
        await expireEntry(entryId);
    };

    // Loyalty methods
    const getLoyaltyInfo = (userId) => {
        const record = loyalty.find(l => l.user_id === userId);
        if (!record) return { visits: 0, freeCutsAvailable: 0, progress: 0, target: barbershop?.loyalty_target || 10 };

        const target = barbershop?.loyalty_target || 10;
        const totalEarned = Math.floor(record.visits / target);
        const freeCutsAvailable = totalEarned - (record.free_cuts_used || 0);
        const progress = record.visits % target;

        return {
            visits: record.visits,
            freeCutsAvailable,
            progress,
            target,
            totalEarned,
        };
    };

    const redeemFreeCut = async (userId) => {
        if (isDemoMode) {
            setLoyalty(prev => {
                const updated = prev.map(l => {
                    if (l.user_id === userId) {
                        return { ...l, free_cuts_used: (l.free_cuts_used || 0) + 1 };
                    }
                    return l;
                });
                setTimeout(() => saveDemoLoyalty(updated), 0);
                return updated;
            });
            return true;
        }

        const record = loyalty.find(l => l.user_id === userId);
        if (!record) return false;

        await supabase
            .from('loyalty')
            .update({ free_cuts_used: (record.free_cuts_used || 0) + 1 })
            .eq('id', record.id);

        await fetchLoyalty(barbershop.id);
        return true;
    };

    // Update barbershop settings
    const updateBarbershopSettings = async (updates) => {
        setBarbershop(prev => ({ ...prev, ...updates }));
        if (isDemoMode) {
            saveDemoSettings(updates);
        } else {
            await supabase
                .from('barbershops')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', barbershop.id);
        }
    };

    // Create barbershop (on signup)
    const createBarbershop = async (userId, name, slug) => {
        if (isDemoMode) {
            const newShop = { ...DEMO_BARBERSHOP, owner_id: userId, name, slug };
            setBarbershop(newShop);
            return newShop;
        }

        const { data, error } = await supabase
            .from('barbershops')
            .insert([{ owner_id: userId, name, slug }])
            .select()
            .single();

        if (!error && data) {
            setBarbershop(data);
        }
        return data;
    };

    // Setup realtime subscription
    const subscribeRealtime = useCallback((barbershopId) => {
        if (isDemoMode) return () => { };

        const channel = supabase
            .channel(`barbershop-${barbershopId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'barbershops', filter: `id=eq.${barbershopId}` },
                (payload) => {
                    setBarbershop(prev => ({ ...prev, ...payload.new }));
                }
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'queue', filter: `barbershop_id=eq.${barbershopId}` },
                () => {
                    fetchQueue(barbershopId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <BarbershopContext.Provider value={{
            barbershop,
            queue,
            loading,
            loyalty,
            history,
            stats,
            financialData,
            fetchOwnerBarbershop,
            fetchBySlug,
            toggleOpen,
            updateWaitTime,
            resetWaitTime,
            addToQueue,
            callNext,
            removeFromQueue,
            requestConfirmation,
            confirmPresence,
            expireEntry,
            skipEntry,
            sendFallbackWhatsApp,
            createBarbershop,
            subscribeRealtime,
            getLoyaltyInfo,
            redeemFreeCut,
            updateBarbershopSettings,
            regenerateFinancial: (services) => {
                const data = regenerateDemoFinancial(services);
                setFinancialData(data);
            },
        }}>
            {children}
        </BarbershopContext.Provider>
    );
}

export function useBarbershop() {
    const context = useContext(BarbershopContext);
    if (!context) {
        throw new Error('useBarbershop must be used within a BarbershopProvider');
    }
    return context;
}
