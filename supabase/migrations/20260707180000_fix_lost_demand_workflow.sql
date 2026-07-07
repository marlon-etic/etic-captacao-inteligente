-- Migration: Fix "Dar Perdido" workflow
-- Allow status update to 'perdida' even when imovel_demand_match entries exist
-- Ensure explicit enum casting in notification functions
-- Idempotent: all functions use CREATE OR REPLACE, triggers use DROP IF EXISTS

-- 1. Drop ALL CHECK constraints on status_demanda and add permissive one
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'demandas_locacao'::regclass
      AND c.contype = 'c'
      AND a.attname = 'status_demanda'
  LOOP
    EXECUTE 'ALTER TABLE demandas_locacao DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;

  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'demandas_vendas'::regclass
      AND c.contype = 'c'
      AND a.attname = 'status_demanda'
  LOOP
    EXECUTE 'ALTER TABLE demandas_vendas DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
END $$;

ALTER TABLE public.demandas_locacao
ADD CONSTRAINT demandas_locacao_status_demanda_check
CHECK (lower(status_demanda) IN (
  'ativo', 'aberta', 'fechado', 'fechada', 'perdida', 'perdido', 'arquivada',
  'pendente', 'em_negociacao', 'finalizada', 'finalizado', 'cancelada', 'cancelado',
  'em busca', 'atendida', 'sem_resposta_24h', 'ganho', 'impossivel',
  'perdida_baixa', 'pausada', 'concluida', 'concluída', 'localmente_perdida',
  'prioritaria', 'ativa'
)) NOT VALID;

ALTER TABLE public.demandas_vendas
ADD CONSTRAINT demandas_vendas_status_demanda_check
CHECK (lower(status_demanda) IN (
  'ativo', 'aberta', 'fechado', 'fechada', 'perdida', 'perdido', 'arquivada',
  'pendente', 'em_negociacao', 'finalizada', 'finalizado', 'cancelada', 'cancelado',
  'em busca', 'atendida', 'sem_resposta_24h', 'ganho', 'impossivel',
  'perdida_baixa', 'pausada', 'concluida', 'concluída', 'localmente_perdida',
  'prioritaria', 'ativa'
)) NOT VALID;

-- 2. Recreate check_demand_auto_close() to NEVER block 'perdida' status changes
CREATE OR REPLACE FUNCTION public.check_demand_auto_close()
RETURNS trigger AS $$
BEGIN
  IF NEW.status_demanda ILIKE 'perdida' OR NEW.status_demanda ILIKE 'perdido'
     OR NEW.status_demanda = 'impossivel' OR NEW.status_demanda = 'PERDIDA_BAIXA' THEN
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate check_all_captadores_lost() to NEVER block status updates
CREATE OR REPLACE FUNCTION public.check_all_captadores_lost()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate fn_handle_captador_lost_demand() to NEVER block status updates
CREATE OR REPLACE FUNCTION public.fn_handle_captador_lost_demand()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate notify_captadores_demand_lost() with explicit casting and owner exclusion
CREATE OR REPLACE FUNCTION public.notify_captadores_demand_lost()
RETURNS trigger AS $$
DECLARE
  v_cliente_nome text;
  v_demanda_id uuid;
  v_tipo_demanda text;
  v_motivo text;
  v_owner_id uuid;
BEGIN
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

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT
      (elem->>'captador_id')::uuid,
      'status_atualizado'::public.notificacao_tipo,
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'alta'::public.notificacao_prioridade
    FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
    WHERE (elem->>'captador_id') IS NOT NULL
      AND (elem->>'captador_id')::uuid IS DISTINCT FROM v_owner_id;

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT DISTINCT
      m.captador_id,
      'status_atualizado'::public.notificacao_tipo,
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'alta'::public.notificacao_prioridade
    FROM public.imovel_demand_match m
    WHERE m.demanda_id = v_demanda_id
      AND m.captador_id IS NOT NULL
      AND m.captador_id IS DISTINCT FROM v_owner_id
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
        WHERE (elem->>'captador_id')::uuid = m.captador_id
      );

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT
      u.id,
      'status_atualizado'::public.notificacao_tipo,
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'normal'::public.notificacao_prioridade
    FROM public.users u
    WHERE u.role IN ('admin', 'gestor')
      AND u.status = 'ativo'
      AND u.id IS DISTINCT FROM v_owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate notify_nova_demanda() with explicit casting
