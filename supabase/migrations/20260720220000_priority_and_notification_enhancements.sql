-- Migration: Priority bypass, 12h/24h deadline notifications, prorrogar logging
-- Idempotent: all functions use CREATE OR REPLACE

-- 1. Add notification tracking columns if not exists
ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS notificada_12h BOOLEAN DEFAULT FALSE;
ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS notificada_24h BOOLEAN DEFAULT FALSE;
ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS notificada_12h BOOLEAN DEFAULT FALSE;
ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS notificada_24h BOOLEAN DEFAULT FALSE;

-- 2. Update fn_marcar_demandas_perdidas_inatividade to skip is_prioritaria = true
CREATE OR REPLACE FUNCTION public.fn_marcar_demandas_perdidas_inatividade()
RETURNS void AS $$
BEGIN
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

-- 3. Create fn_notificar_prazo_proximo for 12h/24h deadline alerts
CREATE OR REPLACE FUNCTION public.fn_notificar_prazo_proximo()
RETURNS void AS $$
DECLARE
  r RECORD;
  demanda_owner UUID;
  cliente_nome TEXT;
  tipo_demanda TEXT;
  horas_restantes NUMERIC;
BEGIN
  FOR r IN
    SELECT pc.id AS prazo_id, pc.demanda_locacao_id, pc.demanda_venda_id,
           pc.prazo_resposta, dl.sdr_id, dl.nome_cliente,
           COALESCE(dl.notificada_12h, false) AS notif_12h,
           COALESCE(dl.notificada_24h, false) AS notif_24h
    FROM public.prazos_captacao pc
    JOIN public.demandas_locacao dl ON dl.id = pc.demanda_locacao_id
    WHERE pc.status = 'ativo'
      AND pc.prazo_resposta > NOW()
      AND dl.status_demanda IN ('aberta', 'sem_resposta_24h', 'em busca')
      AND COALESCE(dl.is_prioritaria, false) = false
  LOOP
    horas_restantes := EXTRACT(EPOCH FROM (r.prazo_resposta - NOW())) / 3600;
    demanda_owner := r.sdr_id;
    cliente_nome := COALESCE(r.nome_cliente, 'Cliente');
    tipo_demanda := 'Aluguel';

    IF horas_restantes <= 24 AND horas_restantes > 12 AND r.notif_24h = false THEN
      IF demanda_owner IS NOT NULL THEN
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (demanda_owner, 'status_atualizado',
          'Prazo se aproximando: ' || cliente_nome,
          'A demanda de ' || cliente_nome || ' vence em menos de 24 horas.',
          jsonb_build_object('demanda_id', r.demanda_locacao_id, 'tipo_demanda', tipo_demanda, 'alert_type', '24h'),
          'alta');
      END IF;
      UPDATE public.demandas_locacao SET notificada_24h = true WHERE id = r.demanda_locacao_id;
    END IF;

    IF horas_restantes <= 12 AND horas_restantes > 0 AND r.notif_12h = false THEN
      IF demanda_owner IS NOT NULL THEN
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (demanda_owner, 'status_atualizado',
          'Prazo critico: ' || cliente_nome,
          'A demanda de ' || cliente_nome || ' vence em menos de 12 horas!',
          jsonb_build_object('demanda_id', r.demanda_locacao_id, 'tipo_demanda', tipo_demanda, 'alert_type', '12h'),
          'alta');
      END IF;
      UPDATE public.demandas_locacao SET notificada_12h = true WHERE id = r.demanda_locacao_id;
    END IF;
  END LOOP;

  FOR r IN
    SELECT pc.id AS prazo_id, pc.demanda_locacao_id, pc.demanda_venda_id,
           pc.prazo_resposta, dv.corretor_id, dv.nome_cliente,
           COALESCE(dv.notificada_12h, false) AS notif_12h,
           COALESCE(dv.notificada_24h, false) AS notif_24h
    FROM public.prazos_captacao pc
    JOIN public.demandas_vendas dv ON dv.id = pc.demanda_venda_id
    WHERE pc.status = 'ativo'
      AND pc.prazo_resposta > NOW()
      AND dv.status_demanda IN ('aberta', 'sem_resposta_24h', 'em busca')
      AND COALESCE(dv.is_prioritaria, false) = false
  LOOP
    horas_restantes := EXTRACT(EPOCH FROM (r.prazo_resposta - NOW())) / 3600;
    demanda_owner := r.corretor_id;
    cliente_nome := COALESCE(r.nome_cliente, 'Cliente');
    tipo_demanda := 'Venda';

    IF horas_restantes <= 24 AND horas_restantes > 12 AND r.notif_24h = false THEN
      IF demanda_owner IS NOT NULL THEN
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (demanda_owner, 'status_atualizado',
          'Prazo se aproximando: ' || cliente_nome,
          'A demanda de ' || cliente_nome || ' vence em menos de 24 horas.',
          jsonb_build_object('demanda_id', r.demanda_venda_id, 'tipo_demanda', tipo_demanda, 'alert_type', '24h'),
          'alta');
      END IF;
      UPDATE public.demandas_vendas SET notificada_24h = true WHERE id = r.demanda_venda_id;
    END IF;

    IF horas_restantes <= 12 AND horas_restantes > 0 AND r.notif_12h = false THEN
      IF demanda_owner IS NOT NULL THEN
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (demanda_owner, 'status_atualizado',
          'Prazo critico: ' || cliente_nome,
          'A demanda de ' || cliente_nome || ' vence em menos de 12 horas!',
          jsonb_build_object('demanda_id', r.demanda_venda_id, 'tipo_demanda', tipo_demanda, 'alert_type', '12h'),
          'alta');
      END IF;
      UPDATE public.demandas_vendas SET notificada_12h = true WHERE id = r.demanda_venda_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update fn_prorrogar_prazo to log to demand_status_log and reset notification flags
