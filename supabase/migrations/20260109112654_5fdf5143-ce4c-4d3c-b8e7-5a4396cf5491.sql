-- Add pending_link_email column to athletes table for email-based linking
ALTER TABLE public.athletes 
ADD COLUMN pending_link_email text;

-- Create function to auto-link athlete when user logs in
CREATE OR REPLACE FUNCTION public.auto_link_athlete_on_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if there's an athlete with pending_link_email matching the user's email
  UPDATE public.athletes
  SET linked_user_id = NEW.id,
      pending_link_email = NULL
  WHERE pending_link_email = NEW.email
    AND linked_user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new user creation
-- Note: We can't create triggers on auth.users directly from migrations
-- Instead, we'll handle this in the application code

-- Create index for faster email lookups
CREATE INDEX idx_athletes_pending_link_email ON public.athletes(pending_link_email) WHERE pending_link_email IS NOT NULL;