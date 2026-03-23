-- supabase/migrations/20260323234105_add_prazos_captacao.sql

CREATE TABLE IF NOT EXISTS public.prazos_captacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demanda_locacao_id UUID REFERENCES public.demandas_locacao(id) ON DELETE CASCADE,
    demanda_venda_id UUID REFERENCES public.demandas_vendas(id) ON DELETE CASCADE,
    captador_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    prazo_resposta TIMESTAMPTZ NOT NULL,
    prorrogacoes_usadas INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'vencido', 'respondido', 'sem_resposta_24h', 'sem_resposta_final')),
    CONSTRAINT check_demanda_link_prazos CHECK (
        (demanda_locacao_id IS NOT NULL AND demanda_venda_id IS NULL) OR
        (demanda_locacao_id IS NULL AND demanda_venda_id IS NOT NULL)
    )
);

ALTER TABLE public.prazos_captacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can read prazos" ON public.prazos_captacao;
CREATE POLICY "All users can read prazos" ON public.prazos_captacao FOR SELECT USING (true);

DROP POLICY IF EXISTS "Captadores can insert prazos" ON public.prazos_captacao;
CREATE POLICY "Captadores can insert prazos" ON public.prazos_captacao FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Captadores can update prazos" ON public.prazos_captacao;
CREATE POLICY "Captadores can update prazos" ON public.prazos_captacao FOR UPDATE USING (true);

-- Trigger to automatically create prazo on new demand
CREATE OR REPLACE FUNCTION public.criar_prazo_captacao()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'demandas_locacao' THEN
        INSERT INTO public.prazos_captacao (demanda_locacao_id, prazo_resposta)
        VALUES (NEW.id, NOW() + INTERVAL '24 hours');
    ELSIF TG_TABLE_NAME = 'demandas_vendas' THEN
        INSERT INTO public.prazos_captacao (demanda_venda_id, prazo_resposta)
        VALUES (NEW.id, NOW() + INTERVAL '24 hours');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS criar_prazo_locacao_trigger ON public.demandas_locacao;
CREATE TRIGGER criar_prazo_locacao_trigger
AFTER INSERT ON public.demandas_locacao
FOR EACH ROW EXECUTE FUNCTION public.criar_prazo_captacao();

DROP TRIGGER IF EXISTS criar_prazo_vendas_trigger ON public.demandas_vendas;
CREATE TRIGGER criar_prazo_vendas_trigger
AFTER INSERT ON public.demandas_vendas
FOR EACH ROW EXECUTE FUNCTION public.criar_prazo_captacao();

-- Triggers for marking as respondido when captador answers
CREATE OR REPLACE FUNCTION public.marcar_prazo_respondido_resposta()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for fora do perfil, fora do mercado ou outro, nós consideramos respondido.
    -- Se for 'Buscando outras opções', continua contando.
    IF NEW.resposta = 'encontrei' OR (NEW.resposta = 'nao_encontrei' AND NEW.motivo != 'Buscando outras opções') THEN
        IF NEW.demanda_locacao_id IS NOT NULL THEN
            UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_locacao_id = NEW.demanda_locacao_id;
        ELSIF NEW.demanda_venda_id IS NOT NULL THEN
            UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_venda_id = NEW.demanda_venda_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS marcar_prazo_resposta_trigger ON public.respostas_captador;
CREATE TRIGGER marcar_prazo_resposta_trigger
AFTER INSERT ON public.respostas_captador
FOR EACH ROW EXECUTE FUNCTION public.marcar_prazo_respondido_resposta();

CREATE OR REPLACE FUNCTION public.marcar_prazo_respondido_imovel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.demanda_locacao_id IS NOT NULL THEN
        UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_locacao_id = NEW.demanda_locacao_id;
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
        UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_venda_id = NEW.demanda_venda_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS marcar_prazo_imovel_trigger ON public.imoveis_captados;
CREATE TRIGGER marcar_prazo_imovel_trigger
AFTER INSERT ON public.imoveis_captados
FOR EACH ROW EXECUTE FUNCTION public.marcar_prazo_respondido_imovel();

-- RPC Function for manual triggering
CREATE OR REPLACE FUNCTION public.atualizar_prazos_vencidos()
RETURNS void AS $$
BEGIN
    UPDATE public.prazos_captacao
    SET status = 'sem_resposta_24h'
    WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas = 0;
    
    UPDATE public.prazos_captacao
    SET status = 'sem_resposta_final'
    WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas >= 3;

    UPDATE public.prazos_captacao
    SET status = 'vencido'
    WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas > 0 AND prorrogacoes_usadas < 3;

    UPDATE public.demandas_locacao dl
    SET status_demanda = 'sem_resposta_24h'
    FROM public.prazos_captacao pc
    WHERE dl.id = pc.demanda_locacao_id AND pc.status IN ('sem_resposta_24h', 'sem_resposta_final') AND dl.status_demanda = 'aberta';

    UPDATE public.demandas_vendas dv
    SET status_demanda = 'sem_resposta_24h'
    FROM public.prazos_captacao pc
    WHERE dv.id = pc.demanda_venda_id AND pc.status IN ('sem_resposta_24h', 'sem_resposta_final') AND dv.status_demanda = 'aberta';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert for existing open demands
INSERT INTO public.prazos_captacao (demanda_locacao_id, prazo_resposta)
SELECT id, created_at + INTERVAL '24 hours' FROM public.demandas_locacao
WHERE status_demanda = 'aberta' AND NOT EXISTS (SELECT 1 FROM public.prazos_captacao WHERE demanda_locacao_id = public.demandas_locacao.id);

INSERT INTO public.prazos_captacao (demanda_venda_id, prazo_resposta)
SELECT id, created_at + INTERVAL '24 hours' FROM public.demandas_vendas
WHERE status_demanda = 'aberta' AND NOT EXISTS (SELECT 1 FROM public.prazos_captacao WHERE demanda_venda_id = public.demandas_vendas.id);

-- Setup pg_cron if available
DO $B$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('check_prazos_vencidos');
      PERFORM cron.schedule('check_prazos_vencidos', '* * * * *', $$
        SELECT public.atualizar_prazos_vencidos();
      $$);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to schedule cron job.';
    END;
  END IF;
END $B$;
