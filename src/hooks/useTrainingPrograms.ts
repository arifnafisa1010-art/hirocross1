import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Mesocycle, PlanWeek, DaySession, Exercise, ProgramSetup } from '@/types/training';
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
    planData: PlanWeek[]
  ) => {
    if (!user) {
      toast.error('Anda harus login!');
      return false;
    }

    const programData: TrainingProgramInsert = {
      user_id: user.id,
      name: setup.planName,
      start_date: setup.startDate,
      match_date: setup.matchDate,
      target_strength: setup.targets.strength,
      target_speed: setup.targets.speed,
      target_endurance: setup.targets.endurance,
      target_technique: setup.targets.technique,
      target_tactic: setup.targets.tactic,
      mesocycles: mesocycles as unknown as Json,
      plan_data: planData as unknown as Json,
    };

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
      
      setCurrentProgram(data);
      setPrograms(prev => [data, ...prev]);
    }
    
    toast.success('Program berhasil disimpan!');
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
