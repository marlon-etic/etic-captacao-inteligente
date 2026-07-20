-- Migration: Relax timeout rules, skip prioritized demands, revert incorrectly lost demands
-- Idempotent: all functions use CREATE OR REPLACE

-- 1. Update fn_marcar_demandas_sem_resposta to skip prioritized demands
CREATE OR REPLACE FUNCTION public.fn_marcar_demandas_sem_resposta()
RETURNS TABLE(tabela text, qtd_marcadas integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_qtd_locacao integer := 0;
  v_qtd_vendas integer := 0;
  v_qtd_locacao_72h integer := 0;
  v_qtd_vendas_72h integer := 0;
BEGIN
  -- 48h rule: demands without active prazo, inactive for 48h (SKIP PRIORITIZED)
  WITH updated AS (
    UPDATE public.demandas_locacao dl
    SET
      status_demanda = 'perdida',
      motivo_perda = 'Inatividade',
      motivo_perda_descricao = 'Perdida por falta de retorno em 48h',
      marcada_sem_resposta = true,
      data_marcacao_sem_resposta = NOW(),
      updated_at = NOW()
    WHERE dl.status_demanda IN ('aberta', 'em busca')
      AND COALESCE(dl.is_prioritaria, false) = false
      AND NOT EXISTS (
        SELECT 1 FROM public.prazos_captacao pc
        WHERE pc.demanda_locacao_id = dl.id AND pc.status = 'ativo'
      )
      AND (
        (dl.data_prazo_resposta IS NOT NULL AND dl.data_prazo_resposta < NOW())
        OR
        (dl.data_prazo_resposta IS NULL AND dl.created_at < NOW() - INTERVAL '48 hours')
      )
    RETURNING id
  )
  SELECT count(*) INTO v_qtd_locacao FROM updated;

  WITH updated AS (
    UPDATE public.demandas_vendas dv
    SET
      status_demanda = 'perdida',
      motivo_perda = 'Inatividade',
      motivo_perda_descricao = 'Perdida por falta de retorno em 48h',
      marcada_sem_resposta = true,
      data_marcacao_sem_resposta = NOW(),
      updated_at = NOW()
    WHERE dv.status_demanda IN ('aberta', 'em busca')
      AND COALESCE(dv.is_prioritaria, false) = false
      AND NOT EXISTS (
        SELECT 1 FROM public.prazos_captacao pc
        WHERE pc.demanda_venda_id = dv.id AND pc.status = 'ativo'
      )
      AND (
        (dv.data_prazo_resposta IS NOT NULL AND dv.data_prazo_resposta < NOW())
        OR
        (dv.data_prazo_resposta IS NULL AND dv.created_at < NOW() - INTERVAL '48 hours')
      )
    RETURNING id
  )
  SELECT count(*) INTO v_qtd_vendas FROM updated;

  -- 72h "Estou Buscando" rule (SKIP PRIORITIZED)
  WITH expired_prazos AS (
    SELECT DISTINCT pc.demanda_locacao_id, MIN(pc.data_criacao) AS prazo_created
    FROM public.prazos_captacao pc
    WHERE pc.demanda_locacao_id IS NOT NULL
      AND pc.status = 'ativo'
      AND pc.prazo_resposta < NOW()
    GROUP BY pc.demanda_locacao_id
  ),
  updated_72h AS (
    UPDATE public.demandas_locacao dl
    SET
      status_demanda = 'perdida',
      motivo_perda = 'Sem Resposta',
      motivo_perda_descricao = 'Perdida por falta de resposta em 72h apos Estou Buscando',
      marcada_sem_resposta = true,
      data_marcacao_sem_resposta = NOW(),
      updated_at = NOW()
    FROM expired_prazos ep
    WHERE dl.id = ep.demanda_locacao_id
      AND dl.status_demanda IN ('aberta', 'em busca')
      AND COALESCE(dl.is_prioritaria, false) = false
      AND NOT EXISTS (
        SELECT 1 FROM public.imoveis_captados ic
        WHERE ic.demanda_locacao_id = dl.id
          AND ic.created_at >= ep.prazo_created
      )
    RETURNING dl.id
  )
  SELECT count(*) INTO v_qtd_locacao_72h FROM updated_72h;

  WITH expired_prazos AS (
    SELECT DISTINCT pc.demanda_venda_id, MIN(pc.data_criacao) AS prazo_created
    FROM public.prazos_captacao pc
    WHERE pc.demanda_venda_id IS NOT NULL
      AND pc.status = 'ativo'
      AND pc.prazo_resposta < NOW()
    GROUP BY pc.demanda_venda_id
  ),
  updated_72h AS (
    UPDATE public.demandas_vendas dv
    SET
      status_demanda = 'perdida',
      motivo_perda = 'Sem Resposta',
      motivo_perda_descricao = 'Perdida por falta de resposta em 72h apos Estou Buscando',
      marcada_sem_resposta = true,
      data_marcacao_sem_resposta = NOW(),
      updated_at = NOW()
    FROM expired_prazos ep
    WHERE dv.id = ep.demanda_venda_id
      AND dv.status_demanda IN ('aberta', 'em busca')
      AND COALESCE(dv.is_prioritaria, false) = false
      AND NOT EXISTS (
        SELECT 1 FROM public.imoveis_captados ic
        WHERE ic.demanda_venda_id = dv.id
          AND ic.created_at >= ep.prazo_created
      )
    RETURNING dv.id
  )
  SELECT count(*) INTO v_qtd_vendas_72h FROM updated_72h;

  -- Mark expired prazos as vencido
  UPDATE public.prazos_captacao
  SET status = 'vencido'
  WHERE status = 'ativo' AND prazo_resposta < NOW();

  RETURN QUERY
  SELECT 'demandas_locacao'::text, v_qtd_locacao + v_qtd_locacao_72h
  UNION ALL
  SELECT 'demandas_vendas'::text, v_qtd_vendas + v_qtd_vendas_72h;
END;
$$;

-- 2. Update fn_marcar_demandas_perdidas_inatividade to skip prioritized demands
CREATE OR REPLACE FUNCTION public.fn_marcar_demandas_perdidas_inatividade()
RETURNS void AS $$
BEGIN
  -- 30-day rule: demands active for more than 30 days are archived (SKIP PRIORITIZED)
  UPDATE public.demandas_locacao
  SET status_demanda = 'PERDIDA_BAIXA',
      motivo_perda = 'Inatividade / Excedeu prazo de 30 dias',
      motivo_perda_descricao = 'Inatividade / Excedeu prazo de 30 dias',
      updated_at = NOW()
  WHERE status_demanda IN ('aberta', 'sem_resposta_24h', 'em busca')
    AND COALESCE(is_prioritaria, false) = false
    AND created_at < NOW() - INTERVAL '30 days';

  UPDATE public.demandas_vendas
  SET status_demanda = 'PERDIDA_BAIXA',
      motivo_perda = 'Inatividade / Excedeu prazo de 30 dias',
      motivo_perda_descricao = 'Inatividade / Excedeu prazo de 30 dias',
      updated_at = NOW()
  WHERE status_demanda IN ('aberta', 'sem_resposta_24h', 'em busca')
    AND COALESCE(is_prioritaria, false) = false
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Revert demands incorrectly marked as PERDIDA_BAIXA by auto-timeout back to 'aberta'
--    Only revert those without explicit user action (motivo contains 'Inatividade' or 'Sem Resposta')
UPDATE public.demandas_locacao
SET status_demanda = 'aberta',
    motivo_perda = NULL,
    motivo_perda_descricao = NULL,
    marcada_sem_resposta = false,
    data_marcacao_sem_resposta = NULL,
    updated_at = NOW()
WHERE status_demanda = 'PERDIDA_BAIXA'
  AND (
    motivo_perda ILIKE '%Inatividade%'
    OR motivo_perda ILIKE '%Sem Resposta%'
    OR motivo_perda IS NULL
  );

UPDATE public.demandas_vendas
SET status_demanda = 'aberta',
    motivo_perda = NULL,
    motivo_perda_descricao = NULL,
    marcada_sem_resposta = false,
    data_marcacao_sem_resposta = NULL,
    updated_at = NOW()
WHERE status_demanda = 'PERDIDA_BAIXA'
  AND (
    motivo_perda ILIKE '%Inatividade%'
    OR motivo_perda ILIKE '%Sem Resposta%'
    OR motivo_perda IS NULL
  );

-- 4. Also revert 'perdida' status set by auto-timeout (not by user explicit action)
UPDATE public.demandas_locacao
SET status_demanda = 'aberta',
    motivo_perda = NULL,
    motivo_perda_descricao = NULL,
    marcada_sem_resposta = false,
    data_marcacao_sem_resposta = NULL,
    updated_at = NOW()
WHERE status_demanda = 'perdida'
  AND motivo_perda IN ('Inatividade', 'Sem Resposta');

UPDATE public.demandas_vendas
SET status_demanda = 'aberta',
    motivo_perda = NULL,
    motivo_perda_descricao = NULL,
    marcada_sem_resposta = false,
    data_marcacao_sem_resposta = NULL,
    updated_at = NOW()
WHERE status_demanda = 'perdida'
  AND motivo_perda IN ('Inatividade', 'Sem Resposta');

-- 5. Ensure marlon@eticimoveis.com.br exists (idempotent)
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
