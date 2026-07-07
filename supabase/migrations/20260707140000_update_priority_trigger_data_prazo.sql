-- Migration: Update priority trigger to also set data_prazo_resposta on demand tables
-- Changes trigger from AFTER to BEFORE UPDATE so it can modify NEW.data_prazo_resposta

CREATE OR REPLACE FUNCTION public.handle_prioridade_toggle()
RETURNS TRIGGER AS $$
DECLARE
    v_captador RECORD;
    v_prazo_exists BOOLEAN;
    v_cliente_nome TEXT;
    v_tipo_demanda TEXT;
BEGIN
    IF TG_TABLE_NAME = 'demandas_locacao' THEN
        v_tipo_demanda := 'Aluguel';
    ELSE
        v_tipo_demanda := 'Venda';
    END IF;

    -- Priority ACTIVATED
    IF (NEW.is_prioritaria = true AND (OLD.is_prioritaria = false OR OLD.is_prioritaria IS NULL)) THEN
        v_cliente_nome := COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'Cliente');

        -- Set data_prazo_resposta to 24h from now on the demand table
        NEW.data_prazo_resposta := NOW() + INTERVAL '24 hours';
        NEW.updated_at := NOW();

        -- Create or update prazo_captacao with 24h deadline
        IF TG_TABLE_NAME = 'demandas_locacao' THEN
            SELECT EXISTS(
                SELECT 1 FROM public.prazos_captacao WHERE demanda_locacao_id = NEW.id
            ) INTO v_prazo_exists;

            IF v_prazo_exists THEN
                UPDATE public.prazos_captacao
                SET prazo_resposta = NOW() + INTERVAL '24 hours',
                    status = 'ativo',
                    prorrogacoes_usadas = 0
                WHERE demanda_locacao_id = NEW.id;
            ELSE
                INSERT INTO public.prazos_captacao (demanda_locacao_id, prazo_resposta, status)
                VALUES (NEW.id, NOW() + INTERVAL '24 hours', 'ativo');
            END IF;
        ELSIF TG_TABLE_NAME = 'demandas_vendas' THEN
            SELECT EXISTS(
                SELECT 1 FROM public.prazos_captacao WHERE demanda_venda_id = NEW.id
            ) INTO v_prazo_exists;

            IF v_prazo_exists THEN
                UPDATE public.prazos_captacao
                SET prazo_resposta = NOW() + INTERVAL '24 hours',
                    status = 'ativo',
                    prorrogacoes_usadas = 0
                WHERE demanda_venda_id = NEW.id;
            ELSE
                INSERT INTO public.prazos_captacao (demanda_venda_id, prazo_resposta, status)
                VALUES (NEW.id, NOW() + INTERVAL '24 hours', 'ativo');
            END IF;
        END IF;

        -- Notify all active captadores
        FOR v_captador IN
            SELECT id FROM public.users WHERE role = 'captador' AND status = 'ativo'
        LOOP
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (
                v_captador.id,
                'status_atualizado',
                '🔴 Demanda Prioritária: ' || v_cliente_nome,
                'Uma demanda foi marcada como PRIORITÁRIA em ' || v_tipo_demanda ||
                '. Você tem 24h para responder! Cliente: ' || v_cliente_nome ||
                COALESCE('. Motivo: ' || NEW.motivo_priorizacao, ''),
                jsonb_build_object(
                    'demanda_id', NEW.id,
                    'is_prioritaria', true,
                    'tipo_demanda', v_tipo_demanda,
                    'motivo_priorizacao', NEW.motivo_priorizacao
                ),
                'alta'
            );
        END LOOP;

    -- Priority DEACTIVATED
    ELSIF ((NEW.is_prioritaria = false OR NEW.is_prioritaria IS NULL) AND OLD.is_prioritaria = true) THEN
        NEW.data_prazo_resposta := NULL;

        IF TG_TABLE_NAME = 'demandas_locacao' THEN
            UPDATE public.prazos_captacao
            SET status = 'respondido'
            WHERE demanda_locacao_id = NEW.id AND status = 'ativo';
        ELSIF TG_TABLE_NAME = 'demandas_vendas' THEN
            UPDATE public.prazos_captacao
            SET status = 'respondido'
            WHERE demanda_venda_id = NEW.id AND status = 'ativo';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers as BEFORE UPDATE to allow setting NEW.data_prazo_resposta
DROP TRIGGER IF EXISTS trg_prioridade_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_prioridade_locacao
BEFORE UPDATE OF is_prioritaria ON public.demandas_locacao
FOR EACH ROW EXECUTE FUNCTION public.handle_prioridade_toggle();

DROP TRIGGER IF EXISTS trg_prioridade_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_prioridade_vendas
BEFORE UPDATE OF is_prioritaria ON public.demandas_vendas
FOR EACH ROW EXECUTE FUNCTION public.handle_prioridade_toggle();
