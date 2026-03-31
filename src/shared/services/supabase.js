import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Demo mode flag — only active when Supabase is not configured AND explicitly allowed
const supabaseNotConfigured = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here';
const demoModeAllowed = import.meta.env.VITE_ALLOW_DEMO_MODE === 'true';
export const isDemoMode = supabaseNotConfigured && demoModeAllowed;

// Only create the client if we have valid credentials
export const supabase = isDemoMode
    ? null
    : createClient(supabaseUrl, supabaseAnonKey);
