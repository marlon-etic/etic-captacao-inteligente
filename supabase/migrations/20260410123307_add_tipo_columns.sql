DO $$ 
BEGIN
  -- Add tipo to demandas_vendas
  ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Venda';
  
  -- Add tipo to demandas_locacao
  ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Locação';

  -- Update existing imoveis_captados to be compliant
  UPDATE public.imoveis_captados SET tipo = 'Locação' WHERE tipo = 'Aluguel' OR tipo ILIKE '%loca%';
  UPDATE public.imoveis_captados SET tipo = 'Venda' WHERE tipo IS NULL OR (tipo != 'Venda' AND tipo != 'Locação' AND tipo != 'Ambos');
  
  -- Update existing demandas
  UPDATE public.demandas_vendas SET tipo = 'Venda' WHERE tipo IS NULL;
  UPDATE public.demandas_locacao SET tipo = 'Locação' WHERE tipo IS NULL;
END $$;
