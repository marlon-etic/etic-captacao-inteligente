CREATE TABLE IF NOT EXISTS public.demand_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id UUID NOT NULL,
  tipo_demanda TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  alterado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_status_log_demanda_id ON public.demand_status_log(demanda_id);
CREATE INDEX IF NOT EXISTS idx_demand_status_log_created_at ON public.demand_status_log(created_at DESC);

ALTER TABLE public.demand_status_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_demand_status_log" ON public.demand_status_log;
CREATE POLICY "authenticated_select_demand_status_log" ON public.demand_status_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_demand_status_log" ON public.demand_status_log;
CREATE POLICY "authenticated_insert_demand_status_log" ON public.demand_status_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_demand_status_change()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.demand_status_log (demanda_id, tipo_demanda, status_anterior, status_novo, alterado_por)
  VALUES (NEW.id, TG_ARGV[0], OLD.status_demanda, NEW.status_demanda, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_status_change_locacao ON public.demandas_locacao;
CREATE TRIGGER log_status_change_locacao
  AFTER UPDATE OF status_demanda ON public.demandas_locacao
  FOR EACH ROW WHEN (OLD.status_demanda IS DISTINCT FROM NEW.status_demanda)
  EXECUTE FUNCTION public.log_demand_status_change('Locação');

DROP TRIGGER IF EXISTS log_status_change_vendas ON public.demandas_vendas;
CREATE TRIGGER log_status_change_vendas
  AFTER UPDATE OF status_demanda ON public.demandas_vendas
  FOR EACH ROW WHEN (OLD.status_demanda IS DISTINCT FROM NEW.status_demanda)
  EXECUTE FUNCTION public.log_demand_status_change('Venda');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'demand_status_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_status_log;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'visit_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.visit_records;
  END IF;
END $$;
