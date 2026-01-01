-- Add competitions JSON column to training_programs
ALTER TABLE public.training_programs 
ADD COLUMN IF NOT EXISTS competitions jsonb DEFAULT '[]'::jsonb;

-- competitions will store array of: { id: string, name: string, date: string, isPrimary: boolean }