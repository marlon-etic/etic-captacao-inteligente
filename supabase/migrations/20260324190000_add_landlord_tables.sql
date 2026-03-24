CREATE TABLE IF NOT EXISTS public.landlord_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  codigo_locador TEXT,
  property_codes JSONB DEFAULT '[]'::jsonb,
  total_imoveis INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure imoveis_captados has landlord_id
ALTER TABLE public.imoveis_captados ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.tenant_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.imoveis_captados(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  tenant_phone TEXT NOT NULL,
  tenant_score INT DEFAULT 0,
  monthly_income NUMERIC DEFAULT 0,
  employment_status TEXT,
  proposed_move_date DATE,
  message TEXT,
  status TEXT DEFAULT 'pending',
  response_date TIMESTAMPTZ,
  response_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_performance (
  property_id UUID PRIMARY KEY REFERENCES public.imoveis_captados(id) ON DELETE CASCADE,
  total_revenue NUMERIC DEFAULT 0,
  months_occupied INT DEFAULT 0,
  vacancy_rate NUMERIC DEFAULT 0,
  average_tenant_score INT DEFAULT 0,
  maintenance_costs NUMERIC DEFAULT 0,
  net_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enable
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_performance ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own landlord profile" ON public.landlord_profiles;
CREATE POLICY "Users can view own landlord profile" ON public.landlord_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own landlord profile" ON public.landlord_profiles;
CREATE POLICY "Users can update own landlord profile" ON public.landlord_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Landlords can view own proposals" ON public.tenant_proposals;
CREATE POLICY "Landlords can view own proposals" ON public.tenant_proposals FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.imoveis_captados ic
    JOIN public.landlord_profiles lp ON ic.landlord_id = lp.id
    WHERE ic.id = tenant_proposals.property_id AND lp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Landlords can update own proposals" ON public.tenant_proposals;
CREATE POLICY "Landlords can update own proposals" ON public.tenant_proposals FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.imoveis_captados ic
    JOIN public.landlord_profiles lp ON ic.landlord_id = lp.id
    WHERE ic.id = tenant_proposals.property_id AND lp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Landlords can view own property performance" ON public.property_performance;
CREATE POLICY "Landlords can view own property performance" ON public.property_performance FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.imoveis_captados ic
    JOIN public.landlord_profiles lp ON ic.landlord_id = lp.id
    WHERE ic.id = property_performance.property_id AND lp.user_id = auth.uid()
  )
);

-- Seed Data for Testing
DO $
DECLARE
  mock_landlord_id uuid := gen_random_uuid();
  mock_user_id uuid;
  mock_imovel_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'proprietario@etic.com') THEN
    mock_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, role, aud,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      mock_user_id, 'proprietario@etic.com', crypt('Senha123!', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"name": "Proprietário Teste", "role": "landlord"}', 'authenticated', 'authenticated',
      '', '', '', '', '', '', '', ''
    );

    INSERT INTO public.landlord_profiles (id, user_id, name, email, phone, codigo_locador, total_imoveis, total_revenue)
    VALUES (mock_landlord_id, mock_user_id, 'Proprietário Teste', 'proprietario@etic.com', '(11) 98888-7777', 'LOC-001', 1, 3500);

    INSERT INTO public.imoveis_captados (
      id, codigo_imovel, preco, status_captacao, landlord_id, endereco, dormitorios, vagas
    ) VALUES (
      gen_random_uuid(), 'IMOVEL-LANDLORD-1', 3500, 'capturado', mock_landlord_id, 'Rua das Flores, 123', 2, 1
    ) RETURNING id INTO mock_imovel_id;

    INSERT INTO public.property_performance (property_id, total_revenue, months_occupied, vacancy_rate, average_tenant_score)
    VALUES (mock_imovel_id, 42000, 12, 0, 85);

    INSERT INTO public.tenant_proposals (
      property_id, tenant_name, tenant_email, tenant_phone, tenant_score, monthly_income, proposed_move_date, message, status
    ) VALUES 
      (mock_imovel_id, 'João Inquilino', 'joao@email.com', '(11) 99999-9999', 90, 10500, CURRENT_DATE + INTERVAL '15 days', 'Gostei muito do imóvel, tenho fiador.', 'pending'),
      (mock_imovel_id, 'Maria Silva', 'maria@email.com', '(11) 97777-7777', 65, 7000, CURRENT_DATE + INTERVAL '30 days', 'Proponho um pequeno desconto no primeiro mês.', 'pending');
  END IF;
END $;

