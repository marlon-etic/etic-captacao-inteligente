-- Adiciona a coluna necessidades_especificas na tabela demandas_vendas
ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS necessidades_especificas TEXT;
