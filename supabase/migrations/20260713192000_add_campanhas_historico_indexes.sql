-- Add indexes for campaign history dashboard performance
CREATE INDEX IF NOT EXISTS idx_campanhas_historico_data_fechamento
    ON public.campanhas_historico(data_fechamento);

CREATE INDEX IF NOT EXISTS idx_campanhas_historico_campanha_id
    ON public.campanhas_historico(campanha_id);

CREATE INDEX IF NOT EXISTS idx_campanhas_status_fechada_created
    ON public.campanhas(status, created_at DESC);
