DO $BLOCK$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'demandas_locacao'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.demandas_locacao;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $BLOCK$;

DO $BLOCK$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'demandas_vendas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.demandas_vendas;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $BLOCK$;

DO $BLOCK$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'imoveis_captados'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.imoveis_captados;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $BLOCK$;
