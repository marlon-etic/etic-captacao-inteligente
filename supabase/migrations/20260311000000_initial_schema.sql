-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE user_role AS ENUM ('captador', 'sdr', 'corretor', 'gestor', 'admin');
CREATE TYPE demand_status AS ENUM ('aberta', 'atendida', 'impossível', 'sem_resposta_24h');
CREATE TYPE demand_urgency AS ENUM ('até 5 dias', 'até 15 dias');

-- ==========================================
-- TABLES
-- ==========================================

-- Table: captadores (Users)
CREATE TABLE captadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'captador',
    pontos INTEGER DEFAULT 0,
    avatar_url TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Este e-mail já foi registrado" UNIQUE (email)
);

-- Table: auth_audit_logs
CREATE TABLE auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES captadores(id) ON DELETE SET NULL,
    event VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: demandas_locacao
CREATE TABLE demandas_locacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_nome VARCHAR(255) NOT NULL,
    localizacao VARCHAR(255) NOT NULL,
    orcamento_min DECIMAL(12,2) NOT NULL DEFAULT 0,
    orcamento_max DECIMAL(12,2) NOT NULL,
    quartos INTEGER NOT NULL,
    banheiros INTEGER NOT NULL,
    vagas INTEGER NOT NULL,
    status demand_status NOT NULL DEFAULT 'aberta',
    urgencia demand_urgency NOT NULL,
    captador_id UUID REFERENCES captadores(id) ON DELETE SET NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Preço mínimo deve ser menor que máximo" CHECK (orcamento_min < orcamento_max),
    CONSTRAINT "Quartos deve ser positivo" CHECK (quartos >= 0),
    CONSTRAINT "Banheiros deve ser positivo" CHECK (banheiros >= 0),
    CONSTRAINT "Vagas deve ser positivo" CHECK (vagas >= 0)
);

-- Table: demandas_vendas
CREATE TABLE demandas_vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_nome VARCHAR(255) NOT NULL,
    localizacao VARCHAR(255) NOT NULL,
    orcamento_min DECIMAL(12,2) NOT NULL DEFAULT 0,
    orcamento_max DECIMAL(12,2) NOT NULL,
    quartos INTEGER NOT NULL,
    banheiros INTEGER NOT NULL,
    vagas INTEGER NOT NULL,
    status demand_status NOT NULL DEFAULT 'aberta',
    urgencia demand_urgency NOT NULL,
    captador_id UUID REFERENCES captadores(id) ON DELETE SET NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Preço mínimo deve ser menor que máximo" CHECK (orcamento_min < orcamento_max),
    CONSTRAINT "Quartos deve ser positivo" CHECK (quartos >= 0),
    CONSTRAINT "Banheiros deve ser positivo" CHECK (banheiros >= 0),
    CONSTRAINT "Vagas deve ser positivo" CHECK (vagas >= 0)
);

-- Table: imoveis_captados
CREATE TABLE imoveis_captados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captador_id UUID NOT NULL REFERENCES captadores(id) ON DELETE CASCADE,
    demanda_locacao_id UUID REFERENCES demandas_locacao(id) ON DELETE SET NULL,
    demanda_venda_id UUID REFERENCES demandas_vendas(id) ON DELETE SET NULL,
    endereco TEXT NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    link_anuncio TEXT,
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Valor deve ser positivo" CHECK (valor > 0),
    CONSTRAINT "Imóvel deve pertencer a no máximo uma demanda" CHECK (
        (demanda_locacao_id IS NOT NULL AND demanda_venda_id IS NULL) OR
        (demanda_locacao_id IS NULL AND demanda_venda_id IS NOT NULL) OR
        (demanda_locacao_id IS NULL AND demanda_venda_id IS NULL)
    )
);

-- Table: ranking_gamificacao
CREATE TABLE ranking_gamificacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captador_id UUID NOT NULL REFERENCES captadores(id) ON DELETE CASCADE,
    pontos_totais INTEGER NOT NULL DEFAULT 0,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pontos devem ser positivos" CHECK (pontos_totais >= 0),
    CONSTRAINT "Mês inválido" CHECK (mes >= 1 AND mes <= 12),
    CONSTRAINT "Ano inválido" CHECK (ano >= 2000),
    UNIQUE(captador_id, mes, ano)
);

-- Table: badges_obtidos
CREATE TABLE badges_obtidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captador_id UUID NOT NULL REFERENCES captadores(id) ON DELETE CASCADE,
    badge_nome VARCHAR(100) NOT NULL,
    data_obtencao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: webhook_queue
CREATE TABLE webhook_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_notificacao VARCHAR(100) NOT NULL,
    destinatario_whatsapp VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    tentativas INTEGER NOT NULL DEFAULT 0,
    erro_mensagem TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_envio TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tentativas devem ser positivas ou zero" CHECK (tentativas >= 0)
);

-- ==========================================
-- AUTOMATION & TRIGGERS
-- ==========================================

