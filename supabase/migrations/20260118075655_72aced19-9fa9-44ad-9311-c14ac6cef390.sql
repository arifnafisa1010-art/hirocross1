-- Create training_loads table for storing daily training load data
CREATE TABLE public.training_loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  rpe INTEGER NOT NULL CHECK (rpe >= 1 AND rpe <= 10),
  session_load INTEGER GENERATED ALWAYS AS (duration_minutes * rpe) STORED,
  training_type TEXT NOT NULL DEFAULT 'training',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_loads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own training loads" 
ON public.training_loads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training loads" 
ON public.training_loads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training loads" 
ON public.training_loads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training loads" 
ON public.training_loads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Athletes can view their own training loads via linked_user_id
CREATE POLICY "Athletes can view their own training loads" 
ON public.training_loads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.athletes 
    WHERE athletes.id = training_loads.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Athletes can create their own training loads
CREATE POLICY "Athletes can create their own training loads" 
ON public.training_loads 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.athletes 
    WHERE athletes.id = training_loads.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Athletes can update their own training loads
CREATE POLICY "Athletes can update their own training loads" 
ON public.training_loads 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.athletes 
    WHERE athletes.id = training_loads.athlete_id 
    AND athletes.linked_user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_training_loads_updated_at
BEFORE UPDATE ON public.training_loads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_training_loads_user_date ON public.training_loads(user_id, session_date DESC);
CREATE INDEX idx_training_loads_athlete_date ON public.training_loads(athlete_id, session_date DESC);