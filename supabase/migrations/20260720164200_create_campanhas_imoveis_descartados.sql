CREATE TABLE IF NOT EXISTS public.campanhas_imoveis_descartados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campanha_id UUID NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
    imovel_id UUID NOT NULL REFERENCES public.imoveis_captados(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campanha_id, imovel_id)
);

CREATE INDEX IF NOT EXISTS idx_campanhas_imoveis_descartados_campanha_id
    ON public.campanhas_imoveis_descartados(campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_imoveis_descartados_imovel_id
    ON public.campanhas_imoveis_descartados(imovel_id);

ALTER TABLE public.campanhas_imoveis_descartados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_campanhas_imoveis_descartados" ON public.campanhas_imoveis_descartados;
CREATE POLICY "authenticated_select_campanhas_imoveis_descartados" ON public.campanhas_imoveis_descartados
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_gestor_manage_campanhas_imoveis_descartados" ON public.campanhas_imoveis_descartados;
CREATE POLICY "admin_gestor_manage_campanhas_imoveis_descartados" ON public.campanhas_imoveis_descartados
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
    );

DO $BLOCK$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'campanhas_imoveis_descartados'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campanhas_imoveis_descartados;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $BLOCK$;