-- Function: Automatically set updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_captadores_updated_at BEFORE UPDATE ON captadores FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_demandas_locacao_updated_at BEFORE UPDATE ON demandas_locacao FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_demandas_vendas_updated_at BEFORE UPDATE ON demandas_vendas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_imoveis_captados_updated_at BEFORE UPDATE ON imoveis_captados FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_ranking_updated_at BEFORE UPDATE ON ranking_gamificacao FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_webhook_updated_at BEFORE UPDATE ON webhook_queue FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Function: Track actions for Gamification Engine
CREATE OR REPLACE FUNCTION add_gamification_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Add 10 points for each new captured property to the current month's ranking
    UPDATE ranking_gamificacao
    SET pontos_totais = pontos_totais + 10,
        updated_at = CURRENT_TIMESTAMP
    WHERE captador_id = NEW.captador_id
      AND mes = EXTRACT(MONTH FROM CURRENT_DATE)
      AND ano = EXTRACT(YEAR FROM CURRENT_DATE);

    IF NOT FOUND THEN
        INSERT INTO ranking_gamificacao (captador_id, pontos_totais, mes, ano)
        VALUES (NEW.captador_id, 10, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE));
    END IF;

    -- Optionally, also sync total points to the main captadores table
    UPDATE captadores
    SET pontos = pontos + 10
    WHERE id = NEW.captador_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_imovel_captado_points
AFTER INSERT ON imoveis_captados
FOR EACH ROW EXECUTE FUNCTION add_gamification_points();

-- ==========================================
-- INDEXING & PERFORMANCE
-- ==========================================

-- Auth Logs
CREATE INDEX idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);

-- Demandas Locação
CREATE INDEX idx_demandas_locacao_captador_id ON demandas_locacao(captador_id);
CREATE INDEX idx_demandas_locacao_localizacao ON demandas_locacao(localizacao);
CREATE INDEX idx_demandas_locacao_status ON demandas_locacao(status);
CREATE INDEX idx_demandas_locacao_data_criacao ON demandas_locacao(data_criacao);

-- Demandas Vendas
CREATE INDEX idx_demandas_vendas_captador_id ON demandas_vendas(captador_id);
CREATE INDEX idx_demandas_vendas_localizacao ON demandas_vendas(localizacao);
CREATE INDEX idx_demandas_vendas_status ON demandas_vendas(status);
CREATE INDEX idx_demandas_vendas_data_criacao ON demandas_vendas(data_criacao);

-- Imóveis Captados & Gamification
CREATE INDEX idx_imoveis_captados_captador_id ON imoveis_captados(captador_id);
CREATE INDEX idx_ranking_captador_id ON ranking_gamificacao(captador_id);
CREATE INDEX idx_badges_captador_id ON badges_obtidos(captador_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE captadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas_locacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE imoveis_captados ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_gamificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_obtidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;

-- Policies: Captadores
CREATE POLICY "Users can view all captadores" ON captadores FOR SELECT USING (true);
CREATE POLICY "Users can update own captador profile" ON captadores FOR UPDATE USING (auth.uid() = id);

-- Policies: Auth Audit Logs
CREATE POLICY "Gestores and Admins can view audit logs" ON auth_audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role IN ('gestor', 'admin'))
);

-- Policies: Demandas Locação
CREATE POLICY "View demandas locacao" ON demandas_locacao FOR SELECT USING (
    EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role IN ('sdr', 'gestor', 'admin')) OR
    captador_id = auth.uid()
);
CREATE POLICY "Captadores can insert demandas locacao" ON demandas_locacao FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Captadores can update assigned demandas locacao" ON demandas_locacao FOR UPDATE USING (
    captador_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role IN ('gestor', 'admin'))
);

-- Policies: Demandas Vendas
CREATE POLICY "View demandas vendas" ON demandas_vendas FOR SELECT USING (
    EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role IN ('corretor', 'gestor', 'admin')) OR
    captador_id = auth.uid()
);
CREATE POLICY "Captadores can insert demandas vendas" ON demandas_vendas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Captadores can update assigned demandas vendas" ON demandas_vendas FOR UPDATE USING (
    captador_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role IN ('gestor', 'admin'))
);

-- Policies: Imóveis Captados
CREATE POLICY "Anyone can view imoveis_captados" ON imoveis_captados FOR SELECT USING (true);
CREATE POLICY "Captadores can insert own imoveis_captados" ON imoveis_captados FOR INSERT WITH CHECK (captador_id = auth.uid());
CREATE POLICY "Captadores can update own imoveis_captados" ON imoveis_captados FOR UPDATE USING (captador_id = auth.uid());
CREATE POLICY "Captadores can delete own imoveis_captados" ON imoveis_captados FOR DELETE USING (captador_id = auth.uid());

-- Policies: Gamification & Badges
CREATE POLICY "Anyone can view ranking" ON ranking_gamificacao FOR SELECT USING (true);
CREATE POLICY "Anyone can view badges" ON badges_obtidos FOR SELECT USING (true);

-- Policies: Webhook Queue (Internal only)
CREATE POLICY "Only admins/gestores can manage webhooks" ON webhook_queue FOR ALL USING (
    EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role IN ('gestor', 'admin'))
);
