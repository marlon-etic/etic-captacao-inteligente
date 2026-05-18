-- 1. Demandas Locação
DROP POLICY IF EXISTS "SDR can see own locacao" ON public.demandas_locacao;
DROP POLICY IF EXISTS "SDR sees own Locacao demands" ON public.demandas_locacao;
DROP POLICY IF EXISTS "Captadores see aberta locacao" ON public.demandas_locacao;
DROP POLICY IF EXISTS "Captador can see demands" ON public.demandas_locacao;
DROP POLICY IF EXISTS "Enable read for authorized roles locacao" ON public.demandas_locacao;

CREATE POLICY "Enable read for authorized roles locacao" ON public.demandas_locacao
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'gestor', 'captador', 'sdr')
  )
);

-- 2. Demandas Vendas
DROP POLICY IF EXISTS "Broker sees own Vendas demands" ON public.demandas_vendas;
DROP POLICY IF EXISTS "Captador can see demands" ON public.demandas_vendas;
DROP POLICY IF EXISTS "Captadores see aberta vendas" ON public.demandas_vendas;
DROP POLICY IF EXISTS "Enable read for authorized roles vendas" ON public.demandas_vendas;

CREATE POLICY "Enable read for authorized roles vendas" ON public.demandas_vendas
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'gestor', 'captador', 'corretor')
  )
);

-- 3. Imóveis Captados
DROP POLICY IF EXISTS "Authenticated users can read all captures" ON public.imoveis_captados;
CREATE POLICY "Authenticated users can read all captures" ON public.imoveis_captados
FOR SELECT TO authenticated
USING (true);

-- 4. Imovel Demand Match
DROP POLICY IF EXISTS "captador_owns_matches" ON public.imovel_demand_match;
DROP POLICY IF EXISTS "Enable read for all matches" ON public.imovel_demand_match;
CREATE POLICY "Enable read for all matches" ON public.imovel_demand_match
FOR SELECT TO authenticated
USING (true);

-- 5. Visitas e Fechamentos
DROP POLICY IF EXISTS "Users can view own visitas" ON public.visitas_imovel;
DROP POLICY IF EXISTS "Enable read for all visitas" ON public.visitas_imovel;
CREATE POLICY "Enable read for all visitas" ON public.visitas_imovel
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can view own fechamentos" ON public.fechamentos;
DROP POLICY IF EXISTS "Enable read for all fechamentos" ON public.fechamentos;
CREATE POLICY "Enable read for all fechamentos" ON public.fechamentos
FOR SELECT TO authenticated
USING (true);

-- Ensure users can see other users (for assigning and displaying names)
DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
CREATE POLICY "Authenticated users can read users" ON public.users
FOR SELECT TO authenticated
USING (true);
