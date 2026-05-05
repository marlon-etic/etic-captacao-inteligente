DO $$
DECLARE
  v_sdr_id UUID;
  v_captador_id UUID;
  v_corretor_id UUID;
  v_admin_id UUID;
BEGIN
  -- Garantir admin marlon
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'marlon@eticimoveis.com.br', crypt('Skip@Pass', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
    
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_admin_id, 'marlon@eticimoveis.com.br', 'Marlon (Admin)', 'admin', 'ativo')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ELSE
    UPDATE public.users SET role = 'admin' WHERE email = 'marlon@eticimoveis.com.br';
  END IF;

  -- Cria os perfis de teste caso não existam
  -- SDR
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sdr@etic.com') THEN
    v_sdr_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_sdr_id, '00000000-0000-0000-0000-000000000000', 'sdr@etic.com', crypt('Password123!', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
    
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_sdr_id, 'sdr@etic.com', 'João SDR', 'sdr', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    SELECT id INTO v_sdr_id FROM auth.users WHERE email = 'sdr@etic.com';
  END IF;

  -- Captador
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'captador@etic.com') THEN
    v_captador_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_captador_id, '00000000-0000-0000-0000-000000000000', 'captador@etic.com', crypt('Password123!', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
    
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_captador_id, 'captador@etic.com', 'Maria Captadora', 'captador', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    SELECT id INTO v_captador_id FROM auth.users WHERE email = 'captador@etic.com';
  END IF;

  -- Corretor
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'corretor@etic.com') THEN
    v_corretor_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_corretor_id, '00000000-0000-0000-0000-000000000000', 'corretor@etic.com', crypt('Password123!', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
    
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_corretor_id, 'corretor@etic.com', 'Pedro Corretor', 'corretor', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    SELECT id INTO v_corretor_id FROM auth.users WHERE email = 'corretor@etic.com';
  END IF;

  -- Insere os dados de analytics mockados (apenas se eles ainda não possuírem dados)
  IF v_captador_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM analytics_events WHERE user_id = v_captador_id) THEN
    INSERT INTO analytics_events (user_id, event_type, created_at)
    VALUES
      (v_captador_id, 'property_created', NOW() - INTERVAL '1 day'),
      (v_captador_id, 'property_created', NOW() - INTERVAL '2 days'),
      (v_captador_id, 'property_created', NOW() - INTERVAL '3 days'),
      (v_captador_id, 'property_created', NOW() - INTERVAL '4 days'),
      (v_captador_id, 'property_linked', NOW() - INTERVAL '1 day'),
      (v_captador_id, 'property_linked', NOW() - INTERVAL '2 days'),
      (v_captador_id, 'property_deal_closed', NOW() - INTERVAL '1 day');
  END IF;

  IF v_sdr_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM analytics_events WHERE user_id = v_sdr_id) THEN
    INSERT INTO analytics_events (user_id, event_type, created_at)
    VALUES
      (v_sdr_id, 'demand_created', NOW() - INTERVAL '1 day'),
      (v_sdr_id, 'demand_created', NOW() - INTERVAL '2 days'),
      (v_sdr_id, 'demand_linked', NOW() - INTERVAL '1 day'),
      (v_sdr_id, 'visit_scheduled', NOW() - INTERVAL '1 day'),
      (v_sdr_id, 'deal_closed', NOW() - INTERVAL '1 day');
  END IF;

  IF v_corretor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM analytics_events WHERE user_id = v_corretor_id) THEN
    INSERT INTO analytics_events (user_id, event_type, created_at)
    VALUES
      (v_corretor_id, 'demand_created', NOW() - INTERVAL '1 day'),
      (v_corretor_id, 'demand_created', NOW() - INTERVAL '3 days'),
      (v_corretor_id, 'demand_linked', NOW() - INTERVAL '1 day'),
      (v_corretor_id, 'deal_closed', NOW() - INTERVAL '1 day');
  END IF;
END $$;
