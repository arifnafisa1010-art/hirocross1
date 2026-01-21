-- Drop the generated column and recreate as a regular column
-- This allows storing the proper RPE-based TSS calculation
ALTER TABLE public.training_loads 
DROP COLUMN session_load;

ALTER TABLE public.training_loads 
ADD COLUMN session_load integer;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.training_loads.session_load IS 'Calculated TSS based on RPE formula: Base load from RPE * (duration / 60). RPE mapping: 1=20, 2=30, 3=40, 4=50, 5=60, 6=70, 7=80, 8=100, 9=120, 10=140 for 60 minutes.';