-- Create campanhas table
CREATE TABLE IF NOT EXISTS public.campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_imovel TEXT NOT NULL CHECK (tipo_imovel IN ('apartamento', 'casa', 'galpao', 'comercial')),
    faixa_valor_min NUMERIC(12,2) NOT NULL DEFAULT 0,
    faixa_valor_max NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'fechada')),
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_fim TIMESTAMPTZ NOT NULL,
    meta INTEGER NOT NULL DEFAULT 5,
    progresso INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_faixa_valor CHECK (faixa_valor_max > faixa_valor_min),
    CONSTRAINT check_data_fim CHECK (data_fim > data_inicio)
);

-- Create campanhas_imoveis table
CREATE TABLE IF NOT EXISTS public.campanhas_imoveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campanha_id UUID NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
    imovel_id UUID NOT NULL REFERENCES public.imoveis_captados(id) ON DELETE CASCADE,
    captador_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    data_adicionado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campanha_id, imovel_id)
);

-- Create campanhas_historico table
CREATE TABLE IF NOT EXISTS public.campanhas_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campanha_id UUID NOT NULL,
    tipo_imovel TEXT NOT NULL,
    faixa_valor JSONB NOT NULL,
    total_imoveis INTEGER NOT NULL DEFAULT 0,
    total_captadores INTEGER NOT NULL DEFAULT 0,
    data_fechamento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON public.campanhas(status);
CREATE INDEX IF NOT EXISTS idx_campanhas_tipo_imovel ON public.campanhas(tipo_imovel);
CREATE INDEX IF NOT EXISTS idx_campanhas_imoveis_campanha_id ON public.campanhas_imoveis(campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_imoveis_imovel_id ON public.campanhas_imoveis(imovel_id);

-- Enable RLS
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas_imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas_historico ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campanhas
DROP POLICY IF EXISTS "authenticated_select_campanhas" ON public.campanhas;
CREATE POLICY "authenticated_select_campanhas" ON public.campanhas
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_campanhas" ON public.campanhas;
CREATE POLICY "admin_manage_campanhas" ON public.campanhas
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for campanhas_imoveis
DROP POLICY IF EXISTS "authenticated_select_campanhas_imoveis" ON public.campanhas_imoveis;
CREATE POLICY "authenticated_select_campanhas_imoveis" ON public.campanhas_imoveis
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_campanhas_imoveis" ON public.campanhas_imoveis;
CREATE POLICY "admin_manage_campanhas_imoveis" ON public.campanhas_imoveis
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies for campanhas_historico
DROP POLICY IF EXISTS "authenticated_select_campanhas_historico" ON public.campanhas_historico;
CREATE POLICY "authenticated_select_campanhas_historico" ON public.campanhas_historico
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_campanhas_historico" ON public.campanhas_historico;
CREATE POLICY "admin_manage_campanhas_historico" ON public.campanhas_historico
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_campanhas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_campanhas_updated_at ON public.campanhas;
CREATE TRIGGER update_campanhas_updated_at
    BEFORE UPDATE ON public.campanhas
    FOR EACH ROW EXECUTE FUNCTION public.set_campanhas_updated_at();

-- Auto-match: when imovel is inserted, find matching active campaigns
CREATE OR REPLACE FUNCTION public.fn_match_imovel_to_campanhas()
RETURNS TRIGGER AS $$
DECLARE
    c RECORD;
    v_tipo_normalized TEXT;
    v_preco NUMERIC;
BEGIN
    v_preco := COALESCE(NEW.preco, NEW.valor, 0);
    
    v_tipo_normalized := LOWER(TRIM(COALESCE(NEW.tipo_imovel, '')));
    IF v_tipo_normalized LIKE '%apart%' THEN
        v_tipo_normalized := 'apartamento';
    ELSIF v_tipo_normalized LIKE '%casa%' OR v_tipo_normalized LIKE '%sobrado%' THEN
        v_tipo_normalized := 'casa';
    ELSIF v_tipo_normalizado LIKE '%galp%' THEN
        v_tipo_normalized := 'galpao';
    ELSIF v_tipo_normalizado LIKE '%comer%' OR v_tipo_normalizado LIKE '%sala%' OR v_tipo_normalizado LIKE '%predio%' THEN
        v_tipo_normalizado := 'comercial';
    END IF;

    FOR c IN
        SELECT id FROM public.campanhas
        WHERE status = 'ativa'
          AND tipo_imovel = v_tipo_normalized
          AND v_preco >= faixa_valor_min
          AND v_preco <= faixa_valor_max
    LOOP
        INSERT INTO public.campanhas_imoveis (campanha_id, imovel_id, captador_id)
        VALUES (c.id, NEW.id, COALESCE(NEW.user_captador_id, NEW.captador_id))
        ON CONFLICT (campanha_id, imovel_id) DO NOTHING;

        IF FOUND THEN
            UPDATE public.campanhas
            SET progresso = progresso + 1
            WHERE id = c.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_match_imovel_campanhas ON public.imoveis_captados;
CREATE TRIGGER trg_match_imovel_campanhas
    AFTER INSERT ON public.imoveis_captados
    FOR EACH ROW EXECUTE FUNCTION public.fn_match_imovel_to_campanhas();

-- Auto-close expired campaigns
CREATE OR REPLACE FUNCTION public.fn_close_expired_campanhas()
RETURNS void AS $$
DECLARE
    c RECORD;
    v_total_captadores INTEGER;
BEGIN
    FOR c IN
        SELECT id, tipo_imovel, faixa_valor_min, faixa_valor_max, progresso
        FROM public.campanhas
        WHERE status IN ('ativa', 'pausada')
          AND data_fim < NOW()
    LOOP
        SELECT COUNT(DISTINCT captador_id) INTO v_total_captadores
        FROM public.campanhas_imoveis
        WHERE campanha_id = c.id;

        INSERT INTO public.campanhas_historico (campanha_id, tipo_imovel, faixa_valor, total_imoveis, total_captadores)
        VALUES (c.id, c.tipo_imovel, jsonb_build_object('min', c.faixa_valor_min, 'max', c.faixa_valor_max), c.progresso, v_total_captadores);

        UPDATE public.campanhas SET status = 'fechada' WHERE id = c.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime
DO $BLOCK$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'campanhas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campanhas;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $BLOCK$;

DO $BLOCK$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'campanhas_imoveis'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campanhas_imoveis;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $BLOCK$;
