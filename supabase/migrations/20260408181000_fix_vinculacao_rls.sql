-- Documentação das policies criadas/ajustadas para Vinculação:
-- 1. Captadores recebem permissão de UPDATE em demandas_locacao e demandas_vendas para poderem vincular seus imóveis e atualizar o status da demanda.
-- 2. SDRs e Corretores recebem permissão de UPDATE restrita aos seus perfis na tabela imoveis_captados para que possam vincular as demandas que eles gerenciam aos imóveis captados.
-- O bloqueio silencioso ocorria pois Captadores tentavam atualizar demandas que pertenciam a SDRs/Corretores, e o RLS rejeitava o UPDATE silenciosamente na chamada do Supabase JS.

DO $$
BEGIN
  -- Remover policies antigas que podem estar conflitando ou excessivamente permissivas
  DROP POLICY IF EXISTS "Corretores update captures linked to own vendas demands" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "SDRs update captures linked to own locacao demands" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "Corretores update captures" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "SDRs update captures" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "Captadores update demandas locacao para vinculacao" ON public.demandas_locacao;
  DROP POLICY IF EXISTS "Captadores update demandas vendas para vinculacao" ON public.demandas_vendas;

  -- 1. Ajustar policies na tabela imoveis_captados
  -- Corretor pode atualizar imóveis (necessário para vincular)
  CREATE POLICY "Corretores update captures" ON public.imoveis_captados
    FOR UPDATE TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'corretor')
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'corretor')
    );

  -- SDR pode atualizar imóveis (necessário para vincular)
  CREATE POLICY "SDRs update captures" ON public.imoveis_captados
    FOR UPDATE TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sdr')
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sdr')
    );

  -- 2. Ajustar policies na tabela demandas_locacao
  -- Captador pode atualizar demandas de locação (necessário para vincular e mudar status)
  CREATE POLICY "Captadores update demandas locacao para vinculacao" ON public.demandas_locacao
    FOR UPDATE TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'captador')
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'captador')
    );

  -- 3. Ajustar policies na tabela demandas_vendas
  -- Captador pode atualizar demandas de vendas (necessário para vincular e mudar status)
  CREATE POLICY "Captadores update demandas vendas para vinculacao" ON public.demandas_vendas
    FOR UPDATE TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'captador')
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'captador')
    );

END $$;
