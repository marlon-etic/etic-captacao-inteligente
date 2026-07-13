CREATE OR REPLACE FUNCTION public.fn_get_foco_demandas(
  p_bairro TEXT DEFAULT NULL,
  p_tipo TEXT DEFAULT NULL,
  p_tipo_imovel TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  nome_cliente text,
  bairros text[],
  localizacoes text[],
  valor_maximo numeric,
  orcamento_max numeric,
  dormitorios integer,
  quartos integer,
  nivel_urgencia text,
  status_demanda text,
  tipo_imovel text,
  created_at timestamptz,
  telefone text,
  email text,
  tipo text,
  observacoes text,
  vagas integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_is_commercial boolean;
  v_bairro_lower text;
BEGIN
  v_bairro_lower := lower(trim(COALESCE(p_bairro, '')));
  
  IF p_tipo_imovel IS NOT NULL AND lower(trim(p_tipo_imovel)) = 'comercial' THEN
    v_is_commercial := true;
  ELSE
    v_is_commercial := false;
  END IF;

  IF p_tipo IS NULL OR lower(p_tipo) LIKE '%loc%' THEN
    RETURN QUERY
    SELECT
      d.id,
      COALESCE(d.nome_cliente, d.cliente_nome),
      d.bairros,
      d.localizacoes,
      COALESCE(NULLIF(d.valor_maximo, 0), d.orcamento_max, 0),
      d.orcamento_max,
      d.dormitorios,
      d.quartos,
      d.nivel_urgencia,
      d.status_demanda,
      d.tipo_imovel,
      d.created_at,
      d.telefone,
      d.email,
      'Locação'::text,
      d.observacoes,
      COALESCE(d.vagas, d.vagas_estacionamento, 0)
    FROM public.demandas_locacao d
    WHERE d.status_demanda IN ('aberta', 'em busca', 'em visita')
      AND (
        v_bairro_lower = '' OR v_bairro_lower = 'sem bairro'
        OR EXISTS (
          SELECT 1 FROM unnest(COALESCE(d.bairros, d.localizacoes, ARRAY[]::text[])) AS b
          WHERE lower(trim(b)) = v_bairro_lower
        )
      )
      AND (
        v_is_commercial = false
        OR lower(trim(COALESCE(d.tipo_imovel, ''))) IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial')
      )
      AND (
        v_is_commercial = true
        OR COALESCE(d.tipo_imovel, '') = ''
        OR lower(trim(d.tipo_imovel)) NOT IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial')
      );
  END IF;

  IF p_tipo IS NULL OR lower(p_tipo) LIKE '%ven%' THEN
    RETURN QUERY
    SELECT
      d.id,
      COALESCE(d.nome_cliente, d.cliente_nome),
      d.bairros,
      d.localizacoes,
      COALESCE(NULLIF(d.valor_maximo, 0), d.orcamento_max, 0),
      d.orcamento_max,
      d.dormitorios,
      d.quartos,
      d.nivel_urgencia,
      d.status_demanda,
      d.tipo_imovel,
      d.created_at,
      d.telefone,
      d.email,
      'Venda'::text,
      d.observacoes,
      COALESCE(d.vagas, d.vagas_estacionamento, 0)
    FROM public.demandas_vendas d
    WHERE d.status_demanda IN ('aberta', 'em busca', 'em visita')
      AND (
        v_bairro_lower = '' OR v_bairro_lower = 'sem bairro'
        OR EXISTS (
          SELECT 1 FROM unnest(COALESCE(d.bairros, d.localizacoes, ARRAY[]::text[])) AS b
          WHERE lower(trim(b)) = v_bairro_lower
        )
      )
      AND (
        v_is_commercial = false
        OR lower(trim(COALESCE(d.tipo_imovel, ''))) IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial')
      )
      AND (
        v_is_commercial = true
        OR COALESCE(d.tipo_imovel, '') = ''
        OR lower(trim(d.tipo_imovel)) NOT IN ('comercial', 'loja', 'galpão', 'sala', 'pavilhão', 'laje corporativa', 'prédio', 'ponto comercial')
      );
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.fn_get_foco_demandas(TEXT, TEXT, TEXT) TO authenticated;
