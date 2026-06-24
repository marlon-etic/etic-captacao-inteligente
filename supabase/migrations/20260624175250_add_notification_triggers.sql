-- 1. Add ENUM values for notification types
ALTER TYPE public.notificacao_tipo ADD VALUE IF NOT EXISTS 'visita_registrada';
ALTER TYPE public.notificacao_tipo ADD VALUE IF NOT EXISTS 'feedback_registrado';
ALTER TYPE public.notificacao_tipo ADD VALUE IF NOT EXISTS 'negociacao_registrada';

-- 2. Trigger Function for visit_records
CREATE OR REPLACE FUNCTION public.fn_notify_visit_recorded()
RETURNS trigger AS $$
DECLARE
    v_captador_id uuid;
    v_endereco text;
    v_cliente_nome text;
    v_sdr_nome text;
    v_demanda_id uuid;
    v_imovel_id uuid;
    v_tipo_demanda text;
    v_data_visita text;
BEGIN
    SELECT m.captador_id, m.imovel_id, m.demanda_id, m.tipo_demanda
    INTO v_captador_id, v_imovel_id, v_demanda_id, v_tipo_demanda
    FROM public.imovel_demand_match m
    WHERE m.id = NEW.property_link_id;

    IF v_imovel_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_captador_id IS NULL THEN
        SELECT user_captador_id, endereco INTO v_captador_id, v_endereco
        FROM public.imoveis_captados
        WHERE id = v_imovel_id;
    ELSE
        SELECT endereco INTO v_endereco
        FROM public.imoveis_captados
        WHERE id = v_imovel_id;
    END IF;

    SELECT nome INTO v_sdr_nome FROM public.users WHERE id = NEW.sdr_user_id;

    IF v_tipo_demanda = 'Locação' OR v_tipo_demanda = 'Aluguel' THEN
        SELECT COALESCE(nome_cliente, cliente_nome) INTO v_cliente_nome FROM public.demandas_locacao WHERE id = v_demanda_id;
    ELSE
        SELECT COALESCE(nome_cliente, cliente_nome) INTO v_cliente_nome FROM public.demandas_vendas WHERE id = v_demanda_id;
    END IF;

    v_data_visita := to_char(timezone('America/Sao_Paulo', NEW.visited_at), 'DD/MM/YYYY HH24:MI');

    IF v_captador_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.users WHERE id = v_captador_id AND status = 'ativo') THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.notificacoes 
                WHERE usuario_id = v_captador_id 
                  AND tipo = 'visita_registrada'::public.notificacao_tipo 
                  AND dados_relacionados->>'property_link_id' = NEW.property_link_id::text
                  AND created_at > NOW() - INTERVAL '1 minute'
            ) THEN
                INSERT INTO public.notificacoes (
                    usuario_id,
                    tipo,
                    titulo,
                    mensagem,
                    dados_relacionados,
                    prioridade,
                    lido
                ) VALUES (
                    v_captador_id,
                    'visita_registrada'::public.notificacao_tipo,
                    'Visita Registrada',
                    'O cliente ' || COALESCE(v_cliente_nome, 'Desconhecido') || ' visitou seu imóvel ' || COALESCE(v_endereco, 'S/C') || ' em ' || COALESCE(v_data_visita, ''),
                    jsonb_build_object(
                        'property_link_id', NEW.property_link_id,
                        'imovel_id', v_imovel_id,
                        'demanda_id', v_demanda_id,
                        'history_record', 'Visita registrada por ' || COALESCE(v_sdr_nome, 'SDR') || ' em ' || COALESCE(v_data_visita, '')
                    ),
                    'normal',
                    false
                );

                -- Insert into webhook queue for future external integration
                INSERT INTO public.webhook_queue (event_type, entity_id, payload)
                VALUES ('visita_registrada', NEW.id, row_to_json(NEW));
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_visit_recorded ON public.visit_records;
CREATE TRIGGER trg_notify_visit_recorded
  AFTER INSERT ON public.visit_records
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_visit_recorded();

