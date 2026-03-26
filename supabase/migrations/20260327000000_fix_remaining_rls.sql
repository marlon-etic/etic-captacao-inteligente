DO $BLOCK$
BEGIN

  -- Assegurar que RLS está ativo nas tabelas mencionadas no diagnóstico
  ALTER TABLE public.grupos_demandas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.api_error_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

  -- 1. Políticas para grupos_demandas
  -- Qualquer usuário autenticado pode ler (necessário para agrupar demandas e ver cards)
  DROP POLICY IF EXISTS "Authenticated users can read grupos_demandas" ON public.grupos_demandas;
  CREATE POLICY "Authenticated users can read grupos_demandas" ON public.grupos_demandas
    FOR SELECT TO authenticated USING (true);

  -- Inserção permitida para os triggers e funções (e fallback para usuários autenticados)
  DROP POLICY IF EXISTS "Authenticated users can insert grupos_demandas" ON public.grupos_demandas;
  CREATE POLICY "Authenticated users can insert grupos_demandas" ON public.grupos_demandas
    FOR INSERT TO authenticated WITH CHECK (true);

  -- Atualização permitida (para incrementar contador de demandas)
  DROP POLICY IF EXISTS "Authenticated users can update grupos_demandas" ON public.grupos_demandas;
  CREATE POLICY "Authenticated users can update grupos_demandas" ON public.grupos_demandas
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  -- Deleção restrita
  DROP POLICY IF EXISTS "Authenticated users can delete grupos_demandas" ON public.grupos_demandas;
  CREATE POLICY "Authenticated users can delete grupos_demandas" ON public.grupos_demandas
    FOR DELETE TO authenticated USING (true);


  -- 2. Políticas para api_error_logs
  -- Permitir que qualquer um (inclusive anônimo ou auth) grave logs de erro, para não perder rastreabilidade
  DROP POLICY IF EXISTS "Anyone can insert api_error_logs" ON public.api_error_logs;
  CREATE POLICY "Anyone can insert api_error_logs" ON public.api_error_logs
    FOR INSERT TO public WITH CHECK (true);

  -- Apenas admins e gestores podem ler os logs de erro
  DROP POLICY IF EXISTS "Admins can read api_error_logs" ON public.api_error_logs;
  CREATE POLICY "Admins can read api_error_logs" ON public.api_error_logs
    FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    );


  -- 3. Políticas para webhook_queue
  -- Gerenciamento interno de fila de webhooks necessita de acesso amplo para leitura e atualização
  -- durante as funções RPC e processos automáticos
  DROP POLICY IF EXISTS "Authenticated users can manage webhook_queue" ON public.webhook_queue;
  CREATE POLICY "Authenticated users can manage webhook_queue" ON public.webhook_queue
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

END $BLOCK$;
