-- 1. FIX AUTH USERS NULLS TO PREVENT HTTP 500
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL OR recovery_token IS NULL
  OR email_change_token_new IS NULL OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- 2. SEED OWNER USER
DO $DO_BLOCK$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'marlon@eticimoveis.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marlon", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.users (id, email, nome, role, status)
    VALUES (new_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $DO_BLOCK$;

-- 3. CREATE/REPLACE 48H INACTIVITY RULE FUNCTION
CREATE OR REPLACE FUNCTION public.fn_marcar_demandas_sem_resposta()
 RETURNS TABLE(tabela text, qtd_marcadas integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $FUNCTION$
DECLARE
  v_qtd_locacao integer := 0;
  v_qtd_vendas integer := 0;
BEGIN
  -- Demandas de Locação: Marca como 'perdida' por 'Inatividade' se sem resposta > 48h
  WITH updated AS (
    UPDATE public.demandas_locacao dl
    SET
      status_demanda = 'perdida',
      motivo_perda = 'Inatividade',
      motivo_perda_descricao = 'Perdida por falta de retorno em 48h',
      marcada_sem_resposta = true,
      data_marcacao_sem_resposta = NOW(),
      updated_at = NOW()
    WHERE dl.status_demanda IN ('aberta', 'em busca')
      AND (
        (dl.data_prazo_resposta IS NOT NULL AND dl.data_prazo_resposta < NOW())
        OR
        (dl.data_prazo_resposta IS NULL AND dl.created_at < NOW() - INTERVAL '48 hours')
      )
    RETURNING id
  )
  SELECT count(*) INTO v_qtd_locacao FROM updated;

  -- Demandas de Vendas: Marca como 'perdida' por 'Inatividade' se sem resposta > 48h
  WITH updated AS (
    UPDATE public.demandas_vendas dv
    SET
      status_demanda = 'perdida',
      motivo_perda = 'Inatividade',
      motivo_perda_descricao = 'Perdida por falta de retorno em 48h',
      marcada_sem_resposta = true,
      data_marcacao_sem_resposta = NOW(),
      updated_at = NOW()
    WHERE dv.status_demanda IN ('aberta', 'em busca')
      AND (
        (dv.data_prazo_resposta IS NOT NULL AND dv.data_prazo_resposta < NOW())
        OR
        (dv.data_prazo_resposta IS NULL AND dv.created_at < NOW() - INTERVAL '48 hours')
      )
    RETURNING id
  )
  SELECT count(*) INTO v_qtd_vendas FROM updated;

  RETURN QUERY
  SELECT 'demandas_locacao'::text, v_qtd_locacao
  UNION ALL
  SELECT 'demandas_vendas'::text, v_qtd_vendas;
END;
$FUNCTION$;

-- 4. FIX HANDLE_NEW_USER TRIGGER FOR PUBLIC.USERS TO AVOID ERRORS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $FUNCTION$
BEGIN
  INSERT INTO public.users (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'captador'::public.user_role)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$FUNCTION$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENSURE RLS FOR DEMANDAS AND RESPOSTAS
DO $DO_BLOCK$
BEGIN
  -- Demandas Locação
  DROP POLICY IF EXISTS "authenticated_select_demandas_locacao" ON public.demandas_locacao;
  CREATE POLICY "authenticated_select_demandas_locacao" ON public.demandas_locacao
    FOR SELECT TO authenticated USING (true);
    
  DROP POLICY IF EXISTS "authenticated_update_demandas_locacao" ON public.demandas_locacao;
  CREATE POLICY "authenticated_update_demandas_locacao" ON public.demandas_locacao
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  -- Demandas Vendas
  DROP POLICY IF EXISTS "authenticated_select_demandas_vendas" ON public.demandas_vendas;
  CREATE POLICY "authenticated_select_demandas_vendas" ON public.demandas_vendas
    FOR SELECT TO authenticated USING (true);
    
  DROP POLICY IF EXISTS "authenticated_update_demandas_vendas" ON public.demandas_vendas;
  CREATE POLICY "authenticated_update_demandas_vendas" ON public.demandas_vendas
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  -- Respostas Captador
  DROP POLICY IF EXISTS "authenticated_select_respostas" ON public.respostas_captador;
  CREATE POLICY "authenticated_select_respostas" ON public.respostas_captador
    FOR SELECT TO authenticated USING (true);
    
  DROP POLICY IF EXISTS "authenticated_insert_respostas" ON public.respostas_captador;
  CREATE POLICY "authenticated_insert_respostas" ON public.respostas_captador
    FOR INSERT TO authenticated WITH CHECK (true);
    
  DROP POLICY IF EXISTS "authenticated_update_respostas" ON public.respostas_captador;
  CREATE POLICY "authenticated_update_respostas" ON public.respostas_captador
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
END $DO_BLOCK$;

-- 6. RPC TO EXTEND DEADLINE (PRORROGAR PRAZO)
CREATE OR REPLACE FUNCTION public.fn_prorrogar_prazo(p_demanda_id uuid, p_tipo_demanda text, p_horas integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $FUNCTION$
DECLARE
  v_prorrogacoes integer;
  v_data_prazo timestamp with time zone;
BEGIN
  IF p_tipo_demanda = 'locacao' THEN
    SELECT prorrogacoes_count, data_prazo_resposta 
    INTO v_prorrogacoes, v_data_prazo
    FROM public.demandas_locacao WHERE id = p_demanda_id;
    
    IF v_prorrogacoes >= 3 THEN
      RETURN '{"success": false, "error": "Limite máximo de 3 prorrogações atingido."}'::jsonb;
    END IF;
    
    UPDATE public.demandas_locacao
    SET 
      prorrogacoes_count = COALESCE(prorrogacoes_count, 0) + 1,
      data_prazo_resposta = GREATEST(NOW(), COALESCE(data_prazo_resposta, NOW() + INTERVAL '48 hours')) + (p_horas || ' hours')::interval,
      status_demanda = CASE WHEN p_horas = 24 THEN 'em busca' ELSE status_demanda END,
      updated_at = NOW()
    WHERE id = p_demanda_id;
    
  ELSIF p_tipo_demanda = 'venda' THEN
    SELECT prorrogacoes_count, data_prazo_resposta 
    INTO v_prorrogacoes, v_data_prazo
    FROM public.demandas_vendas WHERE id = p_demanda_id;
    
    IF v_prorrogacoes >= 3 THEN
      RETURN '{"success": false, "error": "Limite máximo de 3 prorrogações atingido."}'::jsonb;
    END IF;
    
    UPDATE public.demandas_vendas
    SET 
      prorrogacoes_count = COALESCE(prorrogacoes_count, 0) + 1,
      data_prazo_resposta = GREATEST(NOW(), COALESCE(data_prazo_resposta, NOW() + INTERVAL '48 hours')) + (p_horas || ' hours')::interval,
      status_demanda = CASE WHEN p_horas = 24 THEN 'em busca' ELSE status_demanda END,
      updated_at = NOW()
    WHERE id = p_demanda_id;
  ELSE
    RETURN '{"success": false, "error": "Tipo de demanda inválido."}'::jsonb;
  END IF;

  RETURN '{"success": true}'::jsonb;
END;
$FUNCTION$;
