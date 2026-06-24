-- Ensure authenticated users can insert into imovel_demand_match for manual actions
DROP POLICY IF EXISTS "authenticated_insert_imovel_demand_match" ON public.imovel_demand_match;
CREATE POLICY "authenticated_insert_imovel_demand_match" ON public.imovel_demand_match
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_imovel_demand_match" ON public.imovel_demand_match;
CREATE POLICY "authenticated_update_imovel_demand_match" ON public.imovel_demand_match
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
