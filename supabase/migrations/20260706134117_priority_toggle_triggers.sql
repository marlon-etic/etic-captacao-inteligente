-- Migration: Priority toggle triggers - notifications, prazo creation, and seed user
-- Handles: is_prioritaria toggle → prazo_captacao (24h) + notifications to captadores

-- Add motivo_priorizacao column if not exists
ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS motivo_priorizacao TEXT;
ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS motivo_priorizacao TEXT;

-- Trigger function: handle priority toggle
CREATE OR REPLACE FUNCTION public.handle_prioridade_toggle()
RETURNS TRIGGER AS $$
DECLARE
    v_captador RECORD;
    v_prazo_exists BOOLEAN;
    v_cliente_nome TEXT;
    v_tipo_demanda TEXT;
BEGIN
    IF TG_TABLE_NAME = 'demandas_locacao' THEN
        v_tipo_demanda := 'Aluguel';
    ELSE
        v_tipo_demanda := 'Venda';
    END IF;

    -- Priority ACTIVATED
    IF (NEW.is_prioritaria = true AND (OLD.is_prioritaria = false OR OLD.is_prioritaria IS NULL)) THEN
        v_cliente_nome := COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'Cliente');

        -- Create or update prazo_captacao with 24h deadline
        IF TG_TABLE_NAME = 'demandas_locacao' THEN
            SELECT EXISTS(
                SELECT 1 FROM public.prazos_captacao WHERE demanda_locacao_id = NEW.id
            ) INTO v_prazo_exists;

            IF v_prazo_exists THEN
                UPDATE public.prazos_captacao
                SET prazo_resposta = NOW() + INTERVAL '24 hours',
                    status = 'ativo',
                    prorrogacoes_usadas = 0
                WHERE demanda_locacao_id = NEW.id;
            ELSE
                INSERT INTO public.prazos_captacao (demanda_locacao_id, prazo_resposta, status)
                VALUES (NEW.id, NOW() + INTERVAL '24 hours', 'ativo');
            END IF;
        ELSIF TG_TABLE_NAME = 'demandas_vendas' THEN
            SELECT EXISTS(
                SELECT 1 FROM public.prazos_captacao WHERE demanda_venda_id = NEW.id
            ) INTO v_prazo_exists;

            IF v_prazo_exists THEN
                UPDATE public.prazos_captacao
                SET prazo_resposta = NOW() + INTERVAL '24 hours',
                    status = 'ativo',
                    prorrogacoes_usadas = 0
                WHERE demanda_venda_id = NEW.id;
            ELSE
                INSERT INTO public.prazos_captacao (demanda_venda_id, prazo_resposta, status)
                VALUES (NEW.id, NOW() + INTERVAL '24 hours', 'ativo');
            END IF;
        END IF;

        -- Notify all active captadores
        FOR v_captador IN
            SELECT id FROM public.users WHERE role = 'captador' AND status = 'ativo'
        LOOP
            INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
            VALUES (
                v_captador.id,
                'status_atualizado',
                '🔴 Demanda Prioritária: ' || v_cliente_nome,
                'Uma demanda foi marcada como PRIORITÁRIA em ' || v_tipo_demanda ||
                '. Você tem 24h para responder! Cliente: ' || v_cliente_nome ||
                COALESCE('. Motivo: ' || NEW.motivo_priorizacao, ''),
                jsonb_build_object(
                    'demanda_id', NEW.id,
                    'is_prioritaria', true,
                    'tipo_demanda', v_tipo_demanda,
                    'motivo_priorizacao', NEW.motivo_priorizacao
                ),
                'alta'
            );
        END LOOP;

    -- Priority DEACTIVATED
    ELSIF ((NEW.is_prioritaria = false OR NEW.is_prioritaria IS NULL) AND OLD.is_prioritaria = true) THEN
        IF TG_TABLE_NAME = 'demandas_locacao' THEN
            UPDATE public.prazos_captacao
            SET status = 'respondido'
            WHERE demanda_locacao_id = NEW.id AND status = 'ativo';
        ELSIF TG_TABLE_NAME = 'demandas_vendas' THEN
            UPDATE public.prazos_captacao
            SET status = 'respondido'
            WHERE demanda_venda_id = NEW.id AND status = 'ativo';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for priority toggle on both demand tables
