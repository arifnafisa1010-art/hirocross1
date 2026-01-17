import { useMemo, useState, useEffect } from 'react';

interface FormSpeedometerProps {
  value: number; // -100 to +100
  size?: number;
  label?: string;
}

const getFormCategory = (value: number) => {
  if (value <= -50) return { label: 'Overreaching', color: '#ef4444' };
  if (value <= -20) return { label: 'Fatigue', color: '#f97316' };
  if (value <= 20) return { label: 'Baseline', color: '#f59e0b' };
  if (value <= 50) return { label: 'Fresh', color: '#84cc16' };
  return { label: 'Optimal', color: '#22c55e' };
};

export function FormSpeedometer({ value, size = 200, label = 'Form' }: FormSpeedometerProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const category = useMemo(() => getFormCategory(value), [value]);
  
  useEffect(() => {
    setIsVisible(true);
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.round(stepValue * currentStep));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  // Calculate needle angle (-90 to 90 degrees)
  // Value -100 to +100 maps to -90 to 90 degrees
  const needleAngle = useMemo(() => {
    const clampedValue = Math.max(-100, Math.min(100, animatedValue));
    return (clampedValue / 100) * 90;
  }, [animatedValue]);

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
        {/* Overreaching - Red */}
        <path
          d={describeArc(centerX, centerY, radius, -90, -54)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={size * 0.12}
          strokeLinecap="round"
          className="animate-[scale-in_0.5s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Fatigue - Orange */}
        <path
          d={describeArc(centerX, centerY, radius, -52, -18)}
          fill="none"
          stroke="#f97316"
          strokeWidth={size * 0.12}
          className="animate-[scale-in_0.6s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Baseline - Amber */}
        <path
          d={describeArc(centerX, centerY, radius, -16, 18)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={size * 0.12}
          className="animate-[scale-in_0.7s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Fresh - Lime */}
        <path
          d={describeArc(centerX, centerY, radius, 20, 54)}
          fill="none"
          stroke="#84cc16"
          strokeWidth={size * 0.12}
          className="animate-[scale-in_0.8s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Optimal - Green */}
        <path
          d={describeArc(centerX, centerY, radius, 56, 90)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={size * 0.12}
          strokeLinecap="round"
          className="animate-[scale-in_0.9s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />

        {/* Tick marks */}
        {[
          { value: -100, angle: -90 },
          { value: -50, angle: -45 },
          { value: 0, angle: 0 },
          { value: 50, angle: 45 },
          { value: 100, angle: 90 },
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
                {value}
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
        
        {/* Needle center */}
        <circle cx={centerX} cy={centerY} r={size * 0.045} fill="hsl(var(--foreground))" />
        <circle cx={centerX} cy={centerY} r={size * 0.025} fill="hsl(var(--background))" />
      </svg>

      <div className="text-center -mt-2 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}>
        <p className="text-4xl font-black transition-all duration-300" style={{ color: category.color }}>
          {animatedValue > 0 ? '+' : ''}{animatedValue}
        </p>
        <p className="text-sm font-semibold transition-all duration-300" style={{ color: category.color }}>
          {category.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
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
