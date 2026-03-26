-- Create an RPC to auto-fix test users
CREATE OR REPLACE FUNCTION public.fn_auto_fix_test_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sdr_id uuid;
  v_cap_id uuid;
  v_cor_id uuid;
  v_adm_id uuid;
  v_result jsonb := '{"status": "success", "fixed": []}'::jsonb;
BEGIN
  -- Fix NULLs in auth.users just in case (GoTrue bug mitigation)
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

  -- ==========================================
  -- SDR
  -- ==========================================
  SELECT id INTO v_sdr_id FROM auth.users WHERE email = 'sdr@etic.com';
  IF v_sdr_id IS NULL THEN
    v_sdr_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_sdr_id, '00000000-0000-0000-0000-000000000000', 'sdr@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Password1', gen_salt('bf')) WHERE id = v_sdr_id;
  END IF;
  
  -- Clean potential orphans
  DELETE FROM public.users WHERE email = 'sdr@etic.com' AND id != v_sdr_id;
  
  INSERT INTO public.users (id, email, nome, role, status) 
  VALUES (v_sdr_id, 'sdr@etic.com', 'SDR Teste', 'sdr', 'ativo') 
  ON CONFLICT (id) DO UPDATE SET email = 'sdr@etic.com', role = 'sdr', status = 'ativo';

  -- ==========================================
  -- Captador
  -- ==========================================
  SELECT id INTO v_cap_id FROM auth.users WHERE email = 'captador@etic.com';
  IF v_cap_id IS NULL THEN
    v_cap_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_cap_id, '00000000-0000-0000-0000-000000000000', 'captador@etic.com', crypt('captacao123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('captacao123', gen_salt('bf')) WHERE id = v_cap_id;
  END IF;

  DELETE FROM public.users WHERE email = 'captador@etic.com' AND id != v_cap_id;

  INSERT INTO public.users (id, email, nome, role, status) 
  VALUES (v_cap_id, 'captador@etic.com', 'Captador Teste', 'captador', 'ativo') 
  ON CONFLICT (id) DO UPDATE SET email = 'captador@etic.com', role = 'captador', status = 'ativo';

  -- ==========================================
  -- Corretor
  -- ==========================================
  SELECT id INTO v_cor_id FROM auth.users WHERE email = 'corretor@etic.com';
  IF v_cor_id IS NULL THEN
    v_cor_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_cor_id, '00000000-0000-0000-0000-000000000000', 'corretor@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Password1', gen_salt('bf')) WHERE id = v_cor_id;
  END IF;

  DELETE FROM public.users WHERE email = 'corretor@etic.com' AND id != v_cor_id;

  INSERT INTO public.users (id, email, nome, role, status) 
  VALUES (v_cor_id, 'corretor@etic.com', 'Corretor Teste', 'corretor', 'ativo') 
  ON CONFLICT (id) DO UPDATE SET email = 'corretor@etic.com', role = 'corretor', status = 'ativo';

  -- ==========================================
  -- Admin
  -- ==========================================
  SELECT id INTO v_adm_id FROM auth.users WHERE email = 'admin@etic.com';
  IF v_adm_id IS NULL THEN
    v_adm_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    VALUES (v_adm_id, '00000000-0000-0000-0000-000000000000', 'admin@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Password1', gen_salt('bf')) WHERE id = v_adm_id;
  END IF;

  DELETE FROM public.users WHERE email = 'admin@etic.com' AND id != v_adm_id;

  INSERT INTO public.users (id, email, nome, role, status) 
  VALUES (v_adm_id, 'admin@etic.com', 'Admin Teste', 'admin', 'ativo') 
  ON CONFLICT (id) DO UPDATE SET email = 'admin@etic.com', role = 'admin', status = 'ativo';

  v_result := '{"status": "success", "message": "Usuários de teste validados e senhas regeneradas."}'::jsonb;
  RETURN v_result;
END;
$$;

-- Allow execution by authenticated and anon users since it's a diagnostic repair tool
GRANT EXECUTE ON FUNCTION public.fn_auto_fix_test_users() TO anon, authenticated;

-- Ensure robust base RLS configuration for users read access
DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
CREATE POLICY "Authenticated users can read users" ON public.users FOR SELECT TO authenticated USING (true);
