CREATE OR REPLACE FUNCTION public.notify_links_sugeridos_updated()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.links_sugeridos, '[]'::jsonb) IS DISTINCT FROM COALESCE(OLD.links_sugeridos, '[]'::jsonb) THEN
    INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
    SELECT
      c.captador_id,
      'status_atualizado'::notificacao_tipo,
      'Links de Referência Atualizados',
      'Novos links de imóveis de referência foram adicionados para a demanda de ' || COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'cliente'),
      jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', NEW.tipo, 'links_count', jsonb_array_length(COALESCE(NEW.links_sugeridos, '[]'::jsonb))),
      'normal'::notificacao_prioridade
    FROM (
      SELECT DISTINCT elem->>'captador_id' AS captador_id
      FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
      WHERE elem->>'captador_id' IS NOT NULL
    ) c
    WHERE c.captador_id IS NOT NULL;

    IF NEW.sdr_id IS NOT NULL THEN
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      VALUES (
        NEW.sdr_id,
        'status_atualizado'::notificacao_tipo,
        'Links de Referência Salvos',
        'Os links sugeridos foram salvos e estão visíveis para os captadores.',
        jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', NEW.tipo),
        'baixa'::notificacao_prioridade
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_links_sugeridos_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_links_sugeridos_locacao
  AFTER UPDATE OF links_sugeridos ON public.demandas_locacao
  FOR EACH ROW EXECUTE FUNCTION public.notify_links_sugeridos_updated();

DROP TRIGGER IF EXISTS trg_notify_links_sugeridos_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_links_sugeridos_vendas
  AFTER UPDATE OF links_sugeridos ON public.demandas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_links_sugeridos_updated();
