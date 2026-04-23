CREATE TABLE IF NOT EXISTS public.matches_sugestoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL REFERENCES public.imoveis_captados(id) ON DELETE CASCADE,
  demanda_id UUID NOT NULL,
  demanda_tipo TEXT NOT NULL CHECK (demanda_tipo IN ('Venda', 'Locação', 'Aluguel')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'rejeitado', 'vinculado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(imovel_id, demanda_id, demanda_tipo)
);

CREATE INDEX IF NOT EXISTS idx_matches_sugestoes_imovel ON public.matches_sugestoes(imovel_id);
CREATE INDEX IF NOT EXISTS idx_matches_sugestoes_demanda ON public.matches_sugestoes(demanda_id);
CREATE INDEX IF NOT EXISTS idx_matches_sugestoes_status ON public.matches_sugestoes(status);
CREATE INDEX IF NOT EXISTS idx_matches_sugestoes_score ON public.matches_sugestoes(score DESC);

ALTER TABLE public.matches_sugestoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view matches" ON public.matches_sugestoes;
CREATE POLICY "Anyone can view matches"
  ON public.matches_sugestoes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System only insert/update matches" ON public.matches_sugestoes;
CREATE POLICY "System only insert/update matches"
  ON public.matches_sugestoes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "System only update matches" ON public.matches_sugestoes;
CREATE POLICY "System only update matches"
  ON public.matches_sugestoes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete matches" ON public.matches_sugestoes;
CREATE POLICY "Anyone can delete matches"
  ON public.matches_sugestoes
  FOR DELETE
  TO authenticated
  USING (true);
