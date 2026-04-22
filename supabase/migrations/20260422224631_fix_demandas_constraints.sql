DO $$
DECLARE
  col_type text;
BEGIN
  -- Fix demandas_vendas constraints & types
  -- ==========================================
  DROP CONSTRAINT IF EXISTS demandas_vendas_tipo_imovel_check ON public.demandas_vendas;
  DROP CONSTRAINT IF EXISTS demandas_vendas_telefone_check ON public.demandas_vendas;
=======
  -- ==========================================
  -- Fix demandas_vendas constraints & types
  -- ==========================================
  ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS demandas_vendas_tipo_imovel_check;
  ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS demandas_vendas_telefone_check;Fix demandas_locacao constraints & types
  -- ==========================================
  DROP CONSTRAINT IF EXISTS demandas_locacao_tipo_imovel_check ON public.demandas_locacao;
  DROP CONSTRAINT IF EXISTS demandas_locacao_telefone_check ON public.demandas_locacao;
=======
  -- ==========================================
  -- Fix demandas_locacao constraints & types
  -- ==========================================
  ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_tipo_imovel_check;
  ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_telefone_check;==========================================
  -- Fix demandas_locacao constraints & types
  -- ==========================================
  DROP CONSTRAINT IF EXISTS demandas_locacao_tipo_imovel_check ON public.demandas_locacao;
  DROP CONSTRAINT IF EXISTS demandas_locacao_telefone_check ON public.demandas_locacao;

  -- Ensure tipo_imovel is an array to support multiple selections
  SELECT data_type INTO col_type FROM information_schema.columns WHERE table_name = 'demandas_locacao' AND column_name = 'tipo_imovel';
  IF col_type = 'text' OR col_type = 'character varying' THEN
    ALTER TABLE public.demandas_locacao ALTER COLUMN tipo_imovel TYPE text[] USING 
      CASE 
        WHEN tipo_imovel IS NULL THEN NULL 
        WHEN tipo_imovel = '' THEN '{}'::text[] 
        ELSE ARRAY[tipo_imovel]::text[] 
      END;
  END IF;

  -- Relax constraints for arrays and phones
  ALTER TABLE public.demandas_locacao 
  ADD CONSTRAINT demandas_locacao_tipo_imovel_check 
  CHECK (tipo_imovel IS NULL OR tipo_imovel && ARRAY['Apartamento', 'Casa', 'Casa/Sobrado', 'Prédio Comercial', 'Sala Comercial', 'Galpão', 'Terreno', 'Comercial']::text[]);

  ALTER TABLE public.demandas_locacao 
  ADD CONSTRAINT demandas_locacao_telefone_check 
  CHECK (telefone IS NULL OR telefone ~ '^\+?[0-9\s\-\(\)]{8,}$');

  -- ==========================================
  -- Fix demandas_vendas constraints & types
  -- ==========================================
  DROP CONSTRAINT IF EXISTS demandas_vendas_tipo_imovel_check ON public.demandas_vendas;
  DROP CONSTRAINT IF EXISTS demandas_vendas_telefone_check ON public.demandas_vendas;

  -- Ensure tipo_imovel is an array to support multiple selections
  SELECT data_type INTO col_type FROM information_schema.columns WHERE table_name = 'demandas_vendas' AND column_name = 'tipo_imovel';
  IF col_type = 'text' OR col_type = 'character varying' THEN
    ALTER TABLE public.demandas_vendas ALTER COLUMN tipo_imovel TYPE text[] USING 
      CASE 
        WHEN tipo_imovel IS NULL THEN NULL 
        WHEN tipo_imovel = '' THEN '{}'::text[] 
        ELSE ARRAY[tipo_imovel]::text[] 
      END;
  END IF;

  -- Relax constraints for arrays and phones
  ALTER TABLE public.demandas_vendas 
  ADD CONSTRAINT demandas_vendas_tipo_imovel_check 
  CHECK (tipo_imovel IS NULL OR tipo_imovel && ARRAY['Apartamento', 'Casa', 'Casa/Sobrado', 'Prédio Comercial', 'Sala Comercial', 'Galpão', 'Terreno', 'Comercial']::text[]);

  ALTER TABLE public.demandas_vendas 
  ADD CONSTRAINT demandas_vendas_telefone_check 
  CHECK (telefone IS NULL OR telefone ~ '^\+?[0-9\s\-\(\)]{8,}$');

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing constraints: %', SQLERRM;
END $$;
