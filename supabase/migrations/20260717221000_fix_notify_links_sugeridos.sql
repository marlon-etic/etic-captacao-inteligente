CREATE OR REPLACE FUNCTION public.notify_links_sugeridos_updated()
RETURNS trigger AS $$
DECLARE
  v_responsavel_id uuid;
BEGIN
  IF COALESCE(NEW.links_sugeridos, '[]'::jsonb) IS DISTINCT FROM COALESCE(OLD.links_sugeridos, '[]'::jsonb) THEN
    BEGIN
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      SELECT
        c.captador_id::uuid,
        'status_atualizado'::notificacao_tipo,
        'Links de Referência Atualizados',
        'Novos links de imóveis de referência foram adicionados para a demanda de ' || COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'cliente'),
        jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', NEW.tipo, 'links_count', jsonb_array_length(COALESCE(NEW.links_sugeridos, '[]'::jsonb))),
        'normal'::notificacao_prioridade
      FROM (
        SELECT DISTINCT elem->>'captador_id' AS captador_id
        FROM jsonb_array_elements(COALESCE(NEW.captadores_busca, '[]'::jsonb)) AS elem
        WHERE elem->>'captador_id' IS NOT NULL
          AND elem->>'captador_id' != ''
          AND (elem->>'captador_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ) c
      WHERE EXISTS (SELECT 1 FROM public.users WHERE id = c.captador_id::uuid);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    IF TG_TABLE_NAME = 'demandas_locacao' THEN
      v_responsavel_id := NEW.sdr_id;
    ELSIF TG_TABLE_NAME = 'demandas_vendas' THEN
      v_responsavel_id := NEW.corretor_id;
    END IF;

    IF v_responsavel_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (
          v_responsavel_id,
          'status_atualizado'::notificacao_tipo,
          'Links de Referência Salvos',
          'Os links sugeridos foram salvos e estão visíveis para os captadores.',
          jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', NEW.tipo),
          'baixa'::notificacao_prioridade
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
