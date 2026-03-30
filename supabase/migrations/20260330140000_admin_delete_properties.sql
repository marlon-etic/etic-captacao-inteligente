DO $$
BEGIN
  DROP POLICY IF EXISTS "Admin can delete captures" ON public.imoveis_captados;
END
$$;

CREATE POLICY "Admin can delete captures" ON public.imoveis_captados
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DO $$
BEGIN
  -- Check and update visitas_agendadas if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visitas_agendadas') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' AND table_name = 'visitas_agendadas' AND constraint_name = 'visitas_agendadas_imovel_id_fkey'
    ) THEN
      ALTER TABLE public.visitas_agendadas DROP CONSTRAINT visitas_agendadas_imovel_id_fkey;
    END IF;
    
    BEGIN
      ALTER TABLE public.visitas_agendadas ADD CONSTRAINT visitas_agendadas_imovel_id_fkey 
        FOREIGN KEY (imovel_id) REFERENCES public.imoveis_captados(id) ON DELETE CASCADE;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;

  -- Check and update negocios_fechados if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'negocios_fechados') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' AND table_name = 'negocios_fechados' AND constraint_name = 'negocios_fechados_imovel_id_fkey'
    ) THEN
      ALTER TABLE public.negocios_fechados DROP CONSTRAINT negocios_fechados_imovel_id_fkey;
    END IF;
    
    BEGIN
      ALTER TABLE public.negocios_fechados ADD CONSTRAINT negocios_fechados_imovel_id_fkey 
        FOREIGN KEY (imovel_id) REFERENCES public.imoveis_captados(id) ON DELETE CASCADE;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;
END;
$$;
