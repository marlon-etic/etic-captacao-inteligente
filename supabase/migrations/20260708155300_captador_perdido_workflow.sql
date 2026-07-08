-- Migration: Captador "Perdido" workflow with conditional global inactivation
-- 1. Create trigger to check if all assigned captadores have given up
-- 2. Update deadline-based inactivation to mark as 'perdida' when final deadline passes
-- 3. Update marcar_prazo_respondido_resposta to handle 'perdido' responses

-- 1. Function to check if all captadores in captadores_busca have 'perdido' responses
CREATE OR REPLACE FUNCTION public.fn_check_all_captadores_perdido()
RETURNS trigger AS $$
DECLARE
    v_demanda_id uuid;
    v_tipo_demanda text;
    v_captadores_busca jsonb;
    v_total_captadores int;
    v_perdido_count int;
BEGIN
    IF NEW.resposta != 'perdido' THEN
        RETURN NEW;
    END IF;

    IF NEW.demanda_locacao_id IS NOT NULL THEN
        v_demanda_id := NEW.demanda_locacao_id;
        v_tipo_demanda := 'Aluguel';
        SELECT captadores_busca INTO v_captadores_busca FROM public.demandas_locacao WHERE id = v_demanda_id;
    ELSIF NEW.demanda_venda_id IS NOT NULL THEN
        v_demanda_id := NEW.demanda_venda_id;
        v_tipo_demanda := 'Venda';
        SELECT captadores_busca INTO v_captadores_busca FROM public.demandas_vendas WHERE id = v_demanda_id;
    ELSE
        RETURN NEW;
    END IF;

    -- If no specific captadores assigned (general pool), don't mark as perdida
    IF v_captadores_busca IS NULL OR jsonb_array_length(v_captadores_busca) = 0 THEN
        RETURN NEW;
    END IF;

    v_total_captadores := jsonb_array_length(v_captadores_busca);

    SELECT COUNT(DISTINCT r.captador_id) INTO v_perdido_count
    FROM public.respostas_captador r
    WHERE r.resposta = 'perdido'
      AND (
        (NEW.demanda_locacao_id IS NOT NULL AND r.demanda_locacao_id = v_demanda_id)
        OR
        (NEW.demanda_venda_id IS NOT NULL AND r.demanda_venda_id = v_demanda_id)
      );

    -- If all assigned captadores have given up, mark demand as perdida
    IF v_perdido_count >= v_total_captadores THEN
        IF v_tipo_demanda = 'Aluguel' THEN
            UPDATE public.demandas_locacao
            SET status_demanda = 'perdida',
                motivo_perda = COALESCE(motivo_perda, 'Todos os captadores desistiram'),
                updated_at = NOW()
            WHERE id = v_demanda_id
              AND status_demanda NOT IN ('perdida', 'ganho', 'fechado', 'PERDIDA_BAIXA', 'impossivel');
        ELSE
            UPDATE public.demandas_vendas
            SET status_demanda = 'perdida',
                motivo_perda = COALESCE(motivo_perda, 'Todos os captadores desistiram'),
                updated_at = NOW()
            WHERE id = v_demanda_id
              AND status_demanda NOT IN ('perdida', 'ganho', 'fechado', 'PERDIDA_BAIXA', 'impossivel');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for the function
DROP TRIGGER IF EXISTS trg_check_all_captadores_perdido ON public.respostas_captador;
CREATE TRIGGER trg_check_all_captadores_perdido
    AFTER INSERT ON public.respostas_captador
    FOR EACH ROW EXECUTE FUNCTION public.fn_check_all_captadores_perdido();

-- 3. Update marcar_prazo_respondido_resposta to handle 'perdido' responses
CREATE OR REPLACE FUNCTION public.marcar_prazo_respondido_resposta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resposta = 'encontrei' OR NEW.resposta = 'perdido' OR (NEW.resposta = 'nao_encontrei' AND NEW.motivo != 'Buscando outras opções') THEN
        IF NEW.demanda_locacao_id IS NOT NULL THEN
            UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_locacao_id = NEW.demanda_locacao_id;
        ELSIF NEW.demanda_venda_id IS NOT NULL THEN
            UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_venda_id = NEW.demanda_venda_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update atualizar_prazos_vencidos to mark demands as 'perdida' when final deadline passes
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

    -- Mark demands as sem_resposta_24h when prazo expires (first time)
    UPDATE public.demandas_locacao dl
    SET status_demanda = 'sem_resposta_24h'
    FROM public.prazos_captacao pc
    WHERE dl.id = pc.demanda_locacao_id AND pc.status = 'sem_resposta_24h' AND dl.status_demanda = 'aberta';

    UPDATE public.demandas_vendas dv
    SET status_demanda = 'sem_resposta_24h'
    FROM public.prazos_captacao pc
    WHERE dv.id = pc.demanda_venda_id AND pc.status = 'sem_resposta_24h' AND dv.status_demanda = 'aberta';

    -- Mark demands as perdida when final deadline passes (all extensions exhausted)
    UPDATE public.demandas_locacao dl
    SET status_demanda = 'perdida',
        motivo_perda = COALESCE(motivo_perda, 'Prazo final expirado sem captura'),
        updated_at = NOW()
    FROM public.prazos_captacao pc
    WHERE dl.id = pc.demanda_locacao_id
      AND pc.status = 'sem_resposta_final'
      AND dl.status_demanda IN ('aberta', 'sem_resposta_24h');

    UPDATE public.demandas_vendas dv
    SET status_demanda = 'perdida',
        motivo_perda = COALESCE(motivo_perda, 'Prazo final expirado sem captura'),
        updated_at = NOW()
    FROM public.prazos_captacao pc
    WHERE dv.id = pc.demanda_venda_id
      AND pc.status = 'sem_resposta_final'
      AND dv.status_demanda IN ('aberta', 'sem_resposta_24h');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
