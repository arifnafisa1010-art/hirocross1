export interface Mesocycle {
  name: string;
  weeks: number;
}

export interface Competition {
  id: string;
  name: string;
  date: string;
  isPrimary: boolean;
}

export interface PlanWeek {
  wk: number;
  meso: string;
  fase: 'Umum' | 'Khusus' | 'Pra-Komp' | 'Kompetisi' | 'Transisi';
  vol: number;
  int: number;
  competitionId?: string;
  tujuanKekuatan?: string;
  tujuanKecepatan?: string;
  tujuanDayaTahan?: string;
  tujuanFleksibilitas?: string;
  tujuanMental?: string;
}

export interface Exercise {
  name: string;
  cat: 'strength' | 'speed' | 'endurance' | 'technique' | 'tactic';
  set: number;
  rep: number;
  load: number;
}

export interface DaySession {
  warmup: string;
  exercises: Exercise[];
  cooldown: string;
  recovery: string;
  int: 'Rest' | 'Low' | 'Med' | 'High';
  isDone: boolean;
  rpe?: number;
  duration?: number;
}

export interface ProgramSetup {
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
}

export interface TestResult {
  id: string;
  date: string;
  athlete: string;
  category: string;
  item: string;
  variant?: string;
  value: number;
  unit: string;
  score: number;
  notes: string;
}

export type TabId = 'setup' | 'annual' | 'monthly' | 'tests';
