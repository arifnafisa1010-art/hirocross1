-- The issue is that the RESTRICTIVE policies require ALL policies to pass
-- But coaches need to manage athletes (user_id = auth.uid())
-- And athletes need to view their own record (linked_user_id = auth.uid())
-- These are different access patterns that should be OR'd together (PERMISSIVE)

-- Drop the restrictive policies and recreate as PERMISSIVE

-- Drop old restrictive SELECT policies
DROP POLICY IF EXISTS "Athletes can view their own record" ON public.athletes;
DROP POLICY IF EXISTS "Users can view their own athletes" ON public.athletes;

-- Drop old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own athletes" ON public.athletes;

-- Drop old restrictive UPDATE policy 
DROP POLICY IF EXISTS "Users can update their own athletes" ON public.athletes;

-- Drop old restrictive DELETE policy
DROP POLICY IF EXISTS "Users can delete their own athletes" ON public.athletes;

-- Recreate as PERMISSIVE policies (default, so any passing policy allows access)

-- Coaches can view athletes they created
CREATE POLICY "Coaches can view their athletes" 
ON public.athletes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Athletes can view their own linked record
CREATE POLICY "Athletes can view their own record" 
ON public.athletes 
FOR SELECT 
TO authenticated
USING (auth.uid() = linked_user_id);

-- Coaches can create athletes
CREATE POLICY "Coaches can create athletes" 
ON public.athletes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Coaches can update their athletes
CREATE POLICY "Coaches can update their athletes" 
ON public.athletes 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Coaches can delete their athletes
CREATE POLICY "Coaches can delete their athletes" 
ON public.athletes 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);