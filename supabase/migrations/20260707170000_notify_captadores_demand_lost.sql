-- Migration: Notify captadores when a demand is marked as Lost + fix CHECK constraints
-- Idempotent: all functions use CREATE OR REPLACE, triggers use DROP IF EXISTS

-- 1. Fix CHECK constraints to include ALL valid statuses (including 'em busca', 'PERDIDA_BAIXA', etc.)
DO $$
BEGIN
  ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_status_demanda_check;
  ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS chk_status_demanda_locacao;
  ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS demandas_vendas_status_demanda_check;
  ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS chk_status_demanda_vendas;

  ALTER TABLE public.demandas_locacao ADD CONSTRAINT demandas_locacao_status_demanda_check
    CHECK (status_demanda IN (
      'ativo', 'aberta', 'fechado', 'perdida', 'Perdida', 'arquivada', 'pendente',
      'em_negociacao', 'finalizada', 'cancelada', 'em busca', 'atendida',
      'sem_resposta_24h', 'ganho', 'impossivel', 'PERDIDA_BAIXA'
    )) NOT VALID;

  ALTER TABLE public.demandas_vendas ADD CONSTRAINT demandas_vendas_status_demanda_check
    CHECK (status_demanda IN (
      'ativo', 'aberta', 'fechado', 'perdida', 'Perdida', 'arquivada', 'pendente',
      'em_negociacao', 'finalizada', 'cancelada', 'em busca', 'atendida',
      'sem_resposta_24h', 'ganho', 'impossivel', 'PERDIDA_BAIXA'
    )) NOT VALID;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 2. Create trigger function to notify captadores when a demand is marked as Lost
CREATE OR REPLACE FUNCTION public.notify_captadores_demand_lost()
RETURNS trigger AS $$
DECLARE
  v_cliente_nome text;
  v_demanda_id uuid;
  v_tipo_demanda text;
  v_motivo text;
  v_owner_id uuid;
BEGIN
  -- Only fire when status changes TO a lost status (and was NOT already lost)
  IF (
    NEW.status_demanda ILIKE 'perdida' OR
    NEW.status_demanda ILIKE 'perdido' OR
    NEW.status_demanda = 'impossivel' OR
    NEW.status_demanda = 'PERDIDA_BAIXA'
  ) AND (
    OLD.status_demanda IS NULL OR NOT (
      OLD.status_demanda ILIKE 'perdida' OR
      OLD.status_demanda ILIKE 'perdido' OR
      OLD.status_demanda = 'impossivel' OR
      OLD.status_demanda = 'PERDIDA_BAIXA'
    )
  ) THEN
    v_demanda_id := NEW.id;
    v_cliente_nome := COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'Cliente');
    v_motivo := COALESCE(NEW.motivo_perda, 'Não informado');

    IF TG_TABLE_NAME = 'demandas_locacao' THEN
      v_tipo_demanda := 'Aluguel';
      v_owner_id := NEW.sdr_id;
    ELSE
      v_tipo_demanda := 'Venda';
      v_owner_id := NEW.corretor_id;
    END IF;

    -- Notify captadores from captadores_busca JSONB array (exclude owner)
    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT
      (elem->>'captador_id')::uuid,
      'status_atualizado',
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'alta'
    FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
    WHERE (elem->>'captador_id') IS NOT NULL
      AND (elem->>'captador_id')::uuid IS DISTINCT FROM v_owner_id;

    -- Notify captadores linked via imovel_demand_match (not already in captadores_busca)
    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT DISTINCT
      m.captador_id,
      'status_atualizado',
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'alta'
    FROM public.imovel_demand_match m
    WHERE m.demanda_id = v_demanda_id
      AND m.captador_id IS NOT NULL
      AND m.captador_id IS DISTINCT FROM v_owner_id
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
        WHERE (elem->>'captador_id')::uuid = m.captador_id
      );

    -- Notify admins/gestores (exclude owner)
    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT
      u.id,
      'status_atualizado',
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'normal'
    FROM public.users u
    WHERE u.role IN ('admin', 'gestor')
      AND u.status = 'ativo'
      AND u.id IS DISTINCT FROM v_owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create triggers on both demand tables
DROP TRIGGER IF EXISTS trg_notify_captadores_demand_lost_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_captadores_demand_lost_locacao
  AFTER UPDATE OF status_demanda ON public.demandas_locacao
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_captadores_demand_lost();

DROP TRIGGER IF EXISTS trg_notify_captadores_demand_lost_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_captadores_demand_lost_vendas
  AFTER UPDATE OF status_demanda ON public.demandas_vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_captadores_demand_lost();
