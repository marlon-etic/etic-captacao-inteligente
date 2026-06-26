-- View for Foco Captacao V6
DROP VIEW IF EXISTS public.vw_foco_captacao_v6 CASCADE;
CREATE OR REPLACE VIEW public.vw_foco_captacao_v6 AS
WITH unmatched_demandas AS (
    SELECT 
        d.id,
        unnest(COALESCE(d.bairros, d.localizacoes, ARRAY['Sem Bairro'])) AS bairro_alvo,
        d.tipo_demanda::text AS tipo,
        COALESCE(d.tipo_imovel, 'Residencial') AS tipo_imovel,
        COALESCE(NULLIF(d.valor_maximo, 0), d.orcamento_max) AS ticket_medio
    FROM public.demandas_locacao d
    LEFT JOIN public.imovel_demand_match m ON m.demanda_id = d.id AND m.tipo_vinculacao IN ('vinculado', 'agendado', 'fechado')
    WHERE d.status_demanda IN ('aberta', 'em busca', 'em visita') AND m.id IS NULL
    UNION ALL
    SELECT 
        d.id,
        unnest(COALESCE(d.bairros, d.localizacoes, ARRAY['Sem Bairro'])) AS bairro_alvo,
        'Venda'::text AS tipo,
        COALESCE(d.tipo_imovel, 'Residencial') AS tipo_imovel,
        COALESCE(NULLIF(d.valor_maximo, 0), d.orcamento_max) AS ticket_medio
    FROM public.demandas_vendas d
    LEFT JOIN public.imovel_demand_match m ON m.demanda_id = d.id AND m.tipo_vinculacao IN ('vinculado', 'agendado', 'fechado')
    WHERE d.status_demanda IN ('aberta', 'em busca', 'em visita') AND m.id IS NULL
)
SELECT 
    tipo,
    CASE 
        WHEN lower(tipo_imovel) IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial') THEN 'Comercial'
        ELSE 'Residencial'
    END AS tipo_imovel,
    bairro_alvo,
    COUNT(DISTINCT id) AS qtd_clientes_aguardando,
    AVG(NULLIF(ticket_medio, 0)) AS ticket_medio
FROM unmatched_demandas
GROUP BY 1, 2, 3
ORDER BY 4 DESC, 5 DESC;

