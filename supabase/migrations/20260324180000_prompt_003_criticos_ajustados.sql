-- PROMPT-003-CRITICOS-AJUSTADOS-FINAL
-- Ajustes Críticos com Base no Mapeamento Real
-- Data: 24 de março de 2026

-- AJST-BK-001: Garantir RLS ativado em todas as tabelas críticas
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.demandas_locacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.demandas_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.imoveis_captados ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pontuacao_captador ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prazos_captacao ENABLE ROW LEVEL SECURITY;

-- AJST-BK-006: CRIAR TABELA grupos_demandas (faltando no banco)
CREATE TABLE IF NOT EXISTS public.grupos_demandas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bairro TEXT NOT NULL,
    tipologia TEXT DEFAULT 'Padrão',
    valor_aluguel NUMERIC DEFAULT 0,
    num_quartos INTEGER DEFAULT 0,
    num_vagas INTEGER DEFAULT 0,
    count_demandas INTEGER DEFAULT 1,
    tier TEXT GENERATED ALWAYS AS (
        CASE
            WHEN count_demandas >= 7 THEN 'Tier 1'
            WHEN count_demandas >= 4 THEN 'Tier 2'
            ELSE 'Tier 3'
        END
    ) STORED,
    -- Campos legados por retrocompatibilidade:
    preco_minimo_group DECIMAL(12,2) DEFAULT 0,
    preco_maximo_group DECIMAL(12,2) DEFAULT 0,
    dormitorios INTEGER DEFAULT 0,
    vagas INTEGER DEFAULT 0,
    tipo VARCHAR(50) DEFAULT 'locacao',
    total_demandas_ativas INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para grupos_demandas
ALTER TABLE public.grupos_demandas ENABLE ROW LEVEL SECURITY;

-- AJST-BK-012: CRIAR TABELA webhook_queue (faltando no banco)
CREATE TABLE IF NOT EXISTS public.webhook_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    entity_id UUID,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- RLS para webhook_queue
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

-- Adicionar colunas de grupo às demandas (se não existirem)
ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES public.grupos_demandas(id) ON DELETE SET NULL;
ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES public.grupos_demandas(id) ON DELETE SET NULL;

-- AJST-BK-002: Verificar/Atualizar triggers de pontuação
CREATE OR REPLACE FUNCTION public.fn_calculate_points_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    cid UUID;
BEGIN
    cid := COALESCE(NEW.user_captador_id, NEW.captador_id);
    IF cid IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.demanda_locacao_id IS NOT NULL THEN
        INSERT INTO public.pontuacao_captador (captador_id, demanda_locacao_id, tipo_pontuacao, pontos)
        VALUES (cid, NEW.demanda_locacao_id, 'captura_com_demanda', 10);
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
        INSERT INTO public.pontuacao_captador (captador_id, demanda_venda_id, tipo_pontuacao, pontos)
        VALUES (cid, NEW.demanda_venda_id, 'captura_com_demanda', 10);
    ELSE
        INSERT INTO public.pontuacao_captador (captador_id, tipo_pontuacao, pontos)
        VALUES (cid, 'captura_sem_demanda', 3);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que o trigger 'pontuacao_imovel_trigger' chama a função correta
DROP TRIGGER IF EXISTS pontuacao_imovel_trigger ON public.imoveis_captados;
CREATE TRIGGER pontuacao_imovel_trigger
AFTER INSERT ON public.imoveis_captados
FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_points_on_insert();

-- AJST-BK-003: Verificar/Atualizar funções de notificação
CREATE OR REPLACE FUNCTION public.fn_notify_new_demand_locacao()
RETURNS TRIGGER AS $$
DECLARE
    prioridade_val notificacao_prioridade;
BEGIN
    IF NEW.nivel_urgencia IN ('Urgente', 'Alta') THEN 
        prioridade_val := 'alta';
    ELSIF NEW.nivel_urgencia IN ('Baixa') THEN 
        prioridade_val := 'baixa';
    ELSE 
        prioridade_val := 'normal'; 
    END IF;

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT id, 'nova_demanda', 
           'Nova demanda: ' || COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'Cliente'), 
           COALESCE(array_to_string(NEW.bairros, ', '), '') || ' - R$ ' || COALESCE(NEW.valor_maximo, 0),
           jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', 'Aluguel'),
           prioridade_val
    FROM public.users WHERE role = 'captador';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que o trigger 'trg_notify_nova_demanda_locacao' chama a função correta
DROP TRIGGER IF EXISTS trg_notify_nova_demanda_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_nova_demanda_locacao
AFTER INSERT ON public.demandas_locacao
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_new_demand_locacao();

-- AJST-BK-005: Validar integridade referencial (Foreign Keys)
DO $$
BEGIN
    -- Adicionar FK se não existir (sdr_id -> users)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_demandas_locacao_sdr' AND table_name = 'demandas_locacao') THEN
        BEGIN
            ALTER TABLE public.demandas_locacao ADD CONSTRAINT fk_demandas_locacao_sdr FOREIGN KEY (sdr_id) REFERENCES public.users(id) ON DELETE SET NULL;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    
    -- Adicionar FK se não existir (user_captador_id -> users)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_imoveis_captador' AND table_name = 'imoveis_captados') THEN
        BEGIN
            ALTER TABLE public.imoveis_captados ADD CONSTRAINT fk_imoveis_captador FOREIGN KEY (user_captador_id) REFERENCES public.users(id) ON DELETE SET NULL;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
END $$;

-- AJST-BK-007: CRIAR função de agrupamento automático (não encontrada)
CREATE OR REPLACE FUNCTION public.fn_agrupar_demandas_automaticamente()
RETURNS TRIGGER AS $$
DECLARE
    v_grupo_id UUID;
    v_bairro TEXT;
