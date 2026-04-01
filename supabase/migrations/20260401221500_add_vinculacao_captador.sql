ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS vinculacao_captador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS vinculacao_captador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
