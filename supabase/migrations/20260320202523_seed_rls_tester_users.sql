DO $$
DECLARE
  sdr_a_id uuid := gen_random_uuid();
  sdr_b_id uuid := gen_random_uuid();
  cor_a_id uuid := gen_random_uuid();
  cor_b_id uuid := gen_random_uuid();
  cap_id uuid := gen_random_uuid();
  adm_id uuid := gen_random_uuid();
BEGIN
  -- Insert SDR A
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sdr_a@test.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, role, aud, 
      confirmation_token, recovery_token, email_change_token_new, 
      email_change, email_change_token_current, phone_change, 
      phone_change_token, reauthentication_token
    )
    VALUES (
      sdr_a_id, '00000000-0000-0000-0000-000000000000', 'sdr_a@test.com', 
      crypt('TestPassword123!', gen_salt('bf')), now(), now(), now(), 
      'authenticated', 'authenticated', '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role) VALUES (sdr_a_id, 'sdr_a@test.com', 'SDR A Teste', 'sdr') ON CONFLICT DO NOTHING;
  END IF;

  -- Insert SDR B
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sdr_b@test.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, role, aud, 
      confirmation_token, recovery_token, email_change_token_new, 
      email_change, email_change_token_current, phone_change, 
      phone_change_token, reauthentication_token
    )
    VALUES (
      sdr_b_id, '00000000-0000-0000-0000-000000000000', 'sdr_b@test.com', 
      crypt('TestPassword123!', gen_salt('bf')), now(), now(), now(), 
      'authenticated', 'authenticated', '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role) VALUES (sdr_b_id, 'sdr_b@test.com', 'SDR B Teste', 'sdr') ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Corretor A
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cor_a@test.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, role, aud, 
      confirmation_token, recovery_token, email_change_token_new, 
      email_change, email_change_token_current, phone_change, 
      phone_change_token, reauthentication_token
    )
    VALUES (
      cor_a_id, '00000000-0000-0000-0000-000000000000', 'cor_a@test.com', 
      crypt('TestPassword123!', gen_salt('bf')), now(), now(), now(), 
      'authenticated', 'authenticated', '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role) VALUES (cor_a_id, 'cor_a@test.com', 'Corretor A Teste', 'corretor') ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Corretor B
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cor_b@test.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, role, aud, 
      confirmation_token, recovery_token, email_change_token_new, 
      email_change, email_change_token_current, phone_change, 
      phone_change_token, reauthentication_token
    )
    VALUES (
      cor_b_id, '00000000-0000-0000-0000-000000000000', 'cor_b@test.com', 
      crypt('TestPassword123!', gen_salt('bf')), now(), now(), now(), 
      'authenticated', 'authenticated', '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role) VALUES (cor_b_id, 'cor_b@test.com', 'Corretor B Teste', 'corretor') ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Captador
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cap@test.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, role, aud, 
      confirmation_token, recovery_token, email_change_token_new, 
      email_change, email_change_token_current, phone_change, 
      phone_change_token, reauthentication_token
    )
    VALUES (
      cap_id, '00000000-0000-0000-0000-000000000000', 'cap@test.com', 
      crypt('TestPassword123!', gen_salt('bf')), now(), now(), now(), 
      'authenticated', 'authenticated', '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role) VALUES (cap_id, 'cap@test.com', 'Captador Teste', 'captador') ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adm@test.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, role, aud, 
      confirmation_token, recovery_token, email_change_token_new, 
      email_change, email_change_token_current, phone_change, 
      phone_change_token, reauthentication_token
    )
    VALUES (
      adm_id, '00000000-0000-0000-0000-000000000000', 'adm@test.com', 
      crypt('TestPassword123!', gen_salt('bf')), now(), now(), now(), 
      'authenticated', 'authenticated', '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role) VALUES (adm_id, 'adm@test.com', 'Admin Teste', 'admin') ON CONFLICT DO NOTHING;
  END IF;

END $$;
