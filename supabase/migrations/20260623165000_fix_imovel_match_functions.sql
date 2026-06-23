-- Drop to avoid 42P13 return type conflicts and ensure clean state
DROP FUNCTION IF EXISTS public.get_imovel_matches(uuid);
DROP FUNCTION IF EXISTS public.calculate_imovel_demand_match(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_quick_matches(text, numeric, integer, integer, text, text);

CREATE OR REPLACE FUNCTION public.calculate_imovel_demand_match(
  p_imovel_id uuid,
  p_demanda_id uuid,
  p_tipo_demanda text
) RETURNS jsonb AS $func$
DECLARE
  v_imovel record;
  v_demanda record;
  v_score integer := 100;
  v_details jsonb := '{}'::jsonb;
  v_location_match boolean := true;
  v_price_match boolean := true;
  v_rooms_match boolean := true;
  v_parking_match boolean := true;
  v_tipology_match boolean := true;
  v_bairro_match boolean := false;
  v_bairro text;
  v_imovel_bairros_str text;
  v_preco numeric;
BEGIN
  SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('score', 0, 'details', v_details);
  END IF;

  IF p_tipo_demanda = 'Locação' THEN
    SELECT * INTO v_demanda FROM public.demandas_locacao WHERE id = p_demanda_id;
  ELSE
    SELECT * INTO v_demanda FROM public.demandas_vendas WHERE id = p_demanda_id;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('score', 0, 'details', v_details);
  END IF;

  -- 1. Bairro Penalty (-25%)
  v_imovel_bairros_str := lower(COALESCE(v_imovel.endereco, '') || ' ' || COALESCE(v_imovel.localizacao_texto, ''));
  IF v_demanda.bairros IS NOT NULL AND array_length(v_demanda.bairros, 1) > 0 THEN
    FOREACH v_bairro IN ARRAY v_demanda.bairros LOOP
      IF v_imovel_bairros_str LIKE '%' || lower(v_bairro) || '%' THEN
        v_bairro_match := true;
        EXIT;
      END IF;
    END LOOP;
    IF NOT v_bairro_match THEN
      v_score := v_score - 25;
      v_location_match := false;
    END IF;
  END IF;

  -- 2. Vagas Penalty (-15%)
  IF COALESCE(v_demanda.vagas_estacionamento, 0) > 0 AND COALESCE(v_imovel.vagas, 0) < v_demanda.vagas_estacionamento THEN
    v_score := v_score - 15;
    v_parking_match := false;
  END IF;

  -- 3. Preço Penalty (-20% / -30%)
  v_preco := COALESCE(v_imovel.preco, v_imovel.valor, 0);
  IF v_preco > 0 AND COALESCE(v_demanda.valor_maximo, 0) > 0 THEN
    IF v_preco > (v_demanda.valor_maximo * 1.2) THEN
      v_score := v_score - 30;
      v_price_match := false;
    ELSIF v_preco > v_demanda.valor_maximo THEN
      v_score := v_score - 20;
      v_price_match := false;
    END IF;
  END IF;

  -- 4. Dormitorios penalty (-15%)
  IF COALESCE(v_demanda.dormitorios, 0) > 0 AND COALESCE(v_imovel.dormitorios, 0) < v_demanda.dormitorios THEN
    v_score := v_score - 15;
    v_rooms_match := false;
  END IF;

  -- 5. Tipology match (-10%)
  IF v_imovel.tipo_imovel IS NOT NULL AND v_demanda.tipo_imovel IS NOT NULL THEN
    IF lower(trim(v_imovel.tipo_imovel)) != lower(trim(v_demanda.tipo_imovel)) THEN
      v_score := v_score - 10;
      v_tipology_match := false;
    END IF;
  END IF;

  v_score := GREATEST(0, v_score);

  v_details := jsonb_build_object(
    'location_match', v_location_match,
    'price_match', v_price_match,
    'rooms_match', v_rooms_match,
    'parking_match', v_parking_match,
    'tipology_match', v_tipology_match
  );

  RETURN jsonb_build_object('score', v_score, 'details', v_details);
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_imovel_matches(p_imovel_id uuid)
RETURNS TABLE (
  demanda_id uuid,
  cliente_nome varchar,
  budget numeric,
  bairros text[],
  tipo text,
  match_status text,
  compatibilidade_pct numeric,
  motivo text,
  specs text
) AS $func$
DECLARE
  v_imovel record;
BEGIN
  SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_imovel.tipo IN ('Venda', 'Ambos') THEN
    RETURN QUERY
    SELECT 
      d.id as demanda_id,
      d.nome_cliente as cliente_nome,
      d.valor_maximo as budget,
      d.bairros,
      'Venda' as tipo,
      'Pendente' as match_status,
      (public.calculate_imovel_demand_match(p_imovel_id, d.id, 'Venda')->>'score')::numeric as compatibilidade_pct,
      '' as motivo,
      CONCAT(d.dormitorios, ' dorms, ', d.vagas_estacionamento, ' vagas, ', d.tipo_imovel) as specs
    FROM public.demandas_vendas d
    WHERE d.status_demanda IN ('aberta', 'em_andamento')
      AND (public.calculate_imovel_demand_match(p_imovel_id, d.id, 'Venda')->>'score')::numeric >= 60;
  END IF;

  IF v_imovel.tipo IN ('Locação', 'Ambos') THEN
    RETURN QUERY
    SELECT 
      d.id as demanda_id,
      d.nome_cliente as cliente_nome,
      d.valor_maximo as budget,
      d.bairros,
      'Locação' as tipo,
      'Pendente' as match_status,
      (public.calculate_imovel_demand_match(p_imovel_id, d.id, 'Locação')->>'score')::numeric as compatibilidade_pct,
      '' as motivo,
      CONCAT(d.dormitorios, ' dorms, ', d.vagas_estacionamento, ' vagas, ', d.tipo_imovel) as specs
    FROM public.demandas_locacao d
    WHERE d.status_demanda IN ('aberta', 'em_andamento')
      AND (public.calculate_imovel_demand_match(p_imovel_id, d.id, 'Locação')->>'score')::numeric >= 60;
  END IF;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_quick_matches(
  p_endereco text,
  p_preco numeric,
  p_dormitorios integer,
  p_vagas integer,
  p_tipo text,
  p_tipo_imovel text
)
RETURNS TABLE (
  id uuid,
  nome varchar
) AS $func$
DECLARE
  v_score integer;
  v_demanda record;
  v_imovel_bairros_str text;
  v_bairro text;
  v_bairro_match boolean;
BEGIN
  v_imovel_bairros_str := lower(COALESCE(p_endereco, ''));

  IF p_tipo IN ('Venda', 'Ambos') THEN
    FOR v_demanda IN SELECT * FROM public.demandas_vendas WHERE status_demanda IN ('aberta', 'em_andamento') LOOP
      v_score := 100;
      
      IF v_demanda.bairros IS NOT NULL AND array_length(v_demanda.bairros, 1) > 0 THEN
        v_bairro_match := false;
        FOREACH v_bairro IN ARRAY v_demanda.bairros LOOP
          IF v_imovel_bairros_str LIKE '%' || lower(v_bairro) || '%' THEN
            v_bairro_match := true;
            EXIT;
          END IF;
        END LOOP;
        IF NOT v_bairro_match THEN
          v_score := v_score - 25;
        END IF;
      END IF;

      IF COALESCE(v_demanda.vagas_estacionamento, 0) > 0 AND COALESCE(p_vagas, 0) < v_demanda.vagas_estacionamento THEN
        v_score := v_score - 15;
      END IF;

      IF COALESCE(p_preco, 0) > 0 AND COALESCE(v_demanda.valor_maximo, 0) > 0 THEN
        IF p_preco > (v_demanda.valor_maximo * 1.2) THEN
          v_score := v_score - 30;
        ELSIF p_preco > v_demanda.valor_maximo THEN
          v_score := v_score - 20;
        END IF;
      END IF;

      IF COALESCE(v_demanda.dormitorios, 0) > 0 AND COALESCE(p_dormitorios, 0) < v_demanda.dormitorios THEN
        v_score := v_score - 15;
      END IF;

      IF p_tipo_imovel IS NOT NULL AND p_tipo_imovel != '' AND v_demanda.tipo_imovel IS NOT NULL THEN
        IF lower(trim(p_tipo_imovel)) != lower(trim(v_demanda.tipo_imovel)) THEN
          v_score := v_score - 10;
        END IF;
      END IF;

      IF v_score >= 60 THEN
        id := v_demanda.id;
        nome := v_demanda.nome_cliente;
        RETURN NEXT;
      END IF;
    END LOOP;
  END IF;

  IF p_tipo IN ('Locação', 'Ambos') THEN
    FOR v_demanda IN SELECT * FROM public.demandas_locacao WHERE status_demanda IN ('aberta', 'em_andamento') LOOP
      v_score := 100;
      
      IF v_demanda.bairros IS NOT NULL AND array_length(v_demanda.bairros, 1) > 0 THEN
        v_bairro_match := false;
        FOREACH v_bairro IN ARRAY v_demanda.bairros LOOP
          IF v_imovel_bairros_str LIKE '%' || lower(v_bairro) || '%' THEN
            v_bairro_match := true;
            EXIT;
          END IF;
        END LOOP;
        IF NOT v_bairro_match THEN
          v_score := v_score - 25;
        END IF;
      END IF;

      IF COALESCE(v_demanda.vagas_estacionamento, 0) > 0 AND COALESCE(p_vagas, 0) < v_demanda.vagas_estacionamento THEN
        v_score := v_score - 15;
      END IF;

      IF COALESCE(p_preco, 0) > 0 AND COALESCE(v_demanda.valor_maximo, 0) > 0 THEN
        IF p_preco > (v_demanda.valor_maximo * 1.2) THEN
          v_score := v_score - 30;
        ELSIF p_preco > v_demanda.valor_maximo THEN
          v_score := v_score - 20;
        END IF;
      END IF;

      IF COALESCE(v_demanda.dormitorios, 0) > 0 AND COALESCE(p_dormitorios, 0) < v_demanda.dormitorios THEN
        v_score := v_score - 15;
      END IF;

      IF p_tipo_imovel IS NOT NULL AND p_tipo_imovel != '' AND v_demanda.tipo_imovel IS NOT NULL THEN
        IF lower(trim(p_tipo_imovel)) != lower(trim(v_demanda.tipo_imovel)) THEN
          v_score := v_score - 10;
        END IF;
      END IF;

      IF v_score >= 60 THEN
        id := v_demanda.id;
        nome := v_demanda.nome_cliente;
        RETURN NEXT;
      END IF;
    END LOOP;
  END IF;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
