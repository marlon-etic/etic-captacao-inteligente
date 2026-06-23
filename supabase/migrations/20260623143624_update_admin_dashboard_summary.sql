DO $do$
BEGIN
  -- Recreate the admin_dashboard_summary view to have the strict criteria (active and not marked inactive/perdida)
  CREATE OR REPLACE VIEW public.admin_dashboard_summary AS
  SELECT
    1 as id,
    (
      (SELECT COUNT(*) FROM public.demandas_locacao 
       WHERE status_demanda IN ('aberta', 'em busca', 'em_busca') 
         AND (marcada_sem_resposta IS NOT TRUE)) 
      +
      (SELECT COUNT(*) FROM public.demandas_vendas 
       WHERE status_demanda IN ('aberta', 'em busca', 'em_busca') 
         AND (marcada_sem_resposta IS NOT TRUE))
    ) as demandas_abertas,
    (SELECT COUNT(*) FROM public.imoveis_captados) as imoveis_ativos,
    (SELECT COUNT(*) FROM public.users WHERE role = 'captador' AND status = 'ativo') as captadores_ativos,
    (SELECT COALESCE(SUM(pontos), 0) FROM public.pontuacao_captador) as total_pontos,
    NOW() as last_updated;
END;
$do$;

-- Additionally, if refresh_admin_dashboard_summary exists as a function, update it
CREATE OR REPLACE FUNCTION public.refresh_admin_dashboard_summary()
RETURNS void AS $func$
BEGIN
  -- If it was a table instead of view, this will update it. If it's a view, the view already handles it dynamically.
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_dashboard_summary') THEN
    INSERT INTO public.admin_dashboard_summary (id, demandas_abertas, imoveis_ativos, captadores_ativos, total_pontos, last_updated)
    VALUES (
      1,
      (
        (SELECT COUNT(*) FROM public.demandas_locacao 
         WHERE status_demanda IN ('aberta', 'em busca', 'em_busca') 
           AND (marcada_sem_resposta IS NOT TRUE)) 
        +
        (SELECT COUNT(*) FROM public.demandas_vendas 
         WHERE status_demanda IN ('aberta', 'em busca', 'em_busca') 
           AND (marcada_sem_resposta IS NOT TRUE))
      ),
      (SELECT COUNT(*) FROM public.imoveis_captados),
      (SELECT COUNT(*) FROM public.users WHERE role = 'captador' AND status = 'ativo'),
      (SELECT COALESCE(SUM(pontos), 0) FROM public.pontuacao_captador),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      demandas_abertas = EXCLUDED.demandas_abertas,
      imoveis_ativos = EXCLUDED.imoveis_ativos,
      captadores_ativos = EXCLUDED.captadores_ativos,
      total_pontos = EXCLUDED.total_pontos,
      last_updated = EXCLUDED.last_updated;
  END IF;
END;
$func$ LANGUAGE plpgsql;
