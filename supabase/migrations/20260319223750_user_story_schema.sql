-- supabase/migrations/20260319223750_user_story_schema.sql

-- 0. Create ENUM Types and Utility Functions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'sdr', 'corretor', 'captador');
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    nome VARCHAR(255) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'captador',
    bairros_trabalho TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alter Demandas Locacao
ALTER TABLE public.demandas_locacao
ADD COLUMN IF NOT EXISTS sdr_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS nome_cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20) CHECK (telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}$'),
ADD COLUMN IF NOT EXISTS email VARCHAR(255) CHECK (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
ADD COLUMN IF NOT EXISTS bairros TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS valor_minimo DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_maximo DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dormitorios INTEGER CHECK (dormitorios >= 0 AND dormitorios <= 10),
ADD COLUMN IF NOT EXISTS vagas_estacionamento INTEGER CHECK (vagas_estacionamento >= 0 AND vagas_estacionamento <= 10),
ADD COLUMN IF NOT EXISTS nivel_urgencia VARCHAR(50) CHECK (nivel_urgencia IN ('Baixa', 'Média', 'Alta')),
ADD COLUMN IF NOT EXISTS status_demanda VARCHAR(50) CHECK (status_demanda IN ('aberta', 'atendida', 'impossivel', 'sem_resposta_24h'));

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valor_min_max_locacao' AND conrelid = 'public.demandas_locacao'::regclass) THEN
        ALTER TABLE public.demandas_locacao ADD CONSTRAINT check_valor_min_max_locacao CHECK (valor_maximo >= valor_minimo);
    END IF;
END $$;

-- 3. Alter Demandas Vendas
ALTER TABLE public.demandas_vendas
ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tipo_imovel VARCHAR(50) CHECK (tipo_imovel IN ('Casa', 'Apartamento', 'Terreno')),
ADD COLUMN IF NOT EXISTS nome_cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20) CHECK (telefone ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}$'),
ADD COLUMN IF NOT EXISTS email VARCHAR(255) CHECK (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
ADD COLUMN IF NOT EXISTS bairros TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS valor_minimo DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_maximo DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dormitorios INTEGER CHECK (dormitorios >= 0 AND dormitorios <= 10),
ADD COLUMN IF NOT EXISTS vagas_estacionamento INTEGER CHECK (vagas_estacionamento >= 0 AND vagas_estacionamento <= 10),
ADD COLUMN IF NOT EXISTS nivel_urgencia VARCHAR(50) CHECK (nivel_urgencia IN ('Baixa', 'Média', 'Alta')),
ADD COLUMN IF NOT EXISTS status_demanda VARCHAR(50) CHECK (status_demanda IN ('aberta', 'atendida', 'impossivel', 'sem_resposta_24h'));

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valor_min_max_vendas' AND conrelid = 'public.demandas_vendas'::regclass) THEN
        ALTER TABLE public.demandas_vendas ADD CONSTRAINT check_valor_min_max_vendas CHECK (valor_maximo >= valor_minimo);
    END IF;
END $$;

-- 4. Alter Imoveis Captados
ALTER TABLE public.imoveis_captados
ADD COLUMN IF NOT EXISTS user_captador_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS codigo_imovel VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS localizacao_texto TEXT,
ADD COLUMN IF NOT EXISTS preco DECIMAL(12,2) CHECK (preco > 0),
ADD COLUMN IF NOT EXISTS fotos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2) CHECK (comissao_percentual >= 0 AND comissao_percentual <= 100),
ADD COLUMN IF NOT EXISTS status_captacao VARCHAR(50) CHECK (status_captacao IN ('capturado', 'visitado', 'fechado', 'perdido'));