CREATE OR REPLACE FUNCTION public.fn_prorrogar_prazo(
  p_demanda_id uuid,
  p_tipo_demanda text,
  p_horas integer
) RETURNS json AS $$
DECLARE
  v_old_prazo TIMESTAMPTZ;
  v_new_prazo TIMESTAMPTZ;
  v_old_status TEXT;
  v_prorrogacoes INTEGER;
  v_table TEXT;
BEGIN
  v_table := CASE WHEN p_tipo_demanda ILIKE '%aluguel%' OR p_tipo_demanda ILIKE '%locacao%' THEN 'demandas_locacao' ELSE 'demandas_vendas' END;

  IF v_table = 'demandas_locacao' THEN
    SELECT prazo_resposta INTO v_old_prazo
    FROM public.prazos_captacao
    WHERE demanda_locacao_id = p_demanda_id AND status = 'ativo'
    ORDER BY data_criacao DESC LIMIT 1;

    SELECT status_demanda INTO v_old_status
    FROM public.demandas_locacao WHERE id = p_demanda_id;

    UPDATE public.prazos_captacao
    SET prazo_resposta = NOW() + (p_horas || ' hours')::INTERVAL,
        prorrogacoes_usadas = COALESCE(prorrogacoes_usadas, 0) + 1,
        status = 'ativo'
    WHERE demanda_locacao_id = p_demanda_id AND status = 'ativo';

    UPDATE public.demandas_locacao
    SET notificada_12h = false, notificada_24h = false, updated_at = NOW()
    WHERE id = p_demanda_id;
  ELSE
    SELECT prazo_resposta INTO v_old_prazo
    FROM public.prazos_captacao
    WHERE demanda_venda_id = p_demanda_id AND status = 'ativo'
    ORDER BY data_criacao DESC LIMIT 1;

    SELECT status_demanda INTO v_old_status
    FROM public.demandas_vendas WHERE id = p_demanda_id;

    UPDATE public.prazos_captacao
    SET prazo_resposta = NOW() + (p_horas || ' hours')::INTERVAL,
        prorrogacoes_usadas = COALESCE(prorrogacoes_usadas, 0) + 1,
        status = 'ativo'
    WHERE demanda_venda_id = p_demanda_id AND status = 'ativo';

    UPDATE public.demandas_vendas
    SET notificada_12h = false, notificada_24h = false, updated_at = NOW()
    WHERE id = p_demanda_id;
  END IF;

  v_new_prazo := NOW() + (p_horas || ' hours')::INTERVAL;

  INSERT INTO public.demand_status_log (demanda_id, tipo_demanda, status_anterior, status_novo, alterado_por, motivo)
  VALUES (p_demanda_id, p_tipo_demanda, v_old_status, v_old_status, auth.uid(),
    'Prazo prorrogado em ' || p_horas || 'h. Novo prazo: ' || to_char(v_new_prazo AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'));

  RETURN jsonb_build_object('success', true, 'old_prazo', v_old_prazo, 'new_prazo', v_new_prazo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update atualizar_prazos_vencidos to skip prioritized demands
CREATE OR REPLACE FUNCTION public.atualizar_prazos_vencidos()
RETURNS void AS $$
DECLARE
  r RECORD;
  demanda_owner UUID;
  cliente_nome TEXT;
BEGIN
  UPDATE public.prazos_captacao
  SET status = 'sem_resposta_24h'
  WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas < 3;

  UPDATE public.prazos_captacao
  SET status = 'sem_resposta_final'
  WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas >= 3;

  UPDATE public.demandas_locacao dl
  SET status_demanda = 'sem_resposta_24h',
      marcada_sem_resposta = true
  FROM public.prazos_captacao pc
  WHERE dl.id = pc.demanda_locacao_id
    AND pc.status = 'sem_resposta_24h'
    AND dl.status_demanda = 'aberta'
    AND COALESCE(dl.is_prioritaria, false) = false;

  UPDATE public.demandas_vendas dv
  SET status_demanda = 'sem_resposta_24h',
      marcada_sem_resposta = true
  FROM public.prazos_captacao pc
  WHERE dv.id = pc.demanda_venda_id
    AND pc.status = 'sem_resposta_24h'
    AND dv.status_demanda = 'aberta'
    AND COALESCE(dv.is_prioritaria, false) = false;

  FOR r IN
    SELECT pc.id, pc.demanda_locacao_id, pc.demanda_venda_id
    FROM public.prazos_captacao pc
    WHERE pc.status = 'sem_resposta_final'
  LOOP
    IF r.demanda_locacao_id IS NOT NULL THEN
      UPDATE public.demandas_locacao
      SET status_demanda = 'PERDIDA_BAIXA', marcada_sem_resposta = true
      WHERE id = r.demanda_locacao_id
        AND status_demanda IN ('aberta', 'sem_resposta_24h')
        AND COALESCE(is_prioritaria, false) = false
      RETURNING sdr_id, nome_cliente INTO demanda_owner, cliente_nome;

      IF FOUND AND demanda_owner IS NOT NULL THEN
        INSERT INTO public.demand_status_log (demanda_id, tipo_demanda, status_anterior, status_novo, motivo)
        VALUES (r.demanda_locacao_id, 'Aluguel', 'sem_resposta_24h', 'PERDIDA_BAIXA', 'Timeout expirado (48h/3 prorrog.)');

        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (demanda_owner, 'status_atualizado', 'Timeout Expirado',
          'Demanda de ' || COALESCE(cliente_nome, '') || ' foi baixada automaticamente por timeout.',
          jsonb_build_object('demanda_id', r.demanda_locacao_id, 'status', 'PERDIDA_BAIXA'), 'alta');
      END IF;

      UPDATE public.prazos_captacao SET status = 'vencido' WHERE id = r.id;

    ELSIF r.demanda_venda_id IS NOT NULL THEN
      UPDATE public.demandas_vendas
      SET status_demanda = 'PERDIDA_BAIXA', marcada_sem_resposta = true
      WHERE id = r.demanda_venda_id
        AND status_demanda IN ('aberta', 'sem_resposta_24h')
        AND COALESCE(is_prioritaria, false) = false
      RETURNING corretor_id, nome_cliente INTO demanda_owner, cliente_nome;

      IF FOUND AND demanda_owner IS NOT NULL THEN
        INSERT INTO public.demand_status_log (demanda_id, tipo_demanda, status_anterior, status_novo, motivo)
        VALUES (r.demanda_venda_id, 'Venda', 'sem_resposta_24h', 'PERDIDA_BAIXA', 'Timeout expirado (48h/3 prorrog.)');

        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (demanda_owner, 'status_atualizado', 'Timeout Expirado',
          'Demanda de ' || COALESCE(cliente_nome, '') || ' foi baixada automaticamente por timeout.',
          jsonb_build_object('demanda_id', r.demanda_venda_id, 'status', 'PERDIDA_BAIXA'), 'alta');
      END IF;

      UPDATE public.prazos_captacao SET status = 'vencido' WHERE id = r.id;
    END IF;
  END LOOP;

  PERFORM public.fn_notificar_prazo_proximo();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update fn_marcar_demandas_sem_resposta to skip prioritized demands
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
  WITH updated AS (
    UPDATE public.demandas_locacao dl
    SET status_demanda = 'perdida',
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
    SET status_demanda = 'perdida',
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
    SET status_demanda = 'perdida',
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
    SET status_demanda = 'perdida',
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

  UPDATE public.prazos_captacao
  SET status = 'vencido'
  WHERE status = 'ativo' AND prazo_resposta < NOW();

  RETURN QUERY
  SELECT 'demandas_locacao'::text, v_qtd_locacao + v_qtd_locacao_72h
  UNION ALL
  SELECT 'demandas_vendas'::text, v_qtd_vendas + v_qtd_vendas_72h;
END;
$$;

-- 7. Ensure marlon@eticimoveis.com.br seed user exists
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

-- 8. Schedule notification check if pg_cron is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('check_prazo_notifications');
      PERFORM cron.schedule('check_prazo_notifications', '0 * * * *', $$
        SELECT public.fn_notificar_prazo_proximo();
      $$);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to schedule notification cron job.';
    END;
  END IF;
END $$;
