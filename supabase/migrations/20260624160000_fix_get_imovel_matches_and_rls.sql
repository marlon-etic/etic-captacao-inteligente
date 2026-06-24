DO $BODY$
BEGIN
    -- RLS Policy Audit: Ensure SELECT permissions are granted to authenticated users on all involved tables
    
    -- matches_sugestoes
    DROP POLICY IF EXISTS "authenticated_select_matches_sugestoes" ON public.matches_sugestoes;
    CREATE POLICY "authenticated_select_matches_sugestoes" ON public.matches_sugestoes
      FOR SELECT TO authenticated USING (true);

    -- demandas_locacao
    DROP POLICY IF EXISTS "authenticated_select_demandas_locacao" ON public.demandas_locacao;
    CREATE POLICY "authenticated_select_demandas_locacao" ON public.demandas_locacao
      FOR SELECT TO authenticated USING (true);

    -- demandas_vendas
    DROP POLICY IF EXISTS "authenticated_select_demandas_vendas" ON public.demandas_vendas;
    CREATE POLICY "authenticated_select_demandas_vendas" ON public.demandas_vendas
      FOR SELECT TO authenticated USING (true);

    -- imoveis_captados
    DROP POLICY IF EXISTS "authenticated_select_imoveis_captados" ON public.imoveis_captados;
    CREATE POLICY "authenticated_select_imoveis_captados" ON public.imoveis_captados
      FOR SELECT TO authenticated USING (true);
END $BODY$;

-- Drop the old function to rebuild its signature and logic
DROP FUNCTION IF EXISTS public.get_imovel_matches(uuid);

-- Recreate function: fetch all matches using LEFT JOINs and robust data mapping, without arbitrary status/score filters
CREATE OR REPLACE FUNCTION public.get_imovel_matches(p_imovel_id uuid)
RETURNS TABLE (
    imovel_id uuid,
    demanda_id uuid,
    tipo text,
    cliente_nome character varying,
    bairros text[],
    budget numeric,
    orcamento numeric,
    specs text,
    score integer,
    compatibilidade_pct integer,
    match_status text,
    motivo text
) AS $BODY$
BEGIN
    RETURN QUERY
    SELECT 
        m.imovel_id,
        m.demanda_id,
        m.demanda_tipo AS tipo,
        COALESCE(dl.cliente_nome, dv.cliente_nome) AS cliente_nome,
        COALESCE(dl.bairros, dv.bairros) AS bairros,
        COALESCE(dl.valor_maximo, dv.valor_maximo) AS budget,
        COALESCE(dl.valor_maximo, dv.valor_maximo) AS orcamento,
        COALESCE(
            COALESCE(dl.dormitorios, 0) || ' dorms, ' || COALESCE(dl.vagas_estacionamento, 0) || ' vagas',
            COALESCE(dv.dormitorios, 0) || ' dorms, ' || COALESCE(dv.vagas_estacionamento, 0) || ' vagas'
        ) AS specs,
        m.score AS score,
        m.score AS compatibilidade_pct,
        CASE 
            WHEN m.score >= 70 THEN 'alto'
            WHEN m.score >= 50 THEN 'medio'
            ELSE 'baixo'
        END AS match_status,
        'Match detectado pelo sistema'::text AS motivo
    FROM public.matches_sugestoes m
    LEFT JOIN public.demandas_locacao dl ON m.demanda_id = dl.id AND m.demanda_tipo = 'Locação'
    LEFT JOIN public.demandas_vendas dv ON m.demanda_id = dv.id AND m.demanda_tipo = 'Venda'
    WHERE m.imovel_id = p_imovel_id
      AND (dl.id IS NOT NULL OR dv.id IS NOT NULL);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;
