DO $$
BEGIN
  -- Garante que o admin tenha delete explícito na RLS
  DROP POLICY IF EXISTS "Admin can delete captures" ON public.imoveis_captados;
  CREATE POLICY "Admin can delete captures" ON public.imoveis_captados
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

  -- Garante que o admin tenha update explícito na RLS (para a edição)
  DROP POLICY IF EXISTS "Admin can update captures" ON public.imoveis_captados;
  CREATE POLICY "Admin can update captures" ON public.imoveis_captados
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

  -- Cascade deletes nas tabelas dependentes se existirem
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visitas_agendadas') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' AND table_name = 'visitas_agendadas' AND constraint_name = 'visitas_agendadas_imovel_id_fkey'
    ) THEN
      ALTER TABLE public.visitas_agendadas DROP CONSTRAINT visitas_agendadas_imovel_id_fkey;
      ALTER TABLE public.visitas_agendadas ADD CONSTRAINT visitas_agendadas_imovel_id_fkey 
        FOREIGN KEY (imovel_id) REFERENCES public.imoveis_captados(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'negocios_fechados') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' AND table_name = 'negocios_fechados' AND constraint_name = 'negocios_fechados_imovel_id_fkey'
    ) THEN
      ALTER TABLE public.negocios_fechados DROP CONSTRAINT negocios_fechados_imovel_id_fkey;
      ALTER TABLE public.negocios_fechados ADD CONSTRAINT negocios_fechados_imovel_id_fkey 
        FOREIGN KEY (imovel_id) REFERENCES public.imoveis_captados(id) ON DELETE CASCADE;
    END IF;
  END IF;
END;
$$;
