-- Allow authenticated users to read/insert/update/delete prazos_captacao
DROP POLICY IF EXISTS "authenticated_select_prazos" ON public.prazos_captacao;
CREATE POLICY "authenticated_select_prazos" ON public.prazos_captacao FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_prazos" ON public.prazos_captacao;
CREATE POLICY "authenticated_insert_prazos" ON public.prazos_captacao FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_prazos" ON public.prazos_captacao;
CREATE POLICY "authenticated_update_prazos" ON public.prazos_captacao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_prazos" ON public.prazos_captacao;
CREATE POLICY "authenticated_delete_prazos" ON public.prazos_captacao FOR DELETE TO authenticated USING (true);

-- Allow authenticated users to read/insert/update/delete respostas_captador
DROP POLICY IF EXISTS "authenticated_select_respostas" ON public.respostas_captador;
CREATE POLICY "authenticated_select_respostas" ON public.respostas_captador FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_respostas" ON public.respostas_captador;
CREATE POLICY "authenticated_insert_respostas" ON public.respostas_captador FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_respostas" ON public.respostas_captador;
CREATE POLICY "authenticated_update_respostas" ON public.respostas_captador FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_respostas" ON public.respostas_captador;
CREATE POLICY "authenticated_delete_respostas" ON public.respostas_captador FOR DELETE TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'marlon@eticimoveis.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;
END $$;
