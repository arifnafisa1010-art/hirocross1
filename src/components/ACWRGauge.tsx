import { useMemo, useState, useEffect } from 'react';

interface ACWRGaugeProps {
  acwr: number; // Typically 0.5 to 2.0+
  size?: number;
}

const getACWRCategory = (acwr: number) => {
  if (acwr < 0.8) return { label: 'Undertrained', color: '#3b82f6', description: 'Beban latihan terlalu rendah' };
  if (acwr <= 1.3) return { label: 'Sweet Spot', color: '#22c55e', description: 'Zona optimal untuk performa' };
  if (acwr <= 1.5) return { label: 'Warning', color: '#f59e0b', description: 'Risiko cedera meningkat' };
  return { label: 'Danger Zone', color: '#ef4444', description: 'Risiko cedera sangat tinggi' };
};

export function ACWRGauge({ acwr, size = 200 }: ACWRGaugeProps) {
  const [animatedACWR, setAnimatedACWR] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const category = useMemo(() => getACWRCategory(acwr), [acwr]);
  
  useEffect(() => {
    setIsVisible(true);
    const duration = 1500;
    const steps = 60;
    const stepValue = acwr / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedACWR(acwr);
        clearInterval(timer);
      } else {
        setAnimatedACWR(Number((stepValue * currentStep).toFixed(2)));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [acwr]);
  
  // ACWR 0 to 2.0 maps to -90 to 90 degrees
  const needleAngle = useMemo(() => {
    const clampedACWR = Math.max(0, Math.min(2, animatedACWR));
    return -90 + (clampedACWR / 2) * 180;
  }, [animatedACWR]);

  const centerX = size / 2;
  const centerY = size / 2 + 10;
  const radius = size * 0.38;
  const needleLength = radius * 0.85;

  const needleRadians = (needleAngle - 90) * (Math.PI / 180);
  const needleX = centerX + needleLength * Math.cos(needleRadians);
  const needleY = centerY + needleLength * Math.sin(needleRadians);

  return (
    <div className={`flex flex-col items-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Undertrained - Blue (0 - 0.8) */}
        <path
          d={describeArc(centerX, centerY, radius, -90, -18)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={size * 0.12}
          strokeLinecap="round"
          className="animate-[scale-in_0.5s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Sweet Spot - Green (0.8 - 1.3) */}
        <path
          d={describeArc(centerX, centerY, radius, -16, 27)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={size * 0.12}
          className="animate-[scale-in_0.6s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Warning - Amber (1.3 - 1.5) */}
        <path
          d={describeArc(centerX, centerY, radius, 29, 45)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={size * 0.12}
          className="animate-[scale-in_0.7s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Danger - Red (1.5 - 2.0+) */}
        <path
          d={describeArc(centerX, centerY, radius, 47, 90)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={size * 0.12}
          strokeLinecap="round"
          className="animate-[scale-in_0.8s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />

        {/* Tick marks */}
        {[
          { value: 0.5, angle: -90 + (0.5/2) * 180 },
          { value: 0.8, angle: -90 + (0.8/2) * 180 },
          { value: 1.0, angle: -90 + (1.0/2) * 180 },
          { value: 1.3, angle: -90 + (1.3/2) * 180 },
          { value: 1.5, angle: -90 + (1.5/2) * 180 },
          { value: 2.0, angle: 90 },
        ].map(({ value, angle }) => {
          const tickRadians = (angle - 90) * (Math.PI / 180);
          const innerRadius = radius - size * 0.08;
          const outerRadius = radius + size * 0.08;
          const labelRadius = radius + size * 0.16;
          
          return (
            <g key={value}>
              <line
                x1={centerX + innerRadius * Math.cos(tickRadians)}
                y1={centerY + innerRadius * Math.sin(tickRadians)}
                x2={centerX + outerRadius * Math.cos(tickRadians)}
                y2={centerY + outerRadius * Math.sin(tickRadians)}
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                opacity={0.3}
              />
              <text
                x={centerX + labelRadius * Math.cos(tickRadians)}
                y={centerY + labelRadius * Math.sin(tickRadians)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={size * 0.055}
                fill="hsl(var(--muted-foreground))"
                fontWeight="500"
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="hsl(var(--foreground))"
          strokeWidth={3}
          strokeLinecap="round"
          className="transition-all duration-75"
        />
        
        <circle cx={centerX} cy={centerY} r={size * 0.045} fill="hsl(var(--foreground))" />
        <circle cx={centerX} cy={centerY} r={size * 0.025} fill="hsl(var(--background))" />
      </svg>

      <div className="text-center -mt-2 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}>
        <p className="text-4xl font-black transition-all duration-300" style={{ color: category.color }}>
          {animatedACWR.toFixed(2)}
        </p>
        <p className="text-sm font-semibold transition-all duration-300" style={{ color: category.color }}>
          {category.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">ACWR Ratio</p>
      </div>
    </div>
  );
}

export function getACWRInterpretation(acwr: number): string {
  const category = getACWRCategory(acwr);
  return `${category.label}: ${category.description}`;
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}
