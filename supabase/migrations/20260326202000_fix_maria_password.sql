DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mariaennes@eticimoveis.com.br';
  
  IF v_user_id IS NOT NULL THEN
    -- Update password
    UPDATE auth.users 
    SET encrypted_password = crypt('MAria123123', gen_salt('bf'))
    WHERE id = v_user_id;
  ELSE
    -- Insert user if doesn't exist
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
      'mariaennes@eticimoveis.com.br',
      crypt('MAria123123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Maria Ennes"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;

  -- Ensure user exists in public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'mariaennes@eticimoveis.com.br') THEN
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, 'mariaennes@eticimoveis.com.br', 'Maria Ennes', 'admin', 'ativo');
  END IF;
END $$;
