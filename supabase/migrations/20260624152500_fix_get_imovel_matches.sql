-- Fix migration for get_imovel_matches function and RLS policies

-- 1. Drop existing function signatures to prevent return type mismatch errors
DROP FUNCTION IF EXISTS public.get_imovel_matches(uuid);
DROP FUNCTION IF EXISTS public.get_imovel_matches(text);

-- 2. Recreate the function using calculate_imovel_demand_match logic
CREATE OR REPLACE FUNCTION public.get_imovel_matches(p_imovel_id uuid)
RETURNS TABLE (
    demanda_id uuid,
    cliente_nome varchar,
    tipo text,
    bairros text[],
    budget numeric,
    specs text,
    compatibilidade_pct numeric,
    match_status text,
    motivo text
) AS $function$
DECLARE
    v_demanda RECORD;
    v_match_result JSONB;
    v_score NUMERIC;
    v_motivo TEXT;
    v_status TEXT;
BEGIN
    FOR v_demanda IN
        SELECT
            d.id,
            d.cliente_nome,
            d.tipo,
            d.bairros,
            d.valor_maximo,
            d.dormitorios,
            d.vagas
        FROM (
            SELECT id, cliente_nome, 'Locação' as tipo, bairros, valor_maximo, dormitorios, vagas_estacionamento as vagas
            FROM public.demandas_locacao
            WHERE status_demanda IN ('aberta', 'em busca')
            UNION ALL
            SELECT id, cliente_nome, 'Venda' as tipo, bairros, valor_maximo, dormitorios, vagas_estacionamento as vagas
            FROM public.demandas_vendas
            WHERE status_demanda IN ('aberta', 'em busca')
        ) d
    LOOP
        -- Calculate match dynamically using the centralized function
        v_match_result := public.calculate_imovel_demand_match(p_imovel_id, v_demanda.id, v_demanda.tipo);
        
        IF v_match_result IS NOT NULL THEN
            v_score := COALESCE((v_match_result->>'compatibilidade_pct')::NUMERIC, 0);
            v_motivo := v_match_result->>'motivo';
            
            IF v_score >= 70 THEN
                v_status := 'alto';
            ELSIF v_score >= 50 THEN
                v_status := 'medio';
            ELSE
                v_status := 'baixo';
            END IF;

            -- Only return matches with score >= 50 to maintain relevance
            IF v_score >= 50 THEN
                demanda_id := v_demanda.id;
                cliente_nome := v_demanda.cliente_nome;
                tipo := v_demanda.tipo;
                bairros := v_demanda.bairros;
                budget := v_demanda.valor_maximo;
                specs := COALESCE(v_demanda.dormitorios::text, '0') || ' dorm, ' || COALESCE(v_demanda.vagas::text, '0') || ' vagas';
                compatibilidade_pct := v_score;
                match_status := v_status;
                motivo := v_motivo;
                RETURN NEXT;
            END IF;
        END IF;
    END LOOP;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verify and fix RLS policies for match-related tables
DROP POLICY IF EXISTS "authenticated_select_matches_sugestoes" ON public.matches_sugestoes;
CREATE POLICY "authenticated_select_matches_sugestoes" ON public.matches_sugestoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_imovel_demand_match" ON public.imovel_demand_match;
CREATE POLICY "authenticated_select_imovel_demand_match" ON public.imovel_demand_match
  FOR SELECT TO authenticated USING (true);
