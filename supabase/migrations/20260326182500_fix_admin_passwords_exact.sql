DO $body$
BEGIN
  -- Atualiza a senha para coincidir com a tentativa do último erro de login reportado
  UPDATE auth.users 
  SET encrypted_password = crypt('kissarmy0440', gen_salt('bf'))
  WHERE email = 'marlonjmoro@hotmail.com';

  UPDATE auth.users 
  SET encrypted_password = crypt('Kissarmy0440!!!', gen_salt('bf'))
  WHERE email = 'marlon@eticimoveis.com.br';
END $body$;
