-- Function to automatically close demands when all active captadores mark as PERDIDO
CREATE OR REPLACE FUNCTION public.check_demand_auto_close()
RETURNS trigger AS $$
DECLARE
    total_captadores INT;
    respostas_count INT;
    demanda_owner UUID;
    cliente_nome TEXT;
    history_text TEXT;
BEGIN
    IF NEW.resposta = 'nao_encontrei' THEN
        SELECT count(*) INTO total_captadores FROM public.users WHERE role = 'captador' AND status = 'ativo';
        
        IF NEW.demanda_locacao_id IS NOT NULL THEN
            SELECT count(DISTINCT captador_id) INTO respostas_count 
            FROM public.respostas_captador 
            WHERE demanda_locacao_id = NEW.demanda_locacao_id AND resposta = 'nao_encontrei';
        ELSIF NEW.demanda_venda_id IS NOT NULL THEN
            SELECT count(DISTINCT captador_id) INTO respostas_count 
            FROM public.respostas_captador 
            WHERE demanda_venda_id = NEW.demanda_venda_id AND resposta = 'nao_encontrei';
        END IF;

        IF respostas_count >= total_captadores AND total_captadores > 0 THEN
            SELECT string_agg(u.nome || ' (' || to_char(r.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI') || ')', ', ')
            INTO history_text
            FROM public.respostas_captador r
            JOIN public.users u ON u.id = r.captador_id
            WHERE (r.demanda_locacao_id = NEW.demanda_locacao_id OR r.demanda_venda_id = NEW.demanda_venda_id)
              AND r.resposta = 'nao_encontrei';

            IF NEW.demanda_locacao_id IS NOT NULL THEN
                UPDATE public.demandas_locacao SET status_demanda = 'PERDIDA_BAIXA' WHERE id = NEW.demanda_locacao_id AND status_demanda != 'PERDIDA_BAIXA';
                IF FOUND THEN
                    SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
                    IF demanda_owner IS NOT NULL THEN
                        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                        VALUES (demanda_owner, 'status_atualizado', 'Demanda Baixada: Todos marcaram PERDIDO',
                                'Cliente: ' || COALESCE(cliente_nome, '') || '. Histórico: ' || history_text,
                                jsonb_build_object('demanda_id', NEW.demanda_locacao_id, 'status', 'PERDIDA_BAIXA'), 'alta');
                    END IF;
                END IF;
            ELSIF NEW.demanda_venda_id IS NOT NULL THEN
                UPDATE public.demandas_vendas SET status_demanda = 'PERDIDA_BAIXA' WHERE id = NEW.demanda_venda_id AND status_demanda != 'PERDIDA_BAIXA';
                IF FOUND THEN
                    SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
                    IF demanda_owner IS NOT NULL THEN
                        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                        VALUES (demanda_owner, 'status_atualizado', 'Demanda Baixada: Todos marcaram PERDIDO',
                                'Cliente: ' || COALESCE(cliente_nome, '') || '. Histórico: ' || history_text,
                                jsonb_build_object('demanda_id', NEW.demanda_venda_id, 'status', 'PERDIDA_BAIXA'), 'alta');
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_close_demand ON public.respostas_captador;
CREATE TRIGGER trg_auto_close_demand
AFTER INSERT OR UPDATE ON public.respostas_captador
FOR EACH ROW EXECUTE FUNCTION public.check_demand_auto_close();

-- Update the timeout function to handle PERDIDA_BAIXA
CREATE OR REPLACE FUNCTION public.atualizar_prazos_vencidos()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    SET status_demanda = 'sem_resposta_24h'
    FROM public.prazos_captacao pc
    WHERE dl.id = pc.demanda_locacao_id AND pc.status = 'sem_resposta_24h' AND dl.status_demanda = 'aberta';

    UPDATE public.demandas_vendas dv
    SET status_demanda = 'sem_resposta_24h'
    FROM public.prazos_captacao pc
    WHERE dv.id = pc.demanda_venda_id AND pc.status = 'sem_resposta_24h' AND dv.status_demanda = 'aberta';

    FOR r IN 
        SELECT pc.id, pc.demanda_locacao_id, pc.demanda_venda_id 
        FROM public.prazos_captacao pc 
        WHERE pc.status = 'sem_resposta_final'
    LOOP
        IF r.demanda_locacao_id IS NOT NULL THEN
            UPDATE public.demandas_locacao SET status_demanda = 'PERDIDA_BAIXA' 
            WHERE id = r.demanda_locacao_id AND status_demanda IN ('aberta', 'sem_resposta_24h')
            RETURNING sdr_id, nome_cliente INTO demanda_owner, cliente_nome;
            
            IF FOUND AND demanda_owner IS NOT NULL THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                VALUES (demanda_owner, 'status_atualizado', 'Timeout Expirado',
                        'Demanda de ' || COALESCE(cliente_nome, '') || ' foi baixada automaticamente por timeout (48h/3 prorrog.).',
                        jsonb_build_object('demanda_id', r.demanda_locacao_id, 'status', 'PERDIDA_BAIXA'), 'alta');
            END IF;
            
            UPDATE public.prazos_captacao SET status = 'vencido' WHERE id = r.id;
            
        ELSIF r.demanda_venda_id IS NOT NULL THEN
            UPDATE public.demandas_vendas SET status_demanda = 'PERDIDA_BAIXA' 
            WHERE id = r.demanda_venda_id AND status_demanda IN ('aberta', 'sem_resposta_24h')
            RETURNING corretor_id, nome_cliente INTO demanda_owner, cliente_nome;
            
            IF FOUND AND demanda_owner IS NOT NULL THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                VALUES (demanda_owner, 'status_atualizado', 'Timeout Expirado',
                        'Demanda de ' || COALESCE(cliente_nome, '') || ' foi baixada automaticamente por timeout (48h/3 prorrog.).',
                        jsonb_build_object('demanda_id', r.demanda_venda_id, 'status', 'PERDIDA_BAIXA'), 'alta');
            END IF;
            
            UPDATE public.prazos_captacao SET status = 'vencido' WHERE id = r.id;
        END IF;
    END LOOP;
END;
$function$;
