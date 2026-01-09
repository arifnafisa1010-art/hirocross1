-- Add linked_user_id column to athletes table
ALTER TABLE public.athletes 
ADD COLUMN linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_athletes_linked_user_id ON public.athletes(linked_user_id);

-- Create security definer function to check if user is an athlete in a program
CREATE OR REPLACE FUNCTION public.is_athlete_in_program(_user_id uuid, _program_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.athletes a
    JOIN public.training_programs tp ON a.id = ANY(tp.athlete_ids)
    WHERE a.linked_user_id = _user_id
      AND tp.id = _program_id
  )
$$;

-- Create function to get athlete_id from user_id
CREATE OR REPLACE FUNCTION public.get_athlete_id_from_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.athletes WHERE linked_user_id = _user_id LIMIT 1
$$;

-- Update RLS policy for training_programs to allow athletes to view their programs
CREATE POLICY "Athletes can view their assigned programs" 
ON public.training_programs 
FOR SELECT 
USING (
  public.is_athlete_in_program(auth.uid(), id)
);

-- Update RLS policy for training_sessions to allow athletes to view sessions
CREATE POLICY "Athletes can view sessions of their programs" 
ON public.training_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.training_programs tp
    WHERE tp.id = training_sessions.program_id
    AND public.is_athlete_in_program(auth.uid(), tp.id)
  )
);

-- Allow athletes to view their own athlete record
CREATE POLICY "Athletes can view their own record" 
ON public.athletes 
FOR SELECT 
USING (linked_user_id = auth.uid());