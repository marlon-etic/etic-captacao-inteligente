DO $$ 
BEGIN
  ALTER TABLE IF EXISTS public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_telefone_check;
  ALTER TABLE IF EXISTS public.demandas_locacao ADD CONSTRAINT demandas_locacao_telefone_check 
    CHECK (telefone IS NULL OR (telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}' AND length(telefone) = 15));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE IF EXISTS public.demandas_compra DROP CONSTRAINT IF EXISTS demandas_compra_telefone_check;
  ALTER TABLE IF EXISTS public.demandas_compra ADD CONSTRAINT demandas_compra_telefone_check 
    CHECK (telefone IS NULL OR (telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}' AND length(telefone) = 15));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE IF EXISTS public.captadores DROP CONSTRAINT IF EXISTS captadores_telefone_check;
  ALTER TABLE IF EXISTS public.captadores ADD CONSTRAINT captadores_telefone_check 
    CHECK (telefone IS NULL OR (telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}' AND length(telefone) = 15));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE IF EXISTS public.corretores DROP CONSTRAINT IF EXISTS corretores_telefone_check;
  ALTER TABLE IF EXISTS public.corretores ADD CONSTRAINT corretores_telefone_check 
    CHECK (telefone IS NULL OR (telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}' AND length(telefone) = 15));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
