-- Fix: v_tipo_normalizado typo in fn_match_imovel_to_campanhas
-- The original migration declared v_tipo_normalized (English) but some
-- ELSIF branches referenced v_tipo_normalizado (Portuguese), which is
-- undeclared and causes a 42601 error.

CREATE OR REPLACE FUNCTION public.fn_match_imovel_to_campanhas()
RETURNS TRIGGER AS $$
DECLARE
    c RECORD;
    v_tipo_normalized TEXT;
    v_preco NUMERIC;
BEGIN
    v_preco := COALESCE(NEW.preco, NEW.valor, 0);

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
        SELECT id FROM public.campanhas
        WHERE status = 'ativa'
          AND tipo_imovel = v_tipo_normalized
          AND v_preco >= faixa_valor_min
          AND v_preco <= faixa_valor_max
    LOOP
        INSERT INTO public.campanhas_imoveis (campanha_id, imovel_id, captador_id)
        VALUES (c.id, NEW.id, COALESCE(NEW.user_captador_id, NEW.captador_id))
        ON CONFLICT (campanha_id, imovel_id) DO NOTHING;

        IF FOUND THEN
            UPDATE public.campanhas
            SET progresso = progresso + 1
            WHERE id = c.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_match_imovel_campanhas ON public.imoveis_captados;
CREATE TRIGGER trg_match_imovel_campanhas
    AFTER INSERT ON public.imoveis_captados
    FOR EACH ROW EXECUTE FUNCTION public.fn_match_imovel_to_campanhas();
