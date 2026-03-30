DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Seed user marlonjmoro@hotmail.com
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlonjmoro@hotmail.com') THEN
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
      'marlonjmoro@hotmail.com',
      crypt('kissarmy0440', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon Moro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, 'marlonjmoro@hotmail.com', 'Marlon Moro', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Se já existir, atualiza a senha para garantir o acesso
    UPDATE auth.users 
    SET encrypted_password = crypt('kissarmy0440', gen_salt('bf')) 
    WHERE email = 'marlonjmoro@hotmail.com';
    
    UPDATE public.users
    SET role = 'admin', status = 'ativo'
    WHERE email = 'marlonjmoro@hotmail.com';
  END IF;

  -- Seed user marlon@eticimoveis.com.br
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
      crypt('kissarmy0440', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, 'marlon@eticimoveis.com.br', 'Marlon Admin', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('kissarmy0440', gen_salt('bf')) 
    WHERE email = 'marlon@eticimoveis.com.br';
    
    UPDATE public.users
    SET role = 'admin', status = 'ativo'
    WHERE email = 'marlon@eticimoveis.com.br';
  END IF;
END $$;
