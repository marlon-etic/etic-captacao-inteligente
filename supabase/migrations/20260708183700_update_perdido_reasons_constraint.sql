-- Migration: Update respostas_captador constraints for standardized perdido reasons
-- 1. Drop outdated check_motivo_nao_encontrei constraint
-- 2. Drop any resposta check constraint that blocks 'perdido'
-- 3. Add new constraint restricting motivo to 9 standardized options when resposta = 'perdido'
-- 4. Ensure RLS policies allow captadores to insert their own responses
-- 5. Seed admin user marlon@eticimoveis.com.br

-- 1. Drop the old check_motivo_nao_encontrei constraint
ALTER TABLE public.respostas_captador DROP CONSTRAINT IF EXISTS check_motivo_nao_encontrei;

-- 2. Drop any check constraint on the resposta column that restricts values
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.respostas_captador'::regclass
      AND contype = 'c'
      AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.respostas_captador'::regclass
          AND attname = 'resposta'
      )]
  ) LOOP
    EXECUTE 'ALTER TABLE public.respostas_captador DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 3. (Constraint moved to migration 20260708184000 — must normalize existing data first)

-- 4. Ensure RLS policies allow authenticated users to insert their own responses
DROP POLICY IF EXISTS "Captadores insert respostas" ON public.respostas_captador;
CREATE POLICY "Captadores insert respostas" ON public.respostas_captador
  FOR INSERT TO authenticated
  WITH CHECK (captador_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated read respostas" ON public.respostas_captador;
CREATE POLICY "Authenticated read respostas" ON public.respostas_captador
  FOR SELECT TO authenticated
  USING (true);

-- 5. Ensure marlon@eticimoveis.com.br exists as admin
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
  END IF;
END $$;
