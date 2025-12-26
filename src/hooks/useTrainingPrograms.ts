import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Mesocycle, PlanWeek, DaySession, Exercise } from '@/types/training';
import { Json } from '@/integrations/supabase/types';

export type TrainingProgram = Tables<'training_programs'>;
export type TrainingProgramInsert = TablesInsert<'training_programs'>;
export type TrainingSession = Tables<'training_sessions'>;

export function useTrainingPrograms() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [currentProgram, setCurrentProgram] = useState<TrainingProgram | null>(null);
  const [sessions, setSessions] = useState<Record<string, DaySession>>({});
  const [loading, setLoading] = useState(true);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Gagal memuat program latihan');
      console.error(error);
    } else {
      setPrograms(data || []);
      // Auto-select latest program if exists
      if (data && data.length > 0 && !currentProgram) {
        await loadProgram(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadProgram = async (programId: string) => {
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('*')
      .eq('id', programId)
      .single();
    
    if (programError) {
      toast.error('Gagal memuat program');
      console.error(programError);
      return;
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
  };

  const saveProgram = async (
    setup: {
      planName: string;
      startDate: string;
      matchDate: string;
      targets: {
        strength: number;
        speed: number;
        endurance: number;
        technique: number;
        tactic: number;
      };
    },
    mesocycles: Mesocycle[],
    planData: PlanWeek[]
  ) => {
    const programData: TrainingProgramInsert = {
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
  }, []);

  return {
    programs,
    currentProgram,
    sessions,
    loading,
    loadProgram,
    saveProgram,
    saveSession,
    createNewProgram,
    refetch: fetchPrograms,
  };
}
