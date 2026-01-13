import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Mesocycle, PlanWeek, DaySession, Exercise, ProgramSetup, Competition } from '@/types/training';
import { TrainingBlocks, ScheduledEvent } from '@/stores/trainingStore';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

export type TrainingProgram = Tables<'training_programs'>;
export type TrainingProgramInsert = TablesInsert<'training_programs'>;
export type TrainingSession = Tables<'training_sessions'>;

export function useTrainingPrograms() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [currentProgram, setCurrentProgram] = useState<TrainingProgram | null>(null);
  const [sessions, setSessions] = useState<Record<string, DaySession>>({});
  const [loading, setLoading] = useState(true);

  const fetchPrograms = useCallback(async () => {
    if (!user) {
      setPrograms([]);
      setCurrentProgram(null);
      setSessions({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Gagal memuat program latihan');
      console.error(error);
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  const loadProgram = async (programId: string) => {
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('*')
      .eq('id', programId)
      .single();
    
    if (programError) {
      toast.error('Gagal memuat program');
      console.error(programError);
      return null;
    }

    setCurrentProgram(program);

    // Load sessions for this program
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('program_id', programId);
    
    if (sessionsError) {
      console.error(sessionsError);
    } else {
      const sessionsMap: Record<string, DaySession> = {};
      sessionsData?.forEach(s => {
        sessionsMap[s.session_key] = {
          warmup: s.warmup || '',
          exercises: (s.exercises as unknown as Exercise[]) || [],
          cooldown: s.cooldown || '',
          recovery: s.recovery || '',
          int: (s.intensity as DaySession['int']) || 'Rest',
          isDone: s.is_done || false,
        };
      });
      setSessions(sessionsMap);
    }

    return program;
  };

  const saveProgram = async (
    setup: ProgramSetup,
    mesocycles: Mesocycle[],
    planData: PlanWeek[],
    competitions: Competition[] = [],
    athleteIds: string[] = [],
    trainingBlocks?: TrainingBlocks,
    scheduledEvents?: ScheduledEvent[],
    storeSessions?: Record<string, DaySession>
  ) => {
    if (!user) {
      toast.error('Anda harus login!');
      return false;
    }

    // Use the first competition date or matchDate for backwards compatibility
    const primaryCompetition = competitions.find(c => c.isPrimary) || competitions[0];
    const matchDate = primaryCompetition?.date || setup.matchDate;

    const programData: TrainingProgramInsert = {
      user_id: user.id,
      name: setup.planName,
      start_date: setup.startDate,
      match_date: matchDate,
      target_strength: setup.targets.strength,
      target_speed: setup.targets.speed,
      target_endurance: setup.targets.endurance,
      target_technique: setup.targets.technique,
      target_tactic: setup.targets.tactic,
      mesocycles: mesocycles as unknown as Json,
      plan_data: planData as unknown as Json,
      competitions: competitions as unknown as Json,
      athlete_ids: athleteIds,
      training_blocks: trainingBlocks as unknown as Json,
      scheduled_events: scheduledEvents as unknown as Json,
    };

    let programId: string;

    if (currentProgram) {
      // Update existing
      const { error } = await supabase
        .from('training_programs')
        .update(programData)
        .eq('id', currentProgram.id);
      
      if (error) {
        toast.error('Gagal menyimpan program');
        console.error(error);
        return false;
      }
      
      programId = currentProgram.id;
      setCurrentProgram({ ...currentProgram, ...programData } as TrainingProgram);
      setPrograms(prev => prev.map(p => p.id === currentProgram.id ? { ...p, ...programData } as TrainingProgram : p));
    } else {
      // Create new
      const { data, error } = await supabase
        .from('training_programs')
        .insert(programData)
        .select()
        .single();
      
      if (error) {
        toast.error('Gagal menyimpan program');
        console.error(error);
        return false;
      }
      
      programId = data.id;
      setCurrentProgram(data);
      setPrograms(prev => [data, ...prev]);
    }

    // Generate base sessions from planData and merge with storeSessions
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sessionsToSave: Array<{
      program_id: string;
      session_key: string;
      warmup: string;
      exercises: Json;
      cooldown: string;
      recovery: string;
      intensity: string;
      is_done: boolean;
    }> = [];

    // Generate sessions for all weeks in planData
    for (const weekPlan of planData) {
      const weekNum = weekPlan.wk;
      
      // Get intensity based on week's volume/intensity percentage
      const getIntensityForDay = (dayIndex: number): 'Rest' | 'Low' | 'Med' | 'High' => {
        // Sunday (index 6) is typically rest
        if (dayIndex === 6) return 'Rest';
        
        const weekInt = weekPlan.int;
        if (weekInt >= 80) return 'High';
        if (weekInt >= 60) return 'Med';
        if (weekInt >= 30) return 'Low';
        return 'Rest';
      };

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayName = days[dayIndex];
        const storeKey = `W${weekNum}-${dayName}`;
        const sessionKey = `week-${weekNum}-day-${dayIndex + 1}-session-1`;
        const storedSession = storeSessions?.[storeKey];

        // Use stored session data if available, otherwise create default
        if (storedSession) {
          // Map intensity value to valid constraint values
          let intensity: string = storedSession.int || 'Rest';
          // Ensure valid intensity value
          if (!['Rest', 'Low', 'Med', 'High'].includes(intensity)) {
            intensity = 'Rest';
          }
          
          sessionsToSave.push({
            program_id: programId,
            session_key: sessionKey,
            warmup: storedSession.warmup || '',
            exercises: storedSession.exercises as unknown as Json,
            cooldown: storedSession.cooldown || '',
            recovery: storedSession.recovery || '',
            intensity: intensity,
            is_done: storedSession.isDone || false,
          });
        } else {
          // Create default session based on week plan
          sessionsToSave.push({
            program_id: programId,
            session_key: sessionKey,
            warmup: '',
            exercises: [] as unknown as Json,
            cooldown: '',
            recovery: '',
            intensity: getIntensityForDay(dayIndex),
            is_done: false,
          });
        }
      }
    }

    if (sessionsToSave.length > 0) {
      const { error: sessionsError } = await supabase
        .from('training_sessions')
        .upsert(sessionsToSave, { 
          onConflict: 'program_id,session_key' 
        });

      if (sessionsError) {
        console.error('Error saving sessions:', sessionsError);
        toast.error('Program tersimpan, tapi gagal menyimpan sesi latihan');
        return false;
      }
    }
    
    toast.success('Program dan sesi latihan berhasil disimpan!');
    return true;
  };

  const deleteProgram = async (programId: string) => {
    const { error } = await supabase
      .from('training_programs')
      .delete()
      .eq('id', programId);
    
    if (error) {
      toast.error('Gagal menghapus program');
      console.error(error);
      return false;
    }

    setPrograms(prev => prev.filter(p => p.id !== programId));
    if (currentProgram?.id === programId) {
      setCurrentProgram(null);
      setSessions({});
    }
    toast.success('Program berhasil dihapus!');
    return true;
  };

  const saveSession = async (sessionKey: string, session: DaySession) => {
    if (!currentProgram) {
      toast.error('Simpan program terlebih dahulu');
      return false;
    }

    const sessionData = {
      program_id: currentProgram.id,
      session_key: sessionKey,
      warmup: session.warmup,
      exercises: session.exercises as unknown as Json,
      cooldown: session.cooldown,
      recovery: session.recovery,
      intensity: session.int,
      is_done: session.isDone,
    };

    const { error } = await supabase
      .from('training_sessions')
      .upsert(sessionData, { 
        onConflict: 'program_id,session_key' 
      });
    
    if (error) {
      toast.error('Gagal menyimpan sesi');
      console.error(error);
      return false;
    }
    
    setSessions(prev => ({ ...prev, [sessionKey]: session }));
    return true;
  };

  const createNewProgram = () => {
    setCurrentProgram(null);
    setSessions({});
  };

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  return {
    programs,
    currentProgram,
    sessions,
    loading,
    loadProgram,
    saveProgram,
    saveSession,
    deleteProgram,
    createNewProgram,
    refetch: fetchPrograms,
  };
}