CREATE OR REPLACE FUNCTION public.notify_nova_demanda()
RETURNS trigger AS $$
DECLARE
  urgencia_text TEXT;
  prioridade_val notificacao_prioridade;
  cliente_nome TEXT;
  bairros_text TEXT;
  valor_max NUMERIC;
BEGIN
  urgencia_text := NEW.nivel_urgencia;
  cliente_nome := NEW.nome_cliente;
  valor_max := NEW.valor_maximo;

  IF urgencia_text IN ('Urgente', 'Alta') THEN
    prioridade_val := 'alta'::public.notificacao_prioridade;
  ELSIF urgencia_text IN ('Baixa') THEN
    prioridade_val := 'baixa'::public.notificacao_prioridade;
  ELSE
    prioridade_val := 'normal'::public.notificacao_prioridade;
  END IF;

  bairros_text := array_to_string(NEW.bairros, ', ');

  INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
  SELECT id, 'nova_demanda'::public.notificacao_tipo,
         'Nova demanda: ' || COALESCE(cliente_nome, ''),
         COALESCE(bairros_text, '') || ' - R$ ' || COALESCE(valor_max, 0),
         jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', CASE WHEN TG_TABLE_NAME = 'demandas_locacao' THEN 'Aluguel' ELSE 'Venda' END),
         prioridade_val
  FROM public.users WHERE role = 'captador';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recreate notify_novo_imovel() with explicit casting
CREATE OR REPLACE FUNCTION public.notify_novo_imovel()
RETURNS trigger AS $$
DECLARE
  demanda_owner UUID;
  cliente_nome TEXT;
