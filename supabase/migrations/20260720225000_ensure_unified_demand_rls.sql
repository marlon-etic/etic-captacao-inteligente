-- Supplementary RLS policies to ensure users can see and manage their own demands
-- These are additive - existing broader policies remain in effect

-- demandas_locacao: Ensure SDR can always see their own demands
DROP POLICY IF EXISTS "unified_sdr_select_own_locacao" ON public.demandas_locacao;
CREATE POLICY "unified_sdr_select_own_locacao" ON public.demandas_locacao
  FOR SELECT TO authenticated USING (sdr_id = auth.uid());

-- demandas_locacao: Ensure SDR can update their own demands
DROP POLICY IF EXISTS "unified_sdr_update_own_locacao" ON public.demandas_locacao;
CREATE POLICY "unified_sdr_update_own_locacao" ON public.demandas_locacao
  FOR UPDATE TO authenticated USING (sdr_id = auth.uid()) WITH CHECK (true);

-- demandas_vendas: Ensure corretor can always see their own demands
DROP POLICY IF EXISTS "unified_corretor_select_own_venda" ON public.demandas_vendas;
CREATE POLICY "unified_corretor_select_own_venda" ON public.demandas_vendas
  FOR SELECT TO authenticated USING (corretor_id = auth.uid());

-- demandas_vendas: Ensure corretor can update their own demands
DROP POLICY IF EXISTS "unified_corretor_update_own_venda" ON public.demandas_vendas;
CREATE POLICY "unified_corretor_update_own_venda" ON public.demandas_vendas
  FOR UPDATE TO authenticated USING (corretor_id = auth.uid()) WITH CHECK (true);

-- feedback_records: Allow authenticated users to insert their own
DROP POLICY IF EXISTS "unified_feedback_insert" ON public.feedback_records;
CREATE POLICY "unified_feedback_insert" ON public.feedback_records
  FOR INSERT TO authenticated WITH CHECK (sdr_user_id = auth.uid());

-- feedback_records: Allow authenticated users to read their own
DROP POLICY IF EXISTS "unified_feedback_select_own" ON public.feedback_records;
CREATE POLICY "unified_feedback_select_own" ON public.feedback_records
  FOR SELECT TO authenticated USING (sdr_user_id = auth.uid());

-- visit_records: Allow authenticated users to insert their own
DROP POLICY IF EXISTS "unified_visit_insert" ON public.visit_records;
CREATE POLICY "unified_visit_insert" ON public.visit_records
  FOR INSERT TO authenticated WITH CHECK (sdr_user_id = auth.uid());

-- visit_records: Allow authenticated users to read their own
DROP POLICY IF EXISTS "unified_visit_select_own" ON public.visit_records;
CREATE POLICY "unified_visit_select_own" ON public.visit_records
  FOR SELECT TO authenticated USING (sdr_user_id = auth.uid());

-- imovel_demand_match: Allow authenticated users to select matches for their demands
DROP POLICY IF EXISTS "unified_match_select_authenticated" ON public.imovel_demand_match;
CREATE POLICY "unified_match_select_authenticated" ON public.imovel_demand_match
  FOR SELECT TO authenticated USING (true);

-- imovel_demand_match: Allow authenticated users to insert matches
DROP POLICY IF EXISTS "unified_match_insert_authenticated" ON public.imovel_demand_match;
CREATE POLICY "unified_match_insert_authenticated" ON public.imovel_demand_match
  FOR INSERT TO authenticated WITH CHECK (true);

-- demand_status_log: Allow authenticated users to insert status logs
DROP POLICY IF EXISTS "unified_status_log_insert" ON public.demand_status_log;
CREATE POLICY "unified_status_log_insert" ON public.demand_status_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- demand_status_log: Allow authenticated users to read status logs
DROP POLICY IF EXISTS "unified_status_log_select" ON public.demand_status_log;
CREATE POLICY "unified_status_log_select" ON public.demand_status_log
  FOR SELECT TO authenticated USING (true);
