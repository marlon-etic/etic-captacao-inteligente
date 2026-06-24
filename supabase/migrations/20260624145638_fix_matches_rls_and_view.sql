DO $do$
BEGIN
    -- Enable RLS on core matching and property tables
    ALTER TABLE public.matches_sugestoes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.imovel_demand_match ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.imoveis_captados ENABLE ROW LEVEL SECURITY;

    -- Drop existing SELECT policies to ensure idempotency
    DROP POLICY IF EXISTS "authenticated_select_matches_sugestoes" ON public.matches_sugestoes;
    DROP POLICY IF EXISTS "authenticated_select_imovel_demand_match" ON public.imovel_demand_match;
    DROP POLICY IF EXISTS "authenticated_select_imoveis_captados" ON public.imoveis_captados;

    -- Create robust SELECT policies for authenticated users
    CREATE POLICY "authenticated_select_matches_sugestoes" ON public.matches_sugestoes 
        FOR SELECT TO authenticated USING (true);
        
    CREATE POLICY "authenticated_select_imovel_demand_match" ON public.imovel_demand_match 
        FOR SELECT TO authenticated USING (true);
        
    CREATE POLICY "authenticated_select_imoveis_captados" ON public.imoveis_captados 
        FOR SELECT TO authenticated USING (true);
END
$do$;

-- Recreate or create the vw_match_summary view mapped to the frontend integration requirements
CREATE OR REPLACE VIEW public.vw_match_summary AS
SELECT 
    m.id,
    m.imovel_id AS professional_id,
    COALESCE(i.endereco, i.localizacao_texto, u.nome, 'Sem nome') AS name,
    LEAST(GREATEST(m.score, 0), 100) AS score,
    i.localizacao_texto AS distance,
    i.tipo_imovel AS specialty,
    CASE 
        WHEN i.fotos IS NOT NULL AND array_length(i.fotos, 1) > 0 THEN i.fotos[1]
        ELSE NULL 
    END AS avatar_url,
    m.demanda_id,
    m.demanda_tipo,
    m.status,
    i.user_captador_id
FROM public.matches_sugestoes m
JOIN public.imoveis_captados i ON m.imovel_id = i.id
LEFT JOIN public.users u ON i.user_captador_id = u.id;

-- Ensure proper access grants to the view
GRANT SELECT ON public.vw_match_summary TO authenticated;
GRANT SELECT ON public.vw_match_summary TO anon;
GRANT SELECT ON public.vw_match_summary TO service_role;

-- Ensure get_imovel_matches function retrieves integrated and corrected calculated score
CREATE OR REPLACE FUNCTION public.get_imovel_matches(p_imovel_id UUID)
RETURNS TABLE (
    demanda_id UUID,
    tipo TEXT,
    cliente_nome TEXT,
    budget NUMERIC,
    bairros TEXT[],
    specs TEXT,
    match_status TEXT,
    compatibilidade_pct NUMERIC,
    motivo TEXT
) AS $func$
BEGIN
    RETURN QUERY
    SELECT 
        m.demanda_id,
        m.demanda_tipo AS tipo,
        COALESCE(dl.cliente_nome, dv.cliente_nome, dl.nome_cliente, dv.nome_cliente, 'Cliente') AS cliente_nome,
        COALESCE(dl.orcamento_max, dv.orcamento_max, dl.valor_maximo, dv.valor_maximo, 0) AS budget,
        COALESCE(dl.bairros, dv.bairros, dl.localizacoes, dv.localizacoes, ARRAY[]::TEXT[]) AS bairros,
        'Dormitórios: ' || COALESCE(dl.dormitorios, dv.dormitorios, dl.quartos, dv.quartos, 0)::TEXT || 
        ', Vagas: ' || COALESCE(dl.vagas, dv.vagas, dl.vagas_estacionamento, dv.vagas_estacionamento, 0)::TEXT AS specs,
        m.status AS match_status,
        LEAST(GREATEST(m.score, 0), 100)::NUMERIC AS compatibilidade_pct,
        'Match Inteligente'::TEXT AS motivo
    FROM public.matches_sugestoes m
    LEFT JOIN public.demandas_locacao dl ON m.demanda_id = dl.id AND m.demanda_tipo IN ('Locação', 'Aluguel')
    LEFT JOIN public.demandas_vendas dv ON m.demanda_id = dv.id AND m.demanda_tipo = 'Venda'
    WHERE m.imovel_id = p_imovel_id;
END;
$func$ LANGUAGE plpgsql SECURITY INVOKER;

-- Expose function via RLS context
GRANT EXECUTE ON FUNCTION public.get_imovel_matches(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_imovel_matches(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_imovel_matches(UUID) TO service_role;

-- Safe insertion of seed data to ensure at least one match visualization if currently empty state
DO $seed$
DECLARE
    v_demanda_id UUID;
    v_imovel_id UUID;
BEGIN
    SELECT id INTO v_imovel_id FROM public.imoveis_captados LIMIT 1;
    SELECT id INTO v_demanda_id FROM public.demandas_locacao LIMIT 1;
    
    IF v_imovel_id IS NOT NULL AND v_demanda_id IS NOT NULL THEN
        INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
        VALUES (v_imovel_id, v_demanda_id, 'Locação', 85, 'pendente')
        ON CONFLICT DO NOTHING;
    END IF;
END
$seed$;
