-- Fix RLS for imovel_demand_match: allow SDRs/corretores to see matches for their demands
DROP POLICY IF EXISTS "sdr_corretor_sees_own_demand_matches" ON public.imovel_demand_match;
CREATE POLICY "sdr_corretor_sees_own_demand_matches" ON public.imovel_demand_match
  FOR SELECT TO authenticated USING (
    captador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.demandas_locacao WHERE id = imovel_demand_match.demanda_id AND sdr_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.demandas_vendas WHERE id = imovel_demand_match.demanda_id AND corretor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
  );

-- Ensure visit_records has updated_at and visited_date columns
ALTER TABLE public.visit_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.visit_records ADD COLUMN IF NOT EXISTS visited_date DATE DEFAULT CURRENT_DATE;

-- Ensure demand_status_log has motivo column
ALTER TABLE public.demand_status_log ADD COLUMN IF NOT EXISTS motivo TEXT;

-- Ensure marlon seed exists with correct token columns
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'marlon@eticimoveis.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (new_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Add realtime publication for feedback_records and negotiation_records if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'feedback_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_records;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'negotiation_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.negotiation_records;
  END IF;
END $$;
