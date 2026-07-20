-- Migration: Standardized loss reasons, collective 72h timeout, individual action isolation
-- Idempotent: all operations use IF NOT EXISTS / CREATE OR REPLACE / DO blocks

-- ==========================================
-- 1. NORMALIZE EXISTING motivo_perda DATA
-- ==========================================

UPDATE public.demandas_locacao
SET motivo_perda = CASE
    WHEN motivo_perda ILIKE '%sem resposta%' OR motivo_perda ILIKE '%inatividade%' THEN 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)'
    WHEN motivo_perda ILIKE '%alugou%' THEN 'Cliente já alugou'
    WHEN motivo_perda ILIKE '%comprou%' THEN 'Cliente já comprou'
    WHEN motivo_perda ILIKE '%desistiu%' THEN 'Cliente desistiu'
    WHEN motivo_perda ILIKE '%valor%' THEN 'Não existe imóveis no Perfil - Valor'
    WHEN motivo_perda ILIKE '%localiza%' THEN 'Não existe imóveis no Perfil - Localização'
    WHEN motivo_perda ILIKE '%perfil%' THEN 'Não existe imóveis no Perfil - Perfil do Imóvel'
    ELSE 'Cliente desistiu'
  END
WHERE motivo_perda IS NOT NULL
  AND motivo_perda NOT IN (
    'Não existe imóveis no Perfil - Valor','Não existe imóveis no Perfil - Localização',
    'Não existe imóveis no Perfil - Perfil do Imóvel','Cliente já alugou',
    'Cliente já comprou','Cliente desistiu','PERDIDO SEM RESPOSTA (TODOS CAPTADORES)'
  );

UPDATE public.demandas_vendas
SET motivo_perda = CASE
    WHEN motivo_perda ILIKE '%sem resposta%' OR motivo_perda ILIKE '%inatividade%' THEN 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)'
    WHEN motivo_perda ILIKE '%alugou%' THEN 'Cliente já alugou'
    WHEN motivo_perda ILIKE '%comprou%' THEN 'Cliente já comprou'
    WHEN motivo_perda ILIKE '%desistiu%' THEN 'Cliente desistiu'
    WHEN motivo_perda ILIKE '%valor%' THEN 'Não existe imóveis no Perfil - Valor'
    WHEN motivo_perda ILIKE '%localiza%' THEN 'Não existe imóveis no Perfil - Localização'
    WHEN motivo_perda ILIKE '%perfil%' THEN 'Não existe imóveis no Perfil - Perfil do Imóvel'
    ELSE 'Cliente desistiu'
  END
WHERE motivo_perda IS NOT NULL
  AND motivo_perda NOT IN (
    'Não existe imóveis no Perfil - Valor','Não existe imóveis no Perfil - Localização',
    'Não existe imóveis no Perfil - Perfil do Imóvel','Cliente já alugou',
    'Cliente já comprou','Cliente desistiu','PERDIDO SEM RESPOSTA (TODOS CAPTADORES)'
  );

-- Normalize respostas_captador.motivo
UPDATE public.respostas_captador SET motivo = 'Cliente desistiu'
WHERE resposta = 'perdido' AND (motivo IS NULL OR TRIM(motivo) = '');

UPDATE public.respostas_captador
SET motivo = CASE
    WHEN motivo ILIKE '%valor%' THEN 'Não existe imóveis no Perfil - Valor'
    WHEN motivo ILIKE '%localiza%' THEN 'Não existe imóveis no Perfil - Localização'
    WHEN motivo ILIKE '%perfil%inexistente%' THEN 'Não existe imóveis no Perfil - Perfil do Imóvel'
    WHEN motivo ILIKE '%alugou%' THEN 'Cliente já alugou'
    WHEN motivo ILIKE '%comprou%' THEN 'Cliente já comprou'
    WHEN motivo ILIKE '%desistiu%' THEN 'Cliente desistiu'
    ELSE 'Cliente desistiu'
  END
WHERE resposta = 'perdido'
  AND motivo NOT IN (
    'Não existe imóveis no Perfil - Valor','Não existe imóveis no Perfil - Localização',
    'Não existe imóveis no Perfil - Perfil do Imóvel','Cliente já alugou',
    'Cliente já comprou','Cliente desistiu'
  );

