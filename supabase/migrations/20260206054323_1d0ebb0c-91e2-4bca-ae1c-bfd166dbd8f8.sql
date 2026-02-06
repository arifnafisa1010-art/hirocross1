-- Allow athletes to update their own profile (for resting HR, etc.)
CREATE POLICY "Athletes can update their own profile"
ON public.athletes
FOR UPDATE
USING (auth.uid() = linked_user_id)
WITH CHECK (auth.uid() = linked_user_id);

-- Allow athletes to view test results where they are the athlete
CREATE POLICY "Athletes can view their test results"
ON public.test_results
FOR SELECT
USING (
  athlete_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.athletes 
    WHERE athletes.id = test_results.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);