DROP TRIGGER IF EXISTS trg_prioridade_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_prioridade_locacao
AFTER UPDATE OF is_prioritaria ON public.demandas_locacao
FOR EACH ROW EXECUTE FUNCTION public.handle_prioridade_toggle();

DROP TRIGGER IF EXISTS trg_prioridade_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_prioridade_vendas
AFTER UPDATE OF is_prioritaria ON public.demandas_vendas
FOR EACH ROW EXECUTE FUNCTION public.handle_prioridade_toggle();

-- Update marcada_sem_resposta check to also handle priority demands
CREATE OR REPLACE FUNCTION public.atualizar_prazos_vencidos()
RETURNS void AS $$
DECLARE
    r RECORD;
    demanda_owner UUID;
    cliente_nome TEXT;
BEGIN
    UPDATE public.prazos_captacao
    SET status = 'sem_resposta_24h'
    WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas < 3;

    UPDATE public.prazos_captacao
    SET status = 'sem_resposta_final'
    WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas >= 3;

    UPDATE public.demandas_locacao dl
    SET status_demanda = 'sem_resposta_24h',
        marcada_sem_resposta = true
    FROM public.prazos_captacao pc
    WHERE dl.id = pc.demanda_locacao_id
      AND pc.status = 'sem_resposta_24h'
      AND dl.status_demanda = 'aberta';

    UPDATE public.demandas_vendas dv
    SET status_demanda = 'sem_resposta_24h',
        marcada_sem_resposta = true
    FROM public.prazos_captacao pc
    WHERE dv.id = pc.demanda_venda_id
      AND pc.status = 'sem_resposta_24h'
      AND dv.status_demanda = 'aberta';

    FOR r IN
        SELECT pc.id, pc.demanda_locacao_id, pc.demanda_venda_id
        FROM public.prazos_captacao pc
        WHERE pc.status = 'sem_resposta_final'
    LOOP
        IF r.demanda_locacao_id IS NOT NULL THEN
            UPDATE public.demandas_locacao
            SET status_demanda = 'PERDIDA_BAIXA',
                marcada_sem_resposta = true
            WHERE id = r.demanda_locacao_id
              AND status_demanda IN ('aberta', 'sem_resposta_24h')
            RETURNING sdr_id, nome_cliente INTO demanda_owner, cliente_nome;

            IF FOUND AND demanda_owner IS NOT NULL THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                VALUES (
                    demanda_owner,
                    'status_atualizado',
                    'Timeout Expirado',
                    'Demanda de ' || COALESCE(cliente_nome, '') ||
                    ' foi baixada automaticamente por timeout (48h/3 prorrog.).',
                    jsonb_build_object('demanda_id', r.demanda_locacao_id, 'status', 'PERDIDA_BAIXA'),
                    'alta'
                );
            END IF;

            UPDATE public.prazos_captacao SET status = 'vencido' WHERE id = r.id;

        ELSIF r.demanda_venda_id IS NOT NULL THEN
            UPDATE public.demandas_vendas
            SET status_demanda = 'PERDIDA_BAIXA',
                marcada_sem_resposta = true
            WHERE id = r.demanda_venda_id
              AND status_demanda IN ('aberta', 'sem_resposta_24h')
            RETURNING corretor_id, nome_cliente INTO demanda_owner, cliente_nome;

            IF FOUND AND demanda_owner IS NOT NULL THEN
                INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
                VALUES (
                    demanda_owner,
                    'status_atualizado',
                    'Timeout Expirado',
                    'Demanda de ' || COALESCE(cliente_nome, '') ||
                    ' foi baixada automaticamente por timeout (48h/3 prorrog.).',
                    jsonb_build_object('demanda_id', r.demanda_venda_id, 'status', 'PERDIDA_BAIXA'),
                    'alta'
                );
            END IF;

            UPDATE public.prazos_captacao SET status = 'vencido' WHERE id = r.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed test user marlon@eticimoveis.com.br
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
        new_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, role, aud,
            confirmation_token, recovery_token, email_change_token_new,
            email_change, email_change_token_current,
            phone, phone_change, phone_change_token, reauthentication_token
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'marlon@eticimoveis.com.br',
            crypt('Skip@Pass', gen_salt('bf')),
            NOW(), NOW(), NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Marlon", "role": "admin"}',
            false, 'authenticated', 'authenticated',
            '', '', '', '', '',
            NULL, '', '', ''
        );

        INSERT INTO public.users (id, email, nome, role, status)
        VALUES (new_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
