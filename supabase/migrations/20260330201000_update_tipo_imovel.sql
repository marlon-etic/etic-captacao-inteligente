DO $$ 
BEGIN
  -- Ensure existing rows are updated if they have demand links to avoid inconsistencies
  UPDATE public.imoveis_captados 
  SET tipo = 'Aluguel' 
  WHERE demanda_locacao_id IS NOT NULL AND (tipo IS NULL OR tipo != 'Aluguel');
  
  UPDATE public.imoveis_captados 
  SET tipo = 'Venda' 
  WHERE demanda_venda_id IS NOT NULL AND (tipo IS NULL OR tipo != 'Venda');
END $$;

CREATE OR REPLACE FUNCTION public.fn_set_tipo_imovel()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically infer type based on linked demand
  IF NEW.demanda_locacao_id IS NOT NULL THEN
    NEW.tipo := 'Aluguel';
  ELSIF NEW.demanda_venda_id IS NOT NULL THEN
    NEW.tipo := 'Venda';
  END IF;

  -- Ensure it's not null if missing (default to Venda if solto and no type specified)
  IF NEW.tipo IS NULL THEN
    NEW.tipo := 'Venda';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS trg_set_tipo_imovel ON public.imoveis_captados;
CREATE TRIGGER trg_set_tipo_imovel
  BEFORE INSERT OR UPDATE ON public.imoveis_captados
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_tipo_imovel();

CREATE INDEX IF NOT EXISTS idx_imoveis_tipo ON public.imoveis_captados(tipo);
