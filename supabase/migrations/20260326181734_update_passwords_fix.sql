DO $body$
DECLARE
  v_user_id uuid;
BEGIN
  -- Update marlonjmoro@hotmail.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'marlonjmoro@hotmail.com';
  
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('kissarmy0440', gen_salt('bf'))
    WHERE id = v_user_id;
  END IF;

  -- Update marlon@eticimoveis.com.br
  v_user_id := NULL;
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'marlon@eticimoveis.com.br';
  
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('kissarmy0440', gen_salt('bf'))
    WHERE id = v_user_id;
  END IF;
END $body$;