-- 3. Trigger Function for feedback_records
CREATE OR REPLACE FUNCTION public.fn_notify_feedback_recorded()
RETURNS trigger AS $$
DECLARE
    v_captador_id uuid;
    v_endereco text;
    v_cliente_nome text;
    v_demanda_id uuid;
    v_imovel_id uuid;
    v_tipo_demanda text;
    v_mensagem text;
BEGIN
    SELECT m.captador_id, m.imovel_id, m.demanda_id, m.tipo_demanda
    INTO v_captador_id, v_imovel_id, v_demanda_id, v_tipo_demanda
    FROM public.imovel_demand_match m
    WHERE m.id = NEW.property_link_id;

    IF v_imovel_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_captador_id IS NULL THEN
        SELECT user_captador_id, endereco INTO v_captador_id, v_endereco
        FROM public.imoveis_captados
        WHERE id = v_imovel_id;
    ELSE
        SELECT endereco INTO v_endereco
        FROM public.imoveis_captados
        WHERE id = v_imovel_id;
    END IF;

    IF v_tipo_demanda = 'Locação' OR v_tipo_demanda = 'Aluguel' THEN
        SELECT COALESCE(nome_cliente, cliente_nome) INTO v_cliente_nome FROM public.demandas_locacao WHERE id = v_demanda_id;
    ELSE
        SELECT COALESCE(nome_cliente, cliente_nome) INTO v_cliente_nome FROM public.demandas_vendas WHERE id = v_demanda_id;
    END IF;

    v_mensagem := 'Feedback: Cliente ' || COALESCE(v_cliente_nome, 'Desconhecido') || ' ';
    IF NEW.interest_level = 'high' THEN
        v_mensagem := v_mensagem || 'MUITO INTERESSADO';
    ELSIF NEW.interest_level = 'medium' THEN
        v_mensagem := v_mensagem || 'INTERESSADO';
    ELSIF NEW.interest_level = 'low' THEN
        v_mensagem := v_mensagem || 'NÃO INTERESSADO';
    ELSE
        v_mensagem := v_mensagem || COALESCE(NEW.interest_level, '');
    END IF;
    
    v_mensagem := v_mensagem || ' no imóvel ' || COALESCE(v_endereco, 'S/C');

    IF NEW.feedback_text IS NOT NULL AND NEW.feedback_text != '' THEN
        v_mensagem := v_mensagem || '. Motivo: ' || NEW.feedback_text;
    END IF;

    IF v_captador_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.users WHERE id = v_captador_id AND status = 'ativo') THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.notificacoes 
                WHERE usuario_id = v_captador_id 
                  AND tipo = 'feedback_registrado'::public.notificacao_tipo 
                  AND dados_relacionados->>'property_link_id' = NEW.property_link_id::text
                  AND created_at > NOW() - INTERVAL '1 minute'
            ) THEN
                INSERT INTO public.notificacoes (
                    usuario_id,
                    tipo,
                    titulo,
                    mensagem,
                    dados_relacionados,
                    prioridade,
                    lido
                ) VALUES (
                    v_captador_id,
                    'feedback_registrado'::public.notificacao_tipo,
                    'Feedback Registrado',
                    v_mensagem,
                    jsonb_build_object(
                        'property_link_id', NEW.property_link_id,
                        'imovel_id', v_imovel_id,
                        'demanda_id', v_demanda_id,
                        'interest_level', NEW.interest_level
                    ),
                    'normal',
                    false
                );

                INSERT INTO public.webhook_queue (event_type, entity_id, payload)
                VALUES ('feedback_registrado', NEW.id, row_to_json(NEW));
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_feedback_recorded ON public.feedback_records;
CREATE TRIGGER trg_notify_feedback_recorded
  AFTER INSERT ON public.feedback_records
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_feedback_recorded();

-- 4. Trigger Function for negotiation_records
CREATE OR REPLACE FUNCTION public.fn_notify_negotiation_recorded()
RETURNS trigger AS $$
DECLARE
    v_captador_id uuid;
    v_endereco text;
    v_demanda_id uuid;
    v_imovel_id uuid;
    v_data text;
