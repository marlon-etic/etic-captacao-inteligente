-- 1. Ensure supabase_auth_admin has all required permissions to query the schema safely
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- 2. Force GoTrue bug resolution by setting all string tokens to empty string, NEVER NULL
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL OR recovery_token IS NULL
  OR email_change_token_new IS NULL OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- 3. Clean up the problematic user and recreate it from scratch
DO $$
DECLARE
  v_captador_id uuid;
  v_sdr_id uuid;
  v_corretor_id uuid;
  v_gestor_id uuid;
BEGIN
  -- Completely remove the problematic user from both tables
  DELETE FROM public.users WHERE email = 'captador@etic.com';
  DELETE FROM auth.users WHERE email = 'captador@etic.com';

  -- Recreate 'captador@etic.com' cleanly
  v_captador_id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current,
    phone, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    v_captador_id,
    '00000000-0000-0000-0000-000000000000',
    'captador@etic.com',
    crypt('captacao123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Ana Silva"}',
    false, 'authenticated', 'authenticated',
    '', '', '', '', '', NULL, '', '', ''
  );

  INSERT INTO public.users (id, email, nome, role, status)
  VALUES (v_captador_id, 'captador@etic.com', 'Ana Silva', 'captador', 'ativo');

  -- Make sure SDR exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sdr@etic.com') THEN
    v_sdr_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, role, aud,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_sdr_id, '00000000-0000-0000-0000-000000000000', 'sdr@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated',
      '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role, status) VALUES (v_sdr_id, 'sdr@etic.com', 'SDR', 'sdr', 'ativo');
  END IF;

  -- Make sure Corretor exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'corretor@etic.com') THEN
    v_corretor_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, role, aud,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_corretor_id, '00000000-0000-0000-0000-000000000000', 'corretor@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated',
      '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role, status) VALUES (v_corretor_id, 'corretor@etic.com', 'Corretor', 'corretor', 'ativo');
  END IF;

  -- Make sure Gestor exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gestor@etic.com') THEN
    v_gestor_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, role, aud,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_gestor_id, '00000000-0000-0000-0000-000000000000', 'gestor@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated',
      '', '', '', '', '', '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role, status) VALUES (v_gestor_id, 'gestor@etic.com', 'Gestor', 'admin', 'ativo');
  END IF;
END $$;
