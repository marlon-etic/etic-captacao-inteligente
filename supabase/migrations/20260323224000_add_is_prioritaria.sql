ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS is_prioritaria BOOLEAN DEFAULT FALSE;
ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS is_prioritaria BOOLEAN DEFAULT FALSE;
