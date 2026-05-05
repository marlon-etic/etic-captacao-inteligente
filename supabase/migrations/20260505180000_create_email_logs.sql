-- Criar tabela de logs de email
CREATE TABLE IF NOT EXISTS public.analytics_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'skipped'
  error_message TEXT,
  metrics_data JSONB, -- dados que foram enviados
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.analytics_email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.analytics_email_logs(sent_at DESC);

-- Criar função para limpeza automática (manter 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_email_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.analytics_email_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Configurar políticas de RLS (Row Level Security)
ALTER TABLE public.analytics_email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read all email logs" ON public.analytics_email_logs;
CREATE POLICY "Admin can read all email logs" ON public.analytics_email_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'gestor')
    )
  );

DROP POLICY IF EXISTS "Users can read own email logs" ON public.analytics_email_logs;
CREATE POLICY "Users can read own email logs" ON public.analytics_email_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert email logs" ON public.analytics_email_logs;
CREATE POLICY "System can insert email logs" ON public.analytics_email_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
