-- Comprehensive fix: explicit notificacao_tipo and notificacao_prioridade enum casting
-- in ALL notification trigger functions to prevent "column tipo is of type notificacao_tipo but expression is of type text"
-- Idempotent: all functions use CREATE OR REPLACE

-- 1. notify_captadores_demand_lost — INSERT...SELECT needs explicit cast
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

-- 2. notify_nova_demanda — INSERT...SELECT needs explicit cast
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

-- 3. notify_novo_imovel — both INSERT...VALUES and INSERT...SELECT need explicit cast
CREATE OR REPLACE FUNCTION public.notify_novo_imovel() RETURNS trigger AS $$
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

-- 4. notify_imovel_atualizado — explicit enum cast
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

-- 5. notify_resposta_captador — explicit enum cast
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
            VALUES (demanda_owner, 'status_atualizado'::public.notificacao_tipo, 'Busca sem sucesso: ' || COALESCE(cliente_nome, 'Cliente'),
                    'Captador ' || COALESCE(captador_nome, '') || ' não encontrou imóvel. Motivo: ' || COALESCE(NEW.motivo, ''),
                    jsonb_build_object('demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal'::public.notificacao_prioridade);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. notify_busca_iniciada_multipla — explicit enum cast for busca_iniciada notifications
CREATE OR REPLACE FUNCTION public.notify_busca_iniciada_multipla() RETURNS trigger AS $$
DECLARE
    v_owner_id uuid;
    v_cliente_nome text;
    v_tipo_demanda text;
    v_new_captador_id text;
    v_new_captador_nome text;
    v_regiao text;
    v_existing_count int;
BEGIN
    IF NEW.captadores_busca IS DISTINCT FROM OLD.captadores_busca THEN
        IF TG_TABLE_NAME = 'demandas_locacao' THEN
            v_owner_id := NEW.sdr_id;
            v_tipo_demanda := 'Aluguel';
        ELSE
            v_owner_id := NEW.corretor_id;
            v_tipo_demanda := 'Venda';
        END IF;
        v_cliente_nome := COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'Cliente');

        SELECT (elem->>'captador_id') INTO v_new_captador_id
        FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
        WHERE NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(COALESCE(OLD.captadores_busca, '[]'::jsonb)) AS old_elem
            WHERE old_elem->>'captador_id' = elem->>'captador_id'
        )
        LIMIT 1;

        IF v_new_captador_id IS NOT NULL THEN
            SELECT nome INTO v_new_captador_nome FROM public.users WHERE id = v_new_captador_id::uuid;

            SELECT (elem->>'regiao') INTO v_regiao
            FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
            WHERE elem->>'captador_id' = v_new_captador_id
            LIMIT 1;

            SELECT count(*) INTO v_existing_count
            FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
            WHERE (elem->>'captador_id')::uuid IS DISTINCT FROM v_new_captador_id::uuid;

            IF v_owner_id IS NOT NULL THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                VALUES (
                    v_owner_id,
                    'busca_iniciada_responsavel'::public.notificacao_tipo,
                    'Busca Iniciada',
                    COALESCE(v_new_captador_nome, 'Captador') || ' iniciou busca para ' || v_cliente_nome || COALESCE(' em ' || v_regiao, ''),
                    jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', v_tipo_demanda, 'captador_id', v_new_captador_id),
                    'normal'::public.notificacao_prioridade
                );
            END IF;

            IF v_existing_count > 0 THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                SELECT
                    (elem->>'captador_id')::uuid,
                    'busca_iniciada_outros'::public.notificacao_tipo,
                    'Concorrência na Busca',
                    v_new_captador_nome || ' também está buscando para ' || v_cliente_nome,
                    jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', v_tipo_demanda, 'novo_captador_id', v_new_captador_id),
                    'normal'::public.notificacao_prioridade
                FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
                WHERE (elem->>'captador_id')::uuid IS DISTINCT FROM v_new_captador_id::uuid;
            END IF;

            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            SELECT
                u.id,
                'busca_iniciada_admin'::public.notificacao_tipo,
                'Busca Iniciada',
                COALESCE(v_new_captador_nome, 'Captador') || ' iniciou busca para ' || v_cliente_nome,
                jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', v_tipo_demanda, 'captador_id', v_new_captador_id),
                'baixa'::public.notificacao_prioridade
            FROM public.users u
            WHERE u.role IN ('admin', 'gestor') AND u.status = 'ativo';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. notify_imovel_desvinculado — explicit enum cast
CREATE OR REPLACE FUNCTION public.notify_imovel_desvinculado() RETURNS trigger AS $$
DECLARE
    v_demanda_owner uuid;
    v_cliente_nome text;
    v_codigo text;
