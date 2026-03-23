DO $$ 
BEGIN
  -- Fix user policies for real-time and simple reads
  -- Needed to map captador names without triggering RLS recursion
  DROP POLICY IF EXISTS "Anon can read users" ON public.users;
  DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
  DROP POLICY IF EXISTS "Admin sees all users" ON public.users;

  CREATE POLICY "Authenticated users can read users" ON public.users
    FOR SELECT TO authenticated USING (true);
END $$;
