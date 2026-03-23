DO $BLOCK$
BEGIN

  -- Ensure table level grants are present for authenticated users
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.demandas_locacao TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.demandas_vendas TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.imoveis_captados TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.respostas_captador TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_log TO authenticated;

  -- 1. Fix public.users policies (Remove auth.users reference which causes HTTP 403 Permission Denied)
  DROP POLICY IF EXISTS "Admin sees all users" ON public.users;
  CREATE POLICY "Admin sees all users" ON public.users FOR ALL TO authenticated USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') IN ('admin', 'gestor')
  );

  -- Allow all authenticated users to read the users table
  -- The app relies on fetching the users list to work correctly
  DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
  CREATE POLICY "Authenticated users can read users" ON public.users FOR SELECT TO authenticated USING (true);

  -- 2. Fix residual policies on demandas_locacao referencing auth.users
  DROP POLICY IF EXISTS "Captador can see demands" ON public.demandas_locacao;
  CREATE POLICY "Captador can see demands" ON public.demandas_locacao FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'captador')
  );

  DROP POLICY IF EXISTS "Admin and Gestor full access Locacao" ON public.demandas_locacao;
  CREATE POLICY "Admin and Gestor full access Locacao" ON public.demandas_locacao FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
  );

  -- 3. Fix residual policies on demandas_vendas referencing auth.users
  DROP POLICY IF EXISTS "Captador can see demands" ON public.demandas_vendas;
  CREATE POLICY "Captador can see demands" ON public.demandas_vendas FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'captador')
  );

  DROP POLICY IF EXISTS "Admin and Gestor full access Vendas" ON public.demandas_vendas;
  CREATE POLICY "Admin and Gestor full access Vendas" ON public.demandas_vendas FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
  );

  -- 4. Fix audit_log policy referencing auth.users
  DROP POLICY IF EXISTS "Admin sees audit log" ON public.audit_log;
  CREATE POLICY "Admin sees audit log" ON public.audit_log FOR ALL TO authenticated USING (
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') IN ('admin', 'gestor')
  );

END $BLOCK$;
