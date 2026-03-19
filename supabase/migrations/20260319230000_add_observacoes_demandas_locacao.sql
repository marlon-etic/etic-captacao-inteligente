-- Add new columns for the ModalDemandaLocacao features
ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS tipo_demanda VARCHAR(50) DEFAULT 'Aluguel';

-- Ensure SDRs have INSERT permissions on demandas_locacao
DROP POLICY IF EXISTS "SDRs insert locacao" ON public.demandas_locacao;
CREATE POLICY "SDRs insert locacao" ON public.demandas_locacao
  FOR INSERT TO authenticated
  WITH CHECK (
    sdr_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sdr')
  );
