DO $BLOCK$
DECLARE
  new_uid uuid;
BEGIN
  -- Seed SDR Test User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sdr@etic.com') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'sdr@etic.com', crypt('Password1', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Carlos (SDR)"}', 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
    
    INSERT INTO public.users (id, email, nome, role, status) 
    VALUES (new_uid, 'sdr@etic.com', 'Carlos Santos (SDR)', 'sdr', 'ativo') 
    ON CONFLICT (email) DO NOTHING;
  END IF;

  -- Seed Corretor Test User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'corretor@etic.com') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'corretor@etic.com', crypt('Password1', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Roberto (Corretor)"}', 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
    
    INSERT INTO public.users (id, email, nome, role, status) 
    VALUES (new_uid, 'corretor@etic.com', 'Roberto Corretor', 'corretor', 'ativo') 
    ON CONFLICT (email) DO NOTHING;
  END IF;

  -- Seed Captador Test User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'captador@etic.com') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'captador@etic.com', crypt('Password1', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Ana (Captador)"}', 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
    
    INSERT INTO public.users (id, email, nome, role, status) 
    VALUES (new_uid, 'captador@etic.com', 'Ana Silva (Captador)', 'captador', 'ativo') 
    ON CONFLICT (email) DO NOTHING;
  END IF;

  -- Seed Gestor/Admin Test User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gestor@etic.com') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'gestor@etic.com', crypt('Password1', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Mariana (Gestor)"}', 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
    
    INSERT INTO public.users (id, email, nome, role, status) 
    VALUES (new_uid, 'gestor@etic.com', 'Mariana Gestora', 'admin', 'ativo') 
    ON CONFLICT (email) DO NOTHING;
  END IF;

END $BLOCK$;
