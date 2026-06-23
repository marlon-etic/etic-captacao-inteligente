DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- 1. Seed admin user to ensure functionality
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'marlon@eticimoveis.com.br',
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin Marlon", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
    
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (admin_id, 'marlon@eticimoveis.com.br', 'Admin Marlon', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.users SET role = 'admin' WHERE email = 'marlon@eticimoveis.com.br';
  END IF;

  -- 2. Create Archiving Function
  CREATE OR REPLACE FUNCTION public.fn_arquivar_demandas_inativas()
  RETURNS void AS $FUNC$
  BEGIN
    -- Locacao
    UPDATE public.demandas_locacao
    SET 
      status_demanda = 'Perdida',
      motivo_perda = 'Inatividade/Excedeu prazo',
      motivo_perda_descricao = 'Demanda arquivada automaticamente por falta de movimentação após 7 dias.',
      updated_at = NOW()
    WHERE 
      created_at <= NOW() - INTERVAL '7 days'
      AND updated_at <= NOW() - INTERVAL '7 days'
      AND status_demanda NOT IN ('Perdida', 'PERDIDA_BAIXA', 'ganho', 'fechado', 'concluida', 'cancelada')
      AND NOT EXISTS (
        SELECT 1 FROM public.respostas_captador rc 
        WHERE rc.demanda_locacao_id = demandas_locacao.id 
        AND rc.created_at > NOW() - INTERVAL '7 days'
      );

    -- Vendas
    UPDATE public.demandas_vendas
    SET 
      status_demanda = 'Perdida',
      motivo_perda = 'Inatividade/Excedeu prazo',
      motivo_perda_descricao = 'Demanda arquivada automaticamente por falta de movimentação após 7 dias.',
      updated_at = NOW()
    WHERE 
      created_at <= NOW() - INTERVAL '7 days'
      AND updated_at <= NOW() - INTERVAL '7 days'
      AND status_demanda NOT IN ('Perdida', 'PERDIDA_BAIXA', 'ganho', 'fechado', 'concluida', 'cancelada')
      AND NOT EXISTS (
        SELECT 1 FROM public.respostas_captador rc 
        WHERE rc.demanda_venda_id = demandas_vendas.id 
        AND rc.created_at > NOW() - INTERVAL '7 days'
      );
  END;
  $FUNC$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 3. Update RLS Policies to enforce 7-day restriction for captadores
  DROP POLICY IF EXISTS "Enable read for authorized roles locacao" ON public.demandas_locacao;
  DROP POLICY IF EXISTS "authenticated_select_dem_loc_intel" ON public.demandas_locacao;
  DROP POLICY IF EXISTS "authenticated_select_demandas_locacao" ON public.demandas_locacao;
  DROP POLICY IF EXISTS "authenticated_select_intel_locacao" ON public.demandas_locacao;
  
  CREATE POLICY "authenticated_select_demandas_locacao" ON public.demandas_locacao
    FOR SELECT TO authenticated
    USING (
      (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'sdr', 'corretor', 'gestor')
      OR 
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'captador'
        AND (
          created_at >= NOW() - INTERVAL '7 days'
          OR status_demanda IN ('Estou Buscando', 'prioritaria', 'em_andamento', 'em_negociacao', 'Perdida', 'PERDIDA_BAIXA', 'ganho', 'fechado')
          OR EXISTS (
            SELECT 1 FROM public.prazos_captacao pc 
            WHERE pc.demanda_locacao_id = id AND pc.prorrogacoes_usadas > 0
          )
          OR EXISTS (
            SELECT 1 FROM public.imoveis_captados ic
            WHERE ic.demanda_locacao_id = id AND ic.user_captador_id = auth.uid()
          )
        )
      )
      OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "Enable read for authorized roles vendas" ON public.demandas_vendas;
  DROP POLICY IF EXISTS "authenticated_select_dem_ven_intel" ON public.demandas_vendas;
  DROP POLICY IF EXISTS "authenticated_select_demandas_vendas" ON public.demandas_vendas;
  DROP POLICY IF EXISTS "authenticated_select_intel_vendas" ON public.demandas_vendas;

  CREATE POLICY "authenticated_select_demandas_vendas" ON public.demandas_vendas
    FOR SELECT TO authenticated
    USING (
      (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'sdr', 'corretor', 'gestor')
      OR 
      (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'captador'
        AND (
          created_at >= NOW() - INTERVAL '7 days'
          OR status_demanda IN ('Estou Buscando', 'prioritaria', 'em_andamento', 'em_negociacao', 'Perdida', 'PERDIDA_BAIXA', 'ganho', 'fechado')
          OR EXISTS (
            SELECT 1 FROM public.prazos_captacao pc 
            WHERE pc.demanda_venda_id = id AND pc.prorrogacoes_usadas > 0
          )
          OR EXISTS (
            SELECT 1 FROM public.imoveis_captados ic
            WHERE ic.demanda_venda_id = id AND ic.user_captador_id = auth.uid()
          )
        )
      )
      OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
    );
END $$;