-- ==========================================
-- 2. ADD CONSTRAINTS
-- ==========================================

ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS check_motivo_perda_standardized;
ALTER TABLE public.demandas_locacao ADD CONSTRAINT check_motivo_perda_standardized
  CHECK (motivo_perda IS NULL OR motivo_perda IN (
    'Não existe imóveis no Perfil - Valor','Não existe imóveis no Perfil - Localização',
    'Não existe imóveis no Perfil - Perfil do Imóvel','Cliente já alugou',
    'Cliente já comprou','Cliente desistiu','PERDIDO SEM RESPOSTA (TODOS CAPTADORES)'
  ));

ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS check_motivo_perda_standardized;
ALTER TABLE public.demandas_vendas ADD CONSTRAINT check_motivo_perda_standardized
  CHECK (motivo_perda IS NULL OR motivo_perda IN (
    'Não existe imóveis no Perfil - Valor','Não existe imóveis no Perfil - Localização',
    'Não existe imóveis no Perfil - Perfil do Imóvel','Cliente já alugou',
    'Cliente já comprou','Cliente desistiu','PERDIDO SEM RESPOSTA (TODOS CAPTADORES)'
  ));

ALTER TABLE public.respostas_captador DROP CONSTRAINT IF EXISTS check_perdido_motivo_standardized;
ALTER TABLE public.respostas_captador ADD CONSTRAINT check_perdido_motivo_standardized
  CHECK (resposta != 'perdido' OR motivo IN (
    'Não existe imóveis no Perfil - Valor','Não existe imóveis no Perfil - Localização',
    'Não existe imóveis no Perfil - Perfil do Imóvel','Cliente já alugou',
    'Cliente já comprou','Cliente desistiu'
  ));

-- ==========================================
-- 3. ADD motivo COLUMN TO demand_status_log
-- ==========================================

ALTER TABLE public.demand_status_log ADD COLUMN IF NOT EXISTS motivo TEXT;

CREATE OR REPLACE FUNCTION public.log_demand_status_change()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.demand_status_log (demanda_id, tipo_demanda, status_anterior, status_novo, alterado_por, motivo)
  VALUES (NEW.id, TG_ARGV[0], OLD.status_demanda, NEW.status_demanda, auth.uid(), NEW.motivo_perda);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. COLLECTIVE 72h TIMEOUT LOGIC
-- ==========================================

CREATE OR REPLACE FUNCTION public.fn_marcar_demandas_sem_resposta()
RETURNS TABLE(tabela text, qtd_marcadas integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_qtd_locacao integer := 0; v_qtd_vendas integer := 0;
  v_qtd_locacao_72h integer := 0; v_qtd_vendas_72h integer := 0;
BEGIN
  -- 48h rule: no active prazo, 48h inactive, AND 0 responses
  WITH updated AS (
    UPDATE public.demandas_locacao dl SET
      status_demanda = 'perdida', motivo_perda = 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)',
      motivo_perda_descricao = 'Perdida por falta de resposta coletiva em 48h',
      marcada_sem_resposta = true, data_marcacao_sem_resposta = NOW(), updated_at = NOW()
    WHERE dl.status_demanda IN ('aberta','em busca')
      AND NOT EXISTS (SELECT 1 FROM public.prazos_captacao pc WHERE pc.demanda_locacao_id = dl.id AND pc.status = 'ativo')
      AND NOT EXISTS (SELECT 1 FROM public.respostas_captador rc WHERE rc.demanda_locacao_id = dl.id)
      AND ((dl.data_prazo_resposta IS NOT NULL AND dl.data_prazo_resposta < NOW())
           OR (dl.data_prazo_resposta IS NULL AND dl.created_at < NOW() - INTERVAL '48 hours'))
    RETURNING id
  ) SELECT count(*) INTO v_qtd_locacao FROM updated;

  WITH updated AS (
    UPDATE public.demandas_vendas dv SET
      status_demanda = 'perdida', motivo_perda = 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)',
      motivo_perda_descricao = 'Perdida por falta de resposta coletiva em 48h',
      marcada_sem_resposta = true, data_marcacao_sem_resposta = NOW(), updated_at = NOW()
    WHERE dv.status_demanda IN ('aberta','em busca')
      AND NOT EXISTS (SELECT 1 FROM public.prazos_captacao pc WHERE pc.demanda_venda_id = dv.id AND pc.status = 'ativo')
      AND NOT EXISTS (SELECT 1 FROM public.respostas_captador rc WHERE rc.demanda_venda_id = dv.id)
      AND ((dv.data_prazo_resposta IS NOT NULL AND dv.data_prazo_resposta < NOW())
           OR (dv.data_prazo_resposta IS NULL AND dv.created_at < NOW() - INTERVAL '48 hours'))
    RETURNING id
  ) SELECT count(*) INTO v_qtd_vendas FROM updated;

  -- 72h "Estou Buscando" rule: expired prazo, no new properties, AND 0 responses
  WITH expired_prazos AS (
    SELECT DISTINCT pc.demanda_locacao_id, MIN(pc.data_criacao) AS prazo_created
    FROM public.prazos_captacao pc
    WHERE pc.demanda_locacao_id IS NOT NULL AND pc.status = 'ativo' AND pc.prazo_resposta < NOW()
    GROUP BY pc.demanda_locacao_id
  ),
  updated_72h AS (
    UPDATE public.demandas_locacao dl SET
      status_demanda = 'perdida', motivo_perda = 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)',
      motivo_perda_descricao = 'Perdida por falta de resposta coletiva em 72h apos Estou Buscando',
      marcada_sem_resposta = true, data_marcacao_sem_resposta = NOW(), updated_at = NOW()
    FROM expired_prazos ep
    WHERE dl.id = ep.demanda_locacao_id AND dl.status_demanda IN ('aberta','em busca')
      AND NOT EXISTS (SELECT 1 FROM public.respostas_captador rc WHERE rc.demanda_locacao_id = dl.id)
      AND NOT EXISTS (SELECT 1 FROM public.imoveis_captados ic WHERE ic.demanda_locacao_id = dl.id AND ic.created_at >= ep.prazo_created)
    RETURNING dl.id
  ) SELECT count(*) INTO v_qtd_locacao_72h FROM updated_72h;

  WITH expired_prazos AS (
    SELECT DISTINCT pc.demanda_venda_id, MIN(pc.data_criacao) AS prazo_created
    FROM public.prazos_captacao pc
    WHERE pc.demanda_venda_id IS NOT NULL AND pc.status = 'ativo' AND pc.prazo_resposta < NOW()
    GROUP BY pc.demanda_venda_id
  ),
  updated_72h AS (
    UPDATE public.demandas_vendas dv SET
      status_demanda = 'perdida', motivo_perda = 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)',
      motivo_perda_descricao = 'Perdida por falta de resposta coletiva em 72h apos Estou Buscando',
      marcada_sem_resposta = true, data_marcacao_sem_resposta = NOW(), updated_at = NOW()
    FROM expired_prazos ep
    WHERE dv.id = ep.demanda_venda_id AND dv.status_demanda IN ('aberta','em busca')
      AND NOT EXISTS (SELECT 1 FROM public.respostas_captador rc WHERE rc.demanda_venda_id = dv.id)
      AND NOT EXISTS (SELECT 1 FROM public.imoveis_captados ic WHERE ic.demanda_venda_id = dv.id AND ic.created_at >= ep.prazo_created)
    RETURNING dv.id
  ) SELECT count(*) INTO v_qtd_vendas_72h FROM updated_72h;

  UPDATE public.prazos_captacao SET status = 'vencido' WHERE status = 'ativo' AND prazo_resposta < NOW();

  RETURN QUERY SELECT 'demandas_locacao'::text, v_qtd_locacao + v_qtd_locacao_72h
  UNION ALL SELECT 'demandas_vendas'::text, v_qtd_vendas + v_qtd_vendas_72h;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_marcar_demandas_perdidas_inatividade()
