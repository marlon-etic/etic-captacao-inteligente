DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Update marlonjmoro@hotmail.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'marlonjmoro@hotmail.com';
  
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('Kissarmy0440!', gen_salt('bf'))
    WHERE id = v_user_id;
  ELSE
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
      crypt('Kissarmy0440!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon Moro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  INSERT INTO public.users (id, email, nome, role, status)
  VALUES (v_user_id, 'marlonjmoro@hotmail.com', 'Marlon Moro', 'admin', 'ativo')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'ativo';

  -- Update marlon@eticimoveis.com.br
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'marlon@eticimoveis.com.br';
  
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('Kissarmy0440!', gen_salt('bf'))
    WHERE id = v_user_id;
  ELSE
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
      crypt('Kissarmy0440!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon Moro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  INSERT INTO public.users (id, email, nome, role, status)
  VALUES (v_user_id, 'marlon@eticimoveis.com.br', 'Marlon Moro', 'admin', 'ativo')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'ativo';

END $$;
