CREATE OR REPLACE FUNCTION public.fn_set_tipo_imovel()
RETURNS TRIGGER AS $$
BEGIN
  -- If tipo is 'Ambos', preserve it. Otherwise, infer based on linked demand if applicable.
  IF NEW.tipo = 'Ambos' THEN
    -- Keep it as Ambos
    NULL;
  ELSIF NEW.demanda_locacao_id IS NOT NULL AND (NEW.tipo IS NULL OR NEW.tipo != 'Locação') THEN
    NEW.tipo := 'Locação';
  ELSIF NEW.demanda_venda_id IS NOT NULL AND (NEW.tipo IS NULL OR NEW.tipo != 'Venda') THEN
    NEW.tipo := 'Venda';
  END IF;

  -- Ensure it's not null if missing (default to Venda if solto and no type specified)
  IF NEW.tipo IS NULL THEN
    NEW.tipo := 'Venda';
  END IF;

  -- Normalize Aluguel to Locação just in case
  IF NEW.tipo = 'Aluguel' THEN
    NEW.tipo := 'Locação';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
