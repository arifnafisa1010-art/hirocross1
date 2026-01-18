import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export type TrainingLoad = Tables<'training_loads'>;

// RPE-based TSS calculation (same as useTrainingLoads)
const RPE_LOAD_MAP: Record<number, number> = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140,
};

export function calculateAthleteSessionLoad(rpe: number, durationMinutes: number): number {
  const baseLoad = RPE_LOAD_MAP[rpe] || 60;
  return Math.round(baseLoad * (durationMinutes / 60));
}

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface ACWRData {
  acwr: number;
  acuteLoad: number;
  chronicLoad: number;
  riskZone: 'undertrained' | 'optimal' | 'warning' | 'danger';
}

interface CurrentMetrics {
  fitness: number;
  fatigue: number;
  form: number;
}

export function useAthleteTrainingLoads(athleteId: string | null) {
  const { user } = useAuth();
  const [loads, setLoads] = useState<TrainingLoad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoads = async () => {
    if (!user) {
      setLoads([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let query = supabase
      .from('training_loads')
      .select('*')
      .order('session_date', { ascending: true });

    if (athleteId) {
      // Fetch for specific athlete
      query = query.eq('athlete_id', athleteId);
    } else {
      // Fetch coach's own data (no athlete_id, only user_id)
      query = query.eq('user_id', user.id).is('athlete_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching athlete training loads:', error);
      setLoads([]);
    } else {
      setLoads(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLoads();
  }, [user?.id, athleteId]);

  // Calculate daily metrics with proper Fitness-Fatigue model
  const dailyMetrics = useMemo((): DailyMetric[] => {
    const today = new Date();
    const startDate = subDays(today, 60);
    const dateRange = eachDayOfInterval({ start: startDate, end: today });

    // Create a map of loads by date
    const loadsByDate = new Map<string, number>();
    loads.forEach(load => {
      const dateKey = load.session_date;
      const sessionLoad = load.session_load || calculateAthleteSessionLoad(load.rpe, load.duration_minutes);
      loadsByDate.set(dateKey, (loadsByDate.get(dateKey) || 0) + sessionLoad);
    });

    // Calculate metrics for each day
    let fitness = 0;
    let fatigue = 0;
    const metrics: DailyMetric[] = [];

    const fitnessDecay = Math.exp(-1 / 42);
    const fatigueDecay = Math.exp(-1 / 7);

    dateRange.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dailyLoad = loadsByDate.get(dateKey) || 0;

      fitness = fitness * fitnessDecay + dailyLoad * (1 - fitnessDecay);
      fatigue = fatigue * fatigueDecay + dailyLoad * (1 - fatigueDecay);
      const form = fitness - fatigue;

      metrics.push({
        date: dateKey,
        load: dailyLoad,
        fitness: Math.round(fitness),
        fatigue: Math.round(fatigue),
        form: Math.round(form),
      });
    });

    return metrics;
  }, [loads]);

  // Calculate ACWR
  const acwrData = useMemo((): ACWRData => {
    const today = new Date();
    
    const last7Days = loads.filter(l => {
      const loadDate = new Date(l.session_date);
      const diffDays = Math.floor((today.getTime() - loadDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays < 7;
    });

    const last28Days = loads.filter(l => {
      const loadDate = new Date(l.session_date);
      const diffDays = Math.floor((today.getTime() - loadDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays < 28;
    });

    const acuteLoad = last7Days.reduce((sum, l) => 
      sum + (l.session_load || calculateAthleteSessionLoad(l.rpe, l.duration_minutes)), 0
    );

    const chronicLoad = last28Days.length > 0
      ? last28Days.reduce((sum, l) => 
          sum + (l.session_load || calculateAthleteSessionLoad(l.rpe, l.duration_minutes)), 0
        ) / 4
      : 0;

    const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

    let riskZone: 'undertrained' | 'optimal' | 'warning' | 'danger' = 'undertrained';
    if (acwr >= 0.8 && acwr <= 1.3) riskZone = 'optimal';
    else if (acwr > 1.3 && acwr <= 1.5) riskZone = 'warning';
    else if (acwr > 1.5) riskZone = 'danger';

    return {
      acwr: Math.round(acwr * 100) / 100,
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicLoad),
      riskZone,
    };
  }, [loads]);

  // Current metrics (latest values)
  const currentMetrics = useMemo((): CurrentMetrics => {
    if (dailyMetrics.length === 0) {
      return { fitness: 0, fatigue: 0, form: 0 };
    }
    const latest = dailyMetrics[dailyMetrics.length - 1];
    return {
      fitness: latest.fitness,
      fatigue: latest.fatigue,
      form: latest.form,
    };
  }, [dailyMetrics]);

  return {
    loads,
    loading,
    dailyMetrics,
    acwrData,
    currentMetrics,
    refetch: fetchLoads,
  };
}
