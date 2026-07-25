export type MuscleId =
  | 'chest'
  | 'shoulders_front'
  | 'shoulders_rear'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'lats'
  | 'traps'
  | 'upper_back'
  | 'lower_back'
  | 'neck';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  tertiary?: MuscleId[];
  description?: string;
}

export const EXERCISES: Exercise[] = [
  // LOWER BODY
  { id: 'back_squat', name: 'Back Squat', category: 'Lower Body',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lower_back'], tertiary: ['abs', 'calves'],
    description: 'Compound lower body — dominan quads & glutes.' },
  { id: 'front_squat', name: 'Front Squat', category: 'Lower Body',
    primary: ['quads'], secondary: ['glutes', 'abs', 'upper_back'], tertiary: ['hamstrings'] },
  { id: 'deadlift', name: 'Conventional Deadlift', category: 'Lower Body',
    primary: ['hamstrings', 'glutes', 'lower_back'], secondary: ['quads', 'traps', 'lats'], tertiary: ['forearms', 'abs'] },
  { id: 'romanian_dl', name: 'Romanian Deadlift', category: 'Lower Body',
    primary: ['hamstrings', 'glutes'], secondary: ['lower_back'], tertiary: ['forearms'] },
  { id: 'lunges', name: 'Walking Lunges', category: 'Lower Body',
    primary: ['quads', 'glutes'], secondary: ['hamstrings'], tertiary: ['calves', 'abs'] },
  { id: 'hip_thrust', name: 'Hip Thrust', category: 'Lower Body',
    primary: ['glutes'], secondary: ['hamstrings'], tertiary: ['quads'] },
  { id: 'leg_press', name: 'Leg Press', category: 'Lower Body',
    primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  { id: 'leg_curl', name: 'Leg Curl', category: 'Lower Body',
    primary: ['hamstrings'], secondary: ['calves'] },
  { id: 'leg_ext', name: 'Leg Extension', category: 'Lower Body',
    primary: ['quads'], secondary: [] },
  { id: 'calf_raise', name: 'Calf Raise', category: 'Lower Body',
    primary: ['calves'], secondary: [] },
  { id: 'bulgarian', name: 'Bulgarian Split Squat', category: 'Lower Body',
    primary: ['quads', 'glutes'], secondary: ['hamstrings'], tertiary: ['abs'] },

  // PUSH / UPPER
  { id: 'bench', name: 'Bench Press', category: 'Push',
    primary: ['chest'], secondary: ['triceps', 'shoulders_front'] },
  { id: 'incline_bench', name: 'Incline Bench Press', category: 'Push',
    primary: ['chest', 'shoulders_front'], secondary: ['triceps'] },
  { id: 'dips', name: 'Dips', category: 'Push',
    primary: ['chest', 'triceps'], secondary: ['shoulders_front'] },
  { id: 'push_up', name: 'Push Up', category: 'Push',
    primary: ['chest'], secondary: ['triceps', 'shoulders_front'], tertiary: ['abs'] },
  { id: 'ohp', name: 'Overhead Press', category: 'Push',
    primary: ['shoulders_front'], secondary: ['triceps', 'traps'], tertiary: ['abs'] },
  { id: 'lateral_raise', name: 'Lateral Raise', category: 'Push',
    primary: ['shoulders_front'], secondary: ['traps'] },
  { id: 'tricep_ext', name: 'Triceps Extension', category: 'Push',
    primary: ['triceps'], secondary: [] },

  // PULL
  { id: 'pull_up', name: 'Pull Up', category: 'Pull',
    primary: ['lats'], secondary: ['biceps', 'upper_back'], tertiary: ['forearms', 'abs'] },
  { id: 'chin_up', name: 'Chin Up', category: 'Pull',
    primary: ['lats', 'biceps'], secondary: ['upper_back'], tertiary: ['forearms'] },
  { id: 'barbell_row', name: 'Barbell Row', category: 'Pull',
    primary: ['lats', 'upper_back'], secondary: ['biceps', 'shoulders_rear'], tertiary: ['lower_back', 'forearms'] },
  { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'Pull',
    primary: ['lats'], secondary: ['biceps', 'upper_back'] },
  { id: 'seated_row', name: 'Seated Cable Row', category: 'Pull',
    primary: ['upper_back', 'lats'], secondary: ['biceps', 'shoulders_rear'] },
  { id: 'face_pull', name: 'Face Pull', category: 'Pull',
    primary: ['shoulders_rear', 'upper_back'], secondary: ['traps'] },
  { id: 'bicep_curl', name: 'Biceps Curl', category: 'Pull',
    primary: ['biceps'], secondary: ['forearms'] },
  { id: 'shrug', name: 'Shrug', category: 'Pull',
    primary: ['traps'], secondary: ['forearms'] },

  // OLY / POWER
  { id: 'clean', name: 'Power Clean', category: 'Olympic / Power',
    primary: ['glutes', 'hamstrings', 'quads'], secondary: ['traps', 'upper_back', 'lower_back'], tertiary: ['calves', 'shoulders_front'] },
  { id: 'snatch', name: 'Snatch', category: 'Olympic / Power',
    primary: ['glutes', 'hamstrings', 'shoulders_front'], secondary: ['quads', 'traps', 'upper_back'], tertiary: ['lower_back', 'triceps'] },
  { id: 'jerk', name: 'Push Jerk', category: 'Olympic / Power',
    primary: ['shoulders_front', 'quads'], secondary: ['triceps', 'traps', 'glutes'], tertiary: ['abs'] },

  // CORE
  { id: 'plank', name: 'Plank', category: 'Core',
    primary: ['abs'], secondary: ['obliques', 'lower_back'] },
  { id: 'crunch', name: 'Crunch', category: 'Core',
    primary: ['abs'], secondary: [] },
  { id: 'russian_twist', name: 'Russian Twist', category: 'Core',
    primary: ['obliques', 'abs'], secondary: [] },
  { id: 'back_ext', name: 'Back Extension', category: 'Core',
    primary: ['lower_back'], secondary: ['glutes', 'hamstrings'] },
];

export const EXERCISE_CATEGORIES = Array.from(new Set(EXERCISES.map((e) => e.category)));

export const MUSCLE_LABELS: Record<MuscleId, string> = {
  chest: 'Dada (Pectoralis)',
  shoulders_front: 'Bahu Depan (Deltoid Anterior)',
  shoulders_rear: 'Bahu Belakang (Deltoid Posterior)',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Lengan Bawah',
  abs: 'Perut (Rectus Abdominis)',
  obliques: 'Perut Samping (Obliques)',
  quads: 'Paha Depan (Quadriceps)',
  hamstrings: 'Paha Belakang (Hamstrings)',
  glutes: 'Bokong (Gluteus)',
  calves: 'Betis (Gastrocnemius)',
  lats: 'Punggung Sayap (Latissimus)',
  traps: 'Trapezius',
  upper_back: 'Punggung Atas (Rhomboid)',
  lower_back: 'Punggung Bawah (Erector Spinae)',
  neck: 'Leher',
};
