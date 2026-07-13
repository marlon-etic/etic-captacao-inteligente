-- Idempotent migration: enforce strict score > 50 filter at the database level

-- 1. Update fn_gerar_match_inteligente_v6 to only insert matches with score > 50
CREATE OR REPLACE FUNCTION public.fn_gerar_match_inteligente_v6(p_imovel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_imovel record;
    v_demanda record;
    v_score integer;
    v_is_comercial boolean;
    s_bairro integer;
    s_valor integer;
    s_dormitorios integer;
    s_vagas integer;
BEGIN
    SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    v_is_comercial := v_imovel.tipo_imovel ILIKE '%comercial%';

    -- LOCACAO
    IF v_imovel.tipo IN ('Locação', 'Ambos') THEN
        FOR v_demanda IN
            SELECT * FROM public.demandas_locacao
            WHERE status_demanda IN ('aberta', 'em busca')
            AND tipo_imovel = v_imovel.tipo_imovel
        LOOP
            v_score := 0;
            s_bairro := 0;
            s_valor := 0;
            s_dormitorios := 0;
            s_vagas := 0;

            IF v_imovel.localizacao_texto = ANY(v_demanda.bairros) OR v_imovel.localizacao_texto = ANY(v_demanda.localizacoes) THEN
                s_bairro := CASE WHEN v_is_comercial THEN 50 ELSE 45 END;
            END IF;

            IF v_imovel.valor IS NOT NULL AND v_imovel.valor > 0 THEN
                IF v_demanda.valor_maximo IS NOT NULL AND v_demanda.valor_maximo > 0 AND v_imovel.valor <= (v_demanda.valor_maximo * 1.2) THEN
                    s_valor := CASE WHEN v_is_comercial THEN 40 ELSE 30 END;
                ELSIF v_demanda.orcamento_max IS NOT NULL AND v_demanda.orcamento_max > 0 AND v_imovel.valor <= (v_demanda.orcamento_max * 1.2) THEN
                    s_valor := CASE WHEN v_is_comercial THEN 40 ELSE 30 END;
                END IF;
            END IF;

            IF v_demanda.vagas > 0 OR v_demanda.vagas_estacionamento > 0 THEN
                IF v_imovel.vagas >= COALESCE(NULLIF(v_demanda.vagas, 0), v_demanda.vagas_estacionamento, 0) THEN
                    s_vagas := 10;
                END IF;
            ELSE
                s_vagas := 10;
            END IF;

            IF NOT v_is_comercial THEN
                IF v_demanda.quartos > 0 OR v_demanda.dormitorios > 0 THEN
                    IF v_imovel.dormitorios >= COALESCE(NULLIF(v_demanda.quartos, 0), v_demanda.dormitorios, 0) THEN
                        s_dormitorios := 15;
                    END IF;
                ELSE
                    s_dormitorios := 15;
                END IF;
            END IF;

            v_score := s_bairro + s_valor + s_dormitorios + s_vagas;

            IF v_score > 50 THEN
                INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status, created_at, updated_at)
                VALUES (v_imovel.id, v_demanda.id, 'Locação', v_score, 'pendente', NOW(), NOW())
                ON CONFLICT (imovel_id, demanda_id, demanda_tipo) DO UPDATE
                SET score = EXCLUDED.score, updated_at = NOW();
            END IF;
        END LOOP;
    END IF;

    -- VENDAS
    IF v_imovel.tipo IN ('Venda', 'Ambos') THEN
        FOR v_demanda IN
            SELECT * FROM public.demandas_vendas
            WHERE status_demanda IN ('aberta', 'em busca')
            AND tipo_imovel = v_imovel.tipo_imovel
        LOOP
            v_score := 0;
            s_bairro := 0;
            s_valor := 0;
            s_dormitorios := 0;
            s_vagas := 0;

            IF v_imovel.localizacao_texto = ANY(v_demanda.bairros) OR v_imovel.localizacao_texto = ANY(v_demanda.localizacoes) THEN
                s_bairro := CASE WHEN v_is_comercial THEN 50 ELSE 45 END;
            END IF;

            IF v_imovel.valor IS NOT NULL AND v_imovel.valor > 0 THEN
                IF v_demanda.valor_maximo IS NOT NULL AND v_demanda.valor_maximo > 0 AND v_imovel.valor <= (v_demanda.valor_maximo * 1.2) THEN
                    s_valor := CASE WHEN v_is_comercial THEN 40 ELSE 30 END;
                ELSIF v_demanda.orcamento_max IS NOT NULL AND v_demanda.orcamento_max > 0 AND v_imovel.valor <= (v_demanda.orcamento_max * 1.2) THEN
                    s_valor := CASE WHEN v_is_comercial THEN 40 ELSE 30 END;
                END IF;
            END IF;

            IF v_demanda.vagas > 0 OR v_demanda.vagas_estacionamento > 0 THEN
                IF v_imovel.vagas >= COALESCE(NULLIF(v_demanda.vagas, 0), v_demanda.vagas_estacionamento, 0) THEN
                    s_vagas := 10;
                END IF;
            ELSE
                s_vagas := 10;
            END IF;

            IF NOT v_is_comercial THEN
                IF v_demanda.quartos > 0 OR v_demanda.dormitorios > 0 THEN
                    IF v_imovel.dormitorios >= COALESCE(NULLIF(v_demanda.quartos, 0), v_demanda.dormitorios, 0) THEN
                        s_dormitorios := 15;
                    END IF;
                ELSE
                    s_dormitorios := 15;
                END IF;
            END IF;

            v_score := s_bairro + s_valor + s_dormitorios + s_vagas;

            IF v_score > 50 THEN
                INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status, created_at, updated_at)
                VALUES (v_imovel.id, v_demanda.id, 'Venda', v_score, 'pendente', NOW(), NOW())
                ON CONFLICT (imovel_id, demanda_id, demanda_tipo) DO UPDATE
                SET score = EXCLUDED.score, updated_at = NOW();
            END IF;
        END LOOP;
    END IF;
