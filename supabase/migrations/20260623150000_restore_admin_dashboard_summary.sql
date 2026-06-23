DO $$ 
BEGIN
    DROP MATERIALIZED VIEW IF EXISTS public.admin_dashboard_summary CASCADE;
    DROP VIEW IF EXISTS public.admin_dashboard_summary CASCADE;
    DROP TABLE IF EXISTS public.admin_dashboard_summary CASCADE;
END $$;

CREATE OR REPLACE VIEW public.admin_dashboard_summary AS
SELECT 
    1 AS id,
    (SELECT COUNT(*) FROM public.users WHERE role = 'captador' AND status = 'ativo') AS captadores_ativos,
    (
        (SELECT COUNT(*) FROM public.demandas_locacao WHERE status_demanda NOT IN ('fechada', 'perdida', 'cancelada', 'arquivada')) +
        (SELECT COUNT(*) FROM public.demandas_vendas WHERE status_demanda NOT IN ('fechada', 'perdida', 'cancelada', 'arquivada'))
    ) AS demandas_abertas,
    (SELECT COUNT(*) FROM public.imoveis_captados WHERE etapa_funil = 'capturado' OR status_captacao IN ('ativo', 'disponível', 'disponivel')) AS imoveis_ativos,
    COALESCE((SELECT SUM(pontos) FROM public.pontuacao_captador), 0) AS total_pontos,
    NOW() AS last_updated;

GRANT SELECT ON public.admin_dashboard_summary TO authenticated;
GRANT SELECT ON public.admin_dashboard_summary TO service_role;
