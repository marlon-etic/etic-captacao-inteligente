DO $$
BEGIN
  -- Cria a função para atualizar demandas inativas
  CREATE OR REPLACE FUNCTION public.fn_marcar_demandas_perdidas_inatividade()
  RETURNS void AS $$
  BEGIN
    -- Demandas de Locação
    UPDATE public.demandas_locacao
    SET status_demanda = 'PERDIDA_BAIXA',
        motivo_perda = 'Inatividade / Excedeu prazo de 1 semana',
        motivo_perda_descricao = 'Inatividade / Excedeu prazo de 1 semana',
        updated_at = NOW()
    WHERE status_demanda IN ('aberta', 'sem_resposta_24h')
      AND created_at < NOW() - INTERVAL '7 days';

    -- Demandas de Vendas
    UPDATE public.demandas_vendas
    SET status_demanda = 'PERDIDA_BAIXA',
        motivo_perda = 'Inatividade / Excedeu prazo de 1 semana',
        motivo_perda_descricao = 'Inatividade / Excedeu prazo de 1 semana',
        updated_at = NOW()
    WHERE status_demanda IN ('aberta', 'sem_resposta_24h')
      AND created_at < NOW() - INTERVAL '7 days';
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Cria a função trigger que chama a atualização (com proteção de profundidade)
  CREATE OR REPLACE FUNCTION public.trg_fn_auto_cleanup_inactive_demands()
  RETURNS trigger AS $$
  BEGIN
    -- Evita loop infinito se o UPDATE da trigger disparar a si mesmo
    IF pg_trigger_depth() > 1 THEN
      RETURN NULL;
    END IF;
    
    PERFORM public.fn_marcar_demandas_perdidas_inatividade();
    RETURN NULL; -- Trigger AFTER STATEMENT
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Remove as triggers se existirem
  DROP TRIGGER IF EXISTS trg_auto_cleanup_locacao ON public.demandas_locacao;
  DROP TRIGGER IF EXISTS trg_auto_cleanup_vendas ON public.demandas_vendas;

  -- Adiciona triggers de statement (dispara 1x por UPDATE/INSERT para não onerar)
  CREATE TRIGGER trg_auto_cleanup_locacao
  AFTER UPDATE OR INSERT ON public.demandas_locacao
  FOR EACH STATEMENT EXECUTE FUNCTION public.trg_fn_auto_cleanup_inactive_demands();

  CREATE TRIGGER trg_auto_cleanup_vendas
  AFTER UPDATE OR INSERT ON public.demandas_vendas
  FOR EACH STATEMENT EXECUTE FUNCTION public.trg_fn_auto_cleanup_inactive_demands();

  -- Executa uma vez inicialmente para limpar o banco existente
  PERFORM public.fn_marcar_demandas_perdidas_inatividade();
END $$;
