DO $$
BEGIN
  -- 1. Assegurar RLS ativo nas tabelas críticas
  ALTER TABLE public.grupos_demandas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.api_error_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

  -- 2. Políticas para grupos_demandas
  DROP POLICY IF EXISTS "Authenticated users can read grupos_demandas" ON public.grupos_demandas;
  CREATE POLICY "Authenticated users can read grupos_demandas" ON public.grupos_demandas FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "Authenticated users can insert grupos_demandas" ON public.grupos_demandas;
  CREATE POLICY "Authenticated users can insert grupos_demandas" ON public.grupos_demandas FOR INSERT TO authenticated WITH CHECK (true);

  DROP POLICY IF EXISTS "Authenticated users can update grupos_demandas" ON public.grupos_demandas;
  CREATE POLICY "Authenticated users can update grupos_demandas" ON public.grupos_demandas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Authenticated users can delete grupos_demandas" ON public.grupos_demandas;
  CREATE POLICY "Authenticated users can delete grupos_demandas" ON public.grupos_demandas FOR DELETE TO authenticated USING (true);

  -- 3. Políticas para api_error_logs
  DROP POLICY IF EXISTS "Anyone can insert api_error_logs" ON public.api_error_logs;
  CREATE POLICY "Anyone can insert api_error_logs" ON public.api_error_logs FOR INSERT TO public WITH CHECK (true);

  DROP POLICY IF EXISTS "Admins can read api_error_logs" ON public.api_error_logs;
  CREATE POLICY "Admins can read api_error_logs" ON public.api_error_logs FOR SELECT TO authenticated USING (true);

  -- 4. Políticas para webhook_queue
  DROP POLICY IF EXISTS "Authenticated users can manage webhook_queue" ON public.webhook_queue;
  CREATE POLICY "Authenticated users can manage webhook_queue" ON public.webhook_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- 5. Políticas para users (assegurar integridade de perfis)
  DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
  CREATE POLICY "Authenticated users can read users" ON public.users FOR SELECT TO authenticated USING (true);
  
  DROP POLICY IF EXISTS "Users see own profile" ON public.users;
  CREATE POLICY "Users see own profile" ON public.users FOR SELECT TO public USING (id = auth.uid());

  DROP POLICY IF EXISTS "Users update own profile" ON public.users;
  CREATE POLICY "Users update own profile" ON public.users FOR UPDATE TO public USING (id = auth.uid());

  -- 6. Recriar trigger de novos usuários para garantir robustez
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $func$
  BEGIN
    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'captador'::public.user_role),
      'ativo'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      nome = COALESCE(public.users.nome, EXCLUDED.nome);
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql SECURITY DEFINER;

  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

END $$;