RETURNS void AS $$
BEGIN
  UPDATE public.demandas_locacao
  SET status_demanda = 'perdida', motivo_perda = 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)',
      motivo_perda_descricao = 'Inatividade / Excedeu prazo de 30 dias sem respostas', updated_at = NOW()
  WHERE status_demanda IN ('aberta','sem_resposta_24h','em busca')
    AND created_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (SELECT 1 FROM public.respostas_captador rc WHERE rc.demanda_locacao_id = demandas_locacao.id);

  UPDATE public.demandas_vendas
  SET status_demanda = 'perdida', motivo_perda = 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)',
      motivo_perda_descricao = 'Inatividade / Excedeu prazo de 30 dias sem respostas', updated_at = NOW()
  WHERE status_demanda IN ('aberta','sem_resposta_24h','em busca')
    AND created_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (SELECT 1 FROM public.respostas_captador rc WHERE rc.demanda_venda_id = demandas_vendas.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. INDIVIDUAL ACTION ISOLATION
-- ==========================================

CREATE OR REPLACE FUNCTION public.fn_handle_captador_lost_demand()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fn_check_all_captadores_perdido()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_all_captadores_lost()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. SEED ADMIN USER
-- ==========================================

DO $$
DECLARE v_user_id uuid;
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
      v_user_id, '00000000-0000-0000-0000-000000000000',
      'marlon@eticimoveis.com.br', crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{"name":"Marlon","role":"admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.users SET role = 'admin' WHERE email = 'marlon@eticimoveis.com.br';
  END IF;
END $$;

-- ==========================================
-- 7. RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "authenticated_select_demand_status_log" ON public.demand_status_log;
CREATE POLICY "authenticated_select_demand_status_log" ON public.demand_status_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_demand_status_log" ON public.demand_status_log;
CREATE POLICY "authenticated_insert_demand_status_log" ON public.demand_status_log
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Captadores insert respostas" ON public.respostas_captador;
CREATE POLICY "Captadores insert respostas" ON public.respostas_captador
  FOR INSERT TO authenticated WITH CHECK (captador_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated read respostas" ON public.respostas_captador;
CREATE POLICY "Authenticated read respostas" ON public.respostas_captador
  FOR SELECT TO authenticated USING (true);
