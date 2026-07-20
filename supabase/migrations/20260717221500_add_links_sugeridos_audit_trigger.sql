-- Add RLS policy for authenticated users to read audit_log (needed for timeline)
DROP POLICY IF EXISTS "authenticated_select_audit_log" ON public.audit_log;
CREATE POLICY "authenticated_select_audit_log" ON public.audit_log
  FOR SELECT TO authenticated USING (true);

-- Ensure audit_log is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'audit_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
  END IF;
END $$;

-- Create trigger function to log links_sugeridos changes
CREATE OR REPLACE FUNCTION public.log_links_sugeridos_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.links_sugeridos IS DISTINCT FROM OLD.links_sugeridos THEN
    INSERT INTO public.audit_log (usuario_id, acao, tabela, registro_id, dados_antigos, dados_novos)
    VALUES (
      auth.uid(),
      'UPDATE_LINKS',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('links_sugeridos', OLD.links_sugeridos),
      jsonb_build_object('links_sugeridos', NEW.links_sugeridos)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on both demand tables
DROP TRIGGER IF EXISTS trigger_log_links_sugeridos_locacao ON public.demandas_locacao;
CREATE TRIGGER trigger_log_links_sugeridos_locacao
  AFTER UPDATE OF links_sugeridos ON public.demandas_locacao
  FOR EACH ROW EXECUTE FUNCTION public.log_links_sugeridos_change();

DROP TRIGGER IF EXISTS trigger_log_links_sugeridos_vendas ON public.demandas_vendas;
CREATE TRIGGER trigger_log_links_sugeridos_vendas
  AFTER UPDATE OF links_sugeridos ON public.demandas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.log_links_sugeridos_change();
