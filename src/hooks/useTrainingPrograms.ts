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

  // Generate a unique program name by appending a number if needed
  const getUniqueName = (name: string, excludeProgramId?: string): string => {
    const existingNames = programs
      .filter(p => !excludeProgramId || p.id !== excludeProgramId)
      .map(p => p.name);
    
    if (!existingNames.includes(name)) return name;
    
    // Find the next available number
    let counter = 1;
    let candidateName = `${name} (${counter})`;
    while (existingNames.includes(candidateName)) {
      counter++;
      candidateName = `${name} (${counter})`;
    }
    return candidateName;
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

    // Ensure unique name (exclude current program when updating)
    const uniqueName = getUniqueName(setup.planName, currentProgram?.id);

    const programData: TrainingProgramInsert = {
      user_id: user.id,
      name: uniqueName,
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
        if (dayIndex === 6) return 'Rest';
        const weekInt = weekPlan.int;
        if (weekInt >= 80) return 'High';
        if (weekInt >= 60) return 'Med';
        if (weekInt >= 30) return 'Low';
        return 'Rest';
      };

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayName = days[dayIndex];
        
        // Find all sessions for this day (S1, S2, S3... or old format)
        const storeSessionKeys: string[] = [];
        if (storeSessions) {
          for (let sn = 1; sn <= 20; sn++) {
            const newKey = `W${weekNum}-${dayName}-S${sn}`;
            if (storeSessions[newKey]) {
              storeSessionKeys.push(newKey);
            }
          }
          // Check old format key
          const oldKey = `W${weekNum}-${dayName}`;
          if (storeSessions[oldKey] && storeSessionKeys.length === 0) {
            storeSessionKeys.push(oldKey);
          }
        }

        if (storeSessionKeys.length > 0) {
          storeSessionKeys.forEach((storeKey, idx) => {
            const storedSession = storeSessions![storeKey];
            const sessionNum = idx + 1;
            const sessionKey = `week-${weekNum}-day-${dayIndex + 1}-session-${sessionNum}`;

            let intensity: string = storedSession.int || 'Rest';
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
          });
        } else {
          // Create default session-1
          sessionsToSave.push({
            program_id: programId,
            session_key: `week-${weekNum}-day-${dayIndex + 1}-session-1`,
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
      // Separate sessions that have actual content from empty defaults
      const sessionsWithContent = sessionsToSave.filter(s => 
        s.warmup || s.cooldown || s.recovery || 
        (s.exercises as unknown as any[])?.length > 0 || s.is_done
      );
      const emptyDefaults = sessionsToSave.filter(s => 
        !s.warmup && !s.cooldown && !s.recovery && 
        (!(s.exercises as unknown as any[])?.length) && !s.is_done
      );

      // Always upsert sessions with content
      if (sessionsWithContent.length > 0) {
        const { error: sessionsError } = await supabase
          .from('training_sessions')
          .upsert(sessionsWithContent, { 
            onConflict: 'program_id,session_key' 
          });
        if (sessionsError) {
          console.error('Error saving sessions:', sessionsError);
          toast.error('Program tersimpan, tapi gagal menyimpan sesi latihan');
          return false;
        }
      }

      // For empty defaults, only INSERT if they don't already exist (never overwrite)
      if (emptyDefaults.length > 0) {
        // Check which keys already exist in the DB
        const existingKeys = new Set<string>();
        const { data: existing } = await supabase
          .from('training_sessions')
          .select('session_key')
          .eq('program_id', programId)
          .in('session_key', emptyDefaults.map(s => s.session_key));
        
        existing?.forEach(e => existingKeys.add(e.session_key));

        const newDefaults = emptyDefaults.filter(s => !existingKeys.has(s.session_key));
        if (newDefaults.length > 0) {
          const { error: defaultsError } = await supabase
            .from('training_sessions')
            .insert(newDefaults);
          if (defaultsError) {
            console.error('Error inserting default sessions:', defaultsError);
          }
        }
      }
    }
    
    toast.success('Program dan sesi latihan berhasil disimpan!');
    return true;
  };

  // Re-sync sessions from existing program without recreating
  const resyncSessions = async (
    programId: string,
    planData: PlanWeek[],
    storeSessions?: Record<string, DaySession>
  ) => {
    if (!user) {
      toast.error('Anda harus login!');
      return false;
    }

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

    for (const weekPlan of planData) {
      const weekNum = weekPlan.wk;
      
      const getIntensityForDay = (dayIndex: number): 'Rest' | 'Low' | 'Med' | 'High' => {
        if (dayIndex === 6) return 'Rest';
        const weekInt = weekPlan.int;
        if (weekInt >= 80) return 'High';
        if (weekInt >= 60) return 'Med';
        if (weekInt >= 30) return 'Low';
        return 'Rest';
      };

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayName = days[dayIndex];
        
        // Find all sessions for this day
        const storeSessionKeys: string[] = [];
        if (storeSessions) {
          for (let sn = 1; sn <= 20; sn++) {
            const newKey = `W${weekNum}-${dayName}-S${sn}`;
            if (storeSessions[newKey]) {
              storeSessionKeys.push(newKey);
            }
          }
          const oldKey = `W${weekNum}-${dayName}`;
          if (storeSessions[oldKey] && storeSessionKeys.length === 0) {
            storeSessionKeys.push(oldKey);
          }
        }

        if (storeSessionKeys.length > 0) {
          storeSessionKeys.forEach((storeKey, idx) => {
            const storedSession = storeSessions![storeKey];
            const sessionNum = idx + 1;
            const sessionKey = `week-${weekNum}-day-${dayIndex + 1}-session-${sessionNum}`;

            let intensity: string = storedSession.int || 'Rest';
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
          });
        } else {
          sessionsToSave.push({
            program_id: programId,
            session_key: `week-${weekNum}-day-${dayIndex + 1}-session-1`,
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
        console.error('Error resyncing sessions:', sessionsError);
        toast.error('Gagal re-sync sesi latihan');
        return false;
      }
    }
    
    toast.success('Sesi latihan berhasil di-sync!');
    return true;
  };
  const duplicateProgram = async (programId: string) => {
    if (!user) {
      toast.error('Anda harus login!');
      return null;
    }

    // Find source program
    const source = programs.find(p => p.id === programId);
    if (!source) {
      toast.error('Program tidak ditemukan');
      return null;
    }

    const newName = getUniqueName(source.name);

    const { data: newProgram, error: programError } = await supabase
      .from('training_programs')
      .insert({
        user_id: user.id,
        name: newName,
        start_date: source.start_date,
        match_date: source.match_date,
        target_strength: source.target_strength,
        target_speed: source.target_speed,
        target_endurance: source.target_endurance,
        target_technique: source.target_technique,
        target_tactic: source.target_tactic,
        mesocycles: source.mesocycles,
        plan_data: source.plan_data,
        competitions: source.competitions,
        athlete_ids: source.athlete_ids,
        training_blocks: source.training_blocks,
        scheduled_events: source.scheduled_events,
      })
      .select()
      .single();

    if (programError || !newProgram) {
      toast.error('Gagal menduplikasi program');
      console.error(programError);
      return null;
    }

    // Copy sessions
    const { data: sourceSessions } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('program_id', programId);

    if (sourceSessions && sourceSessions.length > 0) {
      const newSessions = sourceSessions.map(s => ({
        program_id: newProgram.id,
        session_key: s.session_key,
        warmup: s.warmup || '',
        exercises: s.exercises,
        cooldown: s.cooldown || '',
        recovery: s.recovery || '',
        intensity: s.intensity || 'Rest',
        is_done: false, // Reset done status for duplicate
      }));

      const { error: sessError } = await supabase
        .from('training_sessions')
        .insert(newSessions);

      if (sessError) {
        console.error('Error duplicating sessions:', sessError);
      }
    }

    setPrograms(prev => [newProgram, ...prev]);
    toast.success(`Program berhasil diduplikasi sebagai "${newName}"`);
    return newProgram;
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

  // Convert store key (W1-Senin-S1 or W1-Senin) to DB key (week-1-day-1-session-1)
  const storeKeyToDbKey = (storeKey: string): string => {
    const dayNameToIndex: Record<string, number> = {
      'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4,
      'Jumat': 5, 'Sabtu': 6, 'Minggu': 7,
    };
    // Handle new format: W1-Senin-S2
    const matchNew = storeKey.match(/^W(\d+)-(.+)-S(\d+)$/);
    if (matchNew) {
      const weekNum = matchNew[1];
      const dayName = matchNew[2];
      const sessionNum = matchNew[3];
      const dayIndex = dayNameToIndex[dayName] || 1;
      return `week-${weekNum}-day-${dayIndex}-session-${sessionNum}`;
    }
    // Handle old format: W1-Senin (defaults to session 1)
    const match = storeKey.match(/^W(\d+)-(.+)$/);
    if (!match) return storeKey;
    const weekNum = match[1];
    const dayName = match[2];
    const dayIndex = dayNameToIndex[dayName] || 1;
    return `week-${weekNum}-day-${dayIndex}-session-1`;
  };

  const saveSession = async (storeKey: string, session: DaySession) => {
    if (!currentProgram) {
      // No program saved yet, skip DB save silently
      return false;
    }

    const dbKey = storeKeyToDbKey(storeKey);

    const sessionData = {
      program_id: currentProgram.id,
      session_key: dbKey,
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
      console.error('Gagal menyimpan sesi ke database:', error);
      return false;
    }
    
    setSessions(prev => ({ ...prev, [storeKey]: session }));
    return true;
  };

  const createNewProgram = () => {
    setCurrentProgram(null);
    setSessions({});
  };

  const renameProgram = async (programId: string, newName: string) => {
    if (!user) {
      toast.error('Anda harus login!');
      return false;
    }

    const uniqueName = getUniqueName(newName, programId);

    const { error } = await supabase
      .from('training_programs')
      .update({ name: uniqueName })
      .eq('id', programId);

    if (error) {
      toast.error('Gagal mengubah nama program');
      console.error(error);
      return false;
    }

    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, name: uniqueName } : p));
    if (currentProgram?.id === programId) {
      setCurrentProgram(prev => prev ? { ...prev, name: uniqueName } : prev);
    }
    toast.success(`Nama program diubah menjadi "${uniqueName}"`);
    return uniqueName;
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
    duplicateProgram,
    renameProgram,
    createNewProgram,
    resyncSessions,
    refetch: fetchPrograms,
  };
}
