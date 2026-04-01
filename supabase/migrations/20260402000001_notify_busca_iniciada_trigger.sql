CREATE OR REPLACE FUNCTION public.trg_notify_busca_iniciada_multipla()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_old_count int;
  v_new_count int;
  v_last_added jsonb;
  v_captador_id uuid;
  v_nome_captador text;
  v_regiao text;
  v_demanda_owner uuid;
  v_cliente_nome text;
  v_demanda_id uuid;
  v_tipo_demanda text;
  v_duplicata boolean;
BEGIN
  v_old_count := COALESCE(jsonb_array_length(OLD.captadores_busca), 0);
  v_new_count := COALESCE(jsonb_array_length(NEW.captadores_busca), 0);

  IF v_new_count > v_old_count THEN
    -- Get the last added entry
    v_last_added := NEW.captadores_busca->(v_new_count - 1);
    v_captador_id := (v_last_added->>'captador_id')::uuid;
    v_nome_captador := v_last_added->>'nome';
    v_regiao := v_last_added->>'regiao';
    
    v_demanda_id := NEW.id;
    
    IF TG_TABLE_NAME = 'demandas_locacao' THEN
      v_demanda_owner := NEW.sdr_id;
      v_cliente_nome := NEW.nome_cliente;
      v_tipo_demanda := 'Aluguel';
    ELSE
      v_demanda_owner := NEW.corretor_id;
      v_cliente_nome := NEW.nome_cliente;
      v_tipo_demanda := 'Venda';
    END IF;

    -- Check for anti-duplication in notifications for the last 24h
    SELECT EXISTS (
      SELECT 1 FROM public.notificacoes
      WHERE (dados_relacionados->>'demanda_id')::uuid = v_demanda_id
        AND (dados_relacionados->>'captador_id')::uuid = v_captador_id
        AND created_at > NOW() - INTERVAL '1 day'
        AND tipo IN ('busca_iniciada_outros', 'busca_iniciada_responsavel', 'busca_iniciada_admin')
    ) INTO v_duplicata;

    IF NOT v_duplicata THEN
      -- Notify other captadores
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      SELECT id, 'busca_iniciada_outros', 'Demanda em busca',
             COALESCE(v_nome_captador, 'Captador') || ' está buscando imóvel para demanda ' || COALESCE(v_cliente_nome, '') || ' em ' || COALESCE(v_regiao, ''),
             jsonb_build_object('demanda_id', v_demanda_id, 'captador_id', v_captador_id),
             'normal'
      FROM public.users
      WHERE role = 'captador' AND id != v_captador_id AND status = 'ativo';

      -- Notify the owner
      IF v_demanda_owner IS NOT NULL THEN
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
        VALUES (v_demanda_owner, 'busca_iniciada_responsavel', 'Captador atribuído',
                COALESCE(v_nome_captador, 'Captador') || ' está buscando imóvel para sua demanda ' || COALESCE(v_cliente_nome, ''),
                jsonb_build_object('demanda_id', v_demanda_id, 'captador_id', v_captador_id),
                'normal');
      END IF;

      -- Notify admins
      INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
      SELECT id, 'busca_iniciada_admin', 'Busca atribuída',
             COALESCE(v_nome_captador, 'Captador') || ' atribuído à demanda ' || COALESCE(v_cliente_nome, ''),
             jsonb_build_object('demanda_id', v_demanda_id, 'captador_id', v_captador_id),
             'baixa'
      FROM public.users
      WHERE role IN ('admin', 'gestor') AND id != v_captador_id AND id != COALESCE(v_demanda_owner, '00000000-0000-0000-0000-000000000000'::uuid) AND status = 'ativo';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_busca_iniciada_locacao ON public.demandas_locacao;
CREATE TRIGGER trg_notify_busca_iniciada_locacao
  AFTER UPDATE OF captadores_busca ON public.demandas_locacao
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_busca_iniciada_multipla();

DROP TRIGGER IF EXISTS trg_notify_busca_iniciada_vendas ON public.demandas_vendas;
CREATE TRIGGER trg_notify_busca_iniciada_vendas
  AFTER UPDATE OF captadores_busca ON public.demandas_vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_busca_iniciada_multipla();
