DO $BLOCK$
BEGIN
  -- Drop existing insert policies to avoid conflicts
  DROP POLICY IF EXISTS "SDRs insert locacao" ON public.demandas_locacao;
  DROP POLICY IF EXISTS "SDR insert rental demands" ON public.demandas_locacao;

  -- Create the correct policy allowing SDRs to insert their own demands
  CREATE POLICY "SDRs insert locacao" ON public.demandas_locacao
  FOR INSERT TO authenticated
  WITH CHECK (
    sdr_id = auth.uid() AND (
      (auth.jwt() ->> 'role' = 'sdr') OR 
      (auth.jwt() -> 'user_metadata' ->> 'role' = 'sdr') OR 
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'sdr')
    )
  );
END $BLOCK$;
