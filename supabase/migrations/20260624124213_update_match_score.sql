-- Replaces calculate_imovel_demand_match logic to be dynamic and score-based

CREATE OR REPLACE FUNCTION public.calculate_imovel_demand_match(
    p_imovel_id uuid,
    p_demanda_id uuid,
    p_tipo_demanda text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_imovel record;
    v_demanda record;
    v_score integer := 100;
    v_has_bairro_match boolean := false;
    v_imovel_bairros_str text;
    v_bairro text;
    v_preco_comparar numeric := 0;
    v_cliente_max_budget numeric := 0;
    v_cliente_min_budget numeric := 0;
    
    v_penalty_bairro_applied integer := 0;
    v_penalty_vagas_applied integer := 0;
    v_penalty_preco_applied integer := 0;
    v_penalty_dorms_applied integer := 0;
    v_penalty_tipo_applied integer := 0;

    v_details jsonb := '{}'::jsonb;
BEGIN
    SELECT * INTO v_imovel
    FROM public.imoveis_captados
    WHERE id = p_imovel_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('compatibilidade_pct', 0, 'error', 'Imovel not found');
    END IF;

    IF p_tipo_demanda = 'Locação' THEN
        SELECT * INTO v_demanda
        FROM public.demandas_locacao
        WHERE id = p_demanda_id;
    ELSE
        SELECT * INTO v_demanda
        FROM public.demandas_vendas
        WHERE id = p_demanda_id;
    END IF;

    IF v_demanda IS NULL THEN
        RETURN jsonb_build_object('compatibilidade_pct', 0, 'error', 'Demanda not found');
    END IF;

    -- Bairro Penalty (-25%)
    v_imovel_bairros_str := lower(coalesce(v_imovel.localizacao_texto, '') || ' ' || coalesce(v_imovel.endereco, ''));
    
    IF v_demanda.bairros IS NOT NULL AND array_length(v_demanda.bairros, 1) > 0 THEN
        FOREACH v_bairro IN ARRAY v_demanda.bairros
        LOOP
            IF v_imovel_bairros_str LIKE '%' || lower(v_bairro) || '%' THEN
                v_has_bairro_match := true;
                EXIT;
            END IF;
        END LOOP;
        
        IF NOT v_has_bairro_match THEN
            v_penalty_bairro_applied := 25;
            v_score := v_score - v_penalty_bairro_applied;
            v_details := jsonb_set(v_details, '{location_match}', 'false'::jsonb);
        ELSE
            v_details := jsonb_set(v_details, '{location_match}', 'true'::jsonb);
        END IF;
    ELSE
        v_details := jsonb_set(v_details, '{location_match}', 'true'::jsonb);
    END IF;
    
    -- Vagas Penalty (-15%)
    IF coalesce(v_demanda.vagas_estacionamento, coalesce(v_demanda.vagas, 0)) > 0 AND coalesce(v_imovel.vagas, 0) < coalesce(v_demanda.vagas_estacionamento, coalesce(v_demanda.vagas, 0)) THEN
        v_penalty_vagas_applied := 15;
        v_score := v_score - v_penalty_vagas_applied;
        v_details := jsonb_set(v_details, '{parking_match}', 'false'::jsonb);
    ELSE
        v_details := jsonb_set(v_details, '{parking_match}', 'true'::jsonb);
    END IF;
    
    -- Preco Penalty (up to -30%)
    v_cliente_max_budget := coalesce(v_demanda.valor_maximo, coalesce(v_demanda.orcamento_max, 0));
    v_cliente_min_budget := coalesce(v_demanda.valor_minimo, 0);
    
    IF v_cliente_max_budget > 0 THEN
        IF v_cliente_max_budget > 50000 AND coalesce(v_imovel.preco, 0) > 0 THEN
            v_preco_comparar := v_imovel.preco;
        ELSIF v_cliente_max_budget <= 50000 AND coalesce(v_imovel.valor, 0) > 0 THEN
            v_preco_comparar := v_imovel.valor;
        ELSE
            IF coalesce(v_imovel.preco, 0) > 0 THEN
                v_preco_comparar := v_imovel.preco;
            ELSE
                v_preco_comparar := coalesce(v_imovel.valor, 0);
            END IF;
        END IF;

        IF v_preco_comparar > 0 THEN
            IF v_preco_comparar > v_cliente_max_budget * 1.2 THEN
                v_penalty_preco_applied := 30;
                v_score := v_score - v_penalty_preco_applied;
                v_details := jsonb_set(v_details, '{price_match}', 'false'::jsonb);
            ELSIF v_preco_comparar > v_cliente_max_budget THEN
                v_penalty_preco_applied := 20;
                v_score := v_score - v_penalty_preco_applied;
                v_details := jsonb_set(v_details, '{price_match}', 'false'::jsonb);
            ELSIF v_cliente_min_budget > 0 AND v_preco_comparar < v_cliente_min_budget THEN
                v_penalty_preco_applied := 10;
                v_score := v_score - v_penalty_preco_applied;
                v_details := jsonb_set(v_details, '{price_match}', 'false'::jsonb);
            ELSE
                v_details := jsonb_set(v_details, '{price_match}', 'true'::jsonb);
            END IF;
        ELSE
             v_details := jsonb_set(v_details, '{price_match}', 'true'::jsonb);
        END IF;
    ELSE
        v_details := jsonb_set(v_details, '{price_match}', 'true'::jsonb);
    END IF;
    
    -- Dormitorios Penalty (-15%)
    IF coalesce(v_demanda.dormitorios, coalesce(v_demanda.quartos, 0)) > 0 AND coalesce(v_imovel.dormitorios, 0) < coalesce(v_demanda.dormitorios, coalesce(v_demanda.quartos, 0)) THEN
        v_penalty_dorms_applied := 15;
        v_score := v_score - v_penalty_dorms_applied;
        v_details := jsonb_set(v_details, '{rooms_match}', 'false'::jsonb);
    ELSE
        v_details := jsonb_set(v_details, '{rooms_match}', 'true'::jsonb);
    END IF;
    
    -- Tipo Imovel Penalty (-10%)
    IF v_imovel.tipo_imovel IS NOT NULL AND v_demanda.tipo_imovel IS NOT NULL THEN
        IF lower(trim(v_imovel.tipo_imovel)) != lower(trim(v_demanda.tipo_imovel)) THEN
            v_penalty_tipo_applied := 10;
            v_score := v_score - v_penalty_tipo_applied;
            v_details := jsonb_set(v_details, '{tipology_match}', 'false'::jsonb);
        ELSE
            v_details := jsonb_set(v_details, '{tipology_match}', 'true'::jsonb);
        END IF;
    ELSE
         v_details := jsonb_set(v_details, '{tipology_match}', 'true'::jsonb);
    END IF;
    
    IF v_score < 0 THEN
        v_score := 0;
    END IF;
    IF v_score > 100 THEN
        v_score := 100;
    END IF;

    RAISE NOTICE 'Match Calculation - Imovel: %, Demanda: % - Base: 100, Penalties: Bairro (-%), Vagas (-%), Preco (-%), Dorms (-%), Tipo (-%) = Final Score: %',
        p_imovel_id, p_demanda_id, v_penalty_bairro_applied, v_penalty_vagas_applied, v_penalty_preco_applied, v_penalty_dorms_applied, v_penalty_tipo_applied, v_score;

    RETURN jsonb_build_object(
        'compatibilidade_pct', v_score,
        'details', v_details
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error calculating match: %', SQLERRM;
        RETURN jsonb_build_object('compatibilidade_pct', 0, 'error', SQLERRM);
END;
$function$;

-- Update trigger functions to properly use the return of calculate_imovel_demand_match
CREATE OR REPLACE FUNCTION public.trg_generate_matches_imovel() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    dem record;
    match_result jsonb;
    v_score integer;
BEGIN
    -- For locação
    FOR dem IN SELECT id FROM public.demandas_locacao WHERE status_demanda IN ('aberta', 'em busca')
    LOOP
        match_result := public.calculate_imovel_demand_match(NEW.id, dem.id, 'Locação');
        v_score := (match_result->>'compatibilidade_pct')::integer;
        IF v_score > 0 THEN
            INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
            VALUES (NEW.id, dem.id, 'Locação', v_score, 'pendente')
            ON CONFLICT (imovel_id, demanda_id, demanda_tipo) 
            DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
        END IF;
    END LOOP;

    -- For vendas
    FOR dem IN SELECT id FROM public.demandas_vendas WHERE status_demanda IN ('aberta', 'em busca')
    LOOP
        match_result := public.calculate_imovel_demand_match(NEW.id, dem.id, 'Venda');
        v_score := (match_result->>'compatibilidade_pct')::integer;
        IF v_score > 0 THEN
            INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
            VALUES (NEW.id, dem.id, 'Venda', v_score, 'pendente')
            ON CONFLICT (imovel_id, demanda_id, demanda_tipo) 
            DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
        END IF;
    END LOOP;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_generate_matches_locacao() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    imov record;
    match_result jsonb;
    v_score integer;
BEGIN
    FOR imov IN SELECT id FROM public.imoveis_captados 
    LOOP
        match_result := public.calculate_imovel_demand_match(imov.id, NEW.id, 'Locação');
        v_score := (match_result->>'compatibilidade_pct')::integer;
        IF v_score > 0 THEN
            INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
            VALUES (imov.id, NEW.id, 'Locação', v_score, 'pendente')
            ON CONFLICT (imovel_id, demanda_id, demanda_tipo) 
            DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
        END IF;
    END LOOP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_generate_matches_venda() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    imov record;
    match_result jsonb;
    v_score integer;
BEGIN
    FOR imov IN SELECT id FROM public.imoveis_captados 
    LOOP
        match_result := public.calculate_imovel_demand_match(imov.id, NEW.id, 'Venda');
        v_score := (match_result->>'compatibilidade_pct')::integer;
        IF v_score > 0 THEN
            INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
            VALUES (imov.id, NEW.id, 'Venda', v_score, 'pendente')
            ON CONFLICT (imovel_id, demanda_id, demanda_tipo) 
            DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
        END IF;
    END LOOP;
    RETURN NEW;
END;
$function$;
