-- Adicionar função zerar_testes
CREATE OR REPLACE FUNCTION public.zerar_testes()
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

    -- Deleta registros de operacionais anteriores a 30/03/2026 (Zera Testes)
    DELETE FROM public.imoveis_captados WHERE created_at < '2026-03-30 00:00:00'::timestamp;
    DELETE FROM public.demandas_locacao WHERE created_at < '2026-03-30 00:00:00'::timestamp;
    DELETE FROM public.demandas_vendas WHERE created_at < '2026-03-30 00:00:00'::timestamp;
    DELETE FROM public.grupos_demandas WHERE created_at < '2026-03-30 00:00:00'::timestamp;
    DELETE FROM public.pontuacao_captador WHERE created_at < '2026-03-30 00:00:00'::timestamp;
    DELETE FROM public.notificacoes WHERE created_at < '2026-03-30 00:00:00'::timestamp;
END;
$$;

-- Atualizar Políticas RLS para garantir que admin consiga deletar sem restrições
DROP POLICY IF EXISTS "Admin can delete captures" ON public.imoveis_captados;
CREATE POLICY "Admin can delete captures" ON public.imoveis_captados
  FOR DELETE TO authenticated
  USING (
    (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY(ARRAY['admin'::text, 'gestor'::text])) OR 
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'gestor'))
  );

DROP POLICY IF EXISTS "Admin can delete demandas_locacao" ON public.demandas_locacao;
CREATE POLICY "Admin can delete demandas_locacao" ON public.demandas_locacao
  FOR DELETE TO authenticated
  USING (
    (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY(ARRAY['admin'::text, 'gestor'::text])) OR 
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'gestor'))
  );

DROP POLICY IF EXISTS "Admin can delete demandas_vendas" ON public.demandas_vendas;
CREATE POLICY "Admin can delete demandas_vendas" ON public.demandas_vendas
  FOR DELETE TO authenticated
  USING (
    (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY(ARRAY['admin'::text, 'gestor'::text])) OR 
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'gestor'))
  );
