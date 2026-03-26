-- Sync the specific missing admin user if they exist in auth.users but not in public.users
DO $$
DECLARE
  v_user_id uuid;
  v_existing_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'marlon@eticimoveis.com.br' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM public.users WHERE email = 'marlon@eticimoveis.com.br' LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
      UPDATE public.users 
      SET role = 'admin', status = 'ativo', nome = 'Marlon'
      WHERE id = v_existing_id;
    ELSE
      INSERT INTO public.users (id, email, nome, role, status)
      VALUES (v_user_id, 'marlon@eticimoveis.com.br', 'Marlon', 'admin', 'ativo')
      ON CONFLICT (id) DO UPDATE 
      SET email = EXCLUDED.email, nome = EXCLUDED.nome, role = EXCLUDED.role, status = EXCLUDED.status;
    END IF;
  END IF;
END $$;

-- Update the audit log function to gracefully handle cases where the user does not exist in public.users
CREATE OR REPLACE FUNCTION public.audit_log_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_id_val UUID;
    user_exists BOOLEAN;
BEGIN
    user_id_val := auth.uid();
    
    IF user_id_val IS NOT NULL THEN
        SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_id_val) INTO user_exists;
        IF NOT user_exists THEN
            user_id_val := NULL;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (usuario_id, acao, tabela, registro_id, dados_novos)
        VALUES (user_id_val, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (usuario_id, acao, tabela, registro_id, dados_antigos, dados_novos)
        VALUES (user_id_val, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (usuario_id, acao, tabela, registro_id, dados_antigos)
        VALUES (user_id_val, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;
