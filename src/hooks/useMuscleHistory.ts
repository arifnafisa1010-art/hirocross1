import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getWeekStartDate } from '@/lib/dateUtils';
import { addDays, format } from 'date-fns';
import { accumulateMuscles, matchExercise, type MuscleWeights } from '@/lib/muscleMatch';
import type { MuscleId } from '@/lib/muscleExercises';
import { useTrainingStore } from '@/stores/trainingStore';

export interface MuscleHistoryEntry {
  date: string; // yyyy-MM-dd
  programName: string;
  sessionKey: string;
  exercises: { name: string; matched: boolean }[];
  weights: MuscleWeights;
  source: 'program' | 'vbt';
}

interface DbSession {
  session_key: string;
  exercises: unknown;
  is_done: boolean | null;
  program_id: string | null;
}

export function useMuscleHistory(athleteId?: string | null) {
  const { user } = useAuth();
  const weekMode = useTrainingStore((s) => s.weekMode);
  const [entries, setEntries] = useState<MuscleHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let programQuery = supabase
      .from('training_programs')
      .select('id, name, start_date')
      .eq('user_id', user.id);
    if (athleteId) programQuery = programQuery.contains('athlete_ids', [athleteId]);
    const { data: programs } = await programQuery;

    const sessions = programs?.length
      ? (
          await supabase
            .from('training_sessions')
            .select('session_key, exercises, is_done, program_id')
            .in(
              'program_id',
              programs.map((p) => p.id),
            )
            .eq('is_done', true)
        ).data
      : [];

    const byId = new Map((programs ?? []).map((p) => [p.id, p]));
    const result: MuscleHistoryEntry[] = [];

    ((sessions ?? []) as DbSession[]).forEach((s) => {
      const program = s.program_id ? byId.get(s.program_id) : undefined;
      if (!program?.start_date) return;
      const match = s.session_key.match(/^week-(\d+)-day-(\d+)/);
      if (!match) return;
      const weekNum = parseInt(match[1], 10);
      const dayIdx = parseInt(match[2], 10);
      const weekStart = getWeekStartDate(new Date(program.start_date), weekNum, weekMode);
      const date = format(addDays(weekStart, dayIdx - 1), 'yyyy-MM-dd');

      const exercises = Array.isArray(s.exercises) ? (s.exercises as { name?: string }[]) : [];
      const weights: MuscleWeights = {};
      const list: { name: string; matched: boolean }[] = [];

      exercises.forEach((ex) => {
        const name = (ex?.name ?? '').toString();
        if (!name.trim()) return;
        const found = matchExercise(name);
        if (found) accumulateMuscles(found, weights);
        list.push({ name, matched: !!found });
      });

      if (list.length === 0) return;
      result.push({
        date,
        programName: program.name,
        sessionKey: s.session_key,
        exercises: list,
        weights,
        source: 'program',
      });
    });

    // --- VBT sets: setiap set kamera/video ikut menghitung otot terkena ---
    let vbtQuery = supabase
      .from('vbt_sets')
      .select('exercise_name, session_date, reps')
      .eq('user_id', user.id);
    if (athleteId) vbtQuery = vbtQuery.eq('athlete_id', athleteId);
    const { data: vbtSets } = await vbtQuery;

    (vbtSets ?? []).forEach((v, i) => {
      const found = matchExercise(v.exercise_name ?? '');
      const weights: MuscleWeights = {};
      const repCount = Array.isArray(v.reps) ? v.reps.length : 0;
      if (found) accumulateMuscles(found, weights, Math.max(1, repCount) / 5);
      result.push({
        date: v.session_date,
        programName: 'VBT Kamera',
        sessionKey: `vbt-${i}`,
        exercises: [
          { name: `${v.exercise_name} (${repCount} rep VBT)`, matched: !!found },
        ],
        weights,
        source: 'vbt',
      });
    });

    result.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    setEntries(result);
    setLoading(false);
  }, [user?.id, weekMode, athleteId]);

  useEffect(() => {
    load();
  }, [load]);

  const dates = useMemo(() => Array.from(new Set(entries.map((e) => e.date))), [entries]);

  const aggregate = useCallback(
    (from?: string, to?: string) => {
      const weights: MuscleWeights = {};
      entries
        .filter((e) => (!from || e.date >= from) && (!to || e.date <= to))
        .forEach((e) => {
          (Object.entries(e.weights) as [MuscleId, number][]).forEach(([m, v]) => {
            weights[m] = (weights[m] ?? 0) + v;
          });
        });
      return weights;
    },
    [entries],
  );

  return { entries, dates, loading, aggregate, reload: load };
}
