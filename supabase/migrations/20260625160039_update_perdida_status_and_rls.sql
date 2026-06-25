DO $$
BEGIN
  -- Remove existing restrictive constraints on status_demanda if any
  ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_status_demanda_check;
  ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS chk_status_demanda_locacao;
  ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS demandas_vendas_status_demanda_check;
  ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS chk_status_demanda_vendas;

  -- Add updated constraints to officially support 'perdida' / 'Perdida' 
  -- We use NOT VALID to ensure it doesn't fail on any historically unclean data while enforcing for new records
  ALTER TABLE public.demandas_locacao ADD CONSTRAINT demandas_locacao_status_demanda_check 
    CHECK (status_demanda IN ('ativo', 'aberta', 'fechado', 'perdida', 'Perdida', 'arquivada', 'pendente', 'em_negociacao', 'finalizada', 'cancelada')) NOT VALID;
    
  ALTER TABLE public.demandas_vendas ADD CONSTRAINT demandas_vendas_status_demanda_check 
    CHECK (status_demanda IN ('ativo', 'aberta', 'fechado', 'perdida', 'Perdida', 'arquivada', 'pendente', 'em_negociacao', 'finalizada', 'cancelada')) NOT VALID;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- RBAC: Explicit SELECT policies to guarantee visibility across the entire database filtered by transaction type
DROP POLICY IF EXISTS "SDRs can read locacao and ambos properties" ON public.imoveis_captados;
CREATE POLICY "SDRs can read locacao and ambos properties" ON public.imoveis_captados
FOR SELECT TO authenticated
USING (
  ((SELECT role FROM public.users WHERE id = auth.uid()) = 'sdr')
  AND (tipo IN ('Locação', 'Aluguel', 'Ambos', 'Ambas', 'locacao', 'aluguel', 'ambos'))
);

DROP POLICY IF EXISTS "Corretores can read venda and ambos properties" ON public.imoveis_captados;
CREATE POLICY "Corretores can read venda and ambos properties" ON public.imoveis_captados
FOR SELECT TO authenticated
USING (
  ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('corretor', 'broker'))
  AND (tipo IN ('Venda', 'Ambos', 'Ambas', 'venda', 'ambos'))
);
