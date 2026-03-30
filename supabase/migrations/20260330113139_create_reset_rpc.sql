CREATE OR REPLACE FUNCTION public.fn_reset_database(p_delete_before timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin boolean;
    v_count_imoveis int;
    v_count_locacao int;
    v_count_vendas int;
    v_count_notificacoes int;
BEGIN
    -- Verifica se o usuário é admin
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem resetar a base.';
    END IF;

    -- Deleta imóveis captados (isso inclui visitas_agendadas e negocios_fechados virtuais, pois são apenas status do imóvel no Supabase)
    WITH deleted AS (
        DELETE FROM public.imoveis_captados 
        WHERE created_at <= p_delete_before
        RETURNING id
    ) SELECT count(*) INTO v_count_imoveis FROM deleted;

    -- Deleta demandas de locação
    WITH deleted AS (
        DELETE FROM public.demandas_locacao 
        WHERE created_at <= p_delete_before
        RETURNING id
    ) SELECT count(*) INTO v_count_locacao FROM deleted;

    -- Deleta demandas de vendas
    WITH deleted AS (
        DELETE FROM public.demandas_vendas 
        WHERE created_at <= p_delete_before
        RETURNING id
    ) SELECT count(*) INTO v_count_vendas FROM deleted;

    -- Limpa tabelas auxiliares para não deixar lixo
    DELETE FROM public.pontuacao_captador WHERE created_at <= p_delete_before;
    DELETE FROM public.prazos_captacao WHERE data_criacao <= p_delete_before;
    DELETE FROM public.respostas_captador WHERE created_at <= p_delete_before;
    DELETE FROM public.tenant_proposals WHERE created_at <= p_delete_before;
    
    WITH deleted AS (
        DELETE FROM public.notificacoes 
        WHERE created_at <= p_delete_before
        RETURNING id
    ) SELECT count(*) INTO v_count_notificacoes FROM deleted;

    DELETE FROM public.audit_log WHERE created_at <= p_delete_before;
    DELETE FROM public.realtime_logs WHERE timestamp <= p_delete_before;

    RETURN jsonb_build_object(
        'status', 'success',
        'deleted', jsonb_build_object(
            'imoveis_captados', v_count_imoveis,
            'demandas_locacao', v_count_locacao,
            'demandas_vendas', v_count_vendas,
            'notificacoes', v_count_notificacoes
        )
    );
END;
$$;
