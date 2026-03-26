-- Helper RPC to diagnose OAuth database configurations safely
CREATE OR REPLACE FUNCTION public.fn_diagnose_oauth_setup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trigger_exists boolean;
  v_rls_enabled boolean;
  v_result jsonb;
BEGIN
  -- Check if the crucial auto-sync trigger exists on auth.users
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) INTO v_trigger_exists;

  -- Check if RLS is enabled on public.users
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE relname = 'users';

  -- Compile results
  v_result := jsonb_build_object(
    'trigger_active', v_trigger_exists,
    'rls_active', COALESCE(v_rls_enabled, false),
    'timestamp', now()
  );

  RETURN v_result;
END;
$$;
