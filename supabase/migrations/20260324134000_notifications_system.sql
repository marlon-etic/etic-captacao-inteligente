-- Enum types for notifications
DO $ BEGIN
    CREATE TYPE notificacao_tipo AS ENUM ('nova_demanda', 'novo_imovel', 'imovel_capturado', 'status_atualizado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE notificacao_prioridade AS ENUM ('alta', 'normal', 'baixa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

-- Create notificacoes table
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo notificacao_tipo NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    dados_relacionados JSONB,
    lido BOOLEAN DEFAULT FALSE,
    prioridade notificacao_prioridade DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lido ON public.notificacoes(usuario_id, lido);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created ON public.notificacoes(created_at DESC);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Policies for notificacoes
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notificacoes;
CREATE POLICY "Users can view own notifications" ON public.notificacoes 
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notificacoes;
CREATE POLICY "Users can update own notifications" ON public.notificacoes 
    FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notificacoes;
CREATE POLICY "System can insert notifications" ON public.notificacoes 
    FOR INSERT WITH CHECK (true);

-- Trigger Function: Notify Nova Demanda
CREATE OR REPLACE FUNCTION public.notify_nova_demanda() RETURNS trigger AS $function$
DECLARE
    urgencia_text TEXT;
    prioridade_val notificacao_prioridade;
    cliente_nome TEXT;
    bairros_text TEXT;
    valor_max NUMERIC;
BEGIN
    IF TG_TABLE_NAME = 'demandas_locacao' THEN
        urgencia_text := NEW.nivel_urgencia;
        cliente_nome := NEW.nome_cliente;
        valor_max := NEW.valor_maximo;
    ELSE
        urgencia_text := NEW.nivel_urgencia;
        cliente_nome := NEW.nome_cliente;
        valor_max := NEW.valor_maximo;
    END IF;

    IF urgencia_text IN ('Urgente', 'Alta') THEN 
        prioridade_val := 'alta';
    ELSIF urgencia_text IN ('Baixa') THEN 
        prioridade_val := 'baixa';
    ELSE 
        prioridade_val := 'normal'; 
    END IF;

    bairros_text := array_to_string(NEW.bairros, ', ');

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT id, 'nova_demanda', 
           'Nova demanda: ' || COALESCE(cliente_nome, ''), 
           COALESCE(bairros_text, '') || ' - R$ ' || COALESCE(valor_max, 0),
           jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', CASE WHEN TG_TABLE_NAME = 'demandas_locacao' THEN 'Aluguel' ELSE 'Venda' END),
           prioridade_val
    FROM public.users WHERE role = 'captador';

    RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Notify Novo Imovel
CREATE OR REPLACE FUNCTION public.notify_novo_imovel() RETURNS trigger AS $function$
DECLARE
    demanda_owner UUID;
    cliente_nome TEXT;
BEGIN
    IF NEW.demanda_locacao_id IS NOT NULL THEN
        SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
        IF demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (demanda_owner, 'imovel_capturado', 'Imóvel capturado para ' || COALESCE(cliente_nome, 'Cliente'),
                    'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
                    jsonb_build_object('imovel_id', NEW.id, 'demanda_id', NEW.demanda_locacao_id), 'alta');
        END IF;
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
        SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
        IF demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (demanda_owner, 'imovel_capturado', 'Imóvel capturado para ' || COALESCE(cliente_nome, 'Cliente'),
                    'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
                    jsonb_build_object('imovel_id', NEW.id, 'demanda_id', NEW.demanda_venda_id), 'alta');
        END IF;
    ELSE
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        SELECT id, 'novo_imovel', 'Novo imóvel genérico',
               'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Localização: ' || COALESCE(NEW.endereco, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
               jsonb_build_object('imovel_id', NEW.id), 'normal'
        FROM public.users WHERE role = 'corretor';
    END IF;

    RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Notify Imovel Atualizado
CREATE OR REPLACE FUNCTION public.notify_imovel_atualizado() RETURNS trigger AS $function$
DECLARE
    demanda_owner UUID;
BEGIN
    IF NEW.etapa_funil IS DISTINCT FROM OLD.etapa_funil THEN
        IF NEW.demanda_locacao_id IS NOT NULL THEN
            SELECT sdr_id INTO demanda_owner FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
        ELSIF NEW.demanda_venda_id IS NOT NULL THEN
            SELECT corretor_id INTO demanda_owner FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
        END IF;

        IF demanda_owner IS NOT NULL THEN
            IF NEW.etapa_funil = 'visitado' THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                VALUES (demanda_owner, 'status_atualizado', 'Imóvel Visitado',
                        'Imóvel ' || COALESCE(NEW.codigo_imovel, '') || ' marcado como visitado.',
                        jsonb_build_object('imovel_id', NEW.id, 'demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal');
            ELSIF NEW.etapa_funil = 'fechado' THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                VALUES (demanda_owner, 'status_atualizado', 'Negócio Fechado! 🎉',
                        'Imóvel ' || COALESCE(NEW.codigo_imovel, '') || ' marcado como fechado!',
                        jsonb_build_object('imovel_id', NEW.id, 'demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'alta');
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Notify Resposta Captador
CREATE OR REPLACE FUNCTION public.notify_resposta_captador() RETURNS trigger AS $function$
DECLARE
    demanda_owner UUID;
    cliente_nome TEXT;
    captador_nome TEXT;
BEGIN
    IF NEW.resposta = 'nao_encontrei' THEN
        SELECT nome INTO captador_nome FROM public.users WHERE id = NEW.captador_id;
        IF NEW.demanda_locacao_id IS NOT NULL THEN
            SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
        ELSIF NEW.demanda_venda_id IS NOT NULL THEN
            SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
        END IF;

        IF demanda_owner IS NOT NULL THEN
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (demanda_owner, 'status_atualizado', 'Busca sem sucesso: ' || COALESCE(cliente_nome, 'Cliente'),
                    'Captador ' || COALESCE(captador_nome, '') || ' não encontrou imóvel. Motivo: ' || COALESCE(NEW.motivo, ''),
                    jsonb_build_object('demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal');
        END IF;
    END IF;
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;


-- Apply Triggers
DROP TRIGGER IF EXISTS trg_notify_nova_demanda_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_nova_demanda_locacao
AFTER INSERT ON public.demandas_locacao
FOR EACH ROW EXECUTE FUNCTION public.notify_nova_demanda();

DROP TRIGGER IF EXISTS trg_notify_nova_demanda_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_nova_demanda_vendas
AFTER INSERT ON public.demandas_vendas
FOR EACH ROW EXECUTE FUNCTION public.notify_nova_demanda();

DROP TRIGGER IF EXISTS trg_notify_novo_imovel ON public.imoveis_captados;
CREATE TRIGGER trg_notify_novo_imovel
AFTER INSERT ON public.imoveis_captados
FOR EACH ROW EXECUTE FUNCTION public.notify_novo_imovel();

DROP TRIGGER IF EXISTS trg_notify_imovel_atualizado ON public.imoveis_captados;
CREATE TRIGGER trg_notify_imovel_atualizado
AFTER UPDATE ON public.imoveis_captados
FOR EACH ROW EXECUTE FUNCTION public.notify_imovel_atualizado();

DROP TRIGGER IF EXISTS trg_notify_resposta_captador ON public.respostas_captador;
CREATE TRIGGER trg_notify_resposta_captador
AFTER INSERT ON public.respostas_captador
FOR EACH ROW EXECUTE FUNCTION public.notify_resposta_captador();

