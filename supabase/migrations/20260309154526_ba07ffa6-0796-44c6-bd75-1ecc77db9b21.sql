-- Allow athletes to insert their own readiness data
CREATE POLICY "Athletes can insert their readiness"
ON public.athlete_readiness FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = athlete_readiness.athlete_id
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Allow athletes to update their own readiness data
CREATE POLICY "Athletes can update their readiness"
ON public.athlete_readiness FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = athlete_readiness.athlete_id
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Allow athletes to delete their own readiness data
CREATE POLICY "Athletes can delete their readiness"
ON public.athlete_readiness FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = athlete_readiness.athlete_id
    AND athletes.linked_user_id = auth.uid()
  )
);