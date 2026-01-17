-- Fix: Restrict the "Users can find athletes by pending email" policy
-- to only return athlete records where pending_link_email matches the authenticated user's OWN email
-- This prevents email harvesting by unauthorized users

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can find athletes by pending email" ON public.athletes;

-- Create a more restrictive policy that only allows users to see their OWN pending athlete record
-- This ensures users can only find athlete records specifically intended for them
CREATE POLICY "Users can find their own pending athlete link"
ON public.athletes
FOR SELECT
USING (
  pending_link_email IS NOT NULL 
  AND pending_link_email = auth.email() 
  AND linked_user_id IS NULL
);