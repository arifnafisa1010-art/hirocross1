-- Add training_blocks column to training_programs table
ALTER TABLE public.training_programs 
ADD COLUMN training_blocks jsonb DEFAULT '{}'::jsonb;