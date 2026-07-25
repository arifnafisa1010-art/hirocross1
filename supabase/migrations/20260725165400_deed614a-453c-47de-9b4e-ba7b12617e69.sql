
CREATE TABLE public.coach_update_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_owner_id UUID,
  actor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_update_audit_actor ON public.coach_update_audit(actor_id, created_at DESC);
CREATE INDEX idx_coach_update_audit_record ON public.coach_update_audit(table_name, record_id);

GRANT SELECT ON public.coach_update_audit TO authenticated;
GRANT ALL ON public.coach_update_audit TO service_role;

ALTER TABLE public.coach_update_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.coach_update_audit
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- No INSERT/UPDATE/DELETE policies: only the SECURITY DEFINER trigger writes here.

CREATE OR REPLACE FUNCTION public.log_coach_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.coach_update_audit (table_name, record_id, record_owner_id, actor_id)
  VALUES (TG_TABLE_NAME, NEW.id, NEW.user_id, auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_athlete_readiness_update
  AFTER UPDATE ON public.athlete_readiness
  FOR EACH ROW EXECUTE FUNCTION public.log_coach_update();

CREATE TRIGGER trg_audit_test_results_update
  AFTER UPDATE ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.log_coach_update();

CREATE TRIGGER trg_audit_training_loads_update
  AFTER UPDATE ON public.training_loads
  FOR EACH ROW EXECUTE FUNCTION public.log_coach_update();

CREATE TRIGGER trg_audit_training_programs_update
  AFTER UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.log_coach_update();
