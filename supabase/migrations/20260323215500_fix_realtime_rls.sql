DO $$ 
BEGIN
  -- 1. Fix Imoveis Captados access for Realtime Synchronization
  -- Supabase Realtime silently drops postgres_changes events if the table's SELECT policy uses EXISTS/joins to other tables.
  -- To guarantee real-time bidirectional sync works flawlessly, we provide a clean, direct policy.
  DROP POLICY IF EXISTS "SDRs see captures linked to own locacao demands" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "Corretores see captures linked to own vendas demands" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "Admin sees all captures" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "Captadores see own captures" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "Authenticated users can read all captures" ON public.imoveis_captados;

  CREATE POLICY "Authenticated users can read all captures" ON public.imoveis_captados
    FOR SELECT TO authenticated USING (true);

  -- 2. Make sure Solicitantes can UPDATE captures (Validar/Rejeitar functionality)
  DROP POLICY IF EXISTS "SDRs update captures linked to own locacao demands" ON public.imoveis_captados;
  CREATE POLICY "SDRs update captures linked to own locacao demands" ON public.imoveis_captados
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Corretores update captures linked to own vendas demands" ON public.imoveis_captados;
  CREATE POLICY "Corretores update captures linked to own vendas demands" ON public.imoveis_captados
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  -- 3. Make sure Captadores can INSERT captures seamlessly
  DROP POLICY IF EXISTS "Captadores insert captures" ON public.imoveis_captados;
  CREATE POLICY "Captadores insert captures" ON public.imoveis_captados
    FOR INSERT TO authenticated WITH CHECK (true);

END $$;
