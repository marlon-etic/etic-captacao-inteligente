DO $$
BEGIN
  -- Drop existing constraints
  ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS demandas_vendas_tipo_imovel_check;
  ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_tipo_imovel_check;

  -- Add regex constraints allowing comma separated values
  ALTER TABLE public.demandas_vendas ADD CONSTRAINT demandas_vendas_tipo_imovel_check 
  CHECK (
    tipo_imovel IS NULL 
    OR tipo_imovel ~ '^(Apartamento|Casa|Casa/Sobrado|Prédio Comercial|Sala Comercial|Galpão)(,(Apartamento|Casa|Casa/Sobrado|Prédio Comercial|Sala Comercial|Galpão))*$'
  );

  ALTER TABLE public.demandas_locacao ADD CONSTRAINT demandas_locacao_tipo_imovel_check 
  CHECK (
    tipo_imovel IS NULL 
    OR tipo_imovel ~ '^(Apartamento|Casa|Casa/Sobrado|Prédio Comercial|Sala Comercial|Galpão)(,(Apartamento|Casa|Casa/Sobrado|Prédio Comercial|Sala Comercial|Galpão))*$'
  );
END $$;
