import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CalendarDays, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PremiumBadge } from './PremiumBadge';
import { cn } from '@/lib/utils';

interface DailyLoad {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface DailyLoadAccumulationProps {
  dailyMetrics: DailyLoad[];
  daysToShow?: number;
}

export function DailyLoadAccumulation({ dailyMetrics, daysToShow = 14 }: DailyLoadAccumulationProps) {
  const chartData = useMemo(() => {
    // Get the last N days of data
    const recentDays = dailyMetrics.slice(-daysToShow);
    
    return recentDays.map((d, index) => {
      const date = parseISO(d.date);
      const prevDay = index > 0 ? recentDays[index - 1] : null;
      
      // Calculate load change from previous day
      const loadChange = prevDay ? d.load - prevDay.load : 0;
      const fitnessChange = prevDay ? d.fitness - prevDay.fitness : 0;
      
      return {
        ...d,
        dayLabel: format(date, 'EEE', { locale: idLocale }),
        dateLabel: format(date, 'd MMM', { locale: idLocale }),
        loadChange,
        fitnessChange,
        // Calculate cumulative load for the last 7 days ending at this point
        rolling7DayLoad: dailyMetrics
          .slice(Math.max(0, dailyMetrics.indexOf(d) - 6), dailyMetrics.indexOf(d) + 1)
          .reduce((sum, day) => sum + day.load, 0),
      };
    });
  }, [dailyMetrics, daysToShow]);

  // Get today's stats
  const todayStats = chartData[chartData.length - 1];
  const yesterdayStats = chartData[chartData.length - 2];

  // Calculate averages
  const avgLoad = useMemo(() => {
    const nonZeroDays = chartData.filter(d => d.load > 0);
    return nonZeroDays.length > 0 
      ? Math.round(nonZeroDays.reduce((sum, d) => sum + d.load, 0) / nonZeroDays.length) 
      : 0;
  }, [chartData]);

  // Get trend icon
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  // Get load color class
  const getLoadColorClass = (load: number) => {
    if (load === 0) return 'text-muted-foreground';
    if (load < 50) return 'text-green-600 dark:text-green-400';
    if (load < 100) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <PremiumBadge size="sm" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Akumulasi Load Harian
        </CardTitle>
        <CardDescription>
          Detail load harian dan perubahan {daysToShow} hari terakhir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
            <p className="text-xs text-primary font-medium uppercase">Hari Ini</p>
            <p className={cn("text-2xl font-bold", getLoadColorClass(todayStats?.load || 0))}>
              {todayStats?.load || 0} <span className="text-xs text-muted-foreground">AU</span>
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {getTrendIcon(todayStats?.loadChange || 0)}
              <span className="text-xs text-muted-foreground">
                {todayStats?.loadChange > 0 ? '+' : ''}{todayStats?.loadChange || 0} dari kemarin
              </span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">Fitness Saat Ini</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {todayStats?.fitness || 0}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {getTrendIcon(todayStats?.fitnessChange || 0)}
              <span className="text-xs text-muted-foreground">
                {todayStats?.fitnessChange > 0 ? '+' : ''}{todayStats?.fitnessChange || 0}
              </span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">7 Hari Terakhir</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {todayStats?.rolling7DayLoad || 0} <span className="text-xs text-muted-foreground">AU</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Rata-rata: {avgLoad} AU/hari
            </p>
          </div>
        </div>

        {/* Daily Load Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="fitnessGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    load: 'Load',
                    fitness: 'Fitness',
                    fatigue: 'Fatigue',
                    form: 'Form'
                  };
                  return [`${value} AU`, labels[name] || name];
                }}
                labelFormatter={(label) => `📅 ${label}`}
              />
              <ReferenceLine 
                y={avgLoad} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ value: `Avg ${avgLoad}`, position: 'right', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="load" 
                stroke="hsl(var(--primary))" 
                fill="url(#loadGradient)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
              />
              <Area 
                type="monotone" 
                dataKey="fitness" 
                stroke="hsl(142, 76%, 36%)" 
                fill="url(#fitnessGradient)"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Detail Grid */}
        <div className="grid grid-cols-7 gap-1">
          {chartData.slice(-7).map((day, index) => (
            <div 
              key={day.date} 
              className={cn(
                "p-2 rounded-lg text-center border transition-all",
                day.load > 0 
                  ? day.load >= 100 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : day.load >= 50 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-green-500/10 border-green-500/30'
                  : 'bg-muted/30 border-border'
              )}
            >
              <p className="text-[10px] text-muted-foreground font-medium">{day.dayLabel}</p>
              <p className={cn("text-sm font-bold", getLoadColorClass(day.load))}>
                {day.load}
              </p>
              <p className="text-[9px] text-muted-foreground">AU</p>
              {day.loadChange !== 0 && (
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {getTrendIcon(day.loadChange)}
                  <span className={cn(
                    "text-[8px] font-medium",
                    day.loadChange > 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {day.loadChange > 0 ? '+' : ''}{day.loadChange}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs pt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Daily Load</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Fitness (CTL)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