-- 5. Create Respostas Captador
CREATE TABLE IF NOT EXISTS public.respostas_captador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demanda_locacao_id UUID REFERENCES public.demandas_locacao(id) ON DELETE CASCADE,
    demanda_venda_id UUID REFERENCES public.demandas_vendas(id) ON DELETE CASCADE,
    captador_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resposta VARCHAR(50) NOT NULL CHECK (resposta IN ('encontrei', 'nao_encontrei')),
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_motivo_nao_encontrei CHECK (resposta = 'encontrei' OR (resposta = 'nao_encontrei' AND motivo IS NOT NULL AND TRIM(motivo) <> '')),
    CONSTRAINT check_demanda_link_respostas CHECK (
        (demanda_locacao_id IS NOT NULL AND demanda_venda_id IS NULL) OR
        (demanda_locacao_id IS NULL AND demanda_venda_id IS NOT NULL)
    )
);

-- 6. Create Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    tabela VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_respostas_captador_updated_at ON public.respostas_captador;
CREATE TRIGGER update_respostas_captador_updated_at BEFORE UPDATE ON public.respostas_captador FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Audit Log Function & Triggers
CREATE OR REPLACE FUNCTION public.audit_log_function()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
BEGIN
    user_id_val := auth.uid();
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_users ON public.users;
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.audit_log_function();

DROP TRIGGER IF EXISTS audit_demandas_locacao ON public.demandas_locacao;
CREATE TRIGGER audit_demandas_locacao AFTER INSERT OR UPDATE OR DELETE ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION public.audit_log_function();

DROP TRIGGER IF EXISTS audit_demandas_vendas ON public.demandas_vendas;
CREATE TRIGGER audit_demandas_vendas AFTER INSERT OR UPDATE OR DELETE ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION public.audit_log_function();

DROP TRIGGER IF EXISTS audit_imoveis_captados ON public.imoveis_captados;
CREATE TRIGGER audit_imoveis_captados AFTER INSERT OR UPDATE OR DELETE ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION public.audit_log_function();

-- 9. Indices
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

CREATE INDEX IF NOT EXISTS idx_demandas_locacao_sdr_id ON public.demandas_locacao(sdr_id);
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_status_demanda ON public.demandas_locacao(status_demanda);
CREATE INDEX IF NOT EXISTS idx_demandas_locacao_bairros ON public.demandas_locacao USING GIN(bairros);

CREATE INDEX IF NOT EXISTS idx_demandas_vendas_corretor_id ON public.demandas_vendas(corretor_id);
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_status_demanda ON public.demandas_vendas(status_demanda);
CREATE INDEX IF NOT EXISTS idx_demandas_vendas_bairros ON public.demandas_vendas USING GIN(bairros);

CREATE INDEX IF NOT EXISTS idx_imoveis_captados_user_captador_id ON public.imoveis_captados(user_captador_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_status_captacao ON public.imoveis_captados(status_captacao);

CREATE INDEX IF NOT EXISTS idx_respostas_captador_dem_loc ON public.respostas_captador(demanda_locacao_id);
CREATE INDEX IF NOT EXISTS idx_respostas_captador_dem_ven ON public.respostas_captador(demanda_venda_id);
CREATE INDEX IF NOT EXISTS idx_respostas_captador_cap_id ON public.respostas_captador(captador_id);

-- 10. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_captador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 11. Policies
-- Users
DROP POLICY IF EXISTS "Admin sees all users" ON public.users;
CREATE POLICY "Admin sees all users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

DROP POLICY IF EXISTS "Users see own profile" ON public.users;
CREATE POLICY "Users see own profile" ON public.users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (id = auth.uid());

-- Demandas Locacao
DROP POLICY IF EXISTS "SDRs manage own locacao" ON public.demandas_locacao;
CREATE POLICY "SDRs manage own locacao" ON public.demandas_locacao FOR ALL USING (
  sdr_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sdr')
);

DROP POLICY IF EXISTS "Captadores see aberta locacao" ON public.demandas_locacao;
CREATE POLICY "Captadores see aberta locacao" ON public.demandas_locacao FOR SELECT USING (
  status_demanda = 'aberta' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'captador')
);

