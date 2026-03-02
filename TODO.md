# Zeta Barbershop - Roadmap (Fase 2)

## NEXT PHASE: Supabase Integration

- [ ] Initialize Supabase Client
  - [ ] Add `.env.local` with user provided `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  - [ ] Configure `src/shared/services/supabase.js`.
- [ ] Implement Supabase Authentication
  - [ ] Refactor `useAuth.jsx` to use `supabase.auth.signInWithPassword` and `signUp`.
  - [ ] Setup auth state listener and session management.
- [ ] Database Schema Setup (SQL Definitions & Setup)
  - [ ] Table `barbershops`: Establish id (UUID), name, slug, avatar_url, settings (tolerance, window), and barber profile data.
  - [ ] Table `services`: Establish normalized relations for dynamic service times.
  - [ ] Table `queue_entries`: Establish queue status, position, and linked services.
- [ ] Migrate State Management (Data Layer)
  - [ ] Refactor `useBarbershop.jsx` to fetch and mutate real data from Supabase instead of `localStorage` (Demo Mode phase out).
  - [ ] Setup Supabase Realtime Channels to listen for INSERTs and UPDATEs on the `queue_entries` table.
