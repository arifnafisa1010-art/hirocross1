import { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarDataPoint {
  category: string;
  value: number;
  fullMark: number;
}

interface SimpleRadarChartProps {
  data: RadarDataPoint[];
  height?: number;
}

export function SimpleRadarChart({ 
  data, 
  height = 300 
}: SimpleRadarChartProps) {
  const [animatedData, setAnimatedData] = useState<RadarDataPoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Initialize with zero values
    const initialData = data.map(item => ({
      ...item,
      value: 0
    }));
    setAnimatedData(initialData);

    // Animate to actual values
    const duration = 1200;
    const steps = 30;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      if (currentStep >= steps) {
        setAnimatedData(data);
        clearInterval(timer);
      } else {
        const newData = data.map(item => ({
          ...item,
          value: Number((item.value * easedProgress).toFixed(2))
        }));
        setAnimatedData(newData);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [data]);

  const hasData = data.some(d => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        Belum ada data tes biomotor
      </div>
    );
  }

  return (
    <div 
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={animatedData}>
          <PolarGrid 
            className="animate-[fade-in_0.5s_ease-out]" 
          />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fontSize: 10 }} 
            className="animate-[fade-in_0.6s_ease-out]"
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 5]} 
            tick={{ fontSize: 10 }} 
            className="animate-[fade-in_0.6s_ease-out]"
          />
          <Radar
            name="Skor"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value}/5`, 'Skor']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