BEGIN
  IF NEW.demanda_locacao_id IS NOT NULL THEN
    SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
    IF demanda_owner IS NOT NULL THEN
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      VALUES (demanda_owner, 'imovel_capturado'::public.notificacao_tipo, 'Imóvel capturado para ' || COALESCE(cliente_nome, 'Cliente'),
              'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
              jsonb_build_object('imovel_id', NEW.id, 'demanda_id', NEW.demanda_locacao_id), 'alta'::public.notificacao_prioridade);
    END IF;
  ELSIF NEW.demanda_venda_id IS NOT NULL THEN
    SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
    IF demanda_owner IS NOT NULL THEN
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      VALUES (demanda_owner, 'imovel_capturado'::public.notificacao_tipo, 'Imóvel capturado para ' || COALESCE(cliente_nome, 'Cliente'),
              'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
              jsonb_build_object('imovel_id', NEW.id, 'demanda_id', NEW.demanda_venda_id), 'alta'::public.notificacao_prioridade);
    END IF;
  ELSE
    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT id, 'novo_imovel'::public.notificacao_tipo, 'Novo imóvel genérico',
           'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Localização: ' || COALESCE(NEW.endereco, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
           jsonb_build_object('imovel_id', NEW.id), 'normal'::public.notificacao_prioridade
    FROM public.users WHERE role = 'corretor';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Recreate notify_imovel_atualizado() with explicit casting
CREATE OR REPLACE FUNCTION public.notify_imovel_atualizado()
RETURNS trigger AS $$
DECLARE
  demanda_owner UUID;
BEGIN
  IF NEW.etapa_funil IS DISTINCT FROM OLD.etapa_funil THEN
    IF NEW.demanda_locacao_id IS NOT NULL THEN
      SELECT sdr_id INTO demanda_owner FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
      SELECT corretor_id INTO demanda_owner FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
    END IF;

    IF demanda_owner IS NOT NULL THEN
      IF NEW.etapa_funil = 'visitado' THEN
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (demanda_owner, 'status_atualizado'::public.notificacao_tipo, 'Imóvel Visitado',
                'Imóvel ' || COALESCE(NEW.codigo_imovel, '') || ' marcado como visitado.',
                jsonb_build_object('imovel_id', NEW.id, 'demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal'::public.notificacao_prioridade);
      ELSIF NEW.etapa_funil = 'fechado' THEN
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (demanda_owner, 'status_atualizado'::public.notificacao_tipo, 'Negócio Fechado! 🎉',
                'Imóvel ' || COALESCE(NEW.codigo_imovel, '') || ' marcado como fechado!',
                jsonb_build_object('imovel_id', NEW.id, 'demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'alta'::public.notificacao_prioridade);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Recreate notify_resposta_captador() with explicit casting
CREATE OR REPLACE FUNCTION public.notify_resposta_captador()
RETURNS trigger AS $$
DECLARE
  demanda_owner UUID;
  cliente_nome TEXT;
  captador_nome TEXT;
BEGIN
  IF NEW.resposta = 'nao_encontrei' THEN
    SELECT nome INTO captador_nome FROM public.users WHERE id = NEW.captador_id;
    IF NEW.demanda_locacao_id IS NOT NULL THEN
      SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
      SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
    END IF;

    IF demanda_owner IS NOT NULL THEN
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      VALUES (demanda_owner, 'status_atualizado'::public.notificacao_tipo, 'Busca sem sucesso: ' || COALESCE(cliente_nome, 'Cliente'),
              'Captador ' || COALESCE(captador_nome, '') || ' não encontrou imóvel. Motivo: ' || COALESCE(NEW.motivo, ''),
              jsonb_build_object('demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal'::public.notificacao_prioridade);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Recreate notify_feedback_captador() with explicit casting
CREATE OR REPLACE FUNCTION public.notify_feedback_captador()
RETURNS trigger AS $$
DECLARE
  v_demanda_owner uuid;
  v_cliente_nome text;
  v_captador_nome text;
BEGIN
  IF NEW.resposta = 'nao_encontrei' THEN
    SELECT nome INTO v_captador_nome FROM public.users WHERE id = NEW.captador_id;
    IF NEW.demanda_locacao_id IS NOT NULL THEN
      SELECT sdr_id, nome_cliente INTO v_demanda_owner, v_cliente_nome
      FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
      SELECT corretor_id, nome_cliente INTO v_demanda_owner, v_cliente_nome
      FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
    END IF;
    IF v_demanda_owner IS NOT NULL THEN
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      VALUES (
        v_demanda_owner,
        'status_atualizado'::public.notificacao_tipo,
        'Feedback do Captador',
        COALESCE(v_captador_nome, 'Captador') || ' não encontrou imóvel para ' || COALESCE(v_cliente_nome, 'Cliente') || '. Motivo: ' || COALESCE(NEW.motivo, ''),
        jsonb_build_object('demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id), 'captador_id', NEW.captador_id),
        'normal'::public.notificacao_prioridade
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Ensure triggers exist for notification functions
DROP TRIGGER IF EXISTS trg_notify_captadores_demand_lost_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_captadores_demand_lost_locacao
  AFTER UPDATE OF status_demanda ON public.demandas_locacao
  FOR EACH ROW EXECUTE FUNCTION public.notify_captadores_demand_lost();

DROP TRIGGER IF EXISTS trg_notify_captadores_demand_lost_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_captadores_demand_lost_vendas
  AFTER UPDATE OF status_demanda ON public.demandas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_captadores_demand_lost();

DROP TRIGGER IF EXISTS trg_notify_nova_demanda_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_nova_demanda_locacao
  AFTER INSERT ON public.demandas_locacao
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_demanda();

DROP TRIGGER IF EXISTS trg_notify_nova_demanda_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_nova_demanda_vendas
  AFTER INSERT ON public.demandas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_demanda();

DROP TRIGGER IF EXISTS trg_notify_novo_imovel ON public.imoveis_captados;
CREATE TRIGGER trg_notify_novo_imovel
  AFTER INSERT ON public.imoveis_captados
  FOR EACH ROW EXECUTE FUNCTION public.notify_novo_imovel();

DROP TRIGGER IF EXISTS trg_notify_imovel_atualizado ON public.imoveis_captados;
CREATE TRIGGER trg_notify_imovel_atualizado
  AFTER UPDATE ON public.imoveis_captados
  FOR EACH ROW EXECUTE FUNCTION public.notify_imovel_atualizado();

DROP TRIGGER IF EXISTS trg_notify_resposta_captador ON public.respostas_captador;
CREATE TRIGGER trg_notify_resposta_captador
  AFTER INSERT ON public.respostas_captador
  FOR EACH ROW EXECUTE FUNCTION public.notify_resposta_captador();

-- 12. RLS: Ensure owners and admins can update status_demanda
DROP POLICY IF EXISTS "owner_update_status_locacao" ON public.demandas_locacao;
CREATE POLICY "owner_update_status_locacao" ON public.demandas_locacao
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = sdr_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  )
  WITH CHECK (
    auth.uid() = sdr_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

DROP POLICY IF EXISTS "owner_update_status_vendas" ON public.demandas_vendas;
CREATE POLICY "owner_update_status_vendas" ON public.demandas_vendas
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = corretor_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  )
  WITH CHECK (
    auth.uid() = corretor_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );
