DO $$
BEGIN
    -- Drop old policies to ensure a clean state
    DROP POLICY IF EXISTS "rbac_select_demandas_locacao" ON public.demandas_locacao;
    DROP POLICY IF EXISTS "rbac_select_demandas_vendas" ON public.demandas_vendas;
    DROP POLICY IF EXISTS "rbac_select_imoveis_captados" ON public.imoveis_captados;

    -- Strict RBAC SELECT policies for demandas_locacao
    -- SDR, Captador, Admin, Gestor: ALL
    -- Corretor, Broker: ONLY OWN
    CREATE POLICY "rbac_select_demandas_locacao" ON public.demandas_locacao
    FOR SELECT TO authenticated
    USING (
        (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor', 'captador', 'sdr'))
        OR 
        ((COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') IN ('corretor', 'broker')) AND sdr_id = auth.uid())
        OR
        -- Fallback if no role is defined, assume SDR defaults
        (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') IS NULL)
    );

    -- Strict RBAC SELECT policies for demandas_vendas
    -- Corretor, Broker, Captador, Admin, Gestor: ALL
    -- SDR: ONLY OWN
    CREATE POLICY "rbac_select_demandas_vendas" ON public.demandas_vendas
    FOR SELECT TO authenticated
    USING (
        (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor', 'captador', 'corretor', 'broker'))
        OR 
        ((COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'sdr') AND corretor_id = auth.uid())
        OR
        -- Fallback if no role is defined, assume SDR defaults, so only OWN for vendas
        (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') IS NULL AND corretor_id = auth.uid())
    );

    -- Strict RBAC SELECT policies for imoveis_captados
    -- SDR, Corretor, Broker, Admin, Gestor: ALL
    -- Captador: ONLY OWN
    CREATE POLICY "rbac_select_imoveis_captados" ON public.imoveis_captados
    FOR SELECT TO authenticated
    USING (
        (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor', 'sdr', 'corretor', 'broker'))
        OR 
        ((COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'captador') AND user_captador_id = auth.uid())
        OR
        -- Fallback
        (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') IS NULL)
    );
END $$;
