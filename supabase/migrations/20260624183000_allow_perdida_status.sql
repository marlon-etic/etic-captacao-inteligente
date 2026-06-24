DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop check constraints on status_demanda for demandas_locacao
  FOR r IN (
    SELECT conname
    FROM pg_constraint 
    WHERE conrelid = 'public.demandas_locacao'::regclass 
      AND contype = 'c' 
      AND conkey @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.demandas_locacao'::regclass AND attname = 'status_demanda')]
  ) LOOP
    EXECUTE 'ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;

  -- Drop check constraints on status_demanda for demandas_vendas
  FOR r IN (
    SELECT conname
    FROM pg_constraint 
    WHERE conrelid = 'public.demandas_vendas'::regclass 
      AND contype = 'c' 
      AND conkey @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.demandas_vendas'::regclass AND attname = 'status_demanda')]
  ) LOOP
    EXECUTE 'ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;
