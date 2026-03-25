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
    -- Re-use ID from public.users if it exists to keep them synced
    SELECT id INTO v_user_id FROM public.users WHERE email = 'marlonjmoro@hotmail.com';
    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
    END IF;

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

  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'marlonjmoro@hotmail.com') THEN
    UPDATE public.users SET role = 'admin', status = 'ativo' WHERE email = 'marlonjmoro@hotmail.com';
  ELSE
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, 'marlonjmoro@hotmail.com', 'Marlon Moro', 'admin', 'ativo');
  END IF;

  -- Update marlon@eticimoveis.com.br
  v_user_id := NULL;
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'marlon@eticimoveis.com.br';
  
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('Kissarmy0440!', gen_salt('bf'))
    WHERE id = v_user_id;
  ELSE
    -- Re-use ID from public.users if it exists to keep them synced
    SELECT id INTO v_user_id FROM public.users WHERE email = 'marlon@eticimoveis.com.br';
    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
    END IF;

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

  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    UPDATE public.users SET role = 'admin', status = 'ativo' WHERE email = 'marlon@eticimoveis.com.br';
  ELSE
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, 'marlon@eticimoveis.com.br', 'Marlon Moro', 'admin', 'ativo');
  END IF;

END $$;
