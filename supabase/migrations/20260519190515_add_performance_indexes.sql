-- Table demandas_locacao
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_created_at_desc ON public.demandas_locacao USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_status_demanda ON public.demandas_locacao USING btree (status_demanda);
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_sdr_id ON public.demandas_locacao USING btree (sdr_id);

-- Table demandas_vendas
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_created_at_desc ON public.demandas_vendas USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_status_demanda ON public.demandas_vendas USING btree (status_demanda);
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_corretor_id ON public.demandas_vendas USING btree (corretor_id);

-- Table imoveis_captados
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_user_captador_id ON public.imoveis_captados USING btree (user_captador_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_demanda_locacao_id ON public.imoveis_captados USING btree (demanda_locacao_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_demanda_venda_id ON public.imoveis_captados USING btree (demanda_venda_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_created_at_desc ON public.imoveis_captados USING btree (created_at DESC);

-- Table notificacoes
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON public.notificacoes USING btree (usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lido ON public.notificacoes USING btree (lido);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at_desc ON public.notificacoes USING btree (created_at DESC);
