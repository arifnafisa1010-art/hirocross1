CREATE TABLE public.vbt_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  exercise_name text NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  load_kg numeric,
  reps jsonb NOT NULL DEFAULT '[]'::jsonb,
  best_mpv numeric,
  avg_mpv numeric,
  velocity_loss numeric,
  source text NOT NULL DEFAULT 'camera',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vbt_sets TO authenticated;
GRANT ALL ON public.vbt_sets TO service_role;

ALTER TABLE public.vbt_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own vbt sets"
ON public.vbt_sets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Coaches insert own vbt sets"
ON public.vbt_sets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches update own vbt sets"
ON public.vbt_sets FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches delete own vbt sets"
ON public.vbt_sets FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Athletes view own vbt sets"
ON public.vbt_sets FOR SELECT TO authenticated
USING (athlete_id IS NOT NULL AND athlete_id = public.get_athlete_id_from_user(auth.uid()));

CREATE INDEX idx_vbt_sets_user_date ON public.vbt_sets (user_id, session_date DESC);
CREATE INDEX idx_vbt_sets_athlete ON public.vbt_sets (athlete_id);

CREATE TRIGGER update_vbt_sets_updated_at
BEFORE UPDATE ON public.vbt_sets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();