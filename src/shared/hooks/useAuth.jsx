import { useState, useEffect, useContext, createContext } from 'react';
import { supabase, isDemoMode } from '../services/supabase';

const AuthContext = createContext(null);

// Demo users
const DEMO_BARBER = {
    id: 'demo-barber-001',
    email: 'barbeiro@zeta.com',
    user_metadata: { name: 'Barbeiro Demo', role: 'barber' },
};

const DEMO_CLIENT = {
    id: 'demo-client-001',
    email: 'cliente@gmail.com',
    user_metadata: { name: 'Cliente Demo', role: 'client', avatar_url: null },
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isDemoMode) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Barber sign up
    const signUp = async (email, password, name) => {
        if (isDemoMode) {
            const newUser = { ...DEMO_BARBER, email, user_metadata: { name, role: 'barber' } };
            setUser(newUser);
            return { error: null };
        }
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, role: 'barber' } },
        });
        return { error };
    };

    // Barber sign in
    const signIn = async (email, password) => {
        if (isDemoMode) {
            setUser({ ...DEMO_BARBER, email });
            return { error: null };
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    // Client Google sign in
    const signInWithGoogle = async () => {
        if (isDemoMode) {
            setUser(DEMO_CLIENT);
            return { error: null, user: DEMO_CLIENT };
        }
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        return { data, error };
    };

    const signOut = async () => {
        if (isDemoMode) {
            setUser(null);
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
    };

    const isBarber = user?.user_metadata?.role === 'barber';
    const isClient = user?.user_metadata?.role === 'client' || (user && !user?.user_metadata?.role);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signUp,
            signIn,
            signInWithGoogle,
            signOut,
            isDemoMode,
            isBarber,
            isClient,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
