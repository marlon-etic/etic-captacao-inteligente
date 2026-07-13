-- Add bairro_alvo column to campanhas for location-based campaign tracking
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS bairro_alvo TEXT;

-- Update the trigger function to validate bairro if specified
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
        SELECT id, bairro_alvo FROM public.campanhas
        WHERE status = 'ativa'
          AND tipo_imovel = v_tipo_normalized
          AND v_preco >= faixa_valor_min
          AND v_preco <= faixa_valor_max
          AND (
            c.bairro_alvo IS NULL
            OR c.bairro_alvo = ''
            OR v_bairro ILIKE '%' || c.bairro_alvo || '%'
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
