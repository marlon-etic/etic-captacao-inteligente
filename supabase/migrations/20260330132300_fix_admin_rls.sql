-- Fix RLS for demandas_locacao
DROP POLICY IF EXISTS "Admin JWT full access demandas_locacao" ON public.demandas_locacao;
CREATE POLICY "Admin JWT full access demandas_locacao" ON public.demandas_locacao
FOR ALL TO authenticated
USING (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
)
WITH CHECK (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
);

-- Fix RLS for demandas_vendas
DROP POLICY IF EXISTS "Admin JWT full access demandas_vendas" ON public.demandas_vendas;
CREATE POLICY "Admin JWT full access demandas_vendas" ON public.demandas_vendas
FOR ALL TO authenticated
USING (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
)
WITH CHECK (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
);

-- Fix RLS for imoveis_captados
DROP POLICY IF EXISTS "Admin JWT full access imoveis_captados" ON public.imoveis_captados;
CREATE POLICY "Admin JWT full access imoveis_captados" ON public.imoveis_captados
FOR ALL TO authenticated
USING (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
)
WITH CHECK (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
);

-- Fix RLS for respostas_captador
DROP POLICY IF EXISTS "Admin JWT full access respostas_captador" ON public.respostas_captador;
CREATE POLICY "Admin JWT full access respostas_captador" ON public.respostas_captador
FOR ALL TO authenticated
USING (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
)
WITH CHECK (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
);

-- Fix RLS for prazos_captacao
DROP POLICY IF EXISTS "Admin JWT full access prazos_captacao" ON public.prazos_captacao;
CREATE POLICY "Admin JWT full access prazos_captacao" ON public.prazos_captacao
FOR ALL TO authenticated
USING (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
)
WITH CHECK (
  (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin') OR
  (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin') OR
  EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin', 'gestor']))))
);

-- Insert dummy test user to prevent FK errors when testing inserts (e.g. from Performance Tester)
DO $inner$
DECLARE
  v_test_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_test_id) THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_test_id, '00000000-0000-0000-0000-000000000000', 'admin@test.com',
      crypt('testpassword123', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"name": "Admin User", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;

  INSERT INTO public.users (id, email, nome, role, status)
  VALUES (v_test_id, 'admin@test.com', 'Admin User', 'admin', 'ativo')
  ON CONFLICT (id) DO NOTHING;
END $inner$;
