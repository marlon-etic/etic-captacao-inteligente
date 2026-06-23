DO $DO$
BEGIN

-- Update calculate_imovel_demand_match to apply the new 25% and 15% penalties
CREATE OR REPLACE FUNCTION public.calculate_imovel_demand_match(
    p_imovel_id uuid,
    p_demanda_id uuid,
    p_tipo_demanda text
) RETURNS jsonb AS $$
DECLARE
    v_imovel record;
    v_demanda record;
    v_score integer := 100;
    v_has_bairro_match boolean := false;
    v_bairro text;
BEGIN
    -- Get Imovel
    SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
    IF NOT FOUND THEN RETURN '{"score": 0, "details": {}}'::jsonb; END IF;

    -- Get Demanda
    IF p_tipo_demanda = 'Locação' OR p_tipo_demanda = 'Aluguel' THEN
        SELECT * INTO v_demanda FROM public.demandas_locacao WHERE id = p_demanda_id;
    ELSE
        SELECT * INTO v_demanda FROM public.demandas_vendas WHERE id = p_demanda_id;
    END IF;
    IF v_demanda IS NULL THEN RETURN '{"score": 0, "details": {}}'::jsonb; END IF;

    -- Bairro Penalty (-25%)
    IF array_length(v_demanda.bairros, 1) > 0 THEN
        FOREACH v_bairro IN ARRAY v_demanda.bairros
        LOOP
            IF v_imovel.endereco ILIKE '%' || v_bairro || '%' OR v_imovel.localizacao_texto ILIKE '%' || v_bairro || '%' THEN
                v_has_bairro_match := true;
                EXIT;
            END IF;
        END LOOP;

        IF NOT v_has_bairro_match THEN
            v_score := v_score - 25;
        END IF;
    END IF;

    -- Vagas Penalty (-15%)
    IF COALESCE(v_demanda.vagas_estacionamento, 0) > 0 AND COALESCE(v_imovel.vagas, 0) < v_demanda.vagas_estacionamento THEN
        v_score := v_score - 15;
    END IF;

    -- Dormitorios Penalty (-15%)
    IF COALESCE(v_demanda.dormitorios, 0) > 0 AND COALESCE(v_imovel.dormitorios, 0) < v_demanda.dormitorios THEN
        v_score := v_score - 15;
    END IF;

    -- Preco Penalty
    IF COALESCE(v_imovel.preco, 0) > 0 AND COALESCE(v_demanda.valor_maximo, 0) > 0 THEN
        IF v_imovel.preco > (v_demanda.valor_maximo * 1.2) THEN
            v_score := v_score - 30;
        ELSIF v_imovel.preco > v_demanda.valor_maximo THEN
            v_score := v_score - 20;
        END IF;
    END IF;

    -- Ensure score is within bounds
    IF v_score < 0 THEN v_score := 0; END IF;
    IF v_score > 100 THEN v_score := 100; END IF;

    RETURN jsonb_build_object(
        'score', v_score,
        'details', jsonb_build_object(
            'bairro_match', v_has_bairro_match,
            'vagas_match', COALESCE(v_imovel.vagas, 0) >= COALESCE(v_demanda.vagas_estacionamento, 0)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update get_imovel_matches to mirror the 60% threshold and return exactly what is required
CREATE OR REPLACE FUNCTION public.get_imovel_matches(p_imovel_id uuid)
RETURNS TABLE(
    demanda_id uuid,
    tipo text,
    cliente_nome character varying,
    bairros text[],
    budget numeric,
    specs text,
    compatibilidade_pct numeric,
    match_status text,
    motivo text
) AS $$
DECLARE
    v_imovel record;
BEGIN
    SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
    IF NOT FOUND THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        d.id as demanda_id,
        d.tipo_demanda as tipo,
        d.nome_cliente as cliente_nome,
        d.bairros,
        d.valor_maximo as budget,
        'Dorms: ' || COALESCE(d.dormitorios::text, '-') || ' | Vagas: ' || COALESCE(d.vagas_estacionamento::text, '-') as specs,
        (calculate_imovel_demand_match(p_imovel_id, d.id, d.tipo_demanda)->>'score')::numeric as compatibilidade_pct,
        'match_potencial' as match_status,
        'Compatibilidade via motor inteligente' as motivo
    FROM public.demandas_locacao d
    WHERE d.status_demanda IN ('aberta', 'em_andamento')
      AND (v_imovel.tipo = 'Ambos' OR v_imovel.tipo = 'Locação')
      AND (calculate_imovel_demand_match(p_imovel_id, d.id, d.tipo_demanda)->>'score')::numeric >= 60

    UNION ALL

    SELECT
        d.id as demanda_id,
        'Venda' as tipo,
        d.nome_cliente as cliente_nome,
        d.bairros,
        d.valor_maximo as budget,
        'Dorms: ' || COALESCE(d.dormitorios::text, '-') || ' | Vagas: ' || COALESCE(d.vagas_estacionamento::text, '-') as specs,
        (calculate_imovel_demand_match(p_imovel_id, d.id, 'Venda')->>'score')::numeric as compatibilidade_pct,
        'match_potencial' as match_status,
        'Compatibilidade via motor inteligente' as motivo
    FROM public.demandas_vendas d
    WHERE d.status_demanda IN ('aberta', 'em_andamento')
      AND (v_imovel.tipo = 'Ambos' OR v_imovel.tipo = 'Venda')
      AND (calculate_imovel_demand_match(p_imovel_id, d.id, 'Venda')->>'score')::numeric >= 60

    ORDER BY compatibilidade_pct DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

END $DO$;
