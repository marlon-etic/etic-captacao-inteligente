DROP VIEW IF EXISTS public.vw_foco_captacao_v6 CASCADE;

CREATE OR REPLACE VIEW public.vw_foco_captacao_v6 AS
WITH unmatched_demandas AS (
    SELECT 
        d.id,
        unnest(COALESCE(d.bairros, d.localizacoes, ARRAY['Sem Bairro'])) AS bairro_alvo,
        d.tipo_demanda::text AS tipo,
        COALESCE(d.tipo_imovel, 'Residencial') AS tipo_imovel,
        COALESCE(NULLIF(d.valor_maximo, 0), d.orcamento_max) AS ticket_medio
    FROM public.demandas_locacao d
    LEFT JOIN public.imovel_demand_match m ON m.demanda_id = d.id AND m.tipo_vinculacao IN ('vinculado', 'agendado', 'fechado')
    WHERE d.status_demanda IN ('aberta', 'em busca', 'em visita')
      AND m.id IS NULL
      AND COALESCE(d.dormitorios, d.quartos, 0) > 0
      AND lower(COALESCE(d.tipo_imovel, 'residencial')) NOT IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial')
    UNION ALL
    SELECT 
        d.id,
        unnest(COALESCE(d.bairros, d.localizacoes, ARRAY['Sem Bairro'])) AS bairro_alvo,
        'Venda'::text AS tipo,
        COALESCE(d.tipo_imovel, 'Residencial') AS tipo_imovel,
        COALESCE(NULLIF(d.valor_maximo, 0), d.orcamento_max) AS ticket_medio
    FROM public.demandas_vendas d
    LEFT JOIN public.imovel_demand_match m ON m.demanda_id = d.id AND m.tipo_vinculacao IN ('vinculado', 'agendado', 'fechado')
    WHERE d.status_demanda IN ('aberta', 'em busca', 'em visita')
      AND m.id IS NULL
      AND COALESCE(d.dormitorios, d.quartos, 0) > 0
      AND lower(COALESCE(d.tipo_imovel, 'residencial')) NOT IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial')
)
SELECT 
    tipo,
    CASE 
        WHEN lower(tipo_imovel) IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial') THEN 'Comercial'
        ELSE 'Residencial'
    END AS tipo_imovel,
    bairro_alvo,
    COUNT(DISTINCT id) AS qtd_clientes_aguardando,
    AVG(NULLIF(ticket_medio, 0)) AS ticket_medio
FROM unmatched_demandas
GROUP BY 1, 2, 3
ORDER BY 4 DESC, 5 DESC;
