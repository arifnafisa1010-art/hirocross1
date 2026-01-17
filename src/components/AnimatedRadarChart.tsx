import { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface AnimatedRadarChartProps {
  data: Array<Record<string, string | number>>;
  athletes: Array<{ id: string; name: string }>;
  colors: string[];
  height?: number;
}

export function AnimatedRadarChart({ 
  data, 
  athletes, 
  colors,
  height = 300 
}: AnimatedRadarChartProps) {
  const [animatedData, setAnimatedData] = useState<Array<Record<string, string | number>>>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Initialize with zero values
    const initialData = data.map(item => {
      const zeroItem: Record<string, string | number> = { category: item.category };
      athletes.forEach(athlete => {
        zeroItem[athlete.name] = 0;
      });
      return zeroItem;
    });
    setAnimatedData(initialData);

    // Animate to actual values
    const duration = 1500;
    const steps = 40;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      if (currentStep >= steps) {
        setAnimatedData(data);
        clearInterval(timer);
      } else {
        const newData = data.map(item => {
          const animatedItem: Record<string, string | number> = { category: item.category };
          athletes.forEach(athlete => {
            const targetValue = typeof item[athlete.name] === 'number' ? item[athlete.name] : 0;
            animatedItem[athlete.name] = Number((targetValue as number * easedProgress).toFixed(2));
          });
          return animatedItem;
        });
        setAnimatedData(newData);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [data, athletes]);

  const hasData = data.some(d => 
    Object.values(d).some(v => typeof v === 'number' && v > 0)
  );

  if (!hasData) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center text-muted-foreground`}>
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
          {athletes.slice(0, 5).map((athlete, index) => (
            <Radar
              key={athlete.id}
              name={athlete.name}
              dataKey={athlete.name}
              stroke={colors[index]}
              fill={colors[index]}
              fillOpacity={0.1}
              strokeWidth={2}
              animationBegin={index * 100}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