BEGIN
    IF (OLD.demanda_locacao_id IS NOT NULL AND NEW.demanda_locacao_id IS NULL)
       OR (OLD.demanda_venda_id IS NOT NULL AND NEW.demanda_venda_id IS NULL) THEN

        v_codigo := COALESCE(NEW.codigo_imovel, OLD.codigo_imovel, 'S/C');

        IF OLD.demanda_locacao_id IS NOT NULL AND NEW.demanda_locacao_id IS NULL THEN
            SELECT sdr_id, nome_cliente INTO v_demanda_owner, v_cliente_nome
            FROM public.demandas_locacao WHERE id = OLD.demanda_locacao_id;
        ELSIF OLD.demanda_venda_id IS NOT NULL AND NEW.demanda_venda_id IS NULL THEN
            SELECT corretor_id, nome_cliente INTO v_demanda_owner, v_cliente_nome
            FROM public.demandas_vendas WHERE id = OLD.demanda_venda_id;
        END IF;

        IF v_demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (
                v_demanda_owner,
                'status_atualizado'::public.notificacao_tipo,
                'Imóvel Desvinculado',
                'Imóvel ' || v_codigo || ' foi desvinculado da demanda de ' || COALESCE(v_cliente_nome, 'Cliente'),
                jsonb_build_object('imovel_id', NEW.id, 'demanda_locacao_id', OLD.demanda_locacao_id, 'demanda_venda_id', OLD.demanda_venda_id),
                'normal'::public.notificacao_prioridade
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. notify_high_score_match — explicit enum cast
CREATE OR REPLACE FUNCTION public.notify_high_score_match() RETURNS trigger AS $$
DECLARE
    v_demanda_owner uuid;
    v_cliente_nome text;
    v_tipo_demanda text;
    v_imovel_codigo text;
    v_imovel_endereco text;
BEGIN
    IF NEW.score >= 80 THEN
        IF NEW.demanda_tipo = 'Locação' OR NEW.demanda_tipo = 'Aluguel' THEN
            SELECT sdr_id, nome_cliente INTO v_demanda_owner, v_cliente_nome
            FROM public.demandas_locacao WHERE id = NEW.demanda_id;
            v_tipo_demanda := 'Aluguel';
        ELSE
            SELECT corretor_id, nome_cliente INTO v_demanda_owner, v_cliente_nome
            FROM public.demandas_vendas WHERE id = NEW.demanda_id;
            v_tipo_demanda := 'Venda';
        END IF;

        SELECT codigo_imovel, endereco INTO v_imovel_codigo, v_imovel_endereco
        FROM public.imoveis_captados WHERE id = NEW.imovel_id;

        IF v_demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (
                v_demanda_owner,
                'novo_imovel'::public.notificacao_tipo,
                'Match Inteligente! 🎯',
                'Imóvel ' || COALESCE(v_imovel_codigo, 'S/C') || ' (' || COALESCE(v_imovel_endereco, '') || ') tem ' || NEW.score || '% de compatibilidade com ' || COALESCE(v_cliente_nome, 'Cliente'),
                jsonb_build_object('imovel_id', NEW.imovel_id, 'demanda_id', NEW.demanda_id, 'tipo_demanda', v_tipo_demanda, 'score', NEW.score),
                'alta'::public.notificacao_prioridade
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. notify_feedback_captador — explicit enum cast
CREATE OR REPLACE FUNCTION public.notify_feedback_captador() RETURNS trigger AS $$
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

-- Ensure triggers exist for the functions
DROP TRIGGER IF EXISTS trg_notify_captadores_demand_lost_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_captadores_demand_lost_locacao
  AFTER UPDATE OF status_demanda ON public.demandas_locacao
  FOR EACH ROW EXECUTE FUNCTION public.notify_captadores_demand_lost();

DROP TRIGGER IF EXISTS trg_notify_captadores_demand_lost_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_captadores_demand_lost_vendas
  AFTER UPDATE OF status_demanda ON public.demandas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_captadores_demand_lost();

DROP TRIGGER IF EXISTS trg_notify_busca_iniciada_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_busca_iniciada_locacao
  AFTER UPDATE OF captadores_busca ON public.demandas_locacao
  FOR EACH ROW EXECUTE FUNCTION public.notify_busca_iniciada_multipla();

DROP TRIGGER IF EXISTS trg_notify_busca_iniciada_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_busca_iniciada_vendas
  AFTER UPDATE OF captadores_busca ON public.demandas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_busca_iniciada_multipla();

DROP TRIGGER IF EXISTS trg_notify_imovel_desvinculado ON public.imoveis_captados;
CREATE TRIGGER trg_notify_imovel_desvinculado
  AFTER UPDATE OF demanda_locacao_id, demanda_venda_id ON public.imoveis_captados
  FOR EACH ROW EXECUTE FUNCTION public.notify_imovel_desvinculado();

DROP TRIGGER IF EXISTS trg_notify_high_score_match ON public.matches_sugestoes;
CREATE TRIGGER trg_notify_high_score_match
  AFTER INSERT ON public.matches_sugestoes
  FOR EACH ROW EXECUTE FUNCTION public.notify_high_score_match();
