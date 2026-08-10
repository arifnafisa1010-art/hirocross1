import { MuscleId } from '@/lib/muscleExercises';

import base from '@/assets/muscle/base.png.asset.json';
import abs from '@/assets/muscle/abs.png.asset.json';
import biceps from '@/assets/muscle/biceps.png.asset.json';
import calves from '@/assets/muscle/calves.png.asset.json';
import chest from '@/assets/muscle/chest.png.asset.json';
import forearms from '@/assets/muscle/forearms.png.asset.json';
import glutes from '@/assets/muscle/glutes.png.asset.json';
import hamstrings from '@/assets/muscle/hamstrings.png.asset.json';
import lats from '@/assets/muscle/lats.png.asset.json';
import lowerBack from '@/assets/muscle/lower_back.png.asset.json';
import neck from '@/assets/muscle/neck.png.asset.json';
import obliques from '@/assets/muscle/obliques.png.asset.json';
import quads from '@/assets/muscle/quads.png.asset.json';
import shouldersFront from '@/assets/muscle/shoulders_front.png.asset.json';
import shouldersRear from '@/assets/muscle/shoulders_rear.png.asset.json';
import traps from '@/assets/muscle/traps.png.asset.json';
import triceps from '@/assets/muscle/triceps.png.asset.json';
import upperBack from '@/assets/muscle/upper_back.png.asset.json';

interface Props {
  intensities: Partial<Record<MuscleId, 0 | 1 | 2 | 3>>;
  onHover?: (m: MuscleId | null) => void;
}

const MASKS: Record<MuscleId, string> = {
  abs: abs.url,
  biceps: biceps.url,
  calves: calves.url,
  chest: chest.url,
  forearms: forearms.url,
  glutes: glutes.url,
  hamstrings: hamstrings.url,
  lats: lats.url,
  lower_back: lowerBack.url,
  neck: neck.url,
  obliques: obliques.url,
  quads: quads.url,
  shoulders_front: shouldersFront.url,
  shoulders_rear: shouldersRear.url,
  traps: traps.url,
  triceps: triceps.url,
  upper_back: upperBack.url,
};

// 1 = tertiary, 2 = secondary, 3 = primary
const COLORS: Record<number, string> = {
  1: '#facc15',
  2: '#fb923c',
  3: '#ef4444',
};

export function MuscleBodyMap({ intensities, onHover }: Props) {
  const active = (Object.keys(MASKS) as MuscleId[]).filter((m) => (intensities[m] ?? 0) > 0);

  return (
    <div className="w-full">
      <div className="relative w-full max-w-3xl mx-auto" onMouseLeave={() => onHover?.(null)}>
        <img
          src={base.url}
          alt="Peta otot tubuh tampak depan dan belakang"
          className="w-full h-auto select-none pointer-events-none"
          draggable={false}
        />
        {active.map((m) => {
          const v = intensities[m] as 1 | 2 | 3;
          return (
            <div
              key={m}
              onMouseEnter={() => onHover?.(m)}
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                backgroundColor: COLORS[v],
                opacity: v === 3 ? 0.95 : v === 2 ? 0.85 : 0.75,
                WebkitMaskImage: `url(${MASKS[m]})`,
                maskImage: `url(${MASKS[m]})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-center gap-24 mt-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Tampak Depan</p>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Tampak Belakang</p>
      </div>
    </div>
  );
}
