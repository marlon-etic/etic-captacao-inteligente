DO $$
BEGIN
    DROP FUNCTION IF EXISTS calculate_imovel_demand_match(uuid, uuid, text);
END $$;

CREATE OR REPLACE FUNCTION calculate_imovel_demand_match(p_imovel_id uuid, p_demanda_id uuid, p_tipo_demanda text)
RETURNS jsonb AS $$
DECLARE
    v_imovel record;
    v_demanda record;
    v_score integer := 100;
    v_location_match boolean := true;
    v_price_match boolean := true;
    v_rooms_match boolean := true;
    v_parking_match boolean := true;
    v_tipology_match boolean := true;
    v_bairro_encontrado boolean := false;
    b text;
BEGIN
    -- Fetch property
    SELECT * INTO v_imovel FROM imoveis_captados WHERE id = p_imovel_id;
    IF NOT FOUND THEN RETURN NULL; END IF;

    -- Fetch demand based on type
    IF p_tipo_demanda IN ('Venda', 'venda') THEN
        SELECT * INTO v_demanda FROM demandas_vendas WHERE id = p_demanda_id;
    ELSIF p_tipo_demanda IN ('Locação', 'Aluguel', 'locacao', 'aluguel') THEN
        SELECT * INTO v_demanda FROM demandas_locacao WHERE id = p_demanda_id;
    ELSE
        RETURN NULL;
    END IF;

    IF NOT FOUND THEN RETURN NULL; END IF;

    -- Tipology Check
    IF v_imovel.tipo_imovel IS NOT NULL AND v_demanda.tipo_imovel IS NOT NULL THEN
        IF LOWER(v_imovel.tipo_imovel) != LOWER(v_demanda.tipo_imovel) AND NOT (LOWER(v_imovel.tipo_imovel) LIKE '%casa%' AND LOWER(v_demanda.tipo_imovel) LIKE '%casa%') THEN
            v_tipology_match := false;
            v_score := 0;
        END IF;
    END IF;

    IF v_score > 0 THEN
        -- Bairro Check
        IF v_imovel.endereco IS NOT NULL AND v_demanda.bairros IS NOT NULL AND array_length(v_demanda.bairros, 1) > 0 THEN
            v_bairro_encontrado := false;
            FOREACH b IN ARRAY v_demanda.bairros LOOP
                IF v_imovel.endereco ILIKE '%' || b || '%' THEN
                    v_bairro_encontrado := true;
                    EXIT;
                END IF;
            END LOOP;
            
            IF NOT v_bairro_encontrado THEN
                v_location_match := false;
                v_score := v_score - 25;
            END IF;
        END IF;

        -- Parking Check
        IF COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas) IS NOT NULL AND COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas) > 0 THEN
            IF COALESCE(v_imovel.vagas, 0) < COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas) THEN
                v_parking_match := false;
                v_score := v_score - 15;
            END IF;
        END IF;

        -- Rooms Check
        IF COALESCE(v_demanda.dormitorios, v_demanda.quartos) IS NOT NULL AND COALESCE(v_demanda.dormitorios, v_demanda.quartos) > 0 THEN
            IF COALESCE(v_imovel.dormitorios, 0) < COALESCE(v_demanda.dormitorios, v_demanda.quartos) THEN
                v_rooms_match := false;
                v_score := v_score - 20;
            END IF;
        END IF;

        -- Budget Check
        IF COALESCE(v_imovel.preco, v_imovel.valor) IS NOT NULL AND COALESCE(v_imovel.preco, v_imovel.valor) > 0 THEN
            IF v_demanda.valor_maximo IS NOT NULL AND v_demanda.valor_maximo > 0 AND COALESCE(v_imovel.preco, v_imovel.valor) > v_demanda.valor_maximo THEN
                v_price_match := false;
                v_score := v_score - 30;
            ELSIF v_demanda.valor_minimo IS NOT NULL AND v_demanda.valor_minimo > 0 AND COALESCE(v_imovel.preco, v_imovel.valor) < v_demanda.valor_minimo THEN
                v_price_match := false;
                v_score := v_score - 10;
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'score', GREATEST(0, v_score),
        'criterios', jsonb_build_object(
            'location_match', v_location_match,
            'price_match', v_price_match,
            'rooms_match', v_rooms_match,
            'parking_match', v_parking_match,
            'tipology_match', v_tipology_match
        )
    );
END;
$$ LANGUAGE plpgsql;
