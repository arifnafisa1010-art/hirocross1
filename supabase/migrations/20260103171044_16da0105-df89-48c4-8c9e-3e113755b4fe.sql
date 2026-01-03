-- Add resting_hr column to athletes table
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS resting_hr integer DEFAULT 60;

-- Add athlete_ids column to training_programs for multi-athlete support
ALTER TABLE public.training_programs ADD COLUMN IF NOT EXISTS athlete_ids uuid[] DEFAULT '{}'::uuid[];