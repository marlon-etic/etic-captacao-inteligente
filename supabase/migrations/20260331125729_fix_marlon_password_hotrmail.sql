DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Update password for known emails to match the user's latest login attempt
  UPDATE auth.users 
  SET encrypted_password = crypt('kissarmy0440', gen_salt('bf'))
  WHERE email IN ('marlonjmoro@hotmail.com', 'marlon@eticimoveis.com.br', 'marlonjmoro@hotrmail.com');

  -- Also create the hotrmail typo user if it doesn't exist to prevent further auth errors
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'marlonjmoro@hotrmail.com';
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
      'marlonjmoro@hotrmail.com',
      crypt('kissarmy0440', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon Moro", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, 'marlonjmoro@hotrmail.com', 'Marlon Moro', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
