import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend, Line, ComposedChart, Area } from 'recharts';
import { TrendingUp, Activity, Target } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PremiumBadge } from './PremiumBadge';

interface DailyLoad {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface WeeklyTSSChartProps {
  dailyMetrics: DailyLoad[];
  weeklyTarget?: number;
}

export function WeeklyTSSChart({ dailyMetrics, weeklyTarget = 400 }: WeeklyTSSChartProps) {
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weeks: { 
      weekLabel: string; 
      weekNum: number;
      totalLoad: number; 
      avgLoad: number;
      avgFitness: number;
      avgFatigue: number;
      avgForm: number;
      target: number;
      isCurrentWeek: boolean;
    }[] = [];

    // Get last 8 weeks of data
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      
      const weekDays = dailyMetrics.filter(d => {
        const date = parseISO(d.date);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      });

      const totalLoad = weekDays.reduce((sum, d) => sum + d.load, 0);
      const avgLoad = weekDays.length > 0 ? totalLoad / weekDays.length : 0;
      const avgFitness = weekDays.length > 0 ? weekDays.reduce((sum, d) => sum + d.fitness, 0) / weekDays.length : 0;
      const avgFatigue = weekDays.length > 0 ? weekDays.reduce((sum, d) => sum + d.fatigue, 0) / weekDays.length : 0;
      const avgForm = weekDays.length > 0 ? weekDays.reduce((sum, d) => sum + d.form, 0) / weekDays.length : 0;

      weeks.push({
        weekLabel: format(weekStart, 'd MMM', { locale: idLocale }),
        weekNum: 8 - i,
        totalLoad: Math.round(totalLoad),
        avgLoad: Math.round(avgLoad),
        avgFitness: Math.round(avgFitness),
        avgFatigue: Math.round(avgFatigue),
        avgForm: Math.round(avgForm),
        target: weeklyTarget,
        isCurrentWeek: i === 0,
      });
    }

    return weeks;
  }, [dailyMetrics, weeklyTarget]);

  // Calculate trend
  const trend = useMemo(() => {
    if (weeklyData.length < 2) return 0;
    const recent = weeklyData.slice(-4);
    const firstHalf = recent.slice(0, 2).reduce((sum, w) => sum + w.totalLoad, 0) / 2;
    const secondHalf = recent.slice(2).reduce((sum, w) => sum + w.totalLoad, 0) / 2;
    return secondHalf - firstHalf;
  }, [weeklyData]);

  // Calculate stats
  const stats = useMemo(() => {
    const nonZeroWeeks = weeklyData.filter(w => w.totalLoad > 0);
    if (nonZeroWeeks.length === 0) return { avg: 0, max: 0, min: 0, compliance: 0 };
    
    const avg = Math.round(nonZeroWeeks.reduce((sum, w) => sum + w.totalLoad, 0) / nonZeroWeeks.length);
    const max = Math.max(...nonZeroWeeks.map(w => w.totalLoad));
    const min = Math.min(...nonZeroWeeks.map(w => w.totalLoad));
    const compliantWeeks = nonZeroWeeks.filter(w => w.totalLoad >= weeklyTarget * 0.8).length;
    const compliance = Math.round((compliantWeeks / nonZeroWeeks.length) * 100);
    
    return { avg, max, min, compliance };
  }, [weeklyData, weeklyTarget]);

  const getBarColor = (load: number, isCurrentWeek: boolean) => {
    if (isCurrentWeek) return 'hsl(var(--primary))';
    if (load >= weeklyTarget) return 'hsl(142, 76%, 36%)'; // Green
    if (load >= weeklyTarget * 0.8) return 'hsl(48, 96%, 53%)'; // Yellow
    if (load > 0) return 'hsl(0, 84%, 60%)'; // Red
    return 'hsl(var(--muted))';
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <PremiumBadge size="sm" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Tren TSS Mingguan
        </CardTitle>
        <CardDescription>
          Visualisasi progres beban latihan 8 minggu terakhir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">Rata-rata</p>
            <p className="text-xl font-bold text-foreground">{stats.avg} <span className="text-xs text-muted-foreground">AU</span></p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">Tertinggi</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.max} <span className="text-xs text-muted-foreground">AU</span></p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">Terendah</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.min} <span className="text-xs text-muted-foreground">AU</span></p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">Kepatuhan</p>
            <p className={`text-xl font-bold ${stats.compliance >= 80 ? 'text-green-600 dark:text-green-400' : stats.compliance >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.compliance}%
            </p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className={`flex items-center gap-2 p-2 rounded-lg ${trend > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : trend < 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">
            {trend > 0 ? `↑ Tren naik (+${Math.abs(Math.round(trend))} AU dari 2 minggu sebelumnya)` : 
             trend < 0 ? `↓ Tren turun (${Math.round(trend)} AU dari 2 minggu sebelumnya)` : 
             'Tren stabil'}
          </span>
        </div>

        {/* Main Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="weekLabel" 
                tick={{ fontSize: 11 }} 
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 11 }} 
                className="text-muted-foreground"
                domain={[0, 'auto']}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }} 
                className="text-muted-foreground"
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    totalLoad: 'Total Load',
                    target: 'Target',
                    avgFitness: 'Avg Fitness',
                    avgForm: 'Avg Form'
                  };
                  return [`${value} AU`, labels[name] || name];
                }}
              />
              <Legend />
              <ReferenceLine 
                yAxisId="left"
                y={weeklyTarget} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ value: `Target ${weeklyTarget}`, position: 'right', fontSize: 10, fill: 'hsl(var(--primary))' }}
              />
              <Bar 
                yAxisId="left"
                dataKey="totalLoad" 
                name="Total Load"
                radius={[4, 4, 0, 0]}
              >
                {weeklyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.totalLoad, entry.isCurrentWeek)}
                    opacity={entry.isCurrentWeek ? 1 : 0.8}
                  />
                ))}
              </Bar>
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgFitness" 
                name="Avg Fitness"
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgForm" 
                name="Avg Form"
                stroke="hsl(48, 96%, 53%)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-muted-foreground">≥ Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-muted-foreground">80-99% Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">&lt; 80% Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">Minggu Ini</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
