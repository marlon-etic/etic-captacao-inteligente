-- Update campaign matching trigger to recalculate progresso from actual count vs meta
CREATE OR REPLACE FUNCTION public.fn_match_imovel_to_campanhas()
RETURNS trigger AS $$
DECLARE
    c RECORD;
    v_tipo_normalized TEXT;
    v_preco NUMERIC;
    v_bairro TEXT;
    v_actual_count INTEGER;
BEGIN
    v_preco := COALESCE(NEW.preco, NEW.valor, 0);
    v_bairro := COALESCE(NEW.localizacao_texto, NEW.endereco, '');

    v_tipo_normalized := LOWER(TRIM(COALESCE(NEW.tipo_imovel, '')));
    IF v_tipo_normalized LIKE '%apart%' THEN
        v_tipo_normalized := 'apartamento';
    ELSIF v_tipo_normalized LIKE '%casa%' OR v_tipo_normalized LIKE '%sobrado%' THEN
        v_tipo_normalized := 'casa';
    ELSIF v_tipo_normalized LIKE '%galp%' THEN
        v_tipo_normalized := 'galpao';
    ELSIF v_tipo_normalized LIKE '%comer%' OR v_tipo_normalized LIKE '%sala%' OR v_tipo_normalized LIKE '%predio%' THEN
        v_tipo_normalized := 'comercial';
    END IF;

    FOR c IN
        SELECT cam.id, cam.bairros_alvo
        FROM public.campanhas cam
        WHERE cam.status = 'ativa'
          AND cam.tipo_imovel = v_tipo_normalized
          AND v_preco >= cam.faixa_valor_min
          AND v_preco <= cam.faixa_valor_max
          AND (
            cam.bairros_alvo IS NULL
            OR array_length(cam.bairros_alvo, 1) IS NULL
            OR EXISTS (
              SELECT 1 FROM unnest(cam.bairros_alvo) AS b
              WHERE v_bairro ILIKE '%' || b || '%'
            )
          )
    LOOP
        INSERT INTO public.campanhas_imoveis (campanha_id, imovel_id, captador_id)
        VALUES (c.id, NEW.id, COALESCE(NEW.user_captador_id, NEW.captador_id))
        ON CONFLICT (campanha_id, imovel_id) DO NOTHING;

        IF FOUND THEN
            SELECT COUNT(*) INTO v_actual_count
            FROM public.campanhas_imoveis
            WHERE campanha_id = c.id;

            UPDATE public.campanhas
            SET progresso = v_actual_count
            WHERE id = c.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate progresso when campanhas_imoveis records are deleted
CREATE OR REPLACE FUNCTION public.fn_recalc_campanha_progresso()
RETURNS trigger AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.campanhas_imoveis
    WHERE campanha_id = OLD.campanha_id;

    UPDATE public.campanhas
    SET progresso = v_count
    WHERE id = OLD.campanha_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalc_campanha_progresso_delete ON public.campanhas_imoveis;
CREATE TRIGGER trg_recalc_campanha_progresso_delete
    AFTER DELETE ON public.campanhas_imoveis
    FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_campanha_progresso();
