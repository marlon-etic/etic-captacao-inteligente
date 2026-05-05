CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_event ON public.analytics_events(user_id, event_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void AS $function$
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$function$ LANGUAGE plpgsql;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT public.cleanup_old_analytics()');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$do$;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.analytics_events;
CREATE POLICY "Enable insert for authenticated users only" ON public.analytics_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable read for admin users only" ON public.analytics_events;
CREATE POLICY "Enable read for admin users only" ON public.analytics_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'gestor')
    )
  );
