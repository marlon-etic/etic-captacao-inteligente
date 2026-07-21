-- Seed mariaennes@eticimoveis.com.br and ensure marlon@eticimoveis.com.br exists
-- Also ensure RLS policies allow authenticated users to SELECT their own records

-- ============================================================
-- 1. Seed auth users (idempotent)
-- ============================================================
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed marlon@eticimoveis.com.br
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
  END IF;

  -- Seed mariaennes@eticimoveis.com.br
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mariaennes@eticimoveis.com.br') THEN
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
      'mariaennes@eticimoveis.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Maria Ennes", "role": "sdr"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

-- ============================================================
-- 2. Ensure public.users profiles exist (using auth.users UUID)
-- ============================================================
INSERT INTO public.users (id, email, nome, role, status)
SELECT au.id, au.email, 'Marlon', 'admin', 'ativo'
FROM auth.users au
WHERE au.email = 'marlon@eticimoveis.com.br'
AND NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.email = au.email OR pu.id = au.id
)
ON CONFLICT DO NOTHING;

INSERT INTO public.users (id, email, nome, role, status)
SELECT au.id, au.email, 'Maria Ennes', 'sdr', 'ativo'
FROM auth.users au
WHERE au.email = 'mariaennes@eticimoveis.com.br'
AND NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.email = au.email OR pu.id = au.id
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. RLS Policies for public.users
-- ============================================================
DROP POLICY IF EXISTS "authenticated_select_users_v2" ON public.users;
CREATE POLICY "authenticated_select_users_v2" ON public.users
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_own_profile_v2" ON public.users;
CREATE POLICY "authenticated_insert_own_profile_v2" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "authenticated_update_own_profile_v2" ON public.users;
CREATE POLICY "authenticated_update_own_profile_v2" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- 4. RLS Policies for demandas_locacao
-- ============================================================
DROP POLICY IF EXISTS "authenticated_select_own_demandas_locacao_v2" ON public.demandas_locacao;
CREATE POLICY "authenticated_select_own_demandas_locacao_v2" ON public.demandas_locacao
  FOR SELECT TO authenticated
  USING (
    sdr_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'gestor', 'captador')
    )
  );

-- ============================================================
-- 5. RLS Policies for demandas_vendas
-- ============================================================
DROP POLICY IF EXISTS "authenticated_select_own_demandas_vendas_v2" ON public.demandas_vendas;
CREATE POLICY "authenticated_select_own_demandas_vendas_v2" ON public.demandas_vendas
  FOR SELECT TO authenticated
  USING (
    corretor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'gestor', 'captador')
    )
  );
