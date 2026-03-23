DO $
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Fix NULLs in auth.users universally (This prevents the 'Database error querying schema' GoTrue 500 error)
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

  -- 2. Setup the specific user the system is trying to authenticate: captador@etic.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'captador@etic.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
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
      'captador@etic.com',
      crypt('captacao123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Ana Silva"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  ELSE
    -- Re-sync password and confirm email just in case the previous seed was partial
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('captacao123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;
  END IF;

  -- 3. Ensure the user exists in public.users to keep foreign keys consistent
  INSERT INTO public.users (id, email, nome, role, status)
  VALUES (v_user_id, 'captador@etic.com', 'Ana Silva', 'captador', 'ativo')
  ON CONFLICT (id) DO UPDATE 
  SET nome = EXCLUDED.nome, role = EXCLUDED.role, status = EXCLUDED.status;

END $;
