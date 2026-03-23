ALTER TABLE public.respostas_captador ADD COLUMN IF NOT EXISTS observacao TEXT;

DROP POLICY IF EXISTS "Captadores insert respostas" ON public.respostas_captador;
CREATE POLICY "Captadores insert respostas" ON public.respostas_captador 
  FOR INSERT TO authenticated 
  WITH CHECK (captador_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated read respostas" ON public.respostas_captador;
CREATE POLICY "Authenticated read respostas" ON public.respostas_captador 
  FOR SELECT TO authenticated 
  USING (true);
