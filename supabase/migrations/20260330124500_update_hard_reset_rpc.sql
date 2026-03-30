CREATE OR REPLACE FUNCTION public.fn_hard_reset_imoveis()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_is_admin boolean;
BEGIN
    -- Verifica se o usuário atual tem permissão de administrador ou gestor
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar o reset total.';
    END IF;

    -- Deleta todos os registros relacionados a imóveis
    DELETE FROM public.imoveis_captados;
    DELETE FROM public.vistasoft_cache;
    DELETE FROM public.property_performance;
    DELETE FROM public.tenant_proposals;

    -- Limpa pontuação relacionada a imóveis genéricos (sem demanda)
    DELETE FROM public.pontuacao_captador WHERE tipo_pontuacao = 'captura_sem_demanda';

    -- Deleta de tabelas virtuais/futuras se existirem
    BEGIN
        EXECUTE 'DELETE FROM public.visitas_agendadas';
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    BEGIN
        EXECUTE 'DELETE FROM public.negocios_fechados';
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
END;
$function$;
