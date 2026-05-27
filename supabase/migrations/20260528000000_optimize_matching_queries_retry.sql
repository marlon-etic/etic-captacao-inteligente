-- Desabilita o timeout para criação de índices pesados
SET statement_timeout = 0;

-- Otimização de Performance: Criação de índices estratégicos para acelerar consultas e filtros
CREATE INDEX IF NOT EXISTS idx_matches_sugestoes_status ON public.matches_sugestoes(status);
CREATE INDEX IF NOT EXISTS idx_matches_sugestoes_imovel_id ON public.matches_sugestoes(imovel_id);
CREATE INDEX IF NOT EXISTS idx_matches_sugestoes_demanda_id ON public.matches_sugestoes(demanda_id);

-- Conformidade RLS para tabela matches_sugestoes
ALTER TABLE public.matches_sugestoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_matches" ON public.matches_sugestoes;
CREATE POLICY "authenticated_select_matches" ON public.matches_sugestoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_matches" ON public.matches_sugestoes;
CREATE POLICY "authenticated_insert_matches" ON public.matches_sugestoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_matches" ON public.matches_sugestoes;
CREATE POLICY "authenticated_update_matches" ON public.matches_sugestoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_matches" ON public.matches_sugestoes;
CREATE POLICY "authenticated_delete_matches" ON public.matches_sugestoes
  FOR DELETE TO authenticated USING (true);

-- Auth Seed Idempotente com Prevenção de Falhas no App e Supabase GoTrue
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
      '{"name": "Marlon"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (new_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
