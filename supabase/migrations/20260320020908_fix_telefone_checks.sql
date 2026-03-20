DO $$ 
BEGIN
  UPDATE public.demandas_locacao SET telefone = regexp_replace(telefone, '[\r\n]+', '', 'g') WHERE telefone ~ '[\r\n]';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE IF EXISTS public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_telefone_check;
  ALTER TABLE IF EXISTS public.demandas_locacao ADD CONSTRAINT demandas_locacao_telefone_check 
    CHECK (telefone IS NULL OR telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}$');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  UPDATE public.demandas_compra SET telefone = regexp_replace(telefone, '[\r\n]+', '', 'g') WHERE telefone ~ '[\r\n]';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE IF EXISTS public.demandas_compra DROP CONSTRAINT IF EXISTS demandas_compra_telefone_check;
  ALTER TABLE IF EXISTS public.demandas_compra ADD CONSTRAINT demandas_compra_telefone_check 
    CHECK (telefone IS NULL OR telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}$');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  UPDATE public.captadores SET telefone = regexp_replace(telefone, '[\r\n]+', '', 'g') WHERE telefone ~ '[\r\n]';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE IF EXISTS public.captadores DROP CONSTRAINT IF EXISTS captadores_telefone_check;
  ALTER TABLE IF EXISTS public.captadores ADD CONSTRAINT captadores_telefone_check 
    CHECK (telefone IS NULL OR telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}$');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  UPDATE public.corretores SET telefone = regexp_replace(telefone, '[\r\n]+', '', 'g') WHERE telefone ~ '[\r\n]';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE IF EXISTS public.corretores DROP CONSTRAINT IF EXISTS corretores_telefone_check;
  ALTER TABLE IF EXISTS public.corretores ADD CONSTRAINT corretores_telefone_check 
    CHECK (telefone IS NULL OR telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}$');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
