-- Ensure RLS is enabled
ALTER TABLE public.imovel_demand_match ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform insert, update, and delete
DROP POLICY IF EXISTS "authenticated_insert_matches" ON public.imovel_demand_match;
CREATE POLICY "authenticated_insert_matches" ON public.imovel_demand_match
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_matches" ON public.imovel_demand_match;
CREATE POLICY "authenticated_update_matches" ON public.imovel_demand_match
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_matches" ON public.imovel_demand_match;
CREATE POLICY "authenticated_delete_matches" ON public.imovel_demand_match
  FOR DELETE TO authenticated USING (true);

-- Add performance indexes for imovel_demand_match
CREATE INDEX IF NOT EXISTS idx_imovel_demand_match_tipo_vinculacao ON public.imovel_demand_match(tipo_vinculacao);
CREATE INDEX IF NOT EXISTS idx_imovel_demand_match_captador_id ON public.imovel_demand_match(captador_id);
