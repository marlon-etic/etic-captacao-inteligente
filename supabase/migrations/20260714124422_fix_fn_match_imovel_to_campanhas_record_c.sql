-- Fix: "record 'c' is not assigned yet" error in fn_match_imovel_to_campanhas
-- The bug: the FOR loop's SELECT referenced c.bairro_alvo in its own WHERE clause
-- before the record variable c was populated. Replace with proper table alias.

CREATE OR REPLACE FUNCTION public.fn_match_imovel_to_campanhas()
RETURNS trigger AS $$
DECLARE
    c RECORD;
    v_tipo_normalized TEXT;
    v_preco NUMERIC;
    v_bairro TEXT;
BEGIN
    v_preco := COALESCE(NEW.preco, NEW.valor, 0);
    v_bairro := COALESCE(NEW.localizacao_texto, '');

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
        SELECT cam.id, cam.bairro_alvo
        FROM public.campanhas cam
        WHERE cam.status = 'ativa'
          AND cam.tipo_imovel = v_tipo_normalized
          AND v_preco >= cam.faixa_valor_min
          AND v_preco <= cam.faixa_valor_max
          AND (
            cam.bairro_alvo IS NULL
            OR cam.bairro_alvo = ''
            OR v_bairro ILIKE '%' || cam.bairro_alvo || '%'
          )
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
