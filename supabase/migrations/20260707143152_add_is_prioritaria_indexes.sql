-- Migration: Add indexes on is_prioritaria for efficient querying across all list views
-- Ensures performant filtering and sorting by priority status
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_is_prioritaria ON public.demandas_locacao (is_prioritaria);
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_is_prioritaria ON public.demandas_vendas (is_prioritaria);
