DO $$
BEGIN
  -- Permite que os captadores atualizem as informações de seus próprios imóveis captados
  DROP POLICY IF EXISTS "Captadores update own captures" ON public.imoveis_captados;
  CREATE POLICY "Captadores update own captures" ON public.imoveis_captados
    FOR UPDATE TO authenticated
    USING (user_captador_id = auth.uid() OR captador_id = auth.uid())
    WITH CHECK (user_captador_id = auth.uid() OR captador_id = auth.uid());
END $$;
