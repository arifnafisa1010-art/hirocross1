import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays, startOfDay } from 'date-fns';

interface TrainingLoad {
  id: string;
  user_id: string;
  athlete_id: string | null;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  session_load: number;
  training_type: string;
  notes: string | null;
  created_at: string;
}

interface DailyLoad {
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

// Exponential weighted moving average constants
const FITNESS_DECAY = 42; // CTL time constant (days)
const FATIGUE_DECAY = 7; // ATL time constant (days)

// RPE-based TSS calculation (for 60 min session)
// This formula calculates load based on RPE where higher RPE has exponentially higher impact
const RPE_LOAD_MAP: Record<number, number> = {
  1: 20,   // Very light
  2: 30,   // Light
  3: 40,   // Light-moderate
  4: 50,   // Moderate
  5: 60,   // Moderate
  6: 70,   // Moderate-hard
  7: 80,   // Hard
  8: 100,  // Very hard
  9: 120,  // Very very hard
  10: 140, // Maximum
};

export function calculateSessionLoad(durationMinutes: number, rpe: number): number {
  const baseLoad = RPE_LOAD_MAP[Math.min(10, Math.max(1, Math.round(rpe)))] || 60;
  // Scale based on duration (base is 60 min)
  return Math.round((durationMinutes / 60) * baseLoad);
}

export function useTrainingLoads(athleteId?: string) {
  const { user } = useAuth();
  const [loads, setLoads] = useState<TrainingLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyMetrics, setDailyMetrics] = useState<DailyLoad[]>([]);
  const [acwrData, setAcwrData] = useState<ACWRData>({
    acwr: 0,
    acuteLoad: 0,
    chronicLoad: 0,
    riskZone: 'undertrained',
  });
  const [currentMetrics, setCurrentMetrics] = useState({
    fitness: 0,
    fatigue: 0,
    form: 0,
  });

  const fetchLoads = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch last 60 days of data for calculations
      const sixtyDaysAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd');
      
      let query = supabase
        .from('training_loads')
        .select('*')
        .gte('session_date', sixtyDaysAgo)
        .order('session_date', { ascending: true });

      if (athleteId) {
        query = query.eq('athlete_id', athleteId);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as TrainingLoad[];
      setLoads(typedData);
      
      // Calculate metrics
      calculateMetrics(typedData);
    } catch (error) {
      console.error('Error fetching training loads:', error);
    } finally {
      setLoading(false);
    }
  }, [user, athleteId]);

  const calculateMetrics = (loadData: TrainingLoad[]) => {
    // Group loads by date (use calculated load based on RPE formula)
    const loadsByDate = new Map<string, number>();
    loadData.forEach(load => {
      const existing = loadsByDate.get(load.session_date) || 0;
      // Use session_load if available, otherwise calculate
      const sessionLoad = load.session_load || calculateSessionLoad(load.duration_minutes, load.rpe);
      loadsByDate.set(load.session_date, existing + sessionLoad);
    });

    // Calculate daily fitness and fatigue using exponential decay
    const today = startOfDay(new Date());
    const metrics: DailyLoad[] = [];
    let fitness = 0;
    let fatigue = 0;

    // Process last 42 days for accurate CTL calculation
    for (let i = 41; i >= 0; i--) {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      const dailyLoad = loadsByDate.get(date) || 0;

      // Exponential weighted moving average
      fitness = fitness + (dailyLoad - fitness) * (1 / FITNESS_DECAY);
      fatigue = fatigue + (dailyLoad - fatigue) * (1 / FATIGUE_DECAY);
      
      const form = fitness - fatigue;

      metrics.push({
        date,
        load: dailyLoad,
        fitness: Math.round(fitness),
        fatigue: Math.round(fatigue),
        form: Math.round(form),
      });
    }

    setDailyMetrics(metrics);

    // Calculate ACWR
    const last7Days = metrics.slice(-7);
    const last28Days = metrics.slice(-28);

    const acuteLoad = last7Days.reduce((sum, d) => sum + d.load, 0);
    const chronicLoad = last28Days.reduce((sum, d) => sum + d.load, 0) / 4;

    const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
    
    let riskZone: ACWRData['riskZone'] = 'undertrained';
    if (acwr >= 0.8 && acwr <= 1.3) riskZone = 'optimal';
    else if (acwr > 1.3 && acwr <= 1.5) riskZone = 'warning';
    else if (acwr > 1.5) riskZone = 'danger';

    setAcwrData({
      acwr: Math.round(acwr * 100) / 100,
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicLoad),
      riskZone,
    });

    // Set current metrics (latest values)
    const latestMetric = metrics[metrics.length - 1];
    if (latestMetric) {
      // Normalize to 0-100 scale for display
      const maxFitness = Math.max(...metrics.map(m => m.fitness), 100);
      const maxFatigue = Math.max(...metrics.map(m => m.fatigue), 100);
      
      setCurrentMetrics({
        fitness: Math.min(100, Math.round((latestMetric.fitness / maxFitness) * 100)),
        fatigue: Math.min(100, Math.round((latestMetric.fatigue / maxFatigue) * 100)),
        form: latestMetric.form,
      });
    }
  };

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const addLoad = async (data: {
    session_date: string;
    duration_minutes: number;
    rpe: number;
    training_type: string;
    notes?: string;
    athlete_id?: string;
  }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Calculate session load using RPE-based formula
      const sessionLoad = calculateSessionLoad(data.duration_minutes, data.rpe);
      
      // Build insert object dynamically
      const insertData: {
        user_id: string;
        athlete_id: string | null;
        session_date: string;
        duration_minutes: number;
        rpe: number;
        session_load: number;
        training_type: string;
        notes: string | null;
      } = {
        user_id: user.id,
        athlete_id: data.athlete_id || athleteId || null,
        session_date: data.session_date,
        duration_minutes: data.duration_minutes,
        rpe: data.rpe,
        session_load: sessionLoad,
        training_type: data.training_type,
        notes: data.notes || null,
      };

      const { data: insertedData, error } = await supabase
        .from('training_loads')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await fetchLoads();
      return { success: true, data: insertedData };
    } catch (error: any) {
      console.error('Error adding training load:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteLoad = async (loadId: string) => {
    try {
      const { error } = await supabase
        .from('training_loads')
        .delete()
        .eq('id', loadId);

      if (error) throw error;

      await fetchLoads();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting training load:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    loads,
    loading,
    dailyMetrics,
    acwrData,
    currentMetrics,
    addLoad,
    deleteLoad,
    refetch: fetchLoads,
  };
}
