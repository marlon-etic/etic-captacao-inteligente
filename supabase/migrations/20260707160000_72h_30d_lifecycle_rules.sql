-- Migration: 72h "Estou Buscando" feedback window and 30-day demand lifecycle rules
-- Idempotent: all functions use CREATE OR REPLACE

-- 1. Update append_captador_busca to create/update 72h prazo_captacao when Captador clicks "Estou Buscando"
CREATE OR REPLACE FUNCTION public.append_captador_busca(
  p_demanda_id uuid,
  p_tipo_demanda text,
  p_captador_id uuid,
  p_nome text,
  p_regiao text
) RETURNS void AS $$
DECLARE
  v_existing jsonb;
  v_new_entry jsonb;
  v_demanda_locacao_id uuid;
  v_demanda_venda_id uuid;
  v_existing_prazo_id uuid;
  v_filtered jsonb;
BEGIN
  IF p_tipo_demanda ILIKE '%aluguel%' OR p_tipo_demanda ILIKE '%locacao%' THEN
    v_demanda_locacao_id := p_demanda_id;
  ELSE
    v_demanda_venda_id := p_demanda_id;
  END IF;

  IF v_demanda_locacao_id IS NOT NULL THEN
    SELECT captadores_busca INTO v_existing FROM public.demandas_locacao WHERE id = p_demanda_id;
  ELSE
    SELECT captadores_busca INTO v_existing FROM public.demandas_vendas WHERE id = p_demanda_id;
  END IF;

  v_new_entry := jsonb_build_object(
    'captador_id', p_captador_id,
    'nome', p_nome,
    'regiao', p_regiao,
    'data_clique', to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS')
  );

  v_existing := COALESCE(v_existing, '[]'::jsonb);

  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO v_filtered
  FROM jsonb_array_elements(v_existing) AS elem
  WHERE elem->>'captador_id' != p_captador_id::text;

  v_filtered := v_filtered || jsonb_build_array(v_new_entry);

  IF v_demanda_locacao_id IS NOT NULL THEN
    UPDATE public.demandas_locacao
    SET captadores_busca = v_filtered,
        status_demanda = 'em busca',
        updated_at = NOW()
    WHERE id = p_demanda_id;
  ELSE
    UPDATE public.demandas_vendas
    SET captadores_busca = v_filtered,
        status_demanda = 'em busca',
        updated_at = NOW()
    WHERE id = p_demanda_id;
  END IF;

  -- Create or update prazo_captacao with 72h deadline for "Estou Buscando" feedback window
  SELECT id INTO v_existing_prazo_id
  FROM public.prazos_captacao
  WHERE (demanda_locacao_id = p_demanda_id OR demanda_venda_id = p_demanda_id)
    AND captador_id = p_captador_id
    AND status = 'ativo'
  LIMIT 1;

  IF v_existing_prazo_id IS NOT NULL THEN
    UPDATE public.prazos_captacao
    SET prazo_resposta = NOW() + INTERVAL '72 hours',
        status = 'ativo',
        prorrogacoes_usadas = 0
    WHERE id = v_existing_prazo_id;
  ELSE
    INSERT INTO public.prazos_captacao (
      demanda_locacao_id, demanda_venda_id, captador_id,
      prazo_resposta, prorrogacoes_usadas, status
    ) VALUES (
      v_demanda_locacao_id, v_demanda_venda_id, p_captador_id,
      NOW() + INTERVAL '72 hours', 0, 'ativo'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update fn_marcar_demandas_sem_resposta to include 72h "Estou Buscando" rule
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
  -- 48h rule: demands without active prazo, inactive for 48h
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

  -- 72h "Estou Buscando" rule: demands with expired prazo and no property additions
  -- If a Captador clicked "Estou Buscando" and 72h passed without new properties, mark as Perdido
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

-- 3. Update fn_marcar_demandas_perdidas_inatividade to use 30 days instead of 7
CREATE OR REPLACE FUNCTION public.fn_marcar_demandas_perdidas_inatividade()
RETURNS void AS $$
BEGIN
  -- 30-day rule: demands active for more than 30 days are archived
  UPDATE public.demandas_locacao
  SET status_demanda = 'PERDIDA_BAIXA',
      motivo_perda = 'Inatividade / Excedeu prazo de 30 dias',
      motivo_perda_descricao = 'Inatividade / Excedeu prazo de 30 dias',
      updated_at = NOW()
  WHERE status_demanda IN ('aberta', 'sem_resposta_24h', 'em busca')
    AND created_at < NOW() - INTERVAL '30 days';

  UPDATE public.demandas_vendas
  SET status_demanda = 'PERDIDA_BAIXA',
      motivo_perda = 'Inatividade / Excedeu prazo de 30 dias',
      motivo_perda_descricao = 'Inatividade / Excedeu prazo de 30 dias',
      updated_at = NOW()
  WHERE status_demanda IN ('aberta', 'sem_resposta_24h', 'em busca')
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the trigger function to call the updated 30-day function
CREATE OR REPLACE FUNCTION public.trg_fn_auto_cleanup_inactive_demands()
RETURNS trigger AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;
  PERFORM public.fn_marcar_demandas_perdidas_inatividade();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
