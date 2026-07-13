-- Trigger: Notify captador when a visit is registered for their property
CREATE OR REPLACE FUNCTION public.fn_notify_visit_to_captador()
RETURNS trigger AS $$
DECLARE
  v_imovel_id UUID;
  v_captador_id UUID;
  v_demanda_id UUID;
  v_tipo_demanda TEXT;
  v_cliente_nome TEXT;
  v_codigo_imovel TEXT;
  v_sdr_id UUID;
  v_sdr_nome TEXT;
BEGIN
  -- Get property link info
  SELECT imovel_id, demanda_id, tipo_demanda INTO v_imovel_id, v_demanda_id, v_tipo_demanda
  FROM public.imovel_demand_match
  WHERE id = NEW.property_link_id;

  IF v_imovel_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get captador and codigo from imoveis_captados
  SELECT user_captador_id, codigo_imovel INTO v_captador_id, v_codigo_imovel
  FROM public.imoveis_captados
  WHERE id = v_imovel_id;

  IF v_captador_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get client name from demandas
  IF v_tipo_demanda = 'Venda' THEN
    SELECT nome_cliente, corretor_id INTO v_cliente_nome, v_sdr_id
    FROM public.demandas_vendas
    WHERE id = v_demanda_id;
  ELSE
    SELECT nome_cliente, sdr_id INTO v_cliente_nome, v_sdr_id
    FROM public.demandas_locacao
    WHERE id = v_demanda_id;
  END IF;

  -- Get SDR name
  IF v_sdr_id IS NOT NULL THEN
    SELECT nome INTO v_sdr_nome FROM public.users WHERE id = v_sdr_id;
  END IF;

  -- Insert notification for the captador
  INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
  VALUES (
    v_captador_id,
    'visita_registrada',
    'Visita registrada para o seu imóvel',
    'Uma nova visita foi registrada para o seu imóvel ' || COALESCE(v_codigo_imovel, 'sem código') || ' na demanda de ' || COALESCE(v_cliente_nome, 'Cliente') || '.',
    jsonb_build_object(
      'imovel_id', v_imovel_id,
      'demanda_id', v_demanda_id,
      'property_link_id', NEW.property_link_id,
      'visit_id', NEW.id,
      'visited_at', NEW.visited_at
    ),
    'alta'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_visit_captador ON public.visit_records;
CREATE TRIGGER trg_notify_visit_captador
  AFTER INSERT ON public.visit_records
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_visit_to_captador();

-- Ensure RLS policies for visit_records
DROP POLICY IF EXISTS "authenticated_select_visit_records" ON public.visit_records;
CREATE POLICY "authenticated_select_visit_records" ON public.visit_records
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_visit_records" ON public.visit_records;
CREATE POLICY "authenticated_insert_visit_records" ON public.visit_records
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_visit_records" ON public.visit_records;
CREATE POLICY "authenticated_update_visit_records" ON public.visit_records
  FOR UPDATE TO authenticated USING (auth.uid() = sdr_user_id);

DROP POLICY IF EXISTS "authenticated_delete_visit_records" ON public.visit_records;
CREATE POLICY "authenticated_delete_visit_records" ON public.visit_records
  FOR DELETE TO authenticated USING (auth.uid() = sdr_user_id);

-- Ensure RLS policies for notificacoes
DROP POLICY IF EXISTS "authenticated_select_notificacoes" ON public.notificacoes;
CREATE POLICY "authenticated_select_notificacoes" ON public.notificacoes
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "authenticated_insert_notificacoes" ON public.notificacoes;
CREATE POLICY "authenticated_insert_notificacoes" ON public.notificacoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_notificacoes" ON public.notificacoes;
CREATE POLICY "authenticated_update_notificacoes" ON public.notificacoes
  FOR UPDATE TO authenticated USING (usuario_id = auth.uid());

-- Ensure RLS policies for demand_status_log
DROP POLICY IF EXISTS "authenticated_select_demand_status_log_v2" ON public.demand_status_log;
CREATE POLICY "authenticated_select_demand_status_log_v2" ON public.demand_status_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_demand_status_log_v2" ON public.demand_status_log;
CREATE POLICY "authenticated_insert_demand_status_log_v2" ON public.demand_status_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add visit_records to realtime publication if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'visit_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.visit_records;
  END IF;
END $$;
