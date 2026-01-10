-- Add policy to allow users to find athletes by their pending email for auto-linking
CREATE POLICY "Users can find athletes by pending email"
ON public.athletes
FOR SELECT
USING (
  pending_link_email IS NOT NULL 
  AND pending_link_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND linked_user_id IS NULL
);