BEGIN
    SELECT m.captador_id, m.imovel_id, m.demanda_id
    INTO v_captador_id, v_imovel_id, v_demanda_id
    FROM public.imovel_demand_match m
    WHERE m.id = NEW.property_link_id;

    IF v_imovel_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_captador_id IS NULL THEN
        SELECT user_captador_id, endereco INTO v_captador_id, v_endereco
        FROM public.imoveis_captados
        WHERE id = v_imovel_id;
    ELSE
        SELECT endereco INTO v_endereco
        FROM public.imoveis_captados
        WHERE id = v_imovel_id;
    END IF;

    v_data := to_char(timezone('America/Sao_Paulo', NEW.negotiation_date), 'DD/MM/YYYY');

    IF v_captador_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.users WHERE id = v_captador_id AND status = 'ativo') THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.notificacoes 
                WHERE usuario_id = v_captador_id 
                  AND tipo = 'negociacao_registrada'::public.notificacao_tipo 
                  AND dados_relacionados->>'property_link_id' = NEW.property_link_id::text
                  AND created_at > NOW() - INTERVAL '1 minute'
            ) THEN
                INSERT INTO public.notificacoes (
                    usuario_id,
                    tipo,
                    titulo,
                    mensagem,
                    dados_relacionados,
                    prioridade,
                    lido
                ) VALUES (
                    v_captador_id,
                    'negociacao_registrada'::public.notificacao_tipo,
                    'Negociação Registrada',
                    'Seu imóvel ' || COALESCE(v_endereco, 'S/C') || ' foi negociado pela imobiliária em ' || COALESCE(v_data, ''),
                    jsonb_build_object(
                        'property_link_id', NEW.property_link_id,
                        'imovel_id', v_imovel_id,
                        'demanda_id', v_demanda_id,
                        'status', NEW.negotiation_status
                    ),
                    'alta',
                    false
                );

                INSERT INTO public.webhook_queue (event_type, entity_id, payload)
                VALUES ('negociacao_registrada', NEW.id, row_to_json(NEW));
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_negotiation_recorded ON public.negotiation_records;
CREATE TRIGGER trg_notify_negotiation_recorded
  AFTER INSERT ON public.negotiation_records
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_negotiation_recorded();

-- 5. Test Function for verification
CREATE OR REPLACE FUNCTION public.fn_test_notifications_flow()
RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_imovel_id uuid;
    v_demanda_id uuid;
    v_match_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'marlon@eticimoveis.com.br' LIMIT 1;
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Create dummy demanda
    INSERT INTO public.demandas_vendas (
        cliente_nome, is_test_data, status_demanda, corretor_id, tipo, nivel_urgencia
    ) VALUES (
        'Cliente Teste Notificacao', true, 'ativa', v_user_id, 'Venda', 'Alta'
    ) RETURNING id INTO v_demanda_id;

    -- Create dummy imovel
    INSERT INTO public.imoveis_captados (
        codigo_imovel, endereco, preco, user_captador_id, is_test_data, tipo, tipo_imovel
    ) VALUES (
        'TEST-NOTIF-01', 'Rua das Notificacoes, 123', 500000, v_user_id, true, 'Venda', 'Casa'
    ) RETURNING id INTO v_imovel_id;

    -- Create match
    INSERT INTO public.imovel_demand_match (
        imovel_id, demanda_id, tipo_demanda, captador_id, compatibilidade_pct, tipo_vinculacao
    ) VALUES (
        v_imovel_id, v_demanda_id, 'Venda', v_user_id, 100, 'manual'
    ) RETURNING id INTO v_match_id;

    -- Insert Visit
    INSERT INTO public.visit_records (
        property_link_id, sdr_user_id, visited_at, visited_date, notes
    ) VALUES (
        v_match_id, v_user_id, NOW(), CURRENT_DATE, 'Visita teste'
    );

    -- Insert Feedback
    INSERT INTO public.feedback_records (
        property_link_id, sdr_user_id, interest_level, feedback_text
    ) VALUES (
        v_match_id, v_user_id, 'high', 'Adorou o imóvel'
    );

    -- Insert Negotiation
    INSERT INTO public.negotiation_records (
        property_link_id, negotiated_by_user_id, negotiation_status, negotiation_date, notes
    ) VALUES (
        v_match_id, v_user_id, 'em_andamento', NOW(), 'Proposta enviada'
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
