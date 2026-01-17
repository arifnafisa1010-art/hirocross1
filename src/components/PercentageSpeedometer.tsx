import { useMemo, useState, useEffect } from 'react';

interface PercentageSpeedometerProps {
  percentage: number;
  size?: number;
  label?: string;
}

const getPercentageCategory = (percentage: number) => {
  if (percentage >= 80) return { label: 'Sangat Baik', color: '#22c55e' };
  if (percentage >= 70) return { label: 'Baik', color: '#84cc16' };
  if (percentage >= 60) return { label: 'Sedang', color: '#f59e0b' };
  if (percentage >= 40) return { label: 'Cukup', color: '#f97316' };
  return { label: 'Kurang', color: '#ef4444' };
};

export function PercentageSpeedometer({ percentage, size = 200, label = 'Skor Keseluruhan' }: PercentageSpeedometerProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const category = useMemo(() => getPercentageCategory(percentage), [percentage]);
  
  // Animate on mount
  useEffect(() => {
    setIsVisible(true);
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepValue = percentage / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedPercentage(percentage);
        clearInterval(timer);
      } else {
        setAnimatedPercentage(Math.round(stepValue * currentStep));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [percentage]);
  
  // Calculate needle angle (-90 to 90 degrees)
  // Percentage 0 to 100 maps to -90 to 90 degrees
  const needleAngle = useMemo(() => {
    const clampedPercentage = Math.max(0, Math.min(100, animatedPercentage));
    return -90 + (clampedPercentage / 100) * 180;
  }, [animatedPercentage]);

  const centerX = size / 2;
  const centerY = size / 2 + 10;
  const radius = size * 0.38;
  const needleLength = radius * 0.85;

  // Calculate needle endpoint
  const needleRadians = (needleAngle - 90) * (Math.PI / 180);
  const needleX = centerX + needleLength * Math.cos(needleRadians);
  const needleY = centerY + needleLength * Math.sin(needleRadians);

  return (
    <div className={`flex flex-col items-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc segments - 5 levels from Kurang to Sangat Baik */}
        {/* Kurang (0-40%) - Red */}
        <path
          d={describeArc(centerX, centerY, radius, -90, -18)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={size * 0.12}
          strokeLinecap="round"
          className="animate-[scale-in_0.5s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Cukup (40-60%) - Orange */}
        <path
          d={describeArc(centerX, centerY, radius, -16, 18)}
          fill="none"
          stroke="#f97316"
          strokeWidth={size * 0.12}
          className="animate-[scale-in_0.6s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Sedang (60-70%) - Amber */}
        <path
          d={describeArc(centerX, centerY, radius, 20, 36)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={size * 0.12}
          className="animate-[scale-in_0.7s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Baik (70-80%) - Lime */}
        <path
          d={describeArc(centerX, centerY, radius, 38, 54)}
          fill="none"
          stroke="#84cc16"
          strokeWidth={size * 0.12}
          className="animate-[scale-in_0.8s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        {/* Sangat Baik (80-100%) - Green */}
        <path
          d={describeArc(centerX, centerY, radius, 56, 90)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={size * 0.12}
          strokeLinecap="round"
          className="animate-[scale-in_0.9s_ease-out]"
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />

        {/* Tick marks and labels */}
        {[
          { value: 0, angle: -90 },
          { value: 20, angle: -90 + (20 / 100) * 180 },
          { value: 40, angle: -90 + (40 / 100) * 180 },
          { value: 60, angle: -90 + (60 / 100) * 180 },
          { value: 80, angle: -90 + (80 / 100) * 180 },
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
                {value}%
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
        />
        
        {/* Needle center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={size * 0.045}
          fill="hsl(var(--foreground))"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={size * 0.025}
          fill="hsl(var(--background))"
        />
      </svg>

      {/* Percentage Value and Category */}
      <div className="text-center -mt-2 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}>
        <p className="text-4xl font-black transition-all duration-300" style={{ color: category.color }}>
          {animatedPercentage}%
        </p>
        <p className="text-sm font-semibold transition-all duration-300" style={{ color: category.color }}>
          {category.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// Helper function to describe an arc path
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
