-- Update calculate_imovel_demand_match function to implement strict logic and active leads filter

DO $BODY$
BEGIN
    DROP FUNCTION IF EXISTS public.calculate_imovel_demand_match(uuid, uuid, text);
END;
$BODY$;

CREATE OR REPLACE FUNCTION public.calculate_imovel_demand_match(
    p_imovel_id uuid,
    p_demanda_id uuid,
    p_tipo_demanda text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_imovel record;
    v_demanda record;
    v_score integer := 100;
    v_details jsonb;
    v_preco_comparar numeric;
    v_bairro_match boolean := true;
    v_price_match boolean := true;
    v_rooms_match boolean := true;
    v_parking_match boolean := true;
    v_tipology_match boolean := true;
    v_bairros_imovel text;
    v_bairros_demanda text[];
    v_bairro text;
    v_tipo_imovel_demanda text[];
    v_i_tipo text;
    v_status text;
BEGIN
    -- Fetch Imovel
    SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Fetch Demanda
    IF p_tipo_demanda = 'Venda' THEN
        SELECT * INTO v_demanda FROM public.demandas_vendas WHERE id = p_demanda_id;
    ELSE
        SELECT * INTO v_demanda FROM public.demandas_locacao WHERE id = p_demanda_id;
    END IF;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Filter out inactive demands
    v_status := COALESCE(v_demanda.status_demanda, '');
    IF lower(v_status) IN ('perdida', 'fechada', 'cancelada', 'inativa', 'concluída') THEN
        RETURN NULL;
    END IF;

    -- 1. Bairros Match (-25%)
    v_bairros_imovel := lower(
        array_to_string(v_imovel.fotos, ', ') || ' ' || 
        COALESCE(v_imovel.localizacao_texto, '') || ' ' ||
        COALESCE(v_imovel.endereco, '')
    );
    
    v_bairros_demanda := COALESCE(v_demanda.bairros, v_demanda.localizacoes, ARRAY[]::text[]);
    
    IF array_length(v_bairros_demanda, 1) > 0 THEN
        v_bairro_match := false;
        FOREACH v_bairro IN ARRAY v_bairros_demanda
        LOOP
            IF v_bairros_imovel LIKE '%' || lower(v_bairro) || '%' THEN
                v_bairro_match := true;
                EXIT;
            END IF;
        END LOOP;
        
        IF NOT v_bairro_match THEN
            v_score := v_score - 25;
        END IF;
    END IF;

    -- 2. Parking (Vagas) Match (-15%)
    IF COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas, 0) > 0 AND COALESCE(v_imovel.vagas, 0) < COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas, 0) THEN
        v_score := v_score - 15;
        v_parking_match := false;
    END IF;

    -- 3. Price Match (-30%, -20%, -10%)
    v_preco_comparar := COALESCE(v_imovel.preco, v_imovel.valor, 0);
    IF COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) > 0 THEN
        IF v_preco_comparar > COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) * 1.2 THEN
            v_score := v_score - 30;
            v_price_match := false;
        ELSIF v_preco_comparar > COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) THEN
            v_score := v_score - 20;
            v_price_match := false;
        ELSIF COALESCE(v_demanda.valor_minimo, 0) > 0 AND v_preco_comparar < COALESCE(v_demanda.valor_minimo, 0) THEN
            v_score := v_score - 10;
            v_price_match := false;
        END IF;
    END IF;

    -- 4. Rooms Match (-15%)
    IF COALESCE(v_demanda.dormitorios, v_demanda.quartos, 0) > 0 AND COALESCE(v_imovel.dormitorios, 0) < COALESCE(v_demanda.dormitorios, v_demanda.quartos, 0) THEN
        v_score := v_score - 15;
        v_rooms_match := false;
    END IF;

    -- 5. Property Type Match (-10%)
    v_i_tipo := lower(trim(COALESCE(v_imovel.tipo_imovel, '')));
    IF v_demanda.tipo_imovel IS NOT NULL AND v_demanda.tipo_imovel != '' THEN
        IF lower(trim(v_demanda.tipo_imovel)) != v_i_tipo THEN
            v_score := v_score - 10;
            v_tipology_match := false;
        END IF;
    END IF;

    IF v_score < 0 THEN
        v_score := 0;
    END IF;

    v_details := jsonb_build_object(
        'location_match', v_bairro_match,
        'price_match', v_price_match,
        'rooms_match', v_rooms_match,
        'parking_match', v_parking_match,
        'tipology_match', v_tipology_match
    );

    RETURN jsonb_build_object('score', v_score, 'details', v_details);
END;
$function$;

-- Ensure Marlon has full access via RLS
DO $BODY$
BEGIN
    DROP POLICY IF EXISTS "marlon_admin_access_matches" ON public.matches_sugestoes;
    CREATE POLICY "marlon_admin_access_matches" ON public.matches_sugestoes
    FOR ALL TO authenticated USING (
        auth.jwt()->>'email' = 'marlon@eticimoveis.com.br'
    );

    DROP POLICY IF EXISTS "marlon_admin_access_imovel_demand" ON public.imovel_demand_match;
    CREATE POLICY "marlon_admin_access_imovel_demand" ON public.imovel_demand_match
    FOR ALL TO authenticated USING (
        auth.jwt()->>'email' = 'marlon@eticimoveis.com.br'
    );
END;
$BODY$;

-- Seed admin user
DO $BODY$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'marlon@eticimoveis.com.br',
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon Moro", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (new_user_id, 'marlon@eticimoveis.com.br', 'Marlon Moro', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $BODY$;