DROP POLICY IF EXISTS "Admin sees all locacao" ON public.demandas_locacao;
CREATE POLICY "Admin sees all locacao" ON public.demandas_locacao FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Demandas Vendas
DROP POLICY IF EXISTS "Corretores manage own vendas" ON public.demandas_vendas;
CREATE POLICY "Corretores manage own vendas" ON public.demandas_vendas FOR ALL USING (
  corretor_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'corretor')
);

DROP POLICY IF EXISTS "Captadores see aberta vendas" ON public.demandas_vendas;
CREATE POLICY "Captadores see aberta vendas" ON public.demandas_vendas FOR SELECT USING (
  status_demanda = 'aberta' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'captador')
);

DROP POLICY IF EXISTS "Admin sees all vendas" ON public.demandas_vendas;
CREATE POLICY "Admin sees all vendas" ON public.demandas_vendas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Imoveis Captados
DROP POLICY IF EXISTS "Captadores see own captures" ON public.imoveis_captados;
CREATE POLICY "Captadores see own captures" ON public.imoveis_captados FOR ALL USING (
  user_captador_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'captador')
);

DROP POLICY IF EXISTS "SDRs see captures linked to own locacao demands" ON public.imoveis_captados;
CREATE POLICY "SDRs see captures linked to own locacao demands" ON public.imoveis_captados FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.demandas_locacao dl
    WHERE dl.id = public.imoveis_captados.demanda_locacao_id AND dl.sdr_id = auth.uid()
  ) AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sdr')
);

DROP POLICY IF EXISTS "Corretores see captures linked to own vendas demands" ON public.imoveis_captados;
CREATE POLICY "Corretores see captures linked to own vendas demands" ON public.imoveis_captados FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.demandas_vendas dv
    WHERE dv.id = public.imoveis_captados.demanda_venda_id AND dv.corretor_id = auth.uid()
  ) AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'corretor')
);

DROP POLICY IF EXISTS "Admin sees all captures" ON public.imoveis_captados;
CREATE POLICY "Admin sees all captures" ON public.imoveis_captados FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Respostas Captador
DROP POLICY IF EXISTS "Captadores manage own respostas" ON public.respostas_captador;
CREATE POLICY "Captadores manage own respostas" ON public.respostas_captador FOR ALL USING (
  captador_id = auth.uid()
);

DROP POLICY IF EXISTS "Admin sees all respostas" ON public.respostas_captador;
CREATE POLICY "Admin sees all respostas" ON public.respostas_captador FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Audit Log
DROP POLICY IF EXISTS "Admin sees audit log" ON public.audit_log;
CREATE POLICY "Admin sees audit log" ON public.audit_log FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 12. Seed Data
DO $$
DECLARE
  u record;
  users_data jsonb := '[
    {"id": "11111111-1111-1111-1111-111111111111", "email": "admin@test.com", "nome": "Admin User", "role": "admin"},
    {"id": "22222222-2222-2222-2222-222222222222", "email": "sdr@test.com", "nome": "SDR User", "role": "sdr"},
    {"id": "33333333-3333-3333-3333-333333333331", "email": "corretor1@test.com", "nome": "Corretor 1", "role": "corretor"},
    {"id": "33333333-3333-3333-3333-333333333332", "email": "corretor2@test.com", "nome": "Corretor 2", "role": "corretor"},
    {"id": "33333333-3333-3333-3333-333333333333", "email": "corretor3@test.com", "nome": "Corretor 3", "role": "corretor"},
    {"id": "44444444-4444-4444-4444-444444444441", "email": "captador1@test.com", "nome": "Captador 1", "role": "captador"},
    {"id": "44444444-4444-4444-4444-444444444442", "email": "captador2@test.com", "nome": "Captador 2", "role": "captador"},
    {"id": "44444444-4444-4444-4444-444444444443", "email": "captador3@test.com", "nome": "Captador 3", "role": "captador"}
  ]'::jsonb;
