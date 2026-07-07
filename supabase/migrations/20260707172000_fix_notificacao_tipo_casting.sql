-- Fix: Explicit notificacao_tipo enum casting in all notification trigger functions
-- Resolves: column "tipo" is of type notificacao_tipo but expression is of type text
-- Idempotent: all functions use CREATE OR REPLACE

-- 1. Fix notify_nova_demanda() - INSERT...SELECT needs explicit enum cast
CREATE OR REPLACE FUNCTION public.notify_nova_demanda() RETURNS trigger AS $$
DECLARE
    urgencia_text TEXT;
    prioridade_val notificacao_prioridade;
    cliente_nome TEXT;
    bairros_text TEXT;
    valor_max NUMERIC;
BEGIN
    IF TG_TABLE_NAME = 'demandas_locacao' THEN
        urgencia_text := NEW.nivel_urgencia;
        cliente_nome := NEW.nome_cliente;
        valor_max := NEW.valor_maximo;
    ELSE
        urgencia_text := NEW.nivel_urgencia;
        cliente_nome := NEW.nome_cliente;
        valor_max := NEW.valor_maximo;
    END IF;

    IF urgencia_text IN ('Urgente', 'Alta') THEN
        prioridade_val := 'alta';
    ELSIF urgencia_text IN ('Baixa') THEN
        prioridade_val := 'baixa';
    ELSE
        prioridade_val := 'normal';
    END IF;

    bairros_text := array_to_string(NEW.bairros, ', ');

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT id, 'nova_demanda'::notificacao_tipo,
           'Nova demanda: ' || COALESCE(cliente_nome, ''),
           COALESCE(bairros_text, '') || ' - R$ ' || COALESCE(valor_max, 0),
           jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', CASE WHEN TG_TABLE_NAME = 'demandas_locacao' THEN 'Aluguel' ELSE 'Venda' END),
           prioridade_val
    FROM public.users WHERE role = 'captador';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix notify_novo_imovel() - both INSERT...VALUES and INSERT...SELECT need explicit cast
CREATE OR REPLACE FUNCTION public.notify_novo_imovel() RETURNS trigger AS $$
DECLARE
    demanda_owner UUID;
    cliente_nome TEXT;
BEGIN
    IF NEW.demanda_locacao_id IS NOT NULL THEN
        SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
        IF demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (demanda_owner, 'imovel_capturado'::notificacao_tipo, 'Imóvel capturado para ' || COALESCE(cliente_nome, 'Cliente'),
                    'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
                    jsonb_build_object('imovel_id', NEW.id, 'demanda_id', NEW.demanda_locacao_id), 'alta');
        END IF;
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
        SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
        IF demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (demanda_owner, 'imovel_capturado'::notificacao_tipo, 'Imóvel capturado para ' || COALESCE(cliente_nome, 'Cliente'),
                    'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
                    jsonb_build_object('imovel_id', NEW.id, 'demanda_id', NEW.demanda_venda_id), 'alta');
        END IF;
    ELSE
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        SELECT id, 'novo_imovel'::notificacao_tipo, 'Novo imóvel genérico',
               'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Localização: ' || COALESCE(NEW.endereco, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
               jsonb_build_object('imovel_id', NEW.id), 'normal'
        FROM public.users WHERE role = 'corretor';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix notify_imovel_atualizado() - explicit enum cast for consistency
CREATE OR REPLACE FUNCTION public.notify_imovel_atualizado() RETURNS trigger AS $$
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
                VALUES (demanda_owner, 'status_atualizado'::notificacao_tipo, 'Imóvel Visitado',
                        'Imóvel ' || COALESCE(NEW.codigo_imovel, '') || ' marcado como visitado.',
                        jsonb_build_object('imovel_id', NEW.id, 'demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal');
            ELSIF NEW.etapa_funil = 'fechado' THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                VALUES (demanda_owner, 'status_atualizado'::notificacao_tipo, 'Negócio Fechado! 🎉',
                        'Imóvel ' || COALESCE(NEW.codigo_imovel, '') || ' marcado como fechado!',
                        jsonb_build_object('imovel_id', NEW.id, 'demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'alta');
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix notify_resposta_captador() - explicit enum cast for consistency
CREATE OR REPLACE FUNCTION public.notify_resposta_captador() RETURNS trigger AS $$
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
            VALUES (demanda_owner, 'status_atualizado'::notificacao_tipo, 'Busca sem sucesso: ' || COALESCE(cliente_nome, 'Cliente'),
                    'Captador ' || COALESCE(captador_nome, '') || ' não encontrou imóvel. Motivo: ' || COALESCE(NEW.motivo, ''),
                    jsonb_build_object('demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix notify_captadores_demand_lost() - explicit enum cast in INSERT...SELECT
--    Also ensures the demand owner (SDR/Corretor) is NOT notified when they mark it as lost
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

    -- Notify captadores from captadores_busca JSONB array (exclude owner)
    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT
      (elem->>'captador_id')::uuid,
      'status_atualizado'::notificacao_tipo,
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'alta'
    FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
    WHERE (elem->>'captador_id') IS NOT NULL
      AND (elem->>'captador_id')::uuid IS DISTINCT FROM v_owner_id;

    -- Notify captadores linked via imovel_demand_match (not already in captadores_busca, exclude owner)
    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT DISTINCT
      m.captador_id,
      'status_atualizado'::notificacao_tipo,
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
      'status_atualizado'::notificacao_tipo,
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
