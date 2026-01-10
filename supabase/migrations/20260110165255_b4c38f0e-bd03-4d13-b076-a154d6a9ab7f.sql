-- Allow athletes to update is_done on training sessions for their assigned programs
CREATE POLICY "Athletes can mark sessions as done"
ON public.training_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM training_programs tp
    WHERE tp.id = training_sessions.program_id
    AND is_athlete_in_program(auth.uid(), tp.id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM training_programs tp
    WHERE tp.id = training_sessions.program_id
    AND is_athlete_in_program(auth.uid(), tp.id)
  )
);