DO $$
BEGIN

CREATE TABLE IF NOT EXISTS public.visitas_imovel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demanda_id UUID NOT NULL,
    tipo_demanda TEXT NOT NULL CHECK (tipo_demanda IN ('Locação', 'Venda')),
    imovel_id UUID,
    novo_imovel_endereco TEXT,
    novo_imovel_valor NUMERIC,
    user_sdr_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_visita TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    qtd_imoveis_visitados INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fechamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demanda_id UUID NOT NULL,
    tipo_demanda TEXT NOT NULL CHECK (tipo_demanda IN ('Locação', 'Venda')),
    imovel_id UUID,
    user_sdr_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valor NUMERIC NOT NULL,
    data_prevista DATE,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resumo_diario_sdr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    novos_clientes INTEGER DEFAULT 0,
    visitas INTEGER DEFAULT 0,
    fechamentos INTEGER DEFAULT 0,
    conversao_pct NUMERIC DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, data)
);

CREATE INDEX IF NOT EXISTS idx_visitas_imovel_user ON public.visitas_imovel(user_sdr_id);
CREATE INDEX IF NOT EXISTS idx_fechamentos_user ON public.fechamentos(user_sdr_id);
CREATE INDEX IF NOT EXISTS idx_resumo_diario_sdr_user_data ON public.resumo_diario_sdr(user_id, data);

ALTER TABLE public.visitas_imovel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumo_diario_sdr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own visitas" ON public.visitas_imovel;
CREATE POLICY "Users can view own visitas" ON public.visitas_imovel 
FOR SELECT USING (user_sdr_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor')));

DROP POLICY IF EXISTS "Users can insert own visitas" ON public.visitas_imovel;
CREATE POLICY "Users can insert own visitas" ON public.visitas_imovel 
FOR INSERT WITH CHECK (user_sdr_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own fechamentos" ON public.fechamentos;
CREATE POLICY "Users can view own fechamentos" ON public.fechamentos 
FOR SELECT USING (user_sdr_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor')));

DROP POLICY IF EXISTS "Users can insert own fechamentos" ON public.fechamentos;
CREATE POLICY "Users can insert own fechamentos" ON public.fechamentos 
FOR INSERT WITH CHECK (user_sdr_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own resumo" ON public.resumo_diario_sdr;
CREATE POLICY "Users can view own resumo" ON public.resumo_diario_sdr 
FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor')));

DROP POLICY IF EXISTS "Users can insert own resumo" ON public.resumo_diario_sdr;
CREATE POLICY "Users can insert own resumo" ON public.resumo_diario_sdr 
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own resumo" ON public.resumo_diario_sdr;
CREATE POLICY "Users can update own resumo" ON public.resumo_diario_sdr 
FOR UPDATE USING (user_id = auth.uid());

END $$;
