DO $$
BEGIN
  -- demandas_locacao: coalesce quartos into dormitorios for residential properties
  UPDATE public.demandas_locacao
  SET dormitorios = quartos
  WHERE dormitorios IS NULL
    AND quartos IS NOT NULL
    AND quartos > 0
    AND lower(COALESCE(tipo_imovel, 'casa')) NOT IN
      ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial');

  -- demandas_vendas: coalesce quartos into dormitorios for residential properties
  UPDATE public.demandas_vendas
  SET dormitorios = quartos
  WHERE dormitorios IS NULL
    AND quartos IS NOT NULL
    AND quartos > 0
    AND lower(COALESCE(tipo_imovel, 'casa')) NOT IN
      ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial');

  -- imoveis_captados: set dormitorios to 0 for residential properties where NULL
  UPDATE public.imoveis_captados
  SET dormitorios = 0
  WHERE dormitorios IS NULL
    AND lower(COALESCE(tipo_imovel, 'apartamento')) NOT IN
      ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial');

  -- demandas_locacao: set dormitorios to 0 where still NULL for residential
  UPDATE public.demandas_locacao
  SET dormitorios = 0
  WHERE dormitorios IS NULL
    AND lower(COALESCE(tipo_imovel, 'casa')) NOT IN
      ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial');

  -- demandas_vendas: set dormitorios to 0 where still NULL for residential
  UPDATE public.demandas_vendas
  SET dormitorios = 0
  WHERE dormitorios IS NULL
    AND lower(COALESCE(tipo_imovel, 'casa')) NOT IN
      ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial');
END $$;
