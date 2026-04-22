DO $$
BEGIN
  -- 1. Remover constraints rígidas de telefone
  ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS demandas_vendas_telefone_check;
  ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_telefone_check;

  -- 2. Adicionar constraints flexíveis de telefone
  ALTER TABLE public.demandas_vendas ADD CONSTRAINT demandas_vendas_telefone_check 
  CHECK (telefone IS NULL OR telefone = '' OR length(regexp_replace(telefone, '[^0-9]', '', 'g')) >= 8);

  ALTER TABLE public.demandas_locacao ADD CONSTRAINT demandas_locacao_telefone_check 
  CHECK (telefone IS NULL OR telefone = '' OR length(regexp_replace(telefone, '[^0-9]', '', 'g')) >= 8);

  -- 3. Adicionar RLS Policies para SDR em demandas_vendas
  DROP POLICY IF EXISTS "SDR can create own vendas" ON public.demandas_vendas;
  CREATE POLICY "SDR can create own vendas" ON public.demandas_vendas FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role' ILIKE 'sdr') OR 
    (auth.jwt() -> 'user_metadata' ->> 'role' ILIKE 'sdr') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text ILIKE 'sdr')
  );

  DROP POLICY IF EXISTS "SDR can see own vendas" ON public.demandas_vendas;
  CREATE POLICY "SDR can see own vendas" ON public.demandas_vendas FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' ILIKE 'sdr') OR 
    (auth.jwt() -> 'user_metadata' ->> 'role' ILIKE 'sdr') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text ILIKE 'sdr')
  );

  DROP POLICY IF EXISTS "SDR can update own vendas" ON public.demandas_vendas;
  CREATE POLICY "SDR can update own vendas" ON public.demandas_vendas FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'role' ILIKE 'sdr') OR 
    (auth.jwt() -> 'user_metadata' ->> 'role' ILIKE 'sdr') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text ILIKE 'sdr')
  );

  -- 4. Adicionar RLS Policies para SDR em demandas_locacao (garantindo também a verificação flexível ILIKE)
  DROP POLICY IF EXISTS "SDR can create own locacao" ON public.demandas_locacao;
  CREATE POLICY "SDR can create own locacao" ON public.demandas_locacao FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role' ILIKE 'sdr') OR 
    (auth.jwt() -> 'user_metadata' ->> 'role' ILIKE 'sdr') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text ILIKE 'sdr')
  );

  DROP POLICY IF EXISTS "SDR can see own locacao" ON public.demandas_locacao;
  CREATE POLICY "SDR can see own locacao" ON public.demandas_locacao FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' ILIKE 'sdr') OR 
    (auth.jwt() -> 'user_metadata' ->> 'role' ILIKE 'sdr') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text ILIKE 'sdr')
  );

  DROP POLICY IF EXISTS "SDR can update own locacao" ON public.demandas_locacao;
  CREATE POLICY "SDR can update own locacao" ON public.demandas_locacao FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'role' ILIKE 'sdr') OR 
    (auth.jwt() -> 'user_metadata' ->> 'role' ILIKE 'sdr') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text ILIKE 'sdr')
  );

END $$;
