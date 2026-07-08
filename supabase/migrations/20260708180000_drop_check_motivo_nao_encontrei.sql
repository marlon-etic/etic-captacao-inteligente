-- Migration: Drop outdated check constraint on respostas_captador to allow 'perdido' status
-- Idempotent: uses DO $$ blocks to check constraint existence before dropping

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_motivo_nao_encontrei' 
    AND conrelid = 'public.respostas_captador'::regclass
  ) THEN
    ALTER TABLE public.respostas_captador DROP CONSTRAINT check_motivo_nao_encontrei;
  END IF;
END $$;

-- Also drop any variant constraint names that might restrict resposta values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'respostas_captador_resposta_check' 
    AND conrelid = 'public.respostas_captador'::regclass
  ) THEN
    ALTER TABLE public.respostas_captador DROP CONSTRAINT respostas_captador_resposta_check;
  END IF;
END $$;

-- Ensure RLS policies allow authenticated users to insert their own responses
DROP POLICY IF EXISTS "Captadores insert respostas" ON public.respostas_captador;
CREATE POLICY "Captadores insert respostas" ON public.respostas_captador 
  FOR INSERT TO authenticated 
  WITH CHECK (captador_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated read respostas" ON public.respostas_captador;
CREATE POLICY "Authenticated read respostas" ON public.respostas_captador 
  FOR SELECT TO authenticated 
  USING (true);

-- Ensure marlon@eticimoveis.com.br remains as admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
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
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (v_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.users SET role = 'admin' WHERE email = 'marlon@eticimoveis.com.br';
    UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
    WHERE email = 'marlon@eticimoveis.com.br';
  END IF;
END $$;
