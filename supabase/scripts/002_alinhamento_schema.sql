-- PROMPT-002-ALINHAMENTO: Mapeamento de Schema e Divergências
-- Objetivo: Identificar e documentar divergências de nomenclatura

-- Tempo: 10-15 minutos

-- 1. LISTAR TODAS AS TABELAS REAIS NO BANCO
SELECT
  table_name,
  CASE
    WHEN table_name IN ('users', 'usuarios') THEN '⚠️ USUARIOS/USERS'
    WHEN table_name IN ('audit_log', 'auditoria') THEN '⚠️ AUDIT_LOG/AUDITORIA'
    WHEN table_name IN ('demandas_locacao', 'demandas_vendas', 'imoveis_captados', 'grupos_demandas', 'pontuacao_captador', 'notificacoes', 'prazos_captacao', 'webhook_queue', 'respostas_captador') THEN '✅ CORRETO'
    ELSE '⚠️ VERIFICAR'
  END AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND information_schema.tables.table_name=t.table_name) AS existe
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. LISTAR TODOS OS TRIGGERS EXISTENTES
SELECT
  trigger_name,
  event_object_table AS tabela,
  event_manipulation AS operacao,
  action_timing AS momento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 3. LISTAR TODAS AS FUNCTIONS EXISTENTES
SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS definicao_resumida
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname NOT LIKE 'pg_%'
ORDER BY proname;

-- 4. LISTAR TODAS AS POLÍTICAS RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. VALIDAR FOREIGN KEYS E CONSTRAINTS
SELECT
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
  AND referenced_table_name IS NOT NULL
ORDER BY table_name;

-- 6. VALIDAR ÍNDICES CRÍTICOS
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE 'idx_%' OR indexname LIKE 'pk_%')
ORDER BY tablename, indexname;
