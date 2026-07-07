-- Migration: Standardize 'perdida' status value across all demandas tables
-- 1. Normalize any 'Perdida'/'PERDIDA' to lowercase 'perdida'
-- 2. Reinforce CHECK constraints (idempotent)
-- 3. Reinforce RLS UPDATE policies for owners (idempotent)
-- 4. Reinforce trigger functions that must not block 'perdida' (idempotent)

-- 1. Normalize status_demanda values to lowercase 'perdida'
UPDATE public.demandas_locacao
SET status_demanda = 'perdida', updated_at = NOW()
WHERE LOWER(status_demanda) = 'perdida' AND status_demanda != 'perdida';

UPDATE public.demandas_vendas
SET status_demanda = 'perdida', updated_at = NOW()
WHERE LOWER(status_demanda) = 'perdida' AND status_demanda != 'perdida';

-- 2. Drop and recreate CHECK constraints to ensure 'perdida' is allowed
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

ALTER TABLE public.demandas_locacao
ADD CONSTRAINT demandas_locacao_status_demanda_check
CHECK (lower(status_demanda) IN (
  'ativo', 'aberta', 'fechado', 'fechada', 'perdida', 'perdido', 'arquivada',
  'pendente', 'em_negociacao', 'finalizada', 'finalizado', 'cancelada', 'cancelado',
  'em busca', 'atendida', 'sem_resposta_24h', 'ganho', 'impossivel',
  'perdida_baixa', 'pausada', 'concluida', 'concluída', 'localmente_perdida',
  'prioritaria', 'ativa'
)) NOT VALID;

ALTER TABLE public.demandas_vendas
ADD CONSTRAINT demandas_vendas_status_demanda_check
CHECK (lower(status_demanda) IN (
  'ativo', 'aberta', 'fechado', 'fechada', 'perdida', 'perdido', 'arquivada',
  'pendente', 'em_negociacao', 'finalizada', 'finalizado', 'cancelada', 'cancelado',
  'em busca', 'atendida', 'sem_resposta_24h', 'ganho', 'impossivel',
  'perdida_baixa', 'pausada', 'concluida', 'concluída', 'localmente_perdida',
  'prioritaria', 'ativa'
)) NOT VALID;

-- 3. Reinforce RLS UPDATE policies for owners (sdr_id / corretor_id) and admins
DROP POLICY IF EXISTS "owner_update_status_locacao" ON public.demandas_locacao;
CREATE POLICY "owner_update_status_locacao" ON public.demandas_locacao
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = sdr_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  )
  WITH CHECK (
    auth.uid() = sdr_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

DROP POLICY IF EXISTS "owner_update_status_vendas" ON public.demandas_vendas;
CREATE POLICY "owner_update_status_vendas" ON public.demandas_vendas
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = corretor_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  )
  WITH CHECK (
    auth.uid() = corretor_id
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

-- 4. Reinforce trigger functions to NEVER block 'perdida' status changes
--    even when imovel_demand_match entries exist
CREATE OR REPLACE FUNCTION public.check_demand_auto_close()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_all_captadores_lost()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fn_handle_captador_lost_demand()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
