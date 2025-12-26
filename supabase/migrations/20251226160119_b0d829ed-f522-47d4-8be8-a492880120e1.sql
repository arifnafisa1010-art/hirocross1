-- Create athletes table
CREATE TABLE public.athletes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F')),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  sport TEXT,
  position TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training programs table
CREATE TABLE public.training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  match_date DATE NOT NULL,
  target_strength DECIMAL(10,2) DEFAULT 100,
  target_speed DECIMAL(10,2) DEFAULT 1000,
  target_endurance DECIMAL(10,2) DEFAULT 10,
  target_technique DECIMAL(10,2) DEFAULT 500,
  target_tactic DECIMAL(10,2) DEFAULT 200,
  mesocycles JSONB DEFAULT '[]'::jsonb,
  plan_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training sessions table
CREATE TABLE public.training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.training_programs(id) ON DELETE CASCADE,
  session_key TEXT NOT NULL,
  warmup TEXT DEFAULT '',
  exercises JSONB DEFAULT '[]'::jsonb,
  cooldown TEXT DEFAULT '',
  recovery TEXT DEFAULT '',
  intensity TEXT CHECK (intensity IN ('Rest', 'Low', 'Med', 'High')) DEFAULT 'Rest',
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, session_key)
);

-- Create test norms table for automatic score calculation
CREATE TABLE public.test_norms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'ALL')),
  age_min INTEGER DEFAULT 0,
  age_max INTEGER DEFAULT 99,
  score_1_max DECIMAL(10,2),
  score_2_max DECIMAL(10,2),
  score_3_max DECIMAL(10,2),
  score_4_max DECIMAL(10,2),
  score_5_max DECIMAL(10,2),
  lower_is_better BOOLEAN DEFAULT false,
  unit TEXT NOT NULL DEFAULT 'kg'
);

-- Create test results table
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  variant TEXT,
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_norms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (since this is a coaching app without auth for now)
CREATE POLICY "Allow all operations on athletes" ON public.athletes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on training_programs" ON public.training_programs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on training_sessions" ON public.training_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on test_norms" ON public.test_norms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on test_results" ON public.test_results FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_athletes_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default test norms for automatic score calculation
-- Kekuatan (Strength) - higher is better
INSERT INTO public.test_norms (category, item, gender, score_1_max, score_2_max, score_3_max, score_4_max, score_5_max, lower_is_better, unit) VALUES
('Kekuatan', '1RM Back Squat', 'M', 60, 80, 100, 130, 999, false, 'kg'),
('Kekuatan', '1RM Back Squat', 'F', 30, 50, 70, 90, 999, false, 'kg'),
('Kekuatan', '1RM Bench Press', 'M', 40, 60, 80, 100, 999, false, 'kg'),
('Kekuatan', '1RM Bench Press', 'F', 20, 35, 50, 65, 999, false, 'kg'),
('Kekuatan', '1RM Deadlift', 'M', 80, 100, 130, 160, 999, false, 'kg'),
('Kekuatan', '1RM Deadlift', 'F', 40, 60, 85, 110, 999, false, 'kg'),
('Kekuatan', 'Push Up Max', 'M', 15, 25, 40, 55, 999, false, 'reps'),
('Kekuatan', 'Push Up Max', 'F', 8, 15, 25, 35, 999, false, 'reps'),
('Kekuatan', 'Pull Up Max', 'M', 3, 8, 12, 18, 999, false, 'reps'),
('Kekuatan', 'Pull Up Max', 'F', 1, 3, 6, 10, 999, false, 'reps'),

-- Kecepatan (Speed) - lower is better
('Kecepatan', 'Sprint 20m', 'M', 999, 3.5, 3.2, 3.0, 2.8, true, 's'),
('Kecepatan', 'Sprint 20m', 'F', 999, 4.0, 3.6, 3.3, 3.1, true, 's'),
('Kecepatan', 'Sprint 40m', 'M', 999, 6.0, 5.5, 5.2, 4.9, true, 's'),
('Kecepatan', 'Sprint 40m', 'F', 999, 6.8, 6.2, 5.8, 5.4, true, 's'),
('Kecepatan', 'Sprint 60m', 'M', 999, 8.5, 8.0, 7.5, 7.0, true, 's'),
('Kecepatan', 'Sprint 60m', 'F', 999, 9.5, 8.8, 8.2, 7.7, true, 's'),
('Kecepatan', 'Flying 30m', 'M', 999, 4.2, 3.8, 3.5, 3.2, true, 's'),
('Kecepatan', 'Flying 30m', 'F', 999, 4.8, 4.3, 4.0, 3.7, true, 's'),

-- Daya Tahan (Endurance) - higher is better
('Daya Tahan', 'VO2Max Test', 'M', 35, 42, 50, 55, 999, false, 'ml/kg/min'),
('Daya Tahan', 'VO2Max Test', 'F', 28, 35, 42, 48, 999, false, 'ml/kg/min'),
('Daya Tahan', 'Yo-Yo IR1', 'M', 800, 1200, 1600, 2000, 999, false, 'm'),
('Daya Tahan', 'Yo-Yo IR1', 'F', 400, 700, 1000, 1300, 999, false, 'm'),
('Daya Tahan', 'Cooper Test', 'M', 2000, 2400, 2800, 3100, 999, false, 'm'),
('Daya Tahan', 'Cooper Test', 'F', 1600, 2000, 2300, 2600, 999, false, 'm'),
('Daya Tahan', 'Beep Test', 'M', 5, 8, 10, 12, 999, false, 'level'),

-- Kelincahan (Agility) - lower is better
('Kelincahan', 'Illinois Test', 'M', 999, 18.0, 16.5, 15.5, 14.5, true, 's'),
('Kelincahan', 'Illinois Test', 'F', 999, 20.0, 18.5, 17.0, 16.0, true, 's'),
('Kelincahan', 'T-Test', 'M', 999, 11.5, 10.5, 9.8, 9.2, true, 's'),
('Kelincahan', 'T-Test', 'F', 999, 13.0, 12.0, 11.0, 10.5, true, 's'),
('Kelincahan', '5-10-5 Drill', 'M', 999, 5.5, 5.0, 4.7, 4.4, true, 's'),
('Kelincahan', '5-10-5 Drill', 'F', 999, 6.2, 5.6, 5.2, 4.9, true, 's'),

-- Fleksibilitas (Flexibility) - higher is better
('Fleksibilitas', 'Sit and Reach', 'M', 5, 15, 25, 32, 999, false, 'cm'),
('Fleksibilitas', 'Sit and Reach', 'F', 10, 20, 30, 38, 999, false, 'cm'),
('Fleksibilitas', 'Shoulder Flexibility', 'M', 5, 10, 15, 20, 999, false, 'cm'),
('Fleksibilitas', 'Shoulder Flexibility', 'F', 8, 13, 18, 23, 999, false, 'cm'),

-- Koordinasi (Coordination) - lower is better for Hexagon, higher for Stork
('Koordinasi', 'Hexagon Test', 'M', 999, 15.0, 13.0, 11.5, 10.0, true, 's'),
('Koordinasi', 'Hexagon Test', 'F', 999, 17.0, 14.5, 12.5, 11.0, true, 's'),
('Koordinasi', 'Stork Stand', 'M', 15, 30, 45, 60, 999, false, 's'),
('Koordinasi', 'Stork Stand', 'F', 12, 25, 40, 55, 999, false, 's');