-- Performance: composite indexes for frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_status_sdr
  ON public.demandas_locacao(status_demanda, sdr_id);

CREATE INDEX IF NOT EXISTS idx_demandas_vendas_status_corretor
  ON public.demandas_vendas(status_demanda, corretor_id);

CREATE INDEX IF NOT EXISTS idx_demandas_locacao_status_tipo_imovel
  ON public.demandas_locacao(status_demanda, tipo_imovel);

CREATE INDEX IF NOT EXISTS idx_demandas_vendas_status_tipo_imovel
  ON public.demandas_vendas(status_demanda, tipo_imovel);

CREATE INDEX IF NOT EXISTS idx_campanhas_status_data_fim
  ON public.campanhas(status, data_fim);

CREATE INDEX IF NOT EXISTS idx_imoveis_captados_status_etapa
  ON public.imoveis_captados(status_captacao, etapa_funil);

CREATE INDEX IF NOT EXISTS idx_pontuacao_captador_captador_created
  ON public.pontuacao_captador(captador_id, created_at DESC);

-- Seed: ensure marlon@eticimoveis.com.br exists with password Skip@Pass (idempotent)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
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
    VALUES (v_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.users
    SET role = 'admin', status = 'ativo'
    WHERE email = 'marlon@eticimoveis.com.br';
  END IF;
END $$;
