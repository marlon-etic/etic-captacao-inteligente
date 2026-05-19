CREATE OR REPLACE FUNCTION public.notify_imovel_desvinculado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    demanda_owner UUID;
    cliente_nome TEXT;
BEGIN
    -- Desvinculação de Locação
    IF OLD.demanda_locacao_id IS NOT NULL AND NEW.demanda_locacao_id IS NULL THEN
        SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = OLD.demanda_locacao_id;
        IF demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (demanda_owner, 'status_atualizado', 'Imóvel Desvinculado',
                    'O imóvel ' || COALESCE(OLD.codigo_imovel, 'S/C') || ' foi desvinculado da demanda de ' || COALESCE(cliente_nome, 'Cliente'),
                    jsonb_build_object('imovel_id', OLD.id, 'demanda_id', OLD.demanda_locacao_id), 'normal');
        END IF;
    END IF;

    -- Desvinculação de Venda
    IF OLD.demanda_venda_id IS NOT NULL AND NEW.demanda_venda_id IS NULL THEN
        SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = OLD.demanda_venda_id;
        IF demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (demanda_owner, 'status_atualizado', 'Imóvel Desvinculado',
                    'O imóvel ' || COALESCE(OLD.codigo_imovel, 'S/C') || ' foi desvinculado da demanda de ' || COALESCE(cliente_nome, 'Cliente'),
                    jsonb_build_object('imovel_id', OLD.id, 'demanda_id', OLD.demanda_venda_id), 'normal');
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_imovel_desvinculado ON public.imoveis_captados;
CREATE TRIGGER trg_notify_imovel_desvinculado
    AFTER UPDATE OF demanda_locacao_id, demanda_venda_id ON public.imoveis_captados
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_imovel_desvinculado();
