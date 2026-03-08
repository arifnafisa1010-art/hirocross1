
-- Create program_backups table for automatic backup before save
CREATE TABLE public.program_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  program_snapshot jsonb NOT NULL,
  sessions_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  backup_reason text NOT NULL DEFAULT 'auto_save',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_backups ENABLE ROW LEVEL SECURITY;

-- Users can view their own backups
CREATE POLICY "Users can view their own backups"
  ON public.program_backups FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own backups
CREATE POLICY "Users can create their own backups"
  ON public.program_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own backups
CREATE POLICY "Users can delete their own backups"
  ON public.program_backups FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_program_backups_program_id ON public.program_backups(program_id);
CREATE INDEX idx_program_backups_user_id ON public.program_backups(user_id);

-- Keep only last 5 backups per program (cleanup function)
CREATE OR REPLACE FUNCTION public.cleanup_old_backups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.program_backups
  WHERE id IN (
    SELECT id FROM public.program_backups
    WHERE program_id = NEW.program_id
    ORDER BY created_at DESC
    OFFSET 5
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_old_backups
  AFTER INSERT ON public.program_backups
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_backups();
