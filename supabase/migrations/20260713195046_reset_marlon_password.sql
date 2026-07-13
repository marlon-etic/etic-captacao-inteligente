DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'marlon@eticimoveis.com.br') THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt('kissarmy0440', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      reauthentication_token = '',
      phone = NULL,
      phone_change = '',
      phone_change_token = '',
      updated_at = NOW()
    WHERE email = 'marlon@eticimoveis.com.br';
  END IF;
END $$;