-- Matchmaking Function V6
CREATE OR REPLACE FUNCTION public.fn_gerar_match_inteligente_v6(p_imovel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_imovel record;
    v_demanda record;
    v_score integer;
    v_bairro_match boolean;
    v_bairros_imovel text;
    v_bairros_demanda text[];
    v_bairro text;
    v_preco_comparar numeric;
    v_is_commercial boolean;
BEGIN
    SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Delete old pending matches for this imovel
    DELETE FROM public.matches_sugestoes WHERE imovel_id = p_imovel_id AND status = 'pendente';

    v_bairros_imovel := lower(
        array_to_string(v_imovel.fotos, ', ') || ' ' || 
        COALESCE(v_imovel.localizacao_texto, '') || ' ' ||
        COALESCE(v_imovel.endereco, '')
    );

    v_preco_comparar := COALESCE(v_imovel.preco, v_imovel.valor, 0);
    
    v_is_commercial := (lower(trim(COALESCE(v_imovel.tipo_imovel, ''))) IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial'));

    FOR v_demanda IN SELECT * FROM public.demandas_locacao WHERE status_demanda IN ('aberta', 'em busca', 'em visita')
    LOOP
        IF v_imovel.tipo NOT IN ('Locação', 'Ambos') THEN
            CONTINUE;
        END IF;

        v_score := 100;
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
                v_score := v_score - (CASE WHEN v_is_commercial THEN 50 ELSE 45 END);
            END IF;
        END IF;

        IF COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) > 0 THEN
            IF v_preco_comparar > COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) * 1.2 THEN
                v_score := v_score - (CASE WHEN v_is_commercial THEN 40 ELSE 30 END);
            ELSIF v_preco_comparar > COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) THEN
                v_score := v_score - (CASE WHEN v_is_commercial THEN 20 ELSE 15 END);
            ELSIF COALESCE(v_demanda.valor_minimo, 0) > 0 AND v_preco_comparar < COALESCE(v_demanda.valor_minimo, 0) THEN
                v_score := v_score - 10;
            END IF;
        END IF;

        IF COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas, 0) > 0 AND COALESCE(v_imovel.vagas, 0) < COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas, 0) THEN
            v_score := v_score - 10;
        END IF;

        IF NOT v_is_commercial THEN
            IF COALESCE(v_demanda.dormitorios, v_demanda.quartos, 0) > 0 AND COALESCE(v_imovel.dormitorios, 0) < COALESCE(v_demanda.dormitorios, v_demanda.quartos, 0) THEN
                v_score := v_score - 15;
            END IF;
        END IF;

        IF v_score < 0 THEN v_score := 0; END IF;

        IF v_score >= 50 THEN
            INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
            VALUES (v_imovel.id, v_demanda.id, 'Locação', v_score, 'pendente')
            ON CONFLICT (imovel_id, demanda_id, demanda_tipo) 
            DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
        END IF;
    END LOOP;

    FOR v_demanda IN SELECT * FROM public.demandas_vendas WHERE status_demanda IN ('aberta', 'em busca', 'em visita')
    LOOP
        IF v_imovel.tipo NOT IN ('Venda', 'Ambos') THEN
            CONTINUE;
        END IF;

        v_score := 100;
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
                v_score := v_score - (CASE WHEN v_is_commercial THEN 50 ELSE 45 END);
            END IF;
        END IF;

        IF COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) > 0 THEN
            IF v_preco_comparar > COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) * 1.2 THEN
                v_score := v_score - (CASE WHEN v_is_commercial THEN 40 ELSE 30 END);
            ELSIF v_preco_comparar > COALESCE(v_demanda.valor_maximo, v_demanda.orcamento_max, 0) THEN
                v_score := v_score - (CASE WHEN v_is_commercial THEN 20 ELSE 15 END);
            ELSIF COALESCE(v_demanda.valor_minimo, 0) > 0 AND v_preco_comparar < COALESCE(v_demanda.valor_minimo, 0) THEN
                v_score := v_score - 10;
            END IF;
        END IF;

        IF COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas, 0) > 0 AND COALESCE(v_imovel.vagas, 0) < COALESCE(v_demanda.vagas_estacionamento, v_demanda.vagas, 0) THEN
            v_score := v_score - 10;
        END IF;

        IF NOT v_is_commercial THEN
            IF COALESCE(v_demanda.dormitorios, v_demanda.quartos, 0) > 0 AND COALESCE(v_imovel.dormitorios, 0) < COALESCE(v_demanda.dormitorios, v_demanda.quartos, 0) THEN
                v_score := v_score - 15;
            END IF;
        END IF;

        IF v_score < 0 THEN v_score := 0; END IF;

        IF v_score >= 50 THEN
            INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
            VALUES (v_imovel.id, v_demanda.id, 'Venda', v_score, 'pendente')
            ON CONFLICT (imovel_id, demanda_id, demanda_tipo) 
            DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
        END IF;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_executar_match_v6()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    PERFORM public.fn_gerar_match_inteligente_v6(NEW.id);
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tgr_match_automatico_v6 ON public.imoveis_captados;
CREATE TRIGGER tgr_match_automatico_v6
AFTER INSERT OR UPDATE OF preco, valor, endereco, localizacao_texto, tipo, tipo_imovel, dormitorios, vagas, banheiros, status_captacao
ON public.imoveis_captados
FOR EACH ROW
EXECUTE FUNCTION public.trg_executar_match_v6();

-- Seed user 
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
      crypt('Skip@Pass', gen_salt('bf')),
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
