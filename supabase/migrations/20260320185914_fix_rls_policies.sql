DO $BLOCK$
BEGIN
  -- Fix Locacao
  DROP POLICY IF EXISTS "SDR sees own Locacao demands" ON public.demandas_locacao;
  CREATE POLICY "SDR sees own Locacao demands" ON public.demandas_locacao
  FOR SELECT TO authenticated USING (
    sdr_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor', 'captador'))
  );

  -- Fix Vendas
  DROP POLICY IF EXISTS "Broker sees own Vendas demands" ON public.demandas_vendas;
  CREATE POLICY "Broker sees own Vendas demands" ON public.demandas_vendas
  FOR SELECT TO authenticated USING (
    corretor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor', 'captador'))
  );

  -- Fix Imoveis Captados access for SDR
  DROP POLICY IF EXISTS "SDRs see captures linked to own locacao demands" ON public.imoveis_captados;
  CREATE POLICY "SDRs see captures linked to own locacao demands" ON public.imoveis_captados
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.demandas_locacao dl 
      WHERE dl.id = imoveis_captados.demanda_locacao_id AND dl.sdr_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor', 'captador'))
  );

  -- Fix Imoveis Captados access for Broker
  DROP POLICY IF EXISTS "Corretores see captures linked to own vendas demands" ON public.imoveis_captados;
  CREATE POLICY "Corretores see captures linked to own vendas demands" ON public.imoveis_captados
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.demandas_vendas dv 
      WHERE dv.id = imoveis_captados.demanda_venda_id AND dv.corretor_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor', 'captador'))
  );

  -- Allow SDRs to update captures linked to their demands (Validate/Reject functionality)
  DROP POLICY IF EXISTS "SDRs update captures linked to own locacao demands" ON public.imoveis_captados;
  CREATE POLICY "SDRs update captures linked to own locacao demands" ON public.imoveis_captados
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.demandas_locacao dl 
      WHERE dl.id = imoveis_captados.demanda_locacao_id AND dl.sdr_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.demandas_locacao dl 
      WHERE dl.id = imoveis_captados.demanda_locacao_id AND dl.sdr_id = auth.uid()
    )
  );

  -- Allow Brokers to update captures linked to their demands (Validate/Reject functionality)
  DROP POLICY IF EXISTS "Corretores update captures linked to own vendas demands" ON public.imoveis_captados;
  CREATE POLICY "Corretores update captures linked to own vendas demands" ON public.imoveis_captados
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.demandas_vendas dv 
      WHERE dv.id = imoveis_captados.demanda_venda_id AND dv.corretor_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.demandas_vendas dv 
      WHERE dv.id = imoveis_captados.demanda_venda_id AND dv.corretor_id = auth.uid()
    )
  );

END $BLOCK$;
