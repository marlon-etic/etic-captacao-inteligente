-- Migrations must be idempotent

-- Fix check constraint on demandas_locacao to include 'perdida'
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'demandas_locacao'::regclass 
      AND c.contype = 'c' 
      AND a.attname = 'status_demanda'
  LOOP
    EXECUTE 'ALTER TABLE demandas_locacao DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
END $$;

ALTER TABLE public.demandas_locacao
ADD CONSTRAINT chk_status_demanda_locacao
CHECK (lower(status_demanda) IN ('ativo', 'aberta', 'pausada', 'fechada', 'perdida', 'perdido', 'concluída', 'concluida', 'pendente', 'cancelada'));


-- Fix check constraint on demandas_vendas to include 'perdida'
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'demandas_vendas'::regclass 
      AND c.contype = 'c' 
      AND a.attname = 'status_demanda'
  LOOP
    EXECUTE 'ALTER TABLE demandas_vendas DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
END $$;

ALTER TABLE public.demandas_vendas
ADD CONSTRAINT chk_status_demanda_vendas
CHECK (lower(status_demanda) IN ('ativo', 'aberta', 'pausada', 'fechada', 'perdida', 'perdido', 'concluída', 'concluida', 'pendente', 'cancelada'));


-- Update RLS policies for imoveis_captados
DO $$
BEGIN
  DROP POLICY IF EXISTS "SDRs can read locacao and ambos properties" ON public.imoveis_captados;
  DROP POLICY IF EXISTS "Corretores can read venda and ambos properties" ON public.imoveis_captados;
END $$;

CREATE POLICY "SDRs can read locacao and ambos properties" ON public.imoveis_captados
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'sdr'
    AND (tipo = 'Locação' OR tipo = 'Aluguel' OR tipo = 'Ambos' OR tipo IS NULL)
  );

CREATE POLICY "Corretores can read venda and ambos properties" ON public.imoveis_captados
  FOR SELECT
  TO authenticated
  USING (
    ((SELECT role FROM public.users WHERE id = auth.uid()) = 'corretor' OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'broker')
    AND (tipo = 'Venda' OR tipo = 'Ambos' OR tipo IS NULL)
  );
