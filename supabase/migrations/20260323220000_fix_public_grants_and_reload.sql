DO $BLOCK$
BEGIN
  -- Grant usage on schema to all relevant roles
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  
  -- Grant all privileges on all tables, sequences, routines
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
  
  -- Explicitly grant to users table to prevent 403 Permission Denied
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated, service_role;

  -- Ensure RLS policies on users table are fully permissive for authenticated users
  DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
  CREATE POLICY "Authenticated users can read users" ON public.users FOR SELECT TO authenticated USING (true);
  
  -- Allow anon to select so that the initial fetch before auth doesn't fail with 403
  DROP POLICY IF EXISTS "Anon can read users" ON public.users;
  CREATE POLICY "Anon can read users" ON public.users FOR SELECT TO anon USING (true);
END $BLOCK$;

-- Notify PostgREST to reload its schema cache to apply the grants immediately
NOTIFY pgrst, 'reload schema';

