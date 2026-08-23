import { EXERCISES, type Exercise, type MuscleId } from '@/lib/muscleExercises';

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Kata kunci tambahan (Indonesia / variasi umum) -> id latihan
const ALIASES: Record<string, string> = {
  squat: 'back_squat',
  'back squat': 'back_squat',
  'front squat': 'front_squat',
  'half squat': 'back_squat',
  deadlift: 'deadlift',
  'dead lift': 'deadlift',
  rdl: 'romanian_dl',
  romanian: 'romanian_dl',
  lunge: 'lunges',
  lunges: 'lunges',
  'hip thrust': 'hip_thrust',
  'leg press': 'leg_press',
  'leg curl': 'leg_curl',
  'leg extension': 'leg_ext',
  calf: 'calf_raise',
  betis: 'calf_raise',
  bulgarian: 'bulgarian',
  bench: 'bench',
  'bench press': 'bench',
  incline: 'incline_bench',
  dip: 'dips',
  dips: 'dips',
  'push up': 'push_up',
  pushup: 'push_up',
  'push-up': 'push_up',
  'overhead press': 'ohp',
  ohp: 'ohp',
  'shoulder press': 'ohp',
  'military press': 'ohp',
  'lateral raise': 'lateral_raise',
  'tricep': 'tricep_ext',
  'triceps': 'tricep_ext',
  'pull up': 'pull_up',
  pullup: 'pull_up',
  'pull-up': 'pull_up',
  'chin up': 'chin_up',
  chinup: 'chin_up',
  row: 'barbell_row',
  'barbell row': 'barbell_row',
  'lat pulldown': 'lat_pulldown',
  pulldown: 'lat_pulldown',
  'seated row': 'seated_row',
  'face pull': 'face_pull',
  curl: 'bicep_curl',
  'bicep curl': 'bicep_curl',
  'biceps curl': 'bicep_curl',
  shrug: 'shrug',
  clean: 'clean',
  'power clean': 'clean',
  snatch: 'snatch',
  jerk: 'jerk',
  plank: 'plank',
  planking: 'plank',
  crunch: 'crunch',
  situp: 'crunch',
  'sit up': 'crunch',
  'russian twist': 'russian_twist',
  'back extension': 'back_ext',
  'back ext': 'back_ext',
  hyperextension: 'back_ext',
};

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

/** Cocokkan nama latihan bebas (teks) ke data latihan yang punya peta otot. */
export function matchExercise(rawName: string): Exercise | null {
  const name = norm(rawName);
  if (!name) return null;

  // 1. Nama persis
  const exact = EXERCISES.find((e) => norm(e.name) === name);
  if (exact) return exact;

  // 2. Nama latihan terkandung dalam teks
  const contains = EXERCISES.filter((e) => name.includes(norm(e.name))).sort(
    (a, b) => norm(b.name).length - norm(a.name).length,
  )[0];
  if (contains) return contains;

  // 3. Alias / kata kunci (ambil alias terpanjang yang cocok)
  const aliasKey = Object.keys(ALIASES)
    .filter((k) => name.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  if (aliasKey) return BY_ID.get(ALIASES[aliasKey]) ?? null;

  return null;
}

export type MuscleWeights = Partial<Record<MuscleId, number>>;

/** Bobot kontribusi per level keterlibatan otot. */
export const MUSCLE_WEIGHT = { primary: 3, secondary: 2, tertiary: 1 } as const;

/** Akumulasi bobot otot dari sebuah latihan ke dalam map. */
export function accumulateMuscles(ex: Exercise, into: MuscleWeights, multiplier = 1) {
  ex.primary.forEach((m) => (into[m] = (into[m] ?? 0) + MUSCLE_WEIGHT.primary * multiplier));
  ex.secondary.forEach((m) => (into[m] = (into[m] ?? 0) + MUSCLE_WEIGHT.secondary * multiplier));
  ex.tertiary?.forEach((m) => (into[m] = (into[m] ?? 0) + MUSCLE_WEIGHT.tertiary * multiplier));
}

/** Ubah bobot menjadi level intensitas 1-3 relatif terhadap bobot tertinggi. */
export function weightsToIntensities(weights: MuscleWeights): Partial<Record<MuscleId, 0 | 1 | 2 | 3>> {
  const max = Math.max(0, ...Object.values(weights).map((v) => v ?? 0));
  const out: Partial<Record<MuscleId, 0 | 1 | 2 | 3>> = {};
  if (max <= 0) return out;
  (Object.entries(weights) as [MuscleId, number][]).forEach(([m, v]) => {
    const ratio = v / max;
    out[m] = ratio >= 0.66 ? 3 : ratio >= 0.33 ? 2 : 1;
  });
  return out;
}
