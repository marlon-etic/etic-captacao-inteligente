-- RLS policies for imoveis_captados to ensure proper data isolation per user
-- Captadores see only their own properties; admins see all; SDRs/Corretores see all for matching

-- Drop the old broad policy that allowed all authenticated users to see everything
DROP POLICY IF EXISTS "Authenticated users can read all captures" ON public.imoveis_captados;

-- Drop existing version of target policy (idempotent)
DROP POLICY IF EXISTS "Users can view their own captured properties" ON public.imoveis_captados;

-- Create policy: users see their own properties OR admins see all
CREATE POLICY "Users can view their own captured properties" ON public.imoveis_captados
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_captador_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Gestor role can also see all properties (treated similarly to admin)
DROP POLICY IF EXISTS "Gestor can read all captures" ON public.imoveis_captados;
CREATE POLICY "Gestor can read all captures" ON public.imoveis_captados
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'gestor'
  );

-- SDRs and Corretores need broad read access for demand-matching and linking
DROP POLICY IF EXISTS "SDR and Corretor read captures" ON public.imoveis_captados;
CREATE POLICY "SDR and Corretor read captures" ON public.imoveis_captados
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('sdr', 'corretor')
  );

-- Allow users to insert their own captured properties
DROP POLICY IF EXISTS "Captadores insert captures" ON public.imoveis_captados;
CREATE POLICY "Captadores insert captures" ON public.imoveis_captados
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_captador_id);

-- Allow captadores to update their own properties, admins can update all
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
