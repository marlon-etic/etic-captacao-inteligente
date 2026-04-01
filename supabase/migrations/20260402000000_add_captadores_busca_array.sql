ALTER TABLE public.demandas_locacao ADD COLUMN IF NOT EXISTS captadores_busca JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.demandas_vendas ADD COLUMN IF NOT EXISTS captadores_busca JSONB DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.append_captador_busca(
  p_demanda_id uuid,
  p_tipo_demanda text,
  p_captador_id uuid,
  p_nome text,
  p_regiao text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_arr jsonb;
  v_filtered_arr jsonb;
  v_new_entry jsonb;
BEGIN
  v_new_entry := jsonb_build_object(
    'captador_id', p_captador_id,
    'nome', p_nome,
    'regiao', p_regiao,
    'data_clique', NOW()
  );

  IF p_tipo_demanda = 'Aluguel' THEN
    SELECT COALESCE(captadores_busca, '[]'::jsonb) INTO v_current_arr FROM public.demandas_locacao WHERE id = p_demanda_id FOR UPDATE;
  ELSE
    SELECT COALESCE(captadores_busca, '[]'::jsonb) INTO v_current_arr FROM public.demandas_vendas WHERE id = p_demanda_id FOR UPDATE;
  END IF;

  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO v_filtered_arr
  FROM jsonb_array_elements(v_current_arr) AS elem
  WHERE (elem->>'data_clique')::timestamp > NOW() - INTERVAL '1 day'
    AND (elem->>'captador_id') != p_captador_id::text;

  v_filtered_arr := v_filtered_arr || v_new_entry;

  WHILE jsonb_array_length(v_filtered_arr) > 10 LOOP
    v_filtered_arr := v_filtered_arr - 0;
  END LOOP;

  IF p_tipo_demanda = 'Aluguel' THEN
    UPDATE public.demandas_locacao SET captadores_busca = v_filtered_arr WHERE id = p_demanda_id;
  ELSE
    UPDATE public.demandas_vendas SET captadores_busca = v_filtered_arr WHERE id = p_demanda_id;
  END IF;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Tenta criar o cron job de limpeza diária, ignorando se falhar por falta de permissão ou já existir
  BEGIN
    PERFORM cron.schedule('clean_captadores_busca', '0 0 * * *', $$
      UPDATE public.demandas_locacao
      SET captadores_busca = (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(captadores_busca) AS elem
        WHERE (elem->>'data_clique')::timestamp > NOW() - INTERVAL '1 day'
      )
      WHERE captadores_busca IS NOT NULL AND jsonb_array_length(captadores_busca) > 0;
      
      UPDATE public.demandas_vendas
      SET captadores_busca = (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(captadores_busca) AS elem
        WHERE (elem->>'data_clique')::timestamp > NOW() - INTERVAL '1 day'
      )
      WHERE captadores_busca IS NOT NULL AND jsonb_array_length(captadores_busca) > 0;
    $$);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível agendar o pg_cron. Certifique-se de que a extensão está ativada e o usuário tem permissão.';
  END;
END $$;