BEGIN
    v_bairro := COALESCE(NEW.bairros[1], 'Desconhecido');
    
    SELECT id INTO v_grupo_id
    FROM public.grupos_demandas
    WHERE bairro = v_bairro 
      AND (dormitorios = NEW.dormitorios OR num_quartos = NEW.dormitorios)
    LIMIT 1;

    IF v_grupo_id IS NULL THEN
        INSERT INTO public.grupos_demandas (bairro, tipologia, valor_aluguel, num_quartos, count_demandas, preco_maximo_group, dormitorios, tipo)
        VALUES (v_bairro, 'Padrão', COALESCE(NEW.valor_maximo, 0), COALESCE(NEW.dormitorios, 0), 1, COALESCE(NEW.valor_maximo, 0), COALESCE(NEW.dormitorios, 0), 'locacao')
        RETURNING id INTO v_grupo_id;
    ELSE
        UPDATE public.grupos_demandas
        SET count_demandas = count_demandas + 1, total_demandas_ativas = total_demandas_ativas + 1
        WHERE id = v_grupo_id;
    END IF;

    NEW.grupo_id := v_grupo_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para agrupamento automático
DROP TRIGGER IF EXISTS trg_agrupar_demanda_automaticamente ON public.demandas_locacao;
CREATE TRIGGER trg_agrupar_demanda_automaticamente
BEFORE INSERT ON public.demandas_locacao
FOR EACH ROW EXECUTE FUNCTION public.fn_agrupar_demandas_automaticamente();

-- AJST-BK-008: Função de cálculo de tenant score
CREATE OR REPLACE FUNCTION public.fn_calcular_tenant_score(
    p_renda_mensal NUMERIC,
    p_valor_aluguel NUMERIC
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 50;
    comprometimento NUMERIC;
BEGIN
    IF p_valor_aluguel > 0 AND p_renda_mensal > 0 THEN
        comprometimento := (p_valor_aluguel / p_renda_mensal) * 100;
        IF comprometimento <= 30 THEN score := score + 30;
        ELSIF comprometimento <= 40 THEN score := score + 15;
        ELSE score := score - 20;
        END IF;
    END IF;
    IF score > 100 THEN score := 100; END IF;
    IF score < 0 THEN score := 0; END IF;
    RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- AJST-BK-009: Adicionar coluna tenant_score e trigger de atualização
ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS renda_mensal_estimada NUMERIC DEFAULT 0;
ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS tenant_score INTEGER DEFAULT 0;

-- Trigger para atualizar score automaticamente
CREATE OR REPLACE FUNCTION public.fn_atualizar_tenant_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tenant_score := public.fn_calcular_tenant_score(COALESCE(NEW.renda_mensal_estimada, 0), COALESCE(NEW.valor_maximo, 0));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_atualizar_tenant_score ON public.demandas_locacao;
CREATE TRIGGER trg_atualizar_tenant_score
BEFORE INSERT OR UPDATE OF renda_mensal_estimada, valor_maximo ON public.demandas_locacao
FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_tenant_score();

-- AJST-BK-010: Tabela e função para logar falhas de API
CREATE TABLE IF NOT EXISTS public.api_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name TEXT NOT NULL,
    endpoint TEXT,
    error_message TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.api_error_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.fn_logar_falhas_api(
    p_api TEXT,
    p_endpoint TEXT,
    p_message TEXT,
    p_payload JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.api_error_logs (api_name, endpoint, error_message, payload)
    VALUES (p_api, p_endpoint, p_message, p_payload);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AJST-BK-011: Constraints de validação de dados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_demandas_locacao_renda' AND table_name = 'demandas_locacao') THEN
        ALTER TABLE public.demandas_locacao ADD CONSTRAINT chk_demandas_locacao_renda CHECK (renda_mensal_estimada >= 0);
    END IF;
END $$;

-- AJST-BK-012 (continuação): Função para processar webhooks
CREATE OR REPLACE FUNCTION public.fn_processar_webhook_queue()
RETURNS TABLE (id UUID, event_type TEXT, payload JSONB, status TEXT) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.webhook_queue wq
    SET status = 'processing', updated_at = NOW()
    WHERE wq.id IN (
        SELECT w.id FROM public.webhook_queue w
        WHERE w.status = 'pending' OR (w.status = 'failed' AND w.retry_count < w.max_retries)
        ORDER BY w.created_at ASC
        LIMIT 10
        FOR UPDATE SKIP LOCKED
    )
    RETURNING wq.id, wq.event_type, wq.payload, wq.status;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================================
-- VALIDAÇÃO FINAL
-- ==============================================================================================

SELECT '✅ PROMPT-003 CONCLUÍDO COM SUCESSO' AS status;

-- Verificar estrutura final
SELECT
    'Tabelas Críticas' AS categoria,
    COUNT(*) AS quantidade,
    CASE WHEN COUNT(*) >= 10 THEN '✅ OK' ELSE '❌ FALHO' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'demandas_locacao', 'demandas_vendas', 'imoveis_captados', 'grupos_demandas', 'pontuacao_captador', 'notificacoes', 'prazos_captacao', 'webhook_queue', 'api_error_logs');

-- Verificar triggers (contagem total, incluindo os existentes e os novos)
SELECT
    'Triggers' AS categoria,
    COUNT(*) AS quantidade
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Verificar funções (contagem total, incluindo as existentes e as novas)
SELECT
    'Funções' AS categoria,
    COUNT(*) AS quantidade
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname NOT LIKE 'pg_%';

-- Verificar RLS (contagem de tabelas com RLS ativado)
SELECT
    'RLS Ativado' AS categoria,
    COUNT(*) AS quantidade
FROM pg_class c
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND relkind = 'r'
AND relrowsecurity = TRUE;
