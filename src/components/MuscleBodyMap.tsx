import { MuscleId } from '@/lib/muscleExercises';

interface Props {
  intensities: Partial<Record<MuscleId, 0 | 1 | 2 | 3>>;
  onHover?: (m: MuscleId | null) => void;
}

// Color mapping: 0 = idle, 1 = tertiary, 2 = secondary, 3 = primary
const COLORS = ['#3f4a5c', '#facc15', '#fb923c', '#ef4444'];

const fill = (m: MuscleId, intensities: Props['intensities']) => COLORS[intensities[m] ?? 0];

export function MuscleBodyMap({ intensities, onHover }: Props) {
  const f = (m: MuscleId) => fill(m, intensities);
  const hoverProps = (m: MuscleId) => ({
    onMouseEnter: () => onHover?.(m),
    onMouseLeave: () => onHover?.(null),
    style: { transition: 'fill 400ms ease', cursor: 'pointer' },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* FRONT VIEW */}
      <div className="flex flex-col items-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Tampak Depan</p>
        <svg viewBox="0 0 220 460" className="w-full max-w-[260px] h-auto">
          {/* body silhouette */}
          <g fill="#1f2937" stroke="#0f172a" strokeWidth="1.2">
            {/* head */}
            <ellipse cx="110" cy="32" rx="22" ry="26" />
            {/* neck */}
            <rect x="100" y="55" width="20" height="14" />
            {/* torso */}
            <path d="M65 72 Q110 60 155 72 L165 190 Q110 210 55 190 Z" />
            {/* hips */}
            <path d="M60 188 Q110 205 160 188 L155 240 Q110 250 65 240 Z" />
            {/* left arm */}
            <path d="M60 78 Q40 90 38 140 L45 200 L58 200 L60 145 Q70 100 70 90 Z" />
            {/* right arm */}
            <path d="M160 78 Q180 90 182 140 L175 200 L162 200 L160 145 Q150 100 150 90 Z" />
            {/* forearms */}
            <path d="M45 200 L38 265 L52 265 L58 200 Z" />
            <path d="M175 200 L182 265 L168 265 L162 200 Z" />
            {/* left leg */}
            <path d="M70 240 Q80 260 82 340 L90 430 L108 430 L108 340 Q108 280 105 245 Z" />
            {/* right leg */}
            <path d="M150 240 Q140 260 138 340 L130 430 L112 430 L112 340 Q112 280 115 245 Z" />
          </g>

          {/* MUSCLES (overlays) */}
          {/* chest */}
          <path d="M75 90 Q88 82 108 84 L108 130 Q92 132 78 122 Z" fill={f('chest')} {...hoverProps('chest')} />
          <path d="M145 90 Q132 82 112 84 L112 130 Q128 132 142 122 Z" fill={f('chest')} {...hoverProps('chest')} />
          {/* shoulders front */}
          <ellipse cx="66" cy="88" rx="12" ry="14" fill={f('shoulders_front')} {...hoverProps('shoulders_front')} />
          <ellipse cx="154" cy="88" rx="12" ry="14" fill={f('shoulders_front')} {...hoverProps('shoulders_front')} />
          {/* biceps */}
          <ellipse cx="52" cy="130" rx="10" ry="22" fill={f('biceps')} {...hoverProps('biceps')} />
          <ellipse cx="168" cy="130" rx="10" ry="22" fill={f('biceps')} {...hoverProps('biceps')} />
          {/* forearms */}
          <ellipse cx="45" cy="230" rx="9" ry="28" fill={f('forearms')} {...hoverProps('forearms')} />
          <ellipse cx="175" cy="230" rx="9" ry="28" fill={f('forearms')} {...hoverProps('forearms')} />
          {/* abs */}
          <path d="M96 135 L124 135 L122 195 L98 195 Z" fill={f('abs')} {...hoverProps('abs')} />
          <line x1="110" y1="140" x2="110" y2="190" stroke="#0f172a" strokeWidth="1" />
          <line x1="97" y1="155" x2="123" y2="155" stroke="#0f172a" strokeWidth="0.8" />
          <line x1="97" y1="170" x2="123" y2="170" stroke="#0f172a" strokeWidth="0.8" />
          <line x1="97" y1="183" x2="123" y2="183" stroke="#0f172a" strokeWidth="0.8" />
          {/* obliques */}
          <path d="M78 138 L94 140 L92 195 L75 185 Z" fill={f('obliques')} {...hoverProps('obliques')} />
          <path d="M142 138 L126 140 L128 195 L145 185 Z" fill={f('obliques')} {...hoverProps('obliques')} />
          {/* quads */}
          <path d="M72 250 Q88 258 96 260 L100 340 L82 340 Q76 300 72 250 Z" fill={f('quads')} {...hoverProps('quads')} />
          <path d="M148 250 Q132 258 124 260 L120 340 L138 340 Q144 300 148 250 Z" fill={f('quads')} {...hoverProps('quads')} />
          {/* calves (front hint) */}
          <ellipse cx="92" cy="385" rx="9" ry="22" fill={f('calves')} {...hoverProps('calves')} />
          <ellipse cx="128" cy="385" rx="9" ry="22" fill={f('calves')} {...hoverProps('calves')} />
        </svg>
      </div>

      {/* BACK VIEW */}
      <div className="flex flex-col items-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Tampak Belakang</p>
        <svg viewBox="0 0 220 460" className="w-full max-w-[260px] h-auto">
          <g fill="#1f2937" stroke="#0f172a" strokeWidth="1.2">
            <ellipse cx="110" cy="32" rx="22" ry="26" />
            <rect x="100" y="55" width="20" height="14" />
            <path d="M65 72 Q110 60 155 72 L165 190 Q110 210 55 190 Z" />
            <path d="M60 188 Q110 205 160 188 L155 240 Q110 250 65 240 Z" />
            <path d="M60 78 Q40 90 38 140 L45 200 L58 200 L60 145 Q70 100 70 90 Z" />
            <path d="M160 78 Q180 90 182 140 L175 200 L162 200 L160 145 Q150 100 150 90 Z" />
            <path d="M45 200 L38 265 L52 265 L58 200 Z" />
            <path d="M175 200 L182 265 L168 265 L162 200 Z" />
            <path d="M70 240 Q80 260 82 340 L90 430 L108 430 L108 340 Q108 280 105 245 Z" />
            <path d="M150 240 Q140 260 138 340 L130 430 L112 430 L112 340 Q112 280 115 245 Z" />
          </g>

          {/* neck */}
          <rect x="102" y="58" width="16" height="10" fill={f('neck')} {...hoverProps('neck')} />
          {/* traps */}
          <path d="M85 72 Q110 65 135 72 L128 100 Q110 108 92 100 Z" fill={f('traps')} {...hoverProps('traps')} />
          {/* shoulders rear */}
          <ellipse cx="66" cy="90" rx="12" ry="14" fill={f('shoulders_rear')} {...hoverProps('shoulders_rear')} />
          <ellipse cx="154" cy="90" rx="12" ry="14" fill={f('shoulders_rear')} {...hoverProps('shoulders_rear')} />
          {/* upper back / rhomboids */}
          <path d="M88 100 L132 100 L128 135 L92 135 Z" fill={f('upper_back')} {...hoverProps('upper_back')} />
          {/* lats */}
          <path d="M78 118 L96 130 L94 180 Q80 175 72 160 Z" fill={f('lats')} {...hoverProps('lats')} />
          <path d="M142 118 L124 130 L126 180 Q140 175 148 160 Z" fill={f('lats')} {...hoverProps('lats')} />
          {/* lower back */}
          <path d="M96 140 L124 140 L122 195 L98 195 Z" fill={f('lower_back')} {...hoverProps('lower_back')} />
          {/* triceps */}
          <ellipse cx="52" cy="130" rx="10" ry="22" fill={f('triceps')} {...hoverProps('triceps')} />
          <ellipse cx="168" cy="130" rx="10" ry="22" fill={f('triceps')} {...hoverProps('triceps')} />
          {/* forearms */}
          <ellipse cx="45" cy="230" rx="9" ry="28" fill={f('forearms')} {...hoverProps('forearms')} />
          <ellipse cx="175" cy="230" rx="9" ry="28" fill={f('forearms')} {...hoverProps('forearms')} />
          {/* glutes */}
          <path d="M78 205 Q95 200 108 205 L108 245 Q90 245 78 235 Z" fill={f('glutes')} {...hoverProps('glutes')} />
          <path d="M142 205 Q125 200 112 205 L112 245 Q130 245 142 235 Z" fill={f('glutes')} {...hoverProps('glutes')} />
          {/* hamstrings */}
          <path d="M76 250 Q90 258 100 260 L100 340 L82 340 Q76 300 76 250 Z" fill={f('hamstrings')} {...hoverProps('hamstrings')} />
          <path d="M144 250 Q130 258 120 260 L120 340 L138 340 Q144 300 144 250 Z" fill={f('hamstrings')} {...hoverProps('hamstrings')} />
          {/* calves */}
          <ellipse cx="92" cy="385" rx="10" ry="26" fill={f('calves')} {...hoverProps('calves')} />
          <ellipse cx="128" cy="385" rx="10" ry="26" fill={f('calves')} {...hoverProps('calves')} />
        </svg>
      </div>
    </div>
  );
}
