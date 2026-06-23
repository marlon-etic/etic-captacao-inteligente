DO $DO$
BEGIN
  -- Idempotent block execution to fix match calculation accuracy
END $DO$;

CREATE OR REPLACE FUNCTION public.calculate_imovel_demand_match(p_imovel_id uuid, p_demanda_id uuid, p_tipo_demanda text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_imovel RECORD;
  v_demanda RECORD;
  v_score INT := 100;
  v_details JSONB := '{}'::jsonb;
  v_preco NUMERIC;
  v_max_budget NUMERIC;
  v_min_budget NUMERIC;
  v_dormitorios INT;
  v_vagas INT;
  v_has_bairro_match BOOLEAN := false;
  v_imovel_bairros_str TEXT;
  v_demanda_bairros TEXT[];
  v_bairro TEXT;
BEGIN
  -- Get Imovel
  SELECT * INTO v_imovel FROM imoveis_captados WHERE id = p_imovel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('score', 0, 'details', '{"error": "Imovel not found"}'::jsonb);
  END IF;

  -- Get Demanda
  IF p_tipo_demanda = 'Venda' THEN
    SELECT * INTO v_demanda FROM demandas_vendas WHERE id = p_demanda_id;
  ELSE
    SELECT * INTO v_demanda FROM demandas_locacao WHERE id = p_demanda_id;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('score', 0, 'details', '{"error": "Demanda not found"}'::jsonb);
  END IF;

  -- Bairros check
  v_imovel_bairros_str := lower(COALESCE(array_to_string(v_imovel.fotos, ''), '') || ' ' || COALESCE(v_imovel.localizacao_texto, '') || ' ' || COALESCE(v_imovel.endereco, ''));
  v_demanda_bairros := COALESCE(v_demanda.bairros, v_demanda.localizacoes, '{}'::text[]);

  IF array_length(v_demanda_bairros, 1) > 0 THEN
    FOREACH v_bairro IN ARRAY v_demanda_bairros
    LOOP
      IF v_imovel_bairros_str ILIKE '%' || lower(v_bairro) || '%' THEN
        v_has_bairro_match := true;
        EXIT;
      END IF;
    END LOOP;

    IF NOT v_has_bairro_match THEN
      v_score := v_score - 25;
      v_details := jsonb_set(v_details, '{location_match}', 'false'::jsonb);
    ELSE
      v_details := jsonb_set(v_details, '{location_match}', 'true'::jsonb);
    END IF;
  ELSE
    v_details := jsonb_set(v_details, '{location_match}', 'true'::jsonb);
  END IF;

  -- Values check
  v_preco := COALESCE(NULLIF(v_imovel.preco, 0), v_imovel.valor, 0);
  v_max_budget := COALESCE(NULLIF(v_demanda.valor_maximo, 0), v_demanda.orcamento_max, 0);
  v_min_budget := COALESCE(v_demanda.valor_minimo, 0);

  IF v_max_budget > 0 AND v_preco > 0 THEN
    IF v_preco > v_max_budget * 1.2 THEN
      v_score := v_score - 30;
      v_details := jsonb_set(v_details, '{price_match}', 'false'::jsonb);
    ELSIF v_preco > v_max_budget THEN
      v_score := v_score - 20;
      v_details := jsonb_set(v_details, '{price_match}', 'false'::jsonb);
    ELSIF v_min_budget > 0 AND v_preco < v_min_budget THEN
      v_score := v_score - 10;
      v_details := jsonb_set(v_details, '{price_match}', 'false'::jsonb);
    ELSE
      v_details := jsonb_set(v_details, '{price_match}', 'true'::jsonb);
    END IF;
  ELSE
    v_details := jsonb_set(v_details, '{price_match}', 'true'::jsonb);
  END IF;

  -- Rooms check
  v_dormitorios := COALESCE(NULLIF(v_demanda.dormitorios, 0), v_demanda.quartos, 0);
  IF v_dormitorios > 0 AND COALESCE(v_imovel.dormitorios, 0) < v_dormitorios THEN
    v_score := v_score - 15;
    v_details := jsonb_set(v_details, '{rooms_match}', 'false'::jsonb);
  ELSE
    v_details := jsonb_set(v_details, '{rooms_match}', 'true'::jsonb);
  END IF;

  -- Parking check
  v_vagas := COALESCE(NULLIF(v_demanda.vagas_estacionamento, 0), v_demanda.vagas, 0);
  IF v_vagas > 0 AND COALESCE(v_imovel.vagas, 0) < v_vagas THEN
    v_score := v_score - 15;
    v_details := jsonb_set(v_details, '{parking_match}', 'false'::jsonb);
  ELSE
    v_details := jsonb_set(v_details, '{parking_match}', 'true'::jsonb);
  END IF;

  -- Tipology match
  IF v_demanda.tipo_imovel IS NOT NULL AND v_imovel.tipo_imovel IS NOT NULL THEN
    IF lower(trim(v_demanda.tipo_imovel)) != '' AND lower(trim(v_imovel.tipo_imovel)) != '' THEN
      IF lower(trim(v_demanda.tipo_imovel)) != lower(trim(v_imovel.tipo_imovel)) THEN
        v_score := v_score - 10;
        v_details := jsonb_set(v_details, '{tipology_match}', 'false'::jsonb);
      ELSE
        v_details := jsonb_set(v_details, '{tipology_match}', 'true'::jsonb);
      END IF;
    ELSE
      v_details := jsonb_set(v_details, '{tipology_match}', 'true'::jsonb);
    END IF;
  ELSE
    v_details := jsonb_set(v_details, '{tipology_match}', 'true'::jsonb);
  END IF;

  IF v_score < 0 THEN v_score := 0; END IF;
  IF v_score > 100 THEN v_score := 100; END IF;

  RETURN jsonb_build_object('score', v_score, 'details', v_details);
END;
$function$;
