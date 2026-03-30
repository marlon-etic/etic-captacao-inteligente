CREATE OR REPLACE FUNCTION public.fn_hard_reset_imoveis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

    -- Deleta todos os registros de imoveis_captados (sem condição WHERE)
    DELETE FROM public.imoveis_captados;
    
    -- Limpa a tabela de cache para evitar resíduos de chamadas a APIs de terceiros
    DELETE FROM public.vistasoft_cache;

    -- Tentar deletar de tabelas virtuais/reais caso existam no schema do projeto (ignorar erros se não existirem)
    BEGIN
        EXECUTE 'DELETE FROM public.visitas_agendadas';
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    BEGIN
        EXECUTE 'DELETE FROM public.negocios_fechados';
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
END;
$$;
