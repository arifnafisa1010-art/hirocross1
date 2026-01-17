-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Users can find their own pending athlete link" ON public.athletes;

-- Create a more secure policy that only allows users to see records where THEIR authenticated email matches
-- This prevents enumeration attacks because users can only query with their own email (from auth.email())
CREATE POLICY "Users can find their own pending athlete link"
ON public.athletes
FOR SELECT
USING (
  pending_link_email IS NOT NULL 
  AND linked_user_id IS NULL 
  AND LOWER(pending_link_email) = LOWER(auth.email())
);

-- Also update the UPDATE policy to be more restrictive
DROP POLICY IF EXISTS "Users can link themselves as athlete" ON public.athletes;

-- Users can only update an athlete record to link themselves if:
-- 1. The pending_link_email matches their authenticated email
-- 2. The athlete is not already linked
-- 3. They can only set linked_user_id to their own user id
CREATE POLICY "Users can link themselves as athlete"
ON public.athletes
FOR UPDATE
USING (
  pending_link_email IS NOT NULL 
  AND LOWER(pending_link_email) = LOWER(auth.email())
  AND linked_user_id IS NULL
)
WITH CHECK (
  linked_user_id = auth.uid()
);