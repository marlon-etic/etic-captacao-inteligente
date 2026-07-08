-- Migration: Reinforce "Perdido" workflow for captador individual filtering
-- Ensures: standardized 'perdido' response, global inactivation trigger, deadline expiry
-- Idempotent: all functions use CREATE OR REPLACE, triggers use DROP IF EXISTS

-- 1. Ensure fn_check_all_captadores_perdido handles 'perdido' responses correctly
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

-- 2. Ensure trigger exists
DROP TRIGGER IF EXISTS trg_check_all_captadores_perdido ON public.respostas_captador;
CREATE TRIGGER trg_check_all_captadores_perdido
    AFTER INSERT ON public.respostas_captador
    FOR EACH ROW EXECUTE FUNCTION public.fn_check_all_captadores_perdido();

-- 3. Ensure marcar_prazo_respondido_resposta handles 'perdido' responses
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

-- 4. Ensure atualizar_prazos_vencidos marks demands as 'perdida' on final deadline
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
    WHERE dl.id = pc.demanda_locacao_id AND pc.status = 'sem_resposta_24h' AND dl.status_demanda = 'aberta';

    UPDATE public.demandas_vendas dv
    SET status_demanda = 'sem_resposta_24h'
    FROM public.prazos_captacao pc
    WHERE dv.id = pc.demanda_venda_id AND pc.status = 'sem_resposta_24h' AND dv.status_demanda = 'aberta';

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

-- 5. Ensure marcar_prazo_respondido_imovel trigger function is compatible
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

-- 6. Disable old auto-close trigger that checked 'nao_encontrei' (now superseded)
CREATE OR REPLACE FUNCTION public.check_demand_auto_close()
RETURNS trigger AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure RLS allows captadores to read respostas_captador (for filtering)
DROP POLICY IF EXISTS "authenticated_select_respostas_captador" ON public.respostas_captador;
CREATE POLICY "authenticated_select_respostas_captador" ON public.respostas_captador
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "captador_insert_respostas" ON public.respostas_captador;
CREATE POLICY "captador_insert_respostas" ON public.respostas_captador
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = captador_id);

-- 8. Ensure seed user exists
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
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
    VALUES (v_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.users SET role = 'admin' WHERE email = 'marlon@eticimoveis.com.br';
  END IF;
END $$;
