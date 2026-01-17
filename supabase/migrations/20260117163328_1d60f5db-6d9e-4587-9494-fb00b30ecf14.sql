-- Step 1: Drop the problematic SELECT policy that exposes too much data
DROP POLICY IF EXISTS "Users can find their own pending athlete link" ON public.athletes;

-- Step 2: Create a secure view that only exposes the id for pending link lookups
-- This view will only return the athlete id for linking purposes, not sensitive data
CREATE OR REPLACE VIEW public.athletes_pending_links
WITH (security_invoker = on) AS
SELECT id
FROM public.athletes
WHERE pending_link_email IS NOT NULL 
  AND linked_user_id IS NULL 
  AND LOWER(pending_link_email) = LOWER(auth.email());

-- Step 3: Grant SELECT on the view to authenticated users
GRANT SELECT ON public.athletes_pending_links TO authenticated;

-- Note: The UPDATE policy "Users can link themselves as athlete" remains - it allows users
-- to update ONLY their own pending link record by setting linked_user_id = auth.uid()
-- This is secure because:
-- 1. USING clause ensures they can only update records where their email matches pending_link_email
-- 2. WITH CHECK clause ensures they can only set linked_user_id to their own user id