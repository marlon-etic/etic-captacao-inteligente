-- ✅ ADICIONAR COLUNA tipo_imovel A imoveis_captados (se não existir)
ALTER TABLE public.imoveis_captados 
ADD COLUMN IF NOT EXISTS tipo_imovel TEXT DEFAULT 'Apartamento' 
CHECK (tipo_imovel IN ('Apartamento', 'Casa/Sobrado', 'Prédio Comercial', 'Sala Comercial', 'Galpão'));

-- ✅ ADICIONAR COLUNA status_revisao A imoveis_captados (para marcar dados problemáticos)
ALTER TABLE public.imoveis_captados 
ADD COLUMN IF NOT EXISTS status_revisao TEXT DEFAULT 'ok' 
CHECK (status_revisao IN ('ok', 'revisar_preco', 'revisar_dados'));

-- Converter tipo_imovel de text para text[] nas demandas_vendas
DO $$
BEGIN
  ALTER TABLE public.demandas_vendas ALTER COLUMN tipo_imovel DROP DEFAULT;
  ALTER TABLE public.demandas_vendas ALTER COLUMN tipo_imovel TYPE text[] USING ARRAY[COALESCE(tipo_imovel, 'Apartamento')];
  ALTER TABLE public.demandas_vendas ALTER COLUMN tipo_imovel SET DEFAULT ARRAY['Apartamento']::text[];
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Converter tipo_imovel de text para text[] nas demandas_locacao
DO $$
BEGIN
  ALTER TABLE public.demandas_locacao ALTER COLUMN tipo_imovel DROP DEFAULT;
  ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS tipo_imovel text[];
  ALTER TABLE public.demandas_locacao ALTER COLUMN tipo_imovel TYPE text[] USING ARRAY[COALESCE(tipo_imovel, 'Apartamento')];
  ALTER TABLE public.demandas_locacao ALTER COLUMN tipo_imovel SET DEFAULT ARRAY['Apartamento']::text[];
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ✅ MARCAR IMÓVEIS COM PREÇO PROBLEMÁTICO
UPDATE public.imoveis_captados 
SET status_revisao = 'revisar_preco' 
WHERE preco < 50000 AND preco > 0;

-- ✅ MARCAR IMÓVEIS SEM PREÇO
UPDATE public.imoveis_captados 
SET status_revisao = 'revisar_dados' 
WHERE preco IS NULL OR preco = 0;
