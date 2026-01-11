-- Fix 1: Update policy for coaches updating athletes - add WITH CHECK clause
DROP POLICY IF EXISTS "Coaches can update their athletes" ON public.athletes;

CREATE POLICY "Coaches can update their athletes" 
ON public.athletes 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Athletes viewing programs policy should be for authenticated users
DROP POLICY IF EXISTS "Athletes can view their assigned programs" ON public.training_programs;

CREATE POLICY "Athletes can view their assigned programs" 
ON public.training_programs 
FOR SELECT 
TO authenticated
USING (is_athlete_in_program(auth.uid(), id));