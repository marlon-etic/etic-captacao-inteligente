-- Ensure idempotent RLS policies for imoveis_captados INSERT operations
-- This migration guarantees that authenticated captadores can insert their own property records

-- Ensure the foreign key on user_captador_id references auth.users(id)
DO $$
BEGIN
  -- Check if the FK exists, if not, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'imoveis_captados_user_captador_id_fkey'
      AND table_name = 'imoveis_captados'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.imoveis_captados
      ADD CONSTRAINT imoveis_captados_user_captador_id_fkey
      FOREIGN KEY (user_captador_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing INSERT policies (idempotent) to recreate cleanly
DROP POLICY IF EXISTS "Captadores insert captures" ON public.imoveis_captados;
DROP POLICY IF EXISTS "authenticated_insert_imoveis" ON public.imoveis_captados;
DROP POLICY IF EXISTS "authenticated_insert_imoveis_captados" ON public.imoveis_captados;
DROP POLICY IF EXISTS "Corretores insert captures" ON public.imoveis_captados;
DROP POLICY IF EXISTS "SDRs insert captures" ON public.imoveis_captados;
DROP POLICY IF EXISTS "Captadores can insert own imoveis_captados" ON public.imoveis_captados;

-- Create the definitive INSERT policy: any authenticated user can insert
-- as long as user_captador_id matches their own auth.uid()
CREATE POLICY "Captadores insert captures"
  ON public.imoveis_captados
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_captador_id);

-- Ensure SELECT policy allows captadores to see their own records
DROP POLICY IF EXISTS "Users can view their own captured properties" ON public.imoveis_captados;
CREATE POLICY "Users can view their own captured properties" ON public.imoveis_captados
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_captador_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Ensure Gestor role can also see all properties
DROP POLICY IF EXISTS "Gestor can read all captures" ON public.imoveis_captados;
CREATE POLICY "Gestor can read all captures" ON public.imoveis_captados
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'gestor'
  );

-- SDRs and Corretores need broad read access for demand-matching
DROP POLICY IF EXISTS "SDR and Corretor read captures" ON public.imoveis_captados;
CREATE POLICY "SDR and Corretor read captures" ON public.imoveis_captados
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('sdr', 'corretor')
  );

-- Allow captadores to update their own properties; admins and gestores can update all
DROP POLICY IF EXISTS "Users update own captures" ON public.imoveis_captados;
CREATE POLICY "Users update own captures" ON public.imoveis_captados
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_captador_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  )
  WITH CHECK (
    auth.uid() = user_captador_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

-- Allow captadores to delete their own properties; admins can delete all
DROP POLICY IF EXISTS "Captadores can delete own imoveis_captados" ON public.imoveis_captados;
CREATE POLICY "Captadores can delete own imoveis_captados" ON public.imoveis_captados
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_captador_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );
