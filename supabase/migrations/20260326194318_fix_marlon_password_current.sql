DO $$
BEGIN
  -- Update password for both emails to 'kissarmy0440' to match the user's latest login attempt
  UPDATE auth.users 
  SET encrypted_password = crypt('kissarmy0440', gen_salt('bf'))
  WHERE email IN ('marlonjmoro@hotmail.com', 'marlon@eticimoveis.com.br');
END $$;
