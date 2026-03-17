-- RLS Policies for Data Isolation in Demands

ALTER TABLE demandas_locacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas_vendas ENABLE ROW LEVEL SECURITY;

-- Capturer Role: Can see group metrics and demand criteria but MUST NOT see client names (only counts)
-- (Note: Actual name masking is generally handled in views or the frontend API layer when not using dedicated columns, 
-- but we allow select so they can read the demand criteria)
CREATE POLICY "Captador can see demands" ON demandas_locacao
FOR SELECT USING (
  EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role = 'captador')
);

CREATE POLICY "Captador can see demands" ON demandas_vendas
FOR SELECT USING (
  EXISTS (SELECT 1 FROM captadores WHERE id = auth.uid() AND role = 'captador')
);

-- SDR Role: Can see only clients and demands associated with their own user ID for "Locação".
CREATE POLICY "SDR sees own Locacao demands" ON demandas_locacao
FOR SELECT USING (
  EXISTS (SELECT 1 FROM sdrs WHERE id = auth.uid() AND role = 'sdr')
  AND user_id = auth.uid()
);

-- Broker Role: Can see only clients and demands associated with their own user ID for "Vendas".
CREATE POLICY "Broker sees own Vendas demands" ON demandas_vendas
FOR SELECT USING (
  EXISTS (SELECT 1 FROM corretores WHERE id = auth.uid() AND role = 'corretor')
  AND user_id = auth.uid()
);

-- Admin/Gestor Role: Access to all data
CREATE POLICY "Admin and Gestor full access Locacao" ON demandas_locacao
FOR ALL USING (
  EXISTS (SELECT 1 FROM gestores WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
);

CREATE POLICY "Admin and Gestor full access Vendas" ON demandas_vendas
FOR ALL USING (
  EXISTS (SELECT 1 FROM gestores WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
);
