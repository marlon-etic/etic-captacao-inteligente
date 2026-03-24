DO $
BEGIN
  ALTER TABLE public.imoveis_captados ADD COLUMN IF NOT EXISTS etapa_funil character varying DEFAULT 'capturado';
  ALTER TABLE public.imoveis_captados ADD COLUMN IF NOT EXISTS data_visita timestamptz;
  ALTER TABLE public.imoveis_captados ADD COLUMN IF NOT EXISTS data_fechamento timestamptz;
  ALTER TABLE public.imoveis_captados ADD COLUMN IF NOT EXISTS dormitorios integer;
  ALTER TABLE public.imoveis_captados ADD COLUMN IF NOT EXISTS vagas integer;
  ALTER TABLE public.imoveis_captados ADD COLUMN IF NOT EXISTS observacoes text;
END $;
