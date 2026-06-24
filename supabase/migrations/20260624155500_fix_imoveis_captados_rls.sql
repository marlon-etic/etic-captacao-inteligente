-- Drop the potentially faulty insert policies
DROP POLICY IF EXISTS "Captadores insert captures" ON public.imoveis_captados;
DROP POLICY IF EXISTS "authenticated_insert_imoveis" ON public.imoveis_captados;
DROP POLICY IF EXISTS "authenticated_insert_imoveis_captados" ON public.imoveis_captados;
DROP POLICY IF EXISTS "Corretores insert captures" ON public.imoveis_captados;
DROP POLICY IF EXISTS "SDRs insert captures" ON public.imoveis_captados;

-- Create the new independent insert policy allowing users to insert their own properties
CREATE POLICY "Captadores insert captures" 
  ON public.imoveis_captados
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_captador_id);
