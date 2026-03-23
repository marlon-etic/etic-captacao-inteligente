-- Adiciona a opção "ganho" ao status da demanda de locação
ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_status_demanda_check;
ALTER TABLE public.demandas_locacao ADD CONSTRAINT demandas_locacao_status_demanda_check 
CHECK (status_demanda IN ('aberta', 'atendida', 'impossivel', 'sem_resposta_24h', 'ganho'));

-- Adiciona a opção "ganho" ao status da demanda de vendas
ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS demandas_vendas_status_demanda_check;
ALTER TABLE public.demandas_vendas ADD CONSTRAINT demandas_vendas_status_demanda_check 
CHECK (status_demanda IN ('aberta', 'atendida', 'impossivel', 'sem_resposta_24h', 'ganho'));

-- Cria tabela de pontuação
CREATE TABLE IF NOT EXISTS public.pontuacao_captador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captador_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    demanda_locacao_id UUID REFERENCES public.demandas_locacao(id) ON DELETE CASCADE,
    demanda_venda_id UUID REFERENCES public.demandas_vendas(id) ON DELETE CASCADE,
    tipo_pontuacao TEXT NOT NULL CHECK (tipo_pontuacao IN ('captura_com_demanda', 'captura_sem_demanda', 'ganho_confirmado')),
    pontos INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativa RLS
ALTER TABLE public.pontuacao_captador ENABLE ROW LEVEL SECURITY;

-- Permite que todos os usuários autenticados vejam as pontuações (para montar o ranking)
DROP POLICY IF EXISTS "Authenticated users can read pontuacao" ON public.pontuacao_captador;
CREATE POLICY "Authenticated users can read pontuacao" ON public.pontuacao_captador 
    FOR SELECT TO authenticated USING (true);

-- Trigger: Pontuação ao capturar imóvel
CREATE OR REPLACE FUNCTION public.trg_pontuacao_imovel()
RETURNS TRIGGER AS $$
DECLARE
    cid UUID;
BEGIN
    -- Captura o ID do captador (tentando dois campos para maior segurança)
    cid := COALESCE(NEW.user_captador_id, NEW.captador_id);
    
    -- Se não houver captador associado, ignora
    IF cid IS NULL THEN
        RETURN NEW;
    END IF;

    -- Se tem demanda de locação vinculada (+10 pontos)
    IF NEW.demanda_locacao_id IS NOT NULL THEN
        INSERT INTO public.pontuacao_captador (captador_id, demanda_locacao_id, tipo_pontuacao, pontos)
        VALUES (cid, NEW.demanda_locacao_id, 'captura_com_demanda', 10);
        
    -- Se tem demanda de venda vinculada (+10 pontos)
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
        INSERT INTO public.pontuacao_captador (captador_id, demanda_venda_id, tipo_pontuacao, pontos)
        VALUES (cid, NEW.demanda_venda_id, 'captura_com_demanda', 10);
        
    -- Sem demanda vinculada (+3 pontos)
    ELSE
        INSERT INTO public.pontuacao_captador (captador_id, tipo_pontuacao, pontos)
        VALUES (cid, 'captura_sem_demanda', 3);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pontuacao_imovel_trigger ON public.imoveis_captados;
CREATE TRIGGER pontuacao_imovel_trigger
AFTER INSERT ON public.imoveis_captados
FOR EACH ROW EXECUTE FUNCTION public.trg_pontuacao_imovel();

-- Trigger: Pontuação bônus quando demanda de Locação é marcada como "ganho"
CREATE OR REPLACE FUNCTION public.trg_pontuacao_ganho_locacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status_demanda = 'ganho' AND OLD.status_demanda != 'ganho' THEN
        INSERT INTO public.pontuacao_captador (captador_id, demanda_locacao_id, tipo_pontuacao, pontos)
        SELECT DISTINCT COALESCE(user_captador_id, captador_id), NEW.id, 'ganho_confirmado', 30
        FROM public.imoveis_captados
        WHERE demanda_locacao_id = NEW.id AND COALESCE(user_captador_id, captador_id) IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pontuacao_ganho_locacao_trigger ON public.demandas_locacao;
CREATE TRIGGER pontuacao_ganho_locacao_trigger
AFTER UPDATE ON public.demandas_locacao
FOR EACH ROW EXECUTE FUNCTION public.trg_pontuacao_ganho_locacao();

-- Trigger: Pontuação bônus quando demanda de Vendas é marcada como "ganho"
CREATE OR REPLACE FUNCTION public.trg_pontuacao_ganho_vendas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status_demanda = 'ganho' AND OLD.status_demanda != 'ganho' THEN
        INSERT INTO public.pontuacao_captador (captador_id, demanda_venda_id, tipo_pontuacao, pontos)
        SELECT DISTINCT COALESCE(user_captador_id, captador_id), NEW.id, 'ganho_confirmado', 30
        FROM public.imoveis_captados
        WHERE demanda_venda_id = NEW.id AND COALESCE(user_captador_id, captador_id) IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pontuacao_ganho_vendas_trigger ON public.demandas_vendas;
CREATE TRIGGER pontuacao_ganho_vendas_trigger
AFTER UPDATE ON public.demandas_vendas
FOR EACH ROW EXECUTE FUNCTION public.trg_pontuacao_ganho_vendas();
