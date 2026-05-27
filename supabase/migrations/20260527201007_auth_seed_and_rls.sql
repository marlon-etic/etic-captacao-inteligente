-- Initial idempotent user seed for the required test user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'marlon@eticimoveis.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon Moro", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    
    -- Try to insert into public.profiles to avoid RLS issues if profile is required
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
      INSERT INTO public.profiles (id, email, role, nome) 
      VALUES (new_user_id, 'marlon@eticimoveis.com.br', 'admin', 'Marlon Moro')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- Ensure notificacoes has basic policies so useNotifications doesn't block due to missing policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notificacoes') THEN
    ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop and create policies
DROP POLICY IF EXISTS "authenticated_select_notificacoes" ON public.notificacoes;
CREATE POLICY "authenticated_select_notificacoes" ON public.notificacoes
  FOR SELECT TO authenticated USING (true);
  
DROP POLICY IF EXISTS "authenticated_insert_notificacoes" ON public.notificacoes;
CREATE POLICY "authenticated_insert_notificacoes" ON public.notificacoes
  FOR INSERT TO authenticated WITH CHECK (true);
  
DROP POLICY IF EXISTS "authenticated_update_notificacoes" ON public.notificacoes;
CREATE POLICY "authenticated_update_notificacoes" ON public.notificacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  
DROP POLICY IF EXISTS "authenticated_delete_notificacoes" ON public.notificacoes;
CREATE POLICY "authenticated_delete_notificacoes" ON public.notificacoes
  FOR DELETE TO authenticated USING (true);
