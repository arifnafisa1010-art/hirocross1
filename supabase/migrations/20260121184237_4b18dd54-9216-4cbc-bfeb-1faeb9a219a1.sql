-- Add RLS policy for coaches to view training loads of their athletes
CREATE POLICY "Coaches can view their athletes training loads"
ON public.training_loads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = training_loads.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

-- Add RLS policy for coaches to create training loads for their athletes
CREATE POLICY "Coaches can create training loads for their athletes"
ON public.training_loads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = training_loads.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

-- Add RLS policy for coaches to update training loads of their athletes
CREATE POLICY "Coaches can update their athletes training loads"
ON public.training_loads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = training_loads.athlete_id
    AND athletes.user_id = auth.uid()
  )
);

-- Add RLS policy for coaches to delete training loads of their athletes
CREATE POLICY "Coaches can delete their athletes training loads"
ON public.training_loads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.athletes
    WHERE athletes.id = training_loads.athlete_id
    AND athletes.user_id = auth.uid()
  )
);