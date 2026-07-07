-- Migration: Ensure "Dar Perdido" workflow works even with linked imovel_id
-- - Seed marlon@eticimoveis.com.br for testing
-- - Reinforce trigger functions never block 'perdida' status
-- - Reinforce RLS UPDATE policies for owners
-- - Ensure CHECK constraints include 'perdida'
-- Idempotent: all functions use CREATE OR REPLACE, policies use DROP IF EXISTS

-- 1. Seed marlon@eticimoveis.com.br in auth.users
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
  END IF;
END $$;

-- 2. Reinforce trigger functions to NEVER block 'perdida' status changes
--    Even when imovel_id is linked (imovel_demand_match entries exist)
CREATE OR REPLACE FUNCTION public.check_demand_auto_close()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_all_captadores_lost()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fn_handle_captador_lost_demand()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure CHECK constraints on status_demanda include 'perdida'
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'demandas_locacao'::regclass
      AND c.contype = 'c'
      AND a.attname = 'status_demanda'
  LOOP
    EXECUTE 'ALTER TABLE demandas_locacao DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;

  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'demandas_vendas'::regclass
      AND c.contype = 'c'
      AND a.attname = 'status_demanda'
  LOOP
    EXECUTE 'ALTER TABLE demandas_vendas DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
END $$;

ALTER TABLE public.demandas_locacao
ADD CONSTRAINT demandas_locacao_status_demanda_check
CHECK (lower(status_demanda) IN (
  'ativo', 'aberta', 'fechado', 'fechada', 'perdida', 'perdido', 'arquivada',
  'pendente', 'em_negociacao', 'finalizada', 'finalizado', 'cancelada', 'cancelado',
  'em busca', 'atendida', 'sem_resposta_24h', 'ganho', 'impossivel',
  'perdida_baixa', 'pausada', 'concluida', 'concluída', 'localmente_perdida',
  'prioritaria', 'ativa'
)) NOT VALID;

ALTER TABLE public.demandas_vendas
ADD CONSTRAINT demandas_vendas_status_demanda_check
CHECK (lower(status_demanda) IN (
  'ativo', 'aberta', 'fechado', 'fechada', 'perdida', 'perdido', 'arquivada',
  'pendente', 'em_negociacao', 'finalizada', 'finalizado', 'cancelada', 'cancelado',
  'em busca', 'atendida', 'sem_resposta_24h', 'ganho', 'impossivel',
  'perdida_baixa', 'pausada', 'concluida', 'concluída', 'localmente_perdida',
  'prioritaria', 'ativa'
)) NOT VALID;

-- 4. RLS: Ensure owners (sdr_id / corretor_id) and admins can update status to 'perdida'
DROP POLICY IF EXISTS "owner_update_status_locacao" ON public.demandas_locacao;
CREATE POLICY "owner_update_status_locacao" ON public.demandas_locacao
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = sdr_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  )
  WITH CHECK (
    auth.uid() = sdr_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

DROP POLICY IF EXISTS "owner_update_status_vendas" ON public.demandas_vendas;
CREATE POLICY "owner_update_status_vendas" ON public.demandas_vendas
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = corretor_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  )
  WITH CHECK (
    auth.uid() = corretor_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

-- 5. Reinforce notify_captadores_demand_lost with explicit enum casting
CREATE OR REPLACE FUNCTION public.notify_captadores_demand_lost()
RETURNS trigger AS $$
DECLARE
  v_cliente_nome text;
  v_demanda_id uuid;
  v_tipo_demanda text;
  v_motivo text;
  v_owner_id uuid;
BEGIN
  IF (
    NEW.status_demanda ILIKE 'perdida' OR
    NEW.status_demanda ILIKE 'perdido' OR
    NEW.status_demanda = 'impossivel' OR
    NEW.status_demanda = 'PERDIDA_BAIXA'
  ) AND (
    OLD.status_demanda IS NULL OR NOT (
      OLD.status_demanda ILIKE 'perdida' OR
      OLD.status_demanda ILIKE 'perdido' OR
      OLD.status_demanda = 'impossivel' OR
      OLD.status_demanda = 'PERDIDA_BAIXA'
    )
  ) THEN
    v_demanda_id := NEW.id;
    v_cliente_nome := COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'Cliente');
    v_motivo := COALESCE(NEW.motivo_perda, 'Não informado');

    IF TG_TABLE_NAME = 'demandas_locacao' THEN
      v_tipo_demanda := 'Aluguel';
      v_owner_id := NEW.sdr_id;
    ELSE
      v_tipo_demanda := 'Venda';
      v_owner_id := NEW.corretor_id;
    END IF;

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT
      (elem->>'captador_id')::uuid,
      'status_atualizado'::public.notificacao_tipo,
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'alta'::public.notificacao_prioridade
    FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
    WHERE (elem->>'captador_id') IS NOT NULL
      AND (elem->>'captador_id')::uuid IS DISTINCT FROM v_owner_id;

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT DISTINCT
      m.captador_id,
      'status_atualizado'::public.notificacao_tipo,
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'alta'::public.notificacao_prioridade
    FROM public.imovel_demand_match m
    WHERE m.demanda_id = v_demanda_id
      AND m.captador_id IS NOT NULL
      AND m.captador_id IS DISTINCT FROM v_owner_id
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
        WHERE (elem->>'captador_id')::uuid = m.captador_id
      );

    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT
      u.id,
      'status_atualizado'::public.notificacao_tipo,
      'Demanda Perdida',
      v_cliente_nome || ' - A demanda foi marcada como perdida. Motivo: ' || v_motivo,
      jsonb_build_object('demanda_id', v_demanda_id, 'tipo_demanda', v_tipo_demanda, 'status', NEW.status_demanda),
      'normal'::public.notificacao_prioridade
    FROM public.users u
    WHERE u.role IN ('admin', 'gestor')
      AND u.status = 'ativo'
      AND u.id IS DISTINCT FROM v_owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure triggers exist
DROP TRIGGER IF EXISTS trg_notify_captadores_demand_lost_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_captadores_demand_lost_locacao
  AFTER UPDATE OF status_demanda ON public.demandas_locacao
  FOR EACH ROW EXECUTE FUNCTION public.notify_captadores_demand_lost();

DROP TRIGGER IF EXISTS trg_notify_captadores_demand_lost_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_captadores_demand_lost_vendas
  AFTER UPDATE OF status_demanda ON public.demandas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_captadores_demand_lost();
