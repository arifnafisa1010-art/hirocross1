import { useMemo } from 'react';

interface BMISpeedometerProps {
  bmi: number;
  size?: number;
}

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Kurus', color: '#3b82f6', angle: -60 };
  if (bmi < 25) return { label: 'Normal', color: '#22c55e', angle: 0 };
  if (bmi < 30) return { label: 'Gemuk', color: '#f59e0b', angle: 45 };
  return { label: 'Obesitas', color: '#ef4444', angle: 75 };
};

export function BMISpeedometer({ bmi, size = 180 }: BMISpeedometerProps) {
  const category = useMemo(() => getBMICategory(bmi), [bmi]);
  
  // Calculate needle angle (-90 to 90 degrees)
  // BMI range: 10 to 40 maps to -90 to 90 degrees
  const needleAngle = useMemo(() => {
    const minBMI = 10;
    const maxBMI = 40;
    const clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi));
    const percentage = (clampedBMI - minBMI) / (maxBMI - minBMI);
    return -90 + percentage * 180;
  }, [bmi]);

  const centerX = size / 2;
  const centerY = size / 2 + 10;
  const radius = size * 0.38;
  const needleLength = radius * 0.85;

  // Calculate needle endpoint
  const needleRadians = (needleAngle - 90) * (Math.PI / 180);
  const needleX = centerX + needleLength * Math.cos(needleRadians);
  const needleY = centerY + needleLength * Math.sin(needleRadians);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc segments */}
        {/* Underweight - Blue */}
        <path
          d={describeArc(centerX, centerY, radius, -90, -45)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={size * 0.12}
          strokeLinecap="round"
        />
        {/* Normal - Green */}
        <path
          d={describeArc(centerX, centerY, radius, -43, 15)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={size * 0.12}
        />
        {/* Overweight - Yellow/Orange */}
        <path
          d={describeArc(centerX, centerY, radius, 17, 50)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={size * 0.12}
        />
        {/* Obese - Red */}
        <path
          d={describeArc(centerX, centerY, radius, 52, 90)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={size * 0.12}
          strokeLinecap="round"
        />

        {/* Tick marks and labels */}
        {[
          { value: 15, angle: -90 + ((15 - 10) / 30) * 180 },
          { value: 18.5, angle: -90 + ((18.5 - 10) / 30) * 180 },
          { value: 25, angle: -90 + ((25 - 10) / 30) * 180 },
          { value: 30, angle: -90 + ((30 - 10) / 30) * 180 },
          { value: 35, angle: -90 + ((35 - 10) / 30) * 180 },
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

      {/* IMT Value and Category */}
      <div className="text-center -mt-2">
        <p className="text-3xl font-black" style={{ color: category.color }}>
          {bmi.toFixed(1)}
        </p>
        <p className="text-sm font-semibold" style={{ color: category.color }}>
          {category.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">kg/m²</p>
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

// IMT interpretation helper
export function getIMTInterpretation(imt: number): string {
  if (imt < 16) return 'Sangat Kurus (Severe Thinness)';
  if (imt < 17) return 'Kurus (Moderate Thinness)';
  if (imt < 18.5) return 'Kurus (Mild Thinness)';
  if (imt < 25) return 'Normal';
  if (imt < 30) return 'Kelebihan Berat Badan (Overweight)';
  if (imt < 35) return 'Obesitas Kelas I';
  if (imt < 40) return 'Obesitas Kelas II';
  return 'Obesitas Kelas III (Morbid)';
}

export function getIMTRecommendation(imt: number): string {
  if (imt < 18.5) return 'Perlu peningkatan asupan kalori dan latihan penguatan otot untuk menambah massa tubuh.';
  if (imt < 25) return 'Pertahankan pola makan seimbang dan aktivitas fisik rutin.';
  if (imt < 30) return 'Disarankan untuk meningkatkan aktivitas kardiovaskular dan menjaga pola makan.';
  return 'Konsultasikan dengan ahli gizi untuk program penurunan berat badan yang tepat.';
}

// Backward compatible aliases
export const getBMIInterpretation = getIMTInterpretation;
export const getBMIRecommendation = getIMTRecommendation;
