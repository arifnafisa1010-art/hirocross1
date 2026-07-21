
DROP POLICY IF EXISTS "Users can update their own programs" ON public.training_programs;
CREATE POLICY "Users can update their own programs" ON public.training_programs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own test results" ON public.test_results;
CREATE POLICY "Users can update their own test results" ON public.test_results
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own readiness" ON public.athlete_readiness;
CREATE POLICY "Users can update their own readiness" ON public.athlete_readiness
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Athletes can update their readiness" ON public.athlete_readiness;
CREATE POLICY "Athletes can update their readiness" ON public.athlete_readiness
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = athlete_readiness.athlete_id AND athletes.linked_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = athlete_readiness.athlete_id AND athletes.linked_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own training loads" ON public.training_loads;
CREATE POLICY "Users can update their own training loads" ON public.training_loads
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Athletes can update their own training loads" ON public.training_loads;
CREATE POLICY "Athletes can update their own training loads" ON public.training_loads
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = training_loads.athlete_id AND athletes.linked_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = training_loads.athlete_id AND athletes.linked_user_id = auth.uid()));

DROP POLICY IF EXISTS "Coaches can update their athletes training loads" ON public.training_loads;
CREATE POLICY "Coaches can update their athletes training loads" ON public.training_loads
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = training_loads.athlete_id AND athletes.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = training_loads.athlete_id AND athletes.user_id = auth.uid()));
