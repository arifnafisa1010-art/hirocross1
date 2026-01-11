-- First, drop the problematic policies that reference auth.users table directly
DROP POLICY IF EXISTS "Users can find athletes by pending email" ON public.athletes;
DROP POLICY IF EXISTS "Users can link themselves as athlete" ON public.athletes;

-- Recreate policies using auth.email() instead of subquery to auth.users
-- This avoids the "permission denied for table users" error

-- Policy for athletes to find their record by pending email (PERMISSIVE this time for proper OR logic)
CREATE POLICY "Users can find athletes by pending email" 
ON public.athletes 
FOR SELECT 
TO authenticated
USING (
  pending_link_email IS NOT NULL 
  AND pending_link_email = auth.email() 
  AND linked_user_id IS NULL
);

-- Policy for users to link themselves as athlete (PERMISSIVE)
CREATE POLICY "Users can link themselves as athlete" 
ON public.athletes 
FOR UPDATE 
TO authenticated
USING (
  pending_link_email IS NOT NULL 
  AND pending_link_email = auth.email() 
  AND linked_user_id IS NULL
)
WITH CHECK (linked_user_id = auth.uid());