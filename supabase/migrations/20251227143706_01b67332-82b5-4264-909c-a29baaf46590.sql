-- Add user_id column to existing tables
ALTER TABLE public.athletes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.training_programs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.test_results ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_athletes_user_id ON public.athletes(user_id);
CREATE INDEX idx_training_programs_user_id ON public.training_programs(user_id);
CREATE INDEX idx_test_results_user_id ON public.test_results(user_id);

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on athletes" ON public.athletes;
DROP POLICY IF EXISTS "Allow all operations on training_programs" ON public.training_programs;
DROP POLICY IF EXISTS "Allow all operations on training_sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Allow all operations on test_results" ON public.test_results;

-- Athletes RLS policies (coach can only see their own athletes)
CREATE POLICY "Users can view their own athletes"
ON public.athletes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own athletes"
ON public.athletes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own athletes"
ON public.athletes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own athletes"
ON public.athletes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Training Programs RLS policies
CREATE POLICY "Users can view their own programs"
ON public.training_programs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs"
ON public.training_programs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs"
ON public.training_programs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs"
ON public.training_programs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Training Sessions RLS policies (via program ownership)
CREATE POLICY "Users can view sessions of their programs"
ON public.training_sessions FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.training_programs 
  WHERE id = training_sessions.program_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create sessions for their programs"
ON public.training_sessions FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.training_programs 
  WHERE id = program_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update sessions of their programs"
ON public.training_sessions FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.training_programs 
  WHERE id = training_sessions.program_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete sessions of their programs"
ON public.training_sessions FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.training_programs 
  WHERE id = training_sessions.program_id AND user_id = auth.uid()
));

-- Test Results RLS policies
CREATE POLICY "Users can view their own test results"
ON public.test_results FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test results"
ON public.test_results FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test results"
ON public.test_results FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test results"
ON public.test_results FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Test norms remain public (read-only for everyone)
DROP POLICY IF EXISTS "Allow all operations on test_norms" ON public.test_norms;
CREATE POLICY "Anyone can read test norms"
ON public.test_norms FOR SELECT
TO authenticated
USING (true);