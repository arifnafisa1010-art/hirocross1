import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MuscleId, MUSCLE_LABELS } from '@/lib/muscleExercises';

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

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

export function MuscleBodyMap({ intensities, onHover }: Props) {
  const active = (Object.keys(MASKS) as MuscleId[]).filter((m) => (intensities[m] ?? 0) > 0);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const dragged = useRef(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  // --- alpha hit-testing on mask images ---
  const hitCanvases = useRef<Map<MuscleId, { ctx: CanvasRenderingContext2D; w: number; h: number }>>(
    new Map(),
  );
  useEffect(() => {
    let cancelled = false;
    (Object.entries(MASKS) as [MuscleId, string][]).forEach(([id, url]) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        const w = 220;
        const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        try {
          ctx.drawImage(img, 0, 0, w, h);
          ctx.getImageData(0, 0, 1, 1);
          hitCanvases.current.set(id, { ctx, w, h });
        } catch {
          /* tainted canvas — fall back to no hit-testing */
        }
      };
      img.src = url;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const muscleAt = useCallback((rx: number, ry: number): MuscleId | null => {
    let best: { id: MuscleId; a: number } | null = null;
    hitCanvases.current.forEach((c, id) => {
      const x = Math.floor(rx * c.w);
      const y = Math.floor(ry * c.h);
      if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
      const a = c.ctx.getImageData(x, y, 1, 1).data[3];
      if (a > 40 && (!best || a > best.a)) best = { id, a };
    });
    return best ? best.id : null;
  }, []);


  const clampOffset = useCallback((o: { x: number; y: number }, z: number) => {
    const el = containerRef.current;
    if (!el) return o;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const minX = w - w * z;
    const minY = h - h * z;
    return { x: clamp(o.x, minX, 0), y: clamp(o.y, minY, 0) };
  }, []);

  const zoomAt = useCallback(
    (nextZoomRaw: number, px: number, py: number) => {
      setZoom((z) => {
        const next = clamp(nextZoomRaw, MIN_ZOOM, MAX_ZOOM);
        const k = next / z;
        setOffset((o) => clampOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k }, next));
        return next;
      });
    },
    [clampOffset],
  );

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAtRef.current(
        zoomRef.current * Math.exp(-dy * 0.0018),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el || !pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rect = el.getBoundingClientRect();

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2 - rect.left;
      const cy = (a.y + b.y) / 2 - rect.top;
      if (pinch.current.dist > 0) {
        zoomAt(zoomRef.current * (dist / pinch.current.dist), cx, cy);
      }
      pinch.current = { dist, cx, cy };
      dragged.current = true;
      return;
    }

    if (zoomRef.current > 1 && pointers.current.size === 1 && e.buttons !== 0) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragged.current = true;
      setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }, zoomRef.current));
      return;
    }

    if (e.pointerType === 'mouse') detectHover(e.clientX, e.clientY);
  };

  const detectHover = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      const content = contentRef.current;
      if (!el || !content) return;
      const rect = el.getBoundingClientRect();
      const cRect = content.getBoundingClientRect();
      if (cRect.width <= 0 || cRect.height <= 0) return;
      const rx = (clientX - cRect.left) / cRect.width;
      const ry = (clientY - cRect.top) / cRect.height;
      if (rx < 0 || ry < 0 || rx > 1 || ry > 1) {
        onHover?.(null);
        setTooltip(null);
        return;
      }
      const id = muscleAt(rx, ry);
      onHover?.(id);
      setTooltip(id ? { x: clientX - rect.left, y: clientY - rect.top, label: MUSCLE_LABELS[id] } : null);
    },
    [muscleAt, onHover],
  );

  const endPointer = (e: React.PointerEvent) => {
    if (!dragged.current && pointers.current.size === 1) {
      detectHover(e.clientX, e.clientY);
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const zoomButton = (dir: 1 | -1) => {
    const el = containerRef.current;
    const px = el ? el.clientWidth / 2 : 0;
    const py = el ? el.clientHeight / 2 : 0;
    zoomAt(zoom * (dir === 1 ? 1.4 : 1 / 1.4), px, py);
  };

  return (
    <div className="w-full">
      <div className="relative w-full max-w-3xl mx-auto">
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-lg bg-muted/20 touch-none select-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={(e) => {
            endPointer(e);
            if (e.pointerType === 'mouse') {
              onHover?.(null);
              setTooltip(null);
            }
          }}
        >
          <div
            ref={contentRef}
            className="relative w-full"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <img
              src={base.url}
              alt="Peta otot tubuh tampak depan dan belakang"
              className="w-full h-auto select-none pointer-events-none"
              draggable={false}
            />
            <div
              className="absolute inset-0 bg-black pointer-events-none"
              aria-hidden="true"
              style={{
                WebkitMaskImage: `url(${base.url})`,
                maskImage: `url(${base.url})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskPosition: '0 0',
                maskPosition: '0 0',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            />
            {(Object.keys(MASKS) as MuscleId[]).map((m) => (
              <div
                key={`idle-${m}`}
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
                style={{
                  backgroundColor: '#4b5563',
                  opacity: (intensities[m] ?? 0) > 0 ? 0 : 0.55,
                  transition: 'opacity 300ms',
                  WebkitMaskImage: `url(${MASKS[m]})`,
                  maskImage: `url(${MASKS[m]})`,
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskPosition: '0 0',
                  maskPosition: '0 0',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
              />
            ))}

            {active.map((m) => {
              const v = intensities[m] as 1 | 2 | 3;
              return (
                <div
                  key={m}
                  className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                  style={{
                    backgroundColor: COLORS[v],
                    opacity: v === 3 ? 0.95 : v === 2 ? 0.85 : 0.75,
                    WebkitMaskImage: `url(${MASKS[m]})`,
                    maskImage: `url(${MASKS[m]})`,
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                    WebkitMaskPosition: '0 0',
                    maskPosition: '0 0',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                  }}
                />
              );
            })}
          </div>

          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow"
              style={{ left: tooltip.x, top: Math.max(tooltip.y - 8, 14) }}
            >
              {tooltip.label}
            </div>
          )}


          {/* Zoom controls */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 shadow"
              onClick={() => zoomButton(1)}
              aria-label="Perbesar"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 shadow"
              onClick={() => zoomButton(-1)}
              aria-label="Perkecil"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 shadow"
              onClick={reset}
              aria-label="Reset tampilan"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="absolute top-2 left-2 rounded bg-background/70 px-2 py-1 text-[10px] text-muted-foreground">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted-foreground md:hidden">
        Cubit untuk zoom, geser untuk menggeser, ketuk tepat pada otot untuk melihat namanya.
      </p>

      <div className="flex justify-center gap-16 sm:gap-24 mt-2">
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">Tampak Depan</p>
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">Tampak Belakang</p>
      </div>
    </div>
  );
}
