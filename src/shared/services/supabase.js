import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Demo mode flag — when Supabase is not configured, use local state
export const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here';

// Only create the client if we have valid credentials
export const supabase = isDemoMode
    ? null
    : createClient(supabaseUrl, supabaseAnonKey);
