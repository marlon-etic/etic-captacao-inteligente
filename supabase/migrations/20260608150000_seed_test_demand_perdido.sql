DO $$
DECLARE
  v_sdr_id uuid;
BEGIN
  -- Get SDR user ID safely to ensure the foreign key doesn't fail
  SELECT id INTO v_sdr_id FROM auth.users WHERE email = 'sdr@etic.com' LIMIT 1;
  
  -- Insert a mock demand for testing "Perdido" flow in Locacao safely
  IF v_sdr_id IS NOT NULL THEN
    INSERT INTO public.demandas_locacao (
      id,
      nome_cliente,
      cliente_nome,
      status_demanda,
      valor_maximo,
      bairros,
      sdr_id,
      tipo_demanda,
      nivel_urgencia,
      created_at,
      updated_at
    ) VALUES (
      'd1b32f91-4c12-4c2f-b4de-c3f25d97f9a1'::uuid,
      'Lead Teste (Fluxo Perdido)',
      'Lead Teste (Fluxo Perdido)',
      'aberta',
      2500,
      ARRAY['Centro', 'Batel'],
      v_sdr_id,
      'Locação',
      'Média',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
