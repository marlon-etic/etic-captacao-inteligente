DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.imovel_demand_match (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id UUID REFERENCES public.imoveis_captados(id) ON DELETE CASCADE,
    demanda_id UUID,
    tipo_demanda TEXT CHECK (tipo_demanda IN ('Locação', 'Venda')),
    captador_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data_vinculacao TIMESTAMPTZ DEFAULT NOW(),
    tipo_vinculacao TEXT CHECK (tipo_vinculacao IN ('automatico', 'manual')),
    compatibilidade_pct NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE public.imovel_demand_match ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "captador_owns_matches" ON public.imovel_demand_match;
  CREATE POLICY "captador_owns_matches" ON public.imovel_demand_match
    FOR ALL TO authenticated USING (captador_id = auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.calculate_imovel_demand_match(p_imovel_id UUID, p_demanda_id UUID, p_tipo_demanda TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_imovel RECORD;
  v_demanda RECORD;
  v_score NUMERIC := 0;
  v_motivos TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('compatibilidade_pct', 0, 'motivo', 'Imóvel não encontrado'); END IF;

  IF p_tipo_demanda = 'Locação' THEN
    SELECT * INTO v_demanda FROM public.demandas_locacao WHERE id = p_demanda_id;
  ELSE
    SELECT * INTO v_demanda FROM public.demandas_vendas WHERE id = p_demanda_id;
  END IF;
  
  IF NOT FOUND THEN RETURN jsonb_build_object('compatibilidade_pct', 0, 'motivo', 'Demanda não encontrada'); END IF;

  IF v_imovel.localizacao_texto IS NOT NULL AND v_demanda.bairros IS NOT NULL AND array_length(v_demanda.bairros, 1) > 0 THEN
    IF v_imovel.localizacao_texto = ANY(v_demanda.bairros) OR v_imovel.localizacao_texto ILIKE ANY(SELECT '%' || unnest(v_demanda.bairros) || '%') THEN
      v_score := v_score + 30;
      v_motivos := array_append(v_motivos, 'Bairro compatível (+30%)');
    END IF;
  END IF;

  IF v_imovel.tipo_imovel IS NOT NULL AND v_demanda.tipo_imovel IS NOT NULL THEN
    IF v_imovel.tipo_imovel = v_demanda.tipo_imovel OR v_imovel.tipo_imovel ILIKE '%' || v_demanda.tipo_imovel || '%' THEN
      v_score := v_score + 25;
      v_motivos := array_append(v_motivos, 'Tipo de imóvel compatível (+25%)');
    END IF;
  END IF;

  IF v_imovel.preco IS NOT NULL AND v_demanda.valor_maximo IS NOT NULL THEN
    IF v_imovel.preco <= v_demanda.valor_maximo THEN
      v_score := v_score + 20;
      v_motivos := array_append(v_motivos, 'Valor dentro do orçamento (+20%)');
    END IF;
  END IF;

  IF v_imovel.dormitorios IS NOT NULL AND v_demanda.dormitorios IS NOT NULL THEN
    IF v_imovel.dormitorios >= v_demanda.dormitorios THEN
      v_score := v_score + 15;
      v_motivos := array_append(v_motivos, 'Dormitórios compatíveis (+15%)');
    END IF;
  END IF;

  IF v_imovel.vagas IS NOT NULL AND v_demanda.vagas_estacionamento IS NOT NULL THEN
    IF v_imovel.vagas >= v_demanda.vagas_estacionamento THEN
      v_score := v_score + 10;
      v_motivos := array_append(v_motivos, 'Vagas compatíveis (+10%)');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'compatibilidade_pct', v_score,
    'motivo', array_to_string(v_motivos, ', ')
  );
END;
$;

CREATE OR REPLACE FUNCTION public.get_imovel_matches(p_imovel_id UUID)
RETURNS TABLE (
  demanda_id UUID,
  cliente_nome TEXT,
  tipo TEXT,
  budget NUMERIC,
  bairros TEXT[],
  specs TEXT,
  compatibilidade_pct NUMERIC,
  match_status TEXT,
  motivo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_imovel RECORD;
  v_match JSONB;
  v_demanda RECORD;
BEGIN
  SELECT * INTO v_imovel FROM public.imoveis_captados WHERE id = p_imovel_id;
  IF NOT FOUND THEN RETURN; END IF;

  FOR v_demanda IN 
    SELECT * FROM public.demandas_locacao 
    WHERE status_demanda IN ('aberta', 'em busca') 
      AND NOT EXISTS (SELECT 1 FROM public.imovel_demand_match WHERE demanda_id = public.demandas_locacao.id AND imovel_id = p_imovel_id)
  LOOP
    v_match := public.calculate_imovel_demand_match(p_imovel_id, v_demanda.id, 'Locação');
    IF (v_match->>'compatibilidade_pct')::NUMERIC >= 70 THEN
      demanda_id := v_demanda.id;
      cliente_nome := v_demanda.nome_cliente;
      tipo := 'Locação';
      budget := v_demanda.valor_maximo;
      bairros := v_demanda.bairros;
      specs := COALESCE(v_demanda.dormitorios::TEXT, '0') || ' Dorm, ' || COALESCE(v_demanda.vagas_estacionamento::TEXT, '0') || ' Vagas';
      compatibilidade_pct := (v_match->>'compatibilidade_pct')::NUMERIC;
      match_status := CASE WHEN compatibilidade_pct >= 70 THEN 'alto' WHEN compatibilidade_pct >= 50 THEN 'medio' ELSE 'baixo' END;
      motivo := v_match->>'motivo';
      RETURN NEXT;
    END IF;
  END LOOP;

  FOR v_demanda IN 
    SELECT * FROM public.demandas_vendas 
    WHERE status_demanda IN ('aberta', 'em busca') 
      AND NOT EXISTS (SELECT 1 FROM public.imovel_demand_match WHERE demanda_id = public.demandas_vendas.id AND imovel_id = p_imovel_id)
  LOOP
    v_match := public.calculate_imovel_demand_match(p_imovel_id, v_demanda.id, 'Venda');
    IF (v_match->>'compatibilidade_pct')::NUMERIC >= 70 THEN
      demanda_id := v_demanda.id;
      cliente_nome := v_demanda.nome_cliente;
      tipo := 'Venda';
      budget := v_demanda.valor_maximo;
      bairros := v_demanda.bairros;
      specs := COALESCE(v_demanda.dormitorios::TEXT, '0') || ' Dorm, ' || COALESCE(v_demanda.vagas_estacionamento::TEXT, '0') || ' Vagas';
      compatibilidade_pct := (v_match->>'compatibilidade_pct')::NUMERIC;
      match_status := CASE WHEN compatibilidade_pct >= 70 THEN 'alto' WHEN compatibilidade_pct >= 50 THEN 'medio' ELSE 'baixo' END;
      motivo := v_match->>'motivo';
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$;
