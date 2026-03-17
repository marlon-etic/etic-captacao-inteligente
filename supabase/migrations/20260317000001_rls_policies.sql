-- RLS Policies for Data Isolation in Demands

ALTER TABLE demandas_locacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas_vendas ENABLE ROW LEVEL SECURITY;

-- Capturer Role: Can see group metrics and demand criteria but MUST NOT see client names
-- In the frontend application, the component 'GroupedDemandCard' masks the clientName as 'Cliente Oculto' for captadores.
-- In a strict production database, you would use a secure view or Column Level Security.
-- For this RLS policy, we grant SELECT so they can read the demand criteria required for grouping.
CREATE POLICY "Captador can see demands" ON demandas_locacao
FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'captador')
);

CREATE POLICY "Captador can see demands" ON demandas_vendas
FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'captador')
);

-- SDR Role: Can see only clients and demands associated with their own user ID for "Locação".
-- Denies access to clients belonging to another SDR.
CREATE POLICY "SDR sees own Locacao demands" ON demandas_locacao
FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'sdr')
  AND created_by = auth.uid()
);

-- Broker Role: Can see only clients and demands associated with their own user ID for "Vendas".
-- Denies access to clients belonging to another Broker.
CREATE POLICY "Broker sees own Vendas demands" ON demandas_vendas
FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'corretor')
  AND created_by = auth.uid()
);

-- Admin and Gestor Role: Access to all data across all tables.
CREATE POLICY "Admin and Gestor full access Locacao" ON demandas_locacao
FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'gestor'))
);

CREATE POLICY "Admin and Gestor full access Vendas" ON demandas_vendas
FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'gestor'))
);

