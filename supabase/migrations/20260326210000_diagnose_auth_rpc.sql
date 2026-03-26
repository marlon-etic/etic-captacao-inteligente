CREATE OR REPLACE FUNCTION public.fn_diagnose_and_fix_auth(p_email text, p_password text, p_name text, p_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_actions jsonb := '[]'::jsonb;
BEGIN
  -- 1. Corrige NULLs globais que causam erro 500 no GoTrue
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

  -- 2. Verifica se o usuário existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
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
      p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      json_build_object('name', p_name, 'role', p_role),
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    v_actions := v_actions || jsonb_build_array('Criado usuário ausente no auth.users'::text);
  ELSE
    -- Força a atualização da senha para garantir hash válido bcrypt
    UPDATE auth.users 
    SET 
      encrypted_password = crypt(p_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;
    v_actions := v_actions || jsonb_build_array('Senha resetada e hash sincronizado'::text);
  END IF;

  -- 3. Sincroniza com a tabela public.users customizada
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    -- Limpa registros órfãos com o mesmo email mas IDs diferentes
    DELETE FROM public.users WHERE email = p_email AND id != v_user_id;
    
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, p_email, p_name, p_role::public.user_role, 'ativo');
    v_actions := v_actions || jsonb_build_array('Perfil sincronizado na tabela usuarios'::text);
  ELSE
    UPDATE public.users 
    SET email = p_email, nome = p_name, role = p_role::public.user_role, status = 'ativo'
    WHERE id = v_user_id;
    v_actions := v_actions || jsonb_build_array('Perfil atualizado e verificado'::text);
  END IF;

  RETURN jsonb_build_object('status', 'success', 'user_id', v_user_id, 'actions', v_actions);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_diagnose_and_fix_auth(text, text, text, text) TO anon, authenticated;
