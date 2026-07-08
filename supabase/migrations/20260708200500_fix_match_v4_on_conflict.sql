-- Fix fn_gerar_match_inteligente_v4 to use the correct ON CONFLICT columns
-- The unique constraint is (imovel_id, demanda_id, demanda_tipo), not (imovel_id, demanda_id)
CREATE OR REPLACE FUNCTION public.fn_gerar_match_inteligente_v4(p_imovel_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
    SELECT 
        i.id as imovel_id,
        d.id as demanda_id,
        'locacao' as demanda_tipo,
        (
            (CASE WHEN i.localizacao_texto = ANY(d.bairros) THEN 50 ELSE 0 END) +
            (CASE WHEN i.valor <= d.valor_maximo THEN 30 ELSE 0 END) +
            (CASE WHEN i.dormitorios >= d.dormitorios THEN 20 ELSE 0 END)
        ) as calculated_score,
        'pendente'
    FROM public.imoveis_captados i
    CROSS JOIN public.demandas_locacao d
    WHERE i.id = p_imovel_id
    AND (i.localizacao_texto = ANY(d.bairros) OR i.valor <= d.valor_maximo)
    AND (
        (CASE WHEN i.localizacao_texto = ANY(d.bairros) THEN 50 ELSE 0 END) +
        (CASE WHEN i.valor <= d.valor_maximo THEN 30 ELSE 0 END) +
        (CASE WHEN i.dormitorios >= d.dormitorios THEN 20 ELSE 0 END)
    ) >= 60
    ON CONFLICT (imovel_id, demanda_id, demanda_tipo) DO UPDATE SET 
        score = EXCLUDED.score,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
