CREATE INDEX IF NOT EXISTS idx_demandas_vendas_status_demanda ON public.demandas_vendas (status_demanda);
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_status_demanda ON public.demandas_locacao (status_demanda);

CREATE OR REPLACE VIEW public.vw_demandas_perdidas AS
SELECT 
  id, 
  'Venda' as tipo,
  nome_cliente, 
  bairros, 
  valor_maximo, 
  nivel_urgencia, 
  status_demanda, 
  created_at
FROM public.demandas_vendas
WHERE status_demanda = 'impossivel'
UNION ALL
SELECT 
  id, 
  'Aluguel' as tipo,
  nome_cliente, 
  bairros, 
  valor_maximo, 
  nivel_urgencia, 
  status_demanda, 
  created_at
FROM public.demandas_locacao
WHERE status_demanda = 'impossivel';

GRANT SELECT ON public.vw_demandas_perdidas TO authenticated;
GRANT SELECT ON public.vw_demandas_perdidas TO anon;
