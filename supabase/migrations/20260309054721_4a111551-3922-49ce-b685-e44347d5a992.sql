
CREATE TABLE public.athlete_readiness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vj_today NUMERIC NOT NULL,
  vj_baseline NUMERIC NOT NULL,
  hr_today INTEGER NOT NULL,
  hr_baseline INTEGER NOT NULL,
  readiness_score NUMERIC GENERATED ALWAYS AS (
    (vj_today / NULLIF(vj_baseline, 0)) + (hr_baseline::NUMERIC / NULLIF(hr_today, 0))
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.athlete_readiness ENABLE ROW LEVEL SECURITY;

-- Coaches can CRUD their own readiness data
CREATE POLICY "Users can view their own readiness" ON public.athlete_readiness FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own readiness" ON public.athlete_readiness FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own readiness" ON public.athlete_readiness FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own readiness" ON public.athlete_readiness FOR DELETE USING (auth.uid() = user_id);

-- Athletes can view their own readiness
CREATE POLICY "Athletes can view their readiness" ON public.athlete_readiness FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = athlete_readiness.athlete_id AND athletes.linked_user_id = auth.uid())
);
