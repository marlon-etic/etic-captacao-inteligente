-- Add bairros_alvo TEXT[] column to campanhas for multi-neighborhood selection
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS bairros_alvo TEXT[];

-- Migrate existing bairro_alvo data to bairros_alvo array
UPDATE public.campanhas
SET bairros_alvo = ARRAY[bairro_alvo]
WHERE bairro_alvo IS NOT NULL
  AND bairro_alvo != ''
  AND bairros_alvo IS NULL;

-- Update the matching trigger to use bairros_alvo array
CREATE OR REPLACE FUNCTION public.fn_match_imovel_to_campanhas()
RETURNS trigger AS $$
DECLARE
    c RECORD;
    v_tipo_normalized TEXT;
    v_preco NUMERIC;
    v_bairro TEXT;
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
            UPDATE public.campanhas
            SET progresso = progresso + 1
            WHERE id = c.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS policies allow admin full CRUD (including DELETE)
DROP POLICY IF EXISTS "admin_manage_campanhas" ON public.campanhas;
CREATE POLICY "admin_manage_campanhas" ON public.campanhas
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Ensure campanhas_imoveis cascade delete works (already has ON DELETE CASCADE)
-- Just verify RLS allows admin to manage
DROP POLICY IF EXISTS "admin_manage_campanhas_imoveis" ON public.campanhas_imoveis;
CREATE POLICY "admin_manage_campanhas_imoveis" ON public.campanhas_imoveis
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
