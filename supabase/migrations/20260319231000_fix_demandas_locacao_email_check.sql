-- Fix the email check constraint that was causing multiline dump issues in types.ts
ALTER TABLE IF EXISTS public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_email_check;

ALTER TABLE IF EXISTS public.demandas_locacao 
  ADD CONSTRAINT demandas_locacao_email_check 
  CHECK (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]+$');
