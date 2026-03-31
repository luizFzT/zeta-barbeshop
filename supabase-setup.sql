-- =============================================
-- ZETA BARBERSHOP — Schema Completo (Projeto Novo)
-- Cole NO Supabase SQL Editor e clique em "Run"
-- =============================================

-- 1. BARBERSHOPS
CREATE TABLE IF NOT EXISTS public.barbershops (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  phone               TEXT,
  address             TEXT,
  avatar_url          TEXT,
  barber_name         TEXT,
  barber_avatar_url   TEXT,
  is_open             BOOLEAN NOT NULL DEFAULT false,
  wait_time_minutes   INT NOT NULL DEFAULT 0,
  loyalty_target      INT NOT NULL DEFAULT 10,
  tolerance_minutes   INT NOT NULL DEFAULT 5,
  confirmation_window INT NOT NULL DEFAULT 10,
  arrival_window      INT NOT NULL DEFAULT 15,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

-- Owner pode fazer TUDO — usando (select auth.uid()) para evitar re-avaliação por linha
CREATE POLICY "barbershops_owner_all" ON public.barbershops
  FOR ALL USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);

-- Qualquer pessoa pode LER (página do cliente)
CREATE POLICY "barbershops_public_read" ON public.barbershops
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_barbershops_owner_id ON public.barbershops(owner_id);


-- 2. SERVICES (tabela separada para serviços de cada barbearia)
CREATE TABLE IF NOT EXISTS public.services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id     UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  duration_minutes  INT NOT NULL DEFAULT 30,
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_owner_all" ON public.services
  FOR ALL USING (
    (select auth.uid()) = (SELECT owner_id FROM public.barbershops WHERE id = barbershop_id)
  ) WITH CHECK (
    (select auth.uid()) = (SELECT owner_id FROM public.barbershops WHERE id = barbershop_id)
  );

CREATE POLICY "services_public_read" ON public.services
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_services_barbershop_id ON public.services(barbershop_id);


-- 3. QUEUE ENTRIES (fila de espera)
CREATE TABLE IF NOT EXISTS public.queue_entries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id         UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name         TEXT NOT NULL,
  email                 TEXT,
  position              INT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'waiting',
  confirmation_status   TEXT NOT NULL DEFAULT 'none',
  confirmation_deadline TIMESTAMPTZ,
  arrival_deadline      TIMESTAMPTZ,
  selected_services     UUID[] DEFAULT '{}',
  total_duration        INT NOT NULL DEFAULT 30,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- Dono da barbearia controla tudo na fila
CREATE POLICY "queue_owner_all" ON public.queue_entries
  FOR ALL USING (
    (select auth.uid()) = (SELECT owner_id FROM public.barbershops WHERE id = barbershop_id)
  );

-- Qualquer pessoa pode entrar na fila (INSERT)
CREATE POLICY "queue_client_insert" ON public.queue_entries
  FOR INSERT WITH CHECK (true);

-- Qualquer pessoa pode ver a fila (SELECT)
CREATE POLICY "queue_public_read" ON public.queue_entries
  FOR SELECT USING (true);

-- Cliente pode atualizar seu próprio registro (confirmar presença)
CREATE POLICY "queue_client_update_own" ON public.queue_entries
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Cliente pode sair da fila (deletar)
CREATE POLICY "queue_client_delete_own" ON public.queue_entries
  FOR DELETE USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_queue_entries_barbershop_id ON public.queue_entries(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_user_id ON public.queue_entries(user_id);


-- 4. LOYALTY (programa de fidelidade)
CREATE TABLE IF NOT EXISTS public.loyalty (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id   UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  email           TEXT,
  visits          INT NOT NULL DEFAULT 0,
  free_cuts_used  INT NOT NULL DEFAULT 0,
  last_visit      TIMESTAMPTZ,
  UNIQUE(barbershop_id, user_id)
);

ALTER TABLE public.loyalty ENABLE ROW LEVEL SECURITY;

-- Dono vê todos os clientes fidelidade
CREATE POLICY "loyalty_owner_all" ON public.loyalty
  FOR ALL USING (
    (select auth.uid()) = (SELECT owner_id FROM public.barbershops WHERE id = barbershop_id)
  );

-- Cliente vê seu próprio registro
CREATE POLICY "loyalty_client_read_own" ON public.loyalty
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Sistema pode criar registro de fidelidade — restrito: user_id nulo (guest) ou do próprio usuário
CREATE POLICY "loyalty_client_insert" ON public.loyalty
  FOR INSERT WITH CHECK (
    user_id IS NULL OR user_id = (select auth.uid())
  );

-- Cliente pode atualizar seu próprio registro
CREATE POLICY "loyalty_client_update_own" ON public.loyalty
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_user_id ON public.loyalty(user_id);


-- 5. SERVICE HISTORY (histórico e financeiro)
CREATE TABLE IF NOT EXISTS public.service_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id   UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  service_name    TEXT,
  service_id      UUID REFERENCES public.services(id) ON DELETE SET NULL,
  price           NUMERIC(10,2) DEFAULT 0,
  served_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history_owner_all" ON public.service_history
  FOR ALL USING (
    (select auth.uid()) = (SELECT owner_id FROM public.barbershops WHERE id = barbershop_id)
  );

CREATE INDEX IF NOT EXISTS idx_service_history_barbershop_id ON public.service_history(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_service_history_user_id ON public.service_history(user_id);
CREATE INDEX IF NOT EXISTS idx_service_history_service_id ON public.service_history(service_id);


-- 6. ENABLE REALTIME para fila e barbearias
ALTER PUBLICATION supabase_realtime ADD TABLE public.barbershops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;


-- ✅ PRONTO! Schema completo com RLS otimizado para multi-barbearia.