END;
$function$;

-- 2. Update get_imovel_matches to strictly filter score > 50
DROP FUNCTION IF EXISTS public.get_imovel_matches(uuid);

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
            COALESCE(dv.dormitorios, 0) || ' dorms, ' || COALESCE(dv.vagas, 0) || ' vagas'
        ) AS specs,
        m.score AS score,
        m.score AS compatibilidade_pct,
        CASE
            WHEN m.score >= 70 THEN 'alto'
            WHEN m.score > 50 THEN 'medio'
            ELSE 'baixo'
        END AS match_status,
        'Match detectado pelo sistema'::text AS motivo
    FROM public.matches_sugestoes m
    LEFT JOIN public.demandas_locacao dl ON m.demanda_id = dl.id AND m.demanda_tipo = 'Locação'
    LEFT JOIN public.demandas_vendas dv ON m.demanda_id = dv.id AND m.demanda_tipo = 'Venda'
    WHERE m.imovel_id = p_imovel_id
      AND m.score > 50
      AND (dl.id IS NOT NULL OR dv.id IS NOT NULL);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Clean up existing low-score matches (score <= 50)
DELETE FROM public.matches_sugestoes WHERE score <= 50;

-- 4. Ensure RLS policies allow authenticated access
DROP POLICY IF EXISTS "authenticated_select_matches_sugestoes" ON public.matches_sugestoes;
CREATE POLICY "authenticated_select_matches_sugestoes" ON public.matches_sugestoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_imovel_demand_match" ON public.imovel_demand_match;
CREATE POLICY "authenticated_select_imovel_demand_match" ON public.imovel_demand_match
  FOR SELECT TO authenticated USING (true);

-- 5. Recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS tgr_match_automatico_v6 ON public.imoveis_captados;
CREATE TRIGGER tgr_match_automatico_v6
    AFTER INSERT OR UPDATE OF valor, localizacao_texto, dormitorios, vagas, tipo_imovel
    ON public.imoveis_captados
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_executar_match_v6();
