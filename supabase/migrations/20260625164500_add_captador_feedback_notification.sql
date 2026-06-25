CREATE OR REPLACE FUNCTION public.notify_feedback_captador()
RETURNS trigger AS $$
DECLARE
    v_owner_id uuid;
    v_demand_name text;
    v_captador_nome text;
BEGIN
    IF NEW.resposta = 'nao_encontrei' THEN
        -- Get captador name
        SELECT nome INTO v_captador_nome FROM public.users WHERE id = NEW.captador_id;
        
        -- Get demand owner and name
        IF NEW.demanda_locacao_id IS NOT NULL THEN
            SELECT sdr_id, nome_cliente INTO v_owner_id, v_demand_name 
            FROM public.demandas_locacao 
            WHERE id = NEW.demanda_locacao_id;
        ELSIF NEW.demanda_venda_id IS NOT NULL THEN
            SELECT corretor_id, nome_cliente INTO v_owner_id, v_demand_name 
            FROM public.demandas_vendas 
            WHERE id = NEW.demanda_venda_id;
        END IF;

        -- Insert notification if owner found
        IF v_owner_id IS NOT NULL THEN
            INSERT INTO public.notificacoes (
                usuario_id, 
                tipo, 
                titulo, 
                mensagem, 
                dados_relacionados
            ) VALUES (
                v_owner_id,
                'feedback_registrado',
                'Feedback de Busca de Imóvel',
                COALESCE(v_captador_nome, 'Um captador') || ' registrou que não encontrou imóvel para a demanda de ' || COALESCE(v_demand_name, 'Cliente') || '. Motivo: ' || COALESCE(NEW.motivo, 'Não informado'),
                jsonb_build_object(
                    'demanda_locacao_id', NEW.demanda_locacao_id,
                    'demanda_venda_id', NEW.demanda_venda_id,
                    'captador_id', NEW.captador_id,
                    'motivo', NEW.motivo,
                    'observacao', NEW.observacao
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_feedback_captador ON public.respostas_captador;

CREATE TRIGGER trg_notify_feedback_captador
AFTER INSERT ON public.respostas_captador
FOR EACH ROW
EXECUTE FUNCTION public.notify_feedback_captador();
