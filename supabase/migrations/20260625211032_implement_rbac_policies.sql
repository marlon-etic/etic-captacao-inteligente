-- Migration: Implement RBAC Policies and Initial Seed User
-- Addresses specific visibility rules for SDR, Corretor, and Captador profiles

-- 1. Initial User Seed
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
      '{"name": "Marlon Moro", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (new_user_id, 'marlon@eticimoveis.com.br', 'Marlon Moro', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 2. RBAC Policy for Demandas Locacao
-- Rule:
-- SDR: ALL locacao
-- Corretor: OWN locacao
-- Captador: ALL locacao
-- Admin/Gestor: ALL locacao
DROP POLICY IF EXISTS "rbac_select_demandas_locacao" ON public.demandas_locacao;
CREATE POLICY "rbac_select_demandas_locacao" ON public.demandas_locacao
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'sdr', 'captador'))
  OR
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'corretor') AND sdr_id = auth.uid())
  OR
  (sdr_id = auth.uid())
);

-- 3. RBAC Policy for Demandas Vendas
-- Rule:
-- SDR: OWN vendas
-- Corretor: ALL vendas
-- Captador: ALL vendas
-- Admin/Gestor: ALL vendas
DROP POLICY IF EXISTS "rbac_select_demandas_vendas" ON public.demandas_vendas;
CREATE POLICY "rbac_select_demandas_vendas" ON public.demandas_vendas
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'corretor', 'captador'))
  OR
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sdr') AND corretor_id = auth.uid())
  OR
  (corretor_id = auth.uid())
);

-- 4. RBAC Policy for Imoveis Captados
-- Rule:
-- Captador: OWN imoveis
-- SDR: Imoveis de Aluguel e Ambos
-- Corretor: Imoveis de Venda e Ambos
-- Admin/Gestor: ALL imoveis
DROP POLICY IF EXISTS "rbac_select_imoveis_captados" ON public.imoveis_captados;
CREATE POLICY "rbac_select_imoveis_captados" ON public.imoveis_captados
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
  OR
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'captador') AND user_captador_id = auth.uid())
  OR
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sdr') AND tipo IN ('Locação', 'Ambos', 'Aluguel'))
  OR
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'corretor') AND tipo IN ('Venda', 'Ambos'))
  OR
  (user_captador_id = auth.uid())
);
