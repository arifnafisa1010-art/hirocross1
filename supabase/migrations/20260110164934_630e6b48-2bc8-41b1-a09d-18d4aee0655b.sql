-- Drop the existing trigger on auth.users if it exists (we can't use triggers on auth schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.auto_link_athlete_on_login();

-- Create a more permissive policy for auto-linking athletes by pending email
-- This allows a user to link themselves if their email matches pending_link_email
CREATE POLICY "Users can link themselves as athlete"
ON public.athletes
FOR UPDATE
USING (
  pending_link_email IS NOT NULL 
  AND pending_link_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND linked_user_id IS NULL
)
WITH CHECK (
  linked_user_id = auth.uid()
);