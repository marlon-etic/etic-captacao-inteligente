DO $$
BEGIN
  DELETE FROM public.visitas_imovel
  WHERE imovel_id IS NOT NULL
    AND imovel_id NOT IN (SELECT id FROM public.imoveis_captados);

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visitas_imovel_imovel_id_fkey'
  ) THEN
    ALTER TABLE public.visitas_imovel
      ADD CONSTRAINT visitas_imovel_imovel_id_fkey
      FOREIGN KEY (imovel_id) REFERENCES public.imoveis_captados(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.visitas_imovel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_visitas_imovel" ON public.visitas_imovel;
CREATE POLICY "authenticated_select_visitas_imovel" ON public.visitas_imovel
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_visitas_imovel" ON public.visitas_imovel;
CREATE POLICY "authenticated_insert_visitas_imovel" ON public.visitas_imovel
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_visitas_imovel" ON public.visitas_imovel;
CREATE POLICY "authenticated_update_visitas_imovel" ON public.visitas_imovel
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_visitas_imovel" ON public.visitas_imovel;
CREATE POLICY "authenticated_delete_visitas_imovel" ON public.visitas_imovel
  FOR DELETE TO authenticated USING (true);
