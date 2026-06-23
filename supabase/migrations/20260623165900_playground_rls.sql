DO $$
BEGIN
    ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    ALTER TABLE public.imoveis_captados ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
    ALTER TABLE public.fechamentos ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
END $$;

CREATE INDEX IF NOT EXISTS idx_demandas_locacao_is_test_data ON public.demandas_locacao(is_test_data);
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_is_test_data ON public.demandas_vendas(is_test_data);
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_is_test_data ON public.imoveis_captados(is_test_data);
CREATE INDEX IF NOT EXISTS idx_fechamentos_is_test_data ON public.fechamentos(is_test_data);
