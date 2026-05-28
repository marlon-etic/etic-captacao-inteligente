DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user (idempotent: skip if email already exists)
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
      '{"name": "Admin", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (new_user_id, 'marlon@eticimoveis.com.br', 'Admin', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Function to trigger when matches_sugestoes gets a new row
CREATE OR REPLACE FUNCTION public.notify_high_score_match()
RETURNS trigger AS $$
DECLARE
  v_demanda_owner uuid;
  v_captador_id uuid;
  v_cliente_nome text;
  v_codigo_imovel text;
BEGIN
  IF NEW.score >= 70 THEN
    -- Get property details
    SELECT codigo_imovel, COALESCE(user_captador_id, captador_id) INTO v_codigo_imovel, v_captador_id
    FROM public.imoveis_captados
    WHERE id = NEW.imovel_id;

    -- Get demand details
    IF NEW.demanda_tipo = 'Locação' OR NEW.demanda_tipo = 'Aluguel' THEN
      SELECT sdr_id, COALESCE(nome_cliente, cliente_nome) INTO v_demanda_owner, v_cliente_nome
      FROM public.demandas_locacao
      WHERE id = NEW.demanda_id;
    ELSE
      SELECT corretor_id, COALESCE(nome_cliente, cliente_nome) INTO v_demanda_owner, v_cliente_nome
      FROM public.demandas_vendas
      WHERE id = NEW.demanda_id;
    END IF;

    -- Notify Demand Owner (SDR/Corretor)
    IF v_demanda_owner IS NOT NULL THEN
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      VALUES (
        v_demanda_owner,
        'status_atualizado',
        'Novo Match Encontrado!',
        'Cliente: ' || COALESCE(v_cliente_nome, 'N/D') || ' | Imóvel: ' || COALESCE(v_codigo_imovel, 'S/C') || ' | ' || NEW.score || '% de Compatibilidade.',
        jsonb_build_object('demanda_id', NEW.demanda_id, 'imovel_id', NEW.imovel_id, 'score', NEW.score, 'is_match', true),
        'alta'
      );
    END IF;

    -- Notify Captador (if different from Demand Owner and not null)
    IF v_captador_id IS NOT NULL AND v_captador_id != v_demanda_owner THEN
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      VALUES (
        v_captador_id,
        'status_atualizado',
        'Novo Match Encontrado!',
        'Cliente: ' || COALESCE(v_cliente_nome, 'N/D') || ' | Imóvel: ' || COALESCE(v_codigo_imovel, 'S/C') || ' | ' || NEW.score || '% de Compatibilidade.',
        jsonb_build_object('demanda_id', NEW.demanda_id, 'imovel_id', NEW.imovel_id, 'score', NEW.score, 'is_match', true),
        'alta'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_high_score_match ON public.matches_sugestoes;
CREATE TRIGGER trg_notify_high_score_match
  AFTER INSERT ON public.matches_sugestoes
  FOR EACH ROW EXECUTE FUNCTION public.notify_high_score_match();

-- Generate matches automatically when Property is inserted
CREATE OR REPLACE FUNCTION public.trg_generate_matches_imovel()
RETURNS trigger AS $$
DECLARE
  v_demanda RECORD;
  v_match jsonb;
  v_score int;
BEGIN
  IF NEW.tipo = 'Ambos' OR NEW.tipo = 'Locação' THEN
    FOR v_demanda IN SELECT * FROM public.demandas_locacao WHERE status_demanda IN ('aberta', 'em busca')
    LOOP
      v_match := public.calculate_imovel_demand_match(NEW.id, v_demanda.id, 'Locação');
      v_score := (v_match->>'compatibilidade_pct')::INTEGER;
      IF v_score >= 70 THEN
        INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
        VALUES (NEW.id, v_demanda.id, 'Locação', v_score, 'pendente')
        ON CONFLICT (imovel_id, demanda_id, demanda_tipo) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  IF NEW.tipo = 'Ambos' OR NEW.tipo = 'Venda' THEN
    FOR v_demanda IN SELECT * FROM public.demandas_vendas WHERE status_demanda IN ('aberta', 'em busca')
    LOOP
      v_match := public.calculate_imovel_demand_match(NEW.id, v_demanda.id, 'Venda');
      v_score := (v_match->>'compatibilidade_pct')::INTEGER;
      IF v_score >= 70 THEN
        INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
        VALUES (NEW.id, v_demanda.id, 'Venda', v_score, 'pendente')
        ON CONFLICT (imovel_id, demanda_id, demanda_tipo) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_imovel_created_matches ON public.imoveis_captados;
CREATE TRIGGER on_imovel_created_matches
  AFTER INSERT ON public.imoveis_captados
  FOR EACH ROW EXECUTE FUNCTION public.trg_generate_matches_imovel();

-- Generate matches automatically when Demanda Locacao is inserted
CREATE OR REPLACE FUNCTION public.trg_generate_matches_locacao()
RETURNS trigger AS $$
DECLARE
  v_imovel RECORD;
  v_match jsonb;
  v_score int;
BEGIN
  FOR v_imovel IN SELECT * FROM public.imoveis_captados WHERE tipo = 'Ambos' OR tipo = 'Locação'
  LOOP
    v_match := public.calculate_imovel_demand_match(v_imovel.id, NEW.id, 'Locação');
    v_score := (v_match->>'compatibilidade_pct')::INTEGER;
    IF v_score >= 70 THEN
      INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
      VALUES (v_imovel.id, NEW.id, 'Locação', v_score, 'pendente')
      ON CONFLICT (imovel_id, demanda_id, demanda_tipo) DO NOTHING;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_demanda_locacao_created_matches ON public.demandas_locacao;
CREATE TRIGGER on_demanda_locacao_created_matches
  AFTER INSERT ON public.demandas_locacao
  FOR EACH ROW EXECUTE FUNCTION public.trg_generate_matches_locacao();

-- Generate matches automatically when Demanda Venda is inserted
CREATE OR REPLACE FUNCTION public.trg_generate_matches_venda()
RETURNS trigger AS $$
DECLARE
  v_imovel RECORD;
  v_match jsonb;
  v_score int;
BEGIN
  FOR v_imovel IN SELECT * FROM public.imoveis_captados WHERE tipo = 'Ambos' OR tipo = 'Venda'
  LOOP
    v_match := public.calculate_imovel_demand_match(v_imovel.id, NEW.id, 'Venda');
    v_score := (v_match->>'compatibilidade_pct')::INTEGER;
    IF v_score >= 70 THEN
      INSERT INTO public.matches_sugestoes (imovel_id, demanda_id, demanda_tipo, score, status)
      VALUES (v_imovel.id, NEW.id, 'Venda', v_score, 'pendente')
      ON CONFLICT (imovel_id, demanda_id, demanda_tipo) DO NOTHING;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_demanda_venda_created_matches ON public.demandas_vendas;
CREATE TRIGGER on_demanda_venda_created_matches
  AFTER INSERT ON public.demandas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.trg_generate_matches_venda();
