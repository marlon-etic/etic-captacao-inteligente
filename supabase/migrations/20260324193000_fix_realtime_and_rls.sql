-- 1. ATIVAR REALTIME EM TODAS TABELAS CRÍTICAS DE FORMA IDEMPOTENTE
DO $$
DECLARE
    table_name text;
    tables_to_add text[] := ARRAY['tenant_proposals', 'imoveis_captados', 'landlord_profiles', 'demandas_locacao', 'property_performance'];
BEGIN
    FOR table_name IN SELECT unnest(tables_to_add)
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = table_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
        END IF;
    END LOOP;
END
$$;

-- 2. INDEXES PARA VELOCIDADE NAS FOREIGN KEYS (Evita timeouts silenciosos nas subscriptions RLS)
CREATE INDEX IF NOT EXISTS idx_tenant_proposals_property_id ON public.tenant_proposals(property_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_captados_landlord_id ON public.imoveis_captados(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_user_id ON public.landlord_profiles(user_id);

-- 3. CRIAÇÃO DA TABELA DE LOGS DE REALTIME (Diagnóstico Contínuo)
CREATE TABLE IF NOT EXISTS public.realtime_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_name text,
  error_message text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now()
);

-- 4. RLS PARA A TABELA DE LOGS
ALTER TABLE public.realtime_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own realtime logs" ON public.realtime_logs;
CREATE POLICY "Users can view own realtime logs" ON public.realtime_logs 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Insert realtime logs" ON public.realtime_logs;
CREATE POLICY "Insert realtime logs" ON public.realtime_logs 
  FOR INSERT TO public WITH CHECK (true);

-- 5. FUNÇÃO PARA LOG DE ERROS REALTIME (Pode ser chamada via RPC)
CREATE OR REPLACE FUNCTION public.log_realtime_error(
  p_channel_name text,
  p_error_message text,
  p_user_id uuid DEFAULT null
) RETURNS void AS $$
BEGIN
  INSERT INTO public.realtime_logs (channel_name, error_message, user_id, timestamp)
  VALUES (p_channel_name, p_error_message, p_user_id, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
