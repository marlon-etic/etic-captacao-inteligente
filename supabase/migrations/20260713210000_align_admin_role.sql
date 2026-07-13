DO $$
BEGIN
  -- Ensure marlon@eticimoveis.com.br exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'marlon@eticimoveis.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon Moro", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  -- Ensure token/change string columns are never NULL for this user
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
  WHERE email = 'marlon@eticimoveis.com.br';

  -- Sync raw_user_meta_data to include role: admin
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE email = 'marlon@eticimoveis.com.br';

  -- Sync public.users table: ensure the row exists with role = admin
  INSERT INTO public.users (id, email, nome, role, status)
  SELECT id, email, 'Marlon Moro', 'admin', 'ativo'
  FROM auth.users
  WHERE email = 'marlon@eticimoveis.com.br'
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', nome = COALESCE(public.users.nome, 'Marlon Moro');

  -- Also update by email in case the id match fails
  UPDATE public.users
  SET role = 'admin'
  WHERE email = 'marlon@eticimoveis.com.br';
END $$;
