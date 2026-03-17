-- Migration for Internal Group Chat Comments

CREATE TABLE IF NOT EXISTS comentarios_grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos_demandas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_usuario TEXT NOT NULL,
    papel_usuario VARCHAR(50) NOT NULL,
    conteudo TEXT NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE comentarios_grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comentarios_grupos" ON comentarios_grupos FOR SELECT USING (true);

CREATE POLICY "Captadores, SDRs and Managers can insert comentarios_grupos" ON comentarios_grupos FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role IN ('captador', 'sdr', 'corretor', 'gestor', 'admin'))
);
