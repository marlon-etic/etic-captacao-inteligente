-- Migration: Ensure RLS policies allow updating is_prioritaria, motivo_priorizacao, and data_prazo_resposta
-- These policies are additive (OR) with existing policies

-- Allow SDRs to update priority fields on their own locacao demands
DROP POLICY IF EXISTS "sdr_update_priority_locacao" ON public.demandas_locacao;
CREATE POLICY "sdr_update_priority_locacao" ON public.demandas_locacao
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('sdr', 'admin', 'gestor'))
    AND sdr_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('sdr', 'admin', 'gestor'))
    AND sdr_id = auth.uid()
  );

-- Allow corretores to update priority fields on their own vendas demands
DROP POLICY IF EXISTS "corretor_update_priority_vendas" ON public.demandas_vendas;
CREATE POLICY "corretor_update_priority_vendas" ON public.demandas_vendas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('corretor', 'admin', 'gestor'))
    AND corretor_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('corretor', 'admin', 'gestor'))
    AND corretor_id = auth.uid()
  );

-- Allow admins/gestores to update priority on all demands
DROP POLICY IF EXISTS "admin_gestor_update_priority_locacao" ON public.demandas_locacao;
CREATE POLICY "admin_gestor_update_priority_locacao" ON public.demandas_locacao
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'gestor'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'gestor'))
  );

DROP POLICY IF EXISTS "admin_gestor_update_priority_vendas" ON public.demandas_vendas;
CREATE POLICY "admin_gestor_update_priority_vendas" ON public.demandas_vendas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'gestor'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'gestor'))
  );
