-- Function to generate match intelligent v6
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

            -- Bairro match
            IF v_imovel.localizacao_texto = ANY(v_demanda.bairros) OR v_imovel.localizacao_texto = ANY(v_demanda.localizacoes) THEN
                s_bairro := CASE WHEN v_is_comercial THEN 50 ELSE 45 END;
            END IF;

            -- Valor match (+- 20%)
            IF v_imovel.valor IS NOT NULL AND v_imovel.valor > 0 THEN
                IF v_demanda.valor_maximo IS NOT NULL AND v_demanda.valor_maximo > 0 AND v_imovel.valor <= (v_demanda.valor_maximo * 1.2) THEN
                    s_valor := CASE WHEN v_is_comercial THEN 40 ELSE 30 END;
                ELSIF v_demanda.orcamento_max IS NOT NULL AND v_demanda.orcamento_max > 0 AND v_imovel.valor <= (v_demanda.orcamento_max * 1.2) THEN
                    s_valor := CASE WHEN v_is_comercial THEN 40 ELSE 30 END;
                END IF;
            END IF;

            -- Vagas match
            IF v_demanda.vagas > 0 OR v_demanda.vagas_estacionamento > 0 THEN
                IF v_imovel.vagas >= COALESCE(NULLIF(v_demanda.vagas, 0), v_demanda.vagas_estacionamento, 0) THEN
                    s_vagas := 10;
                END IF;
            ELSE
                s_vagas := 10;
            END IF;

            -- Dormitorios match (only if not comercial)
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

            IF v_score > 0 THEN
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

            -- Bairro match
            IF v_imovel.localizacao_texto = ANY(v_demanda.bairros) OR v_imovel.localizacao_texto = ANY(v_demanda.localizacoes) THEN
                s_bairro := CASE WHEN v_is_comercial THEN 50 ELSE 45 END;
            END IF;

            -- Valor match (+- 20%)
            IF v_imovel.valor IS NOT NULL AND v_imovel.valor > 0 THEN
                IF v_demanda.valor_maximo IS NOT NULL AND v_demanda.valor_maximo > 0 AND v_imovel.valor <= (v_demanda.valor_maximo * 1.2) THEN
                    s_valor := CASE WHEN v_is_comercial THEN 40 ELSE 30 END;
                ELSIF v_demanda.orcamento_max IS NOT NULL AND v_demanda.orcamento_max > 0 AND v_imovel.valor <= (v_demanda.orcamento_max * 1.2) THEN
                    s_valor := CASE WHEN v_is_comercial THEN 40 ELSE 30 END;
                END IF;
            END IF;

            -- Vagas match
            IF v_demanda.vagas > 0 OR v_demanda.vagas_estacionamento > 0 THEN
                IF v_imovel.vagas >= COALESCE(NULLIF(v_demanda.vagas, 0), v_demanda.vagas_estacionamento, 0) THEN
                    s_vagas := 10;
                END IF;
            ELSE
                s_vagas := 10;
            END IF;

            -- Dormitorios match
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

            IF v_score > 0 THEN
                INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status, created_at, updated_at)
                VALUES (v_imovel.id, v_demanda.id, 'Venda', v_score, 'pendente', NOW(), NOW())
                ON CONFLICT (imovel_id, demanda_id, demanda_tipo) DO UPDATE 
                SET score = EXCLUDED.score, updated_at = NOW();
            END IF;
        END LOOP;
    END IF;
END;
$function$;

-- Strategic View: Foco Captacao V6
DROP VIEW IF EXISTS public.vw_foco_captacao_v6 CASCADE;
CREATE OR REPLACE VIEW public.vw_foco_captacao_v6 AS
WITH locacao_sem_match AS (
    SELECT
        d.id,
        'Locação'::text AS tipo,
        d.tipo_imovel,
        unnest(CASE WHEN array_length(d.bairros, 1) > 0 THEN d.bairros ELSE d.localizacoes END) AS bairro_alvo,
        COALESCE(NULLIF(d.valor_maximo, 0), d.orcamento_max, 0) AS valor
    FROM public.demandas_locacao d
    LEFT JOIN public.matches_sugestoes ms ON ms.demanda_id = d.id AND ms.demanda_tipo = 'Locação'
    WHERE d.status_demanda IN ('aberta', 'em busca')
      AND ms.id IS NULL
),
venda_sem_match AS (
    SELECT
        d.id,
        'Venda'::text AS tipo,
        d.tipo_imovel,
        unnest(CASE WHEN array_length(d.bairros, 1) > 0 THEN d.bairros ELSE d.localizacoes END) AS bairro_alvo,
        COALESCE(NULLIF(d.valor_maximo, 0), d.orcamento_max, 0) AS valor
    FROM public.demandas_vendas d
    LEFT JOIN public.matches_sugestoes ms ON ms.demanda_id = d.id AND ms.demanda_tipo = 'Venda'
    WHERE d.status_demanda IN ('aberta', 'em busca')
      AND ms.id IS NULL
),
todas_sem_match AS (
    SELECT * FROM locacao_sem_match
    UNION ALL
    SELECT * FROM venda_sem_match
)
SELECT 
    tipo,
    tipo_imovel,
    bairro_alvo,
    COUNT(DISTINCT id)::bigint AS qtd_clientes_aguardando,
    ROUND(AVG(valor), 2)::numeric AS ticket_medio
FROM todas_sem_match
WHERE bairro_alvo IS NOT NULL
GROUP BY tipo, tipo_imovel, bairro_alvo;

-- Automation Trigger Function
CREATE OR REPLACE FUNCTION public.tr_executar_match_v6()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (
        NEW.valor IS DISTINCT FROM OLD.valor OR
        NEW.localizacao_texto IS DISTINCT FROM OLD.localizacao_texto OR
        NEW.dormitorios IS DISTINCT FROM OLD.dormitorios OR
        NEW.vagas IS DISTINCT FROM OLD.vagas OR
        NEW.tipo_imovel IS DISTINCT FROM OLD.tipo_imovel
    )) THEN
        PERFORM public.fn_gerar_match_inteligente_v6(NEW.id);
    END IF;
    RETURN NEW;
END;
$function$;

-- Apply Trigger
DROP TRIGGER IF EXISTS tgr_match_automatico_v6 ON public.imoveis_captados;
CREATE TRIGGER tgr_match_automatico_v6
    AFTER INSERT OR UPDATE OF valor, localizacao_texto, dormitorios, vagas, tipo_imovel
    ON public.imoveis_captados
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_executar_match_v6();
