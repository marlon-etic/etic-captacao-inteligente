DO $$
BEGIN
  -- Adicionar coluna links_sugeridos na tabela demandas_locacao
  ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS links_sugeridos JSONB DEFAULT '[]'::jsonb;
  
  -- Adicionar coluna links_sugeridos na tabela demandas_vendas
  ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS links_sugeridos JSONB DEFAULT '[]'::jsonb;
END $$;
