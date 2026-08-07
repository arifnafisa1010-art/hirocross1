import { MuscleId } from '@/lib/muscleExercises';

interface Props {
  intensities: Partial<Record<MuscleId, 0 | 1 | 2 | 3>>;
  onHover?: (m: MuscleId | null) => void;
}

// 0 = idle, 1 = tertiary, 2 = secondary, 3 = primary
const COLORS = ['#39435466', '#facc15', '#fb923c', '#ef4444'];

export function MuscleBodyMap({ intensities, onHover }: Props) {
  const f = (m: MuscleId) => COLORS[intensities[m] ?? 0];
  const hp = (m: MuscleId) => ({
    onMouseEnter: () => onHover?.(m),
    onMouseLeave: () => onHover?.(null),
    style: { transition: 'fill 350ms ease', cursor: 'pointer' },
    stroke: '#0b1220',
    strokeWidth: 0.7,
  });

  const SKIN = '#2b3648';
  const OUTLINE = '#0b1220';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* ---------------- FRONT ---------------- */}
      <div className="flex flex-col items-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Tampak Depan</p>
        <svg viewBox="0 0 240 520" className="w-full max-w-[280px] h-auto">
          <g fill={SKIN} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round">
            {/* head + neck */}
            <ellipse cx="120" cy="36" rx="23" ry="28" />
            <path d="M110 60 L130 60 L133 76 L107 76 Z" />
            {/* torso */}
            <path d="M85 76 Q120 66 155 76 Q170 82 172 104 L168 150 Q166 190 160 216 Q120 230 80 216 Q74 190 72 150 L68 104 Q70 82 85 76 Z" />
            {/* pelvis */}
            <path d="M80 214 Q120 228 160 214 L156 258 Q120 272 84 258 Z" />
            {/* arms upper */}
            <path d="M72 88 Q56 96 52 122 L50 172 L66 176 L70 130 Q72 106 80 96 Z" />
            <path d="M168 88 Q184 96 188 122 L190 172 L174 176 L170 130 Q168 106 160 96 Z" />
            {/* forearms */}
            <path d="M50 172 Q44 210 42 256 L56 260 Q62 214 66 176 Z" />
            <path d="M190 172 Q196 210 198 256 L184 260 Q178 214 174 176 Z" />
            {/* hands */}
            <ellipse cx="49" cy="272" rx="9" ry="14" />
            <ellipse cx="191" cy="272" rx="9" ry="14" />
            {/* legs */}
            <path d="M86 256 Q94 300 94 340 L96 400 Q98 450 100 486 L118 486 L118 400 Q120 330 116 260 Z" />
            <path d="M154 256 Q146 300 146 340 L144 400 Q142 450 140 486 L122 486 L122 400 Q120 330 124 260 Z" />
            {/* feet */}
            <path d="M99 486 L119 486 L121 500 L95 500 Z" />
            <path d="M121 486 L141 486 L145 500 L119 500 Z" />
          </g>

          {/* muscles */}
          {/* neck (sternocleidomastoid) */}
          <path d="M110 62 L118 62 L116 76 L108 74 Z" fill={f('neck')} {...hp('neck')} />
          <path d="M130 62 L122 62 L124 76 L132 74 Z" fill={f('neck')} {...hp('neck')} />
          {/* traps front */}
          <path d="M92 78 Q120 70 148 78 L140 92 Q120 84 100 92 Z" fill={f('traps')} {...hp('traps')} />
          {/* shoulders front */}
          <path d="M70 88 Q84 82 92 92 Q90 112 80 120 Q66 116 64 104 Q64 92 70 88 Z" fill={f('shoulders_front')} {...hp('shoulders_front')} />
          <path d="M170 88 Q156 82 148 92 Q150 112 160 120 Q174 116 176 104 Q176 92 170 88 Z" fill={f('shoulders_front')} {...hp('shoulders_front')} />
          {/* chest */}
          <path d="M92 94 Q106 88 117 92 L117 134 Q100 136 88 124 Q86 106 92 94 Z" fill={f('chest')} {...hp('chest')} />
          <path d="M148 94 Q134 88 123 92 L123 134 Q140 136 152 124 Q154 106 148 94 Z" fill={f('chest')} {...hp('chest')} />
          {/* biceps */}
          <path d="M60 112 Q70 110 72 126 L70 158 Q60 162 55 154 Q54 128 60 112 Z" fill={f('biceps')} {...hp('biceps')} />
          <path d="M180 112 Q170 110 168 126 L170 158 Q180 162 185 154 Q186 128 180 112 Z" fill={f('biceps')} {...hp('biceps')} />
          {/* forearms */}
          <path d="M52 180 Q62 178 64 192 Q60 226 56 250 Q48 250 46 240 Q48 208 52 180 Z" fill={f('forearms')} {...hp('forearms')} />
          <path d="M188 180 Q178 178 176 192 Q180 226 184 250 Q192 250 194 240 Q192 208 188 180 Z" fill={f('forearms')} {...hp('forearms')} />
          {/* abs — 3 pairs */}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x="103" y={140 + i * 22} width="15" height="18" rx="4" fill={f('abs')} {...hp('abs')} />
              <rect x="122" y={140 + i * 22} width="15" height="18" rx="4" fill={f('abs')} {...hp('abs')} />
            </g>
          ))}
          <path d="M103 206 L137 206 L133 224 Q120 230 107 224 Z" fill={f('abs')} {...hp('abs')} />
          {/* obliques */}
          <path d="M88 140 L100 144 L99 214 Q88 208 84 194 Z" fill={f('obliques')} {...hp('obliques')} />
          <path d="M152 140 L140 144 L141 214 Q152 208 156 194 Z" fill={f('obliques')} {...hp('obliques')} />
          {/* quads */}
          <path d="M90 268 Q104 276 114 276 L115 356 Q102 362 95 350 Q90 310 90 268 Z" fill={f('quads')} {...hp('quads')} />
          <path d="M150 268 Q136 276 126 276 L125 356 Q138 362 145 350 Q150 310 150 268 Z" fill={f('quads')} {...hp('quads')} />
          {/* calves front (tibialis) */}
          <path d="M100 400 Q108 398 110 412 L110 452 Q102 456 99 444 Q98 420 100 400 Z" fill={f('calves')} {...hp('calves')} />
          <path d="M140 400 Q132 398 130 412 L130 452 Q138 456 141 444 Q142 420 140 400 Z" fill={f('calves')} {...hp('calves')} />
        </svg>
      </div>

      {/* ---------------- BACK ---------------- */}
      <div className="flex flex-col items-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Tampak Belakang</p>
        <svg viewBox="0 0 240 520" className="w-full max-w-[280px] h-auto">
          <g fill={SKIN} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round">
            <ellipse cx="120" cy="36" rx="23" ry="28" />
            <path d="M110 60 L130 60 L133 76 L107 76 Z" />
            <path d="M85 76 Q120 66 155 76 Q170 82 172 104 L168 150 Q166 190 160 216 Q120 230 80 216 Q74 190 72 150 L68 104 Q70 82 85 76 Z" />
            <path d="M80 214 Q120 228 160 214 L156 258 Q120 272 84 258 Z" />
            <path d="M72 88 Q56 96 52 122 L50 172 L66 176 L70 130 Q72 106 80 96 Z" />
            <path d="M168 88 Q184 96 188 122 L190 172 L174 176 L170 130 Q168 106 160 96 Z" />
            <path d="M50 172 Q44 210 42 256 L56 260 Q62 214 66 176 Z" />
            <path d="M190 172 Q196 210 198 256 L184 260 Q178 214 174 176 Z" />
            <ellipse cx="49" cy="272" rx="9" ry="14" />
            <ellipse cx="191" cy="272" rx="9" ry="14" />
            <path d="M86 256 Q94 300 94 340 L96 400 Q98 450 100 486 L118 486 L118 400 Q120 330 116 260 Z" />
            <path d="M154 256 Q146 300 146 340 L144 400 Q142 450 140 486 L122 486 L122 400 Q120 330 124 260 Z" />
            <path d="M99 486 L119 486 L121 500 L95 500 Z" />
            <path d="M121 486 L141 486 L145 500 L119 500 Z" />
          </g>

          {/* neck back */}
          <path d="M109 60 L131 60 L129 76 L111 76 Z" fill={f('neck')} {...hp('neck')} />
          {/* traps (diamond) */}
          <path d="M120 74 L152 84 Q140 112 120 128 Q100 112 88 84 Z" fill={f('traps')} {...hp('traps')} />
          {/* shoulders rear */}
          <path d="M70 88 Q84 82 92 92 Q90 112 80 120 Q66 116 64 104 Q64 92 70 88 Z" fill={f('shoulders_rear')} {...hp('shoulders_rear')} />
          <path d="M170 88 Q156 82 148 92 Q150 112 160 120 Q174 116 176 104 Q176 92 170 88 Z" fill={f('shoulders_rear')} {...hp('shoulders_rear')} />
          {/* upper back / rhomboids */}
          <path d="M96 106 L118 118 L118 146 L94 138 Q92 120 96 106 Z" fill={f('upper_back')} {...hp('upper_back')} />
          <path d="M144 106 L122 118 L122 146 L146 138 Q148 120 144 106 Z" fill={f('upper_back')} {...hp('upper_back')} />
          {/* lats */}
          <path d="M92 140 L118 150 L118 196 Q98 194 86 176 Q82 158 92 140 Z" fill={f('lats')} {...hp('lats')} />
          <path d="M148 140 L122 150 L122 196 Q142 194 154 176 Q158 158 148 140 Z" fill={f('lats')} {...hp('lats')} />
          {/* lower back */}
          <path d="M106 176 L134 176 L132 220 Q120 226 108 220 Z" fill={f('lower_back')} {...hp('lower_back')} />
          {/* triceps */}
          <path d="M58 110 Q70 108 72 126 L70 160 Q59 164 55 154 Q53 128 58 110 Z" fill={f('triceps')} {...hp('triceps')} />
          <path d="M182 110 Q170 108 168 126 L170 160 Q181 164 185 154 Q187 128 182 110 Z" fill={f('triceps')} {...hp('triceps')} />
          {/* forearms */}
          <path d="M52 180 Q62 178 64 192 Q60 226 56 250 Q48 250 46 240 Q48 208 52 180 Z" fill={f('forearms')} {...hp('forearms')} />
          <path d="M188 180 Q178 178 176 192 Q180 226 184 250 Q192 250 194 240 Q192 208 188 180 Z" fill={f('forearms')} {...hp('forearms')} />
          {/* glutes */}
          <path d="M86 224 Q104 218 118 226 L118 262 Q98 266 87 252 Q83 238 86 224 Z" fill={f('glutes')} {...hp('glutes')} />
          <path d="M154 224 Q136 218 122 226 L122 262 Q142 266 153 252 Q157 238 154 224 Z" fill={f('glutes')} {...hp('glutes')} />
          {/* hamstrings */}
          <path d="M92 270 Q104 278 114 278 L115 358 Q102 364 96 352 Q92 312 92 270 Z" fill={f('hamstrings')} {...hp('hamstrings')} />
          <path d="M148 270 Q136 278 126 278 L125 358 Q138 364 144 352 Q148 312 148 270 Z" fill={f('hamstrings')} {...hp('hamstrings')} />
          {/* calves */}
          <path d="M98 388 Q110 388 112 406 Q112 438 106 458 Q96 458 95 442 Q94 412 98 388 Z" fill={f('calves')} {...hp('calves')} />
          <path d="M142 388 Q130 388 128 406 Q128 438 134 458 Q144 458 145 442 Q146 412 142 388 Z" fill={f('calves')} {...hp('calves')} />
        </svg>
      </div>
    </div>
  );
}