BEGIN
  -- Insert Users
  FOR u IN SELECT * FROM jsonb_array_elements(users_data)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = u.value->>'email') THEN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud,
        confirmation_token, recovery_token, email_change_token_new,
        email_change, email_change_token_current,
        phone, phone_change, phone_change_token, reauthentication_token
      ) VALUES (
        (u.value->>'id')::uuid,
        '00000000-0000-0000-0000-000000000000',
        u.value->>'email',
        crypt('TestPassword123!', gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('name', u.value->>'nome', 'role', u.value->>'role'),
        false, 'authenticated', 'authenticated',
        '', '', '', '', '', NULL, '', '', ''
      );

      -- Satisfy existing fk for captadores table just in case
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'captadores') THEN
          BEGIN
            INSERT INTO public.captadores (id, email, nome, role)
            VALUES (
              (u.value->>'id')::uuid,
              u.value->>'email',
              u.value->>'nome',
              (u.value->>'role')::public.user_role
            ) ON CONFLICT (email) DO NOTHING;
          EXCEPTION WHEN undefined_table THEN
            -- Ignore if table doesn't actually exist
          END;
      END IF;

      INSERT INTO public.users (id, email, nome, role, status)
      VALUES (
        (u.value->>'id')::uuid,
        u.value->>'email',
        u.value->>'nome',
        (u.value->>'role')::public.user_role,
        'ativo'
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;

  -- Insert Demandas Locacao
  INSERT INTO public.demandas_locacao (
    id, cliente_nome, nome_cliente, localizacoes, orcamento_max, quartos, banheiros, vagas, urgencia, sdr_id, telefone, email, bairros, valor_minimo, valor_maximo, dormitorios, vagas_estacionamento, nivel_urgencia, status_demanda
  ) VALUES 
  ('55555555-5555-5555-5555-555555555551'::uuid, 'Locacao Cliente 1', 'Locacao Cliente 1', '{}', 2000, 2, 1, 1, 'até 5 dias', '22222222-2222-2222-2222-222222222222'::uuid, '(11) 98888-7777', 'loc1@test.com', '{"Centro"}', 1000, 2000, 2, 1, 'Alta', 'aberta'),
  ('55555555-5555-5555-5555-555555555552'::uuid, 'Locacao Cliente 2', 'Locacao Cliente 2', '{}', 3000, 3, 2, 2, 'até 15 dias', '22222222-2222-2222-2222-222222222222'::uuid, '(11) 98888-7776', 'loc2@test.com', '{"Batel"}', 2000, 3000, 3, 2, 'Média', 'aberta'),
  ('55555555-5555-5555-5555-555555555553'::uuid, 'Locacao Cliente 3', 'Locacao Cliente 3', '{}', 1500, 1, 1, 0, 'até 5 dias', '22222222-2222-2222-2222-222222222222'::uuid, '(11) 98888-7775', 'loc3@test.com', '{"Portão"}', 1000, 1500, 1, 0, 'Baixa', 'aberta'),
  ('55555555-5555-5555-5555-555555555554'::uuid, 'Locacao Cliente 4', 'Locacao Cliente 4', '{}', 5000, 4, 3, 3, 'até 5 dias', '22222222-2222-2222-2222-222222222222'::uuid, '(11) 98888-7774', 'loc4@test.com', '{"Ecoville"}', 4000, 5000, 4, 3, 'Alta', 'atendida'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Locacao Cliente 5', 'Locacao Cliente 5', '{}', 2500, 2, 2, 1, 'até 15 dias', '22222222-2222-2222-2222-222222222222'::uuid, '(11) 98888-7773', 'loc5@test.com', '{"Agua Verde"}', 2000, 2500, 2, 1, 'Média', 'aberta')
  ON CONFLICT (id) DO NOTHING;

  -- Insert Demandas Vendas
  INSERT INTO public.demandas_vendas (
    id, cliente_nome, nome_cliente, localizacoes, orcamento_max, quartos, banheiros, vagas, urgencia, corretor_id, tipo_imovel, telefone, email, bairros, valor_minimo, valor_maximo, dormitorios, vagas_estacionamento, nivel_urgencia, status_demanda
  ) VALUES 
  ('66666666-6666-6666-6666-666666666661'::uuid, 'Venda Cliente 1', 'Venda Cliente 1', '{}', 500000, 3, 2, 2, 'até 15 dias', '33333333-3333-3333-3333-333333333331'::uuid, 'Casa', '(41) 99999-1111', 'venda1@test.com', '{"Centro"}', 400000, 500000, 3, 2, 'Alta', 'aberta'),
  ('66666666-6666-6666-6666-666666666662'::uuid, 'Venda Cliente 2', 'Venda Cliente 2', '{}', 800000, 4, 3, 3, 'até 5 dias', '33333333-3333-3333-3333-333333333332'::uuid, 'Apartamento', '(41) 99999-2222', 'venda2@test.com', '{"Batel"}', 700000, 800000, 4, 3, 'Média', 'aberta'),
  ('66666666-6666-6666-6666-666666666663'::uuid, 'Venda Cliente 3', 'Venda Cliente 3', '{}', 300000, 2, 1, 1, 'até 15 dias', '33333333-3333-3333-3333-333333333333'::uuid, 'Terreno', '(41) 99999-3333', 'venda3@test.com', '{"Portão"}', 200000, 300000, 2, 1, 'Baixa', 'aberta'),
  ('66666666-6666-6666-6666-666666666664'::uuid, 'Venda Cliente 4', 'Venda Cliente 4', '{}', 1200000, 4, 4, 4, 'até 5 dias', '33333333-3333-3333-3333-333333333331'::uuid, 'Casa', '(41) 99999-4444', 'venda4@test.com', '{"Ecoville"}', 1000000, 1200000, 4, 4, 'Alta', 'atendida'),
  ('66666666-6666-6666-6666-666666666665'::uuid, 'Venda Cliente 5', 'Venda Cliente 5', '{}', 450000, 2, 2, 1, 'até 15 dias', '33333333-3333-3333-3333-333333333332'::uuid, 'Apartamento', '(41) 99999-5555', 'venda5@test.com', '{"Agua Verde"}', 400000, 450000, 2, 1, 'Média', 'aberta')
  ON CONFLICT (id) DO NOTHING;

  -- Insert Imoveis Captados
  INSERT INTO public.imoveis_captados (
    id, captador_id, endereco, valor, demanda_locacao_id, user_captador_id, codigo_imovel, localizacao_texto, preco, fotos, comissao_percentual, status_captacao
  ) VALUES 
  ('77777777-7777-7777-7777-777777777771'::uuid, '44444444-4444-4444-4444-444444444441'::uuid, 'Rua Teste 1', 1500, '55555555-5555-5555-5555-555555555551'::uuid, '44444444-4444-4444-4444-444444444441'::uuid, 'IMO-001', 'Centro, Curitiba', 1500, '{"https://img.usecurling.com/p/200/200?q=apartment"}', 10, 'capturado'),
  ('77777777-7777-7777-7777-777777777772'::uuid, '44444444-4444-4444-4444-444444444442'::uuid, 'Rua Teste 2', 2500, '55555555-5555-5555-5555-555555555552'::uuid, '44444444-4444-4444-4444-444444444442'::uuid, 'IMO-002', 'Batel, Curitiba', 2500, '{"https://img.usecurling.com/p/200/200?q=house"}', 8.5, 'visitado'),
  ('77777777-7777-7777-7777-777777777773'::uuid, '44444444-4444-4444-4444-444444444443'::uuid, 'Rua Teste 3', 450000, NULL, '44444444-4444-4444-4444-444444444443'::uuid, 'IMO-003', 'Agua Verde, Curitiba', 450000, '{"https://img.usecurling.com/p/200/200?q=building"}', 5, 'fechado')
  ON CONFLICT (id) DO NOTHING;

  -- Update the 3rd to link to a venda demand since constraints usually only allow one demand link
  UPDATE public.imoveis_captados 
  SET demanda_venda_id = '66666666-6666-6666-6666-666666666665'::uuid 
  WHERE id = '77777777-7777-7777-7777-777777777773'::uuid;

END $$;

