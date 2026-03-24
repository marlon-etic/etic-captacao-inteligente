-- PROMPT-004-PERFORMANCE: Otimizações de Performance
-- Objetivo: Adicionar índices e otimizar queries
-- Data: 24 de março de 2026

-- OTZ-PERF-001: Índice em status_demanda (corrigido do schema real)
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_status_demanda 
ON public.demandas_locacao(status_demanda);

CREATE INDEX IF NOT EXISTS idx_demandas_vendas_status_demanda 
ON public.demandas_vendas(status_demanda);

-- OTZ-PERF-002: Índice em captador_id (e user_captador_id para garantir cobertura)
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_captador_id 
ON public.imoveis_captados(captador_id);

CREATE INDEX IF NOT EXISTS idx_imoveis_captados_user_captador_id_perf 
ON public.imoveis_captados(user_captador_id);

-- OTZ-PERF-003: Índice composto para agrupamento
-- Adaptado para as colunas reais da tabela demandas_locacao
CREATE INDEX IF NOT EXISTS idx_demandas_grouping_criteria 
ON public.demandas_locacao(tipo_demanda, valor_maximo, dormitorios, vagas_estacionamento);

-- OTZ-PERF-004: Índice para paginação eficiente (Data de criação descendente)
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_created_at_desc 
ON public.demandas_locacao(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_demandas_vendas_created_at_desc 
ON public.demandas_vendas(created_at DESC);

-- OTZ-PERF-005: Tabela de cache para VistaSoft API
CREATE TABLE IF NOT EXISTS public.vistasoft_cache (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS para a nova tabela de cache
ALTER TABLE public.vistasoft_cache ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários autenticados operem no cache
DROP POLICY IF EXISTS "vistasoft_cache_all" ON public.vistasoft_cache;
CREATE POLICY "vistasoft_cache_all" ON public.vistasoft_cache 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_vistasoft_cache_expires_at 
ON public.vistasoft_cache(expires_at);

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION public.fn_clean_expired_cache()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.vistasoft_cache WHERE expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- OTZ-PERF-006: Materialized View para Dashboard Admin
DROP MATERIALIZED VIEW IF EXISTS public.admin_dashboard_summary CASCADE;

CREATE MATERIALIZED VIEW public.admin_dashboard_summary AS
SELECT
    1 AS id, -- Identificador único para permitir refresh CONCURRENTLY
    (SELECT COUNT(*) FROM public.demandas_locacao WHERE status_demanda = 'aberta') AS demandas_abertas,
    (SELECT COUNT(*) FROM public.imoveis_captados WHERE status_captacao = 'capturado') AS imoveis_ativos,
    (SELECT COALESCE(SUM(pontos), 0) FROM public.pontuacao_captador) AS total_pontos,
    (SELECT COUNT(DISTINCT COALESCE(user_captador_id, captador_id)) FROM public.imoveis_captados WHERE COALESCE(user_captador_id, captador_id) IS NOT NULL) AS captadores_ativos,
    NOW() AS last_updated;

-- Índice único necessário para o REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_dashboard_id 
ON public.admin_dashboard_summary(id);

-- Função auxiliar para atualizar a Materialized View facilmente
CREATE OR REPLACE FUNCTION public.refresh_admin_dashboard_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_summary;
EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW public.admin_dashboard_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- OTZ-PERF-007: Índice para processamento da webhook_queue
CREATE INDEX IF NOT EXISTS idx_webhook_queue_status_created 
ON public.webhook_queue(status, created_at);

-- OTZ-PERF-008: Índice para notificações (Ajustado para coluna real 'lido')
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lido 
ON public.notificacoes(usuario_id, lido);

-- ==============================================================================================
-- VALIDAÇÃO FINAL
-- ==============================================================================================

SELECT '✅ PROMPT-004 CONCLUÍDO COM SUCESSO' AS status;

-- Listar os novos índices criados para validação visual
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
