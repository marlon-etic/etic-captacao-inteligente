DO $$
BEGIN
    ALTER TABLE public.imoveis_captados DROP CONSTRAINT IF EXISTS imoveis_captados_status_captacao_check;
    ALTER TABLE public.imoveis_captados ADD CONSTRAINT imoveis_captados_status_captacao_check 
      CHECK (status_captacao IN ('pendente', 'capturado', 'visitado', 'fechado', 'perdido'));
END $$;
