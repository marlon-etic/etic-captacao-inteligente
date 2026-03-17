-- Migration for Grupos de Demandas (Grouping Engine)

CREATE TABLE IF NOT EXISTS grupos_demandas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bairro TEXT NOT NULL,
    tipologia TEXT,
    preco_minimo_group DECIMAL(12,2) NOT NULL,
    preco_maximo_group DECIMAL(12,2) NOT NULL,
    dormitorios INTEGER NOT NULL,
    vagas INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('locacao', 'vendas')),
    total_demandas_ativas INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE demandas_locacao 
    ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos_demandas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS posicao_no_grupo INTEGER;

ALTER TABLE demandas_vendas 
    ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos_demandas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS posicao_no_grupo INTEGER;

-- Trigger to update updated_at for grupos_demandas
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_grupos_demandas_updated_at ON grupos_demandas;
CREATE TRIGGER update_grupos_demandas_updated_at BEFORE UPDATE ON grupos_demandas FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE grupos_demandas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view grupos_demandas" ON grupos_demandas FOR SELECT USING (true);
CREATE POLICY "Captadores and Managers can update grupos_demandas" ON grupos_demandas FOR ALL USING (
    EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role IN ('captador', 'gestor', 'admin'))
);
