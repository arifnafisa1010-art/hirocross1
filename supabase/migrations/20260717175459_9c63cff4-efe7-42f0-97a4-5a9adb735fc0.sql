
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.deactivate_expired_premium()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.premium_access
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at <= now();
END;
$$;

-- Remove existing schedule if any, then create new
DO $$
BEGIN
  PERFORM cron.unschedule('deactivate-expired-premium');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'deactivate-expired-premium',
  '0 * * * *',
  $$SELECT public.deactivate_expired_premium();$$
);

-- Run once now to clean current state
SELECT public.deactivate_expired_premium();
