-- Add scheduled_events column to training_programs table
ALTER TABLE public.training_programs 
ADD COLUMN scheduled_events jsonb DEFAULT '[]'::jsonb;