import { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ComposedChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface PerformanceTrendChartProps {
  dailyMetrics: DailyMetric[];
}

export function PerformanceTrendChart({ dailyMetrics }: PerformanceTrendChartProps) {
  const [animatedData, setAnimatedData] = useState<DailyMetric[]>([]);

  // Generate baseline data if no metrics
  const metricsToUse = useMemo(() => {
    if (dailyMetrics.length > 0) return dailyMetrics;
    
    const baseline: DailyMetric[] = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      baseline.push({
        date: format(date, 'yyyy-MM-dd'),
        load: 0,
        fitness: 0,
        fatigue: 0,
        form: 0,
      });
    }
    return baseline;
  }, [dailyMetrics]);

  // Animation effect
  useEffect(() => {
    setAnimatedData([]);
    const timer = setTimeout(() => {
      setAnimatedData(metricsToUse);
    }, 100);

    return () => clearTimeout(timer);
  }, [metricsToUse]);

  // Get last 28 days for display
  const displayData = animatedData.slice(-28).map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), 'dd/MM', { locale: idLocale }),
    fullDate: format(parseISO(d.date), 'dd MMMM yyyy', { locale: idLocale }),
  }));

  const hasRealData = dailyMetrics.length > 0 && dailyMetrics.some(m => m.load > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.fullDate}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[hsl(142,76%,36%)]" />
                Fitness (CTL):
              </span>
              <span className="font-medium">{data.fitness}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[hsl(0,84%,60%)]" />
                Fatigue (ATL):
              </span>
              <span className="font-medium">{data.fatigue}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[hsl(45,93%,47%)]" />
                Form (TSB):
              </span>
              <span className="font-medium">{data.form}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-primary/70" />
                Load (AU):
              </span>
              <span className="font-medium">{data.load}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trend Performa (28 Hari Terakhir)
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          Monitoring Fitness, Fatigue, Form & Training Load
          {!hasRealData && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Info className="w-3 h-3" />
              <span className="text-xs">Input data untuk melihat tren</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData}>
              <defs>
                <linearGradient id="loadBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 9 }} 
                interval={2}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10 }} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'CTL/ATL/TSB', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Load (AU)', angle: 90, position: 'insideRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <ReferenceLine yAxisId="left" y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
              
              {/* Training Load as Bars */}
              <Bar
                yAxisId="right"
                dataKey="load"
                name="Training Load"
                fill="url(#loadBarGradient)"
                radius={[2, 2, 0, 0]}
                opacity={0.7}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              
              {/* Fitness Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="fitness"
                name="Fitness (CTL)"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              
              {/* Fatigue Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="fatigue"
                name="Fatigue (ATL)"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              
              {/* Form Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="form"
                name="Form (TSB)"
                stroke="hsl(45, 93%, 47%)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend Explanation */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
            <span className="font-semibold text-green-600 dark:text-green-400">Fitness (CTL)</span>
            <p className="text-muted-foreground">Rata-rata 42 hari</p>
          </div>
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
            <span className="font-semibold text-red-600 dark:text-red-400">Fatigue (ATL)</span>
            <p className="text-muted-foreground">Rata-rata 7 hari</p>
          </div>
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-center">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Form (TSB)</span>
            <p className="text-muted-foreground">Fitness - Fatigue</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg text-center">
            <span className="font-semibold text-primary">Training Load</span>
            <p className="text-muted-foreground">Beban harian (AU)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
