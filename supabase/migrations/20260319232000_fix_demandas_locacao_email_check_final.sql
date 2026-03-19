-- Drop the complex regex constraint that causes multiline dump issues in types.ts
ALTER TABLE IF EXISTS public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_email_check;

-- Add a simpler constraint that fits on a single line and won't trigger pg_dump wrapping
ALTER TABLE IF EXISTS public.demandas_locacao 
  ADD CONSTRAINT demandas_locacao_email_check 
  CHECK (email IS NULL OR email = '' OR email LIKE '%@%');
