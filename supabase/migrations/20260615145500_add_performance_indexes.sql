-- Indexes for optimizing SDR and Corretor demands queries
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_sdr_id ON public.demandas_locacao(sdr_id);
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_corretor_id ON public.demandas_vendas(corretor_id);

-- Index for ordering property searches by latest registrations
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_created_at_desc ON public.imoveis_captados(created_at DESC);

-- Indexes for realtime relationship resolutions (linking properties to demands)
CREATE INDEX IF NOT EXISTS idx_prazos_captacao_demanda_loc_id ON public.prazos_captacao(demanda_locacao_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_demanda_loc_id ON public.imoveis_captados(demanda_locacao_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_demanda_ven_id ON public.imoveis_captados(demanda_venda_id);

-- Index for filtering by status (optimizing active/vencidas tabs)
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_status ON public.demandas_locacao(status_demanda);
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_status ON public.demandas_vendas(status_demanda);
