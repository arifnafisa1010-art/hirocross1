import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TrendingUp, Activity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface AthleteWeeklyTrendChartProps {
  dailyMetrics: DailyMetric[];
  loading?: boolean;
}

interface WeeklyData {
  weekLabel: string;
  weekStart: string;
  weekNumber: number;
  totalLoad: number;
  avgFitness: number;
  avgFatigue: number;
  avgForm: number;
  sessionsCount: number;
}

export function AthleteWeeklyTrendChart({ dailyMetrics, loading = false }: AthleteWeeklyTrendChartProps) {
  
  // Aggregate daily metrics into weekly data (last 8 weeks)
  const weeklyData = useMemo(() => {
    if (dailyMetrics.length === 0) return [];

    const today = new Date();
    const eightWeeksAgo = subWeeks(today, 8);
    
    // Get all weeks in the range
    const weeks = eachWeekOfInterval(
      { start: eightWeeksAgo, end: today },
      { weekStartsOn: 1 } // Monday
    );

    const result: WeeklyData[] = [];

    weeks.forEach((weekStart, idx) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Filter metrics for this week
      const weekMetrics = dailyMetrics.filter(m => {
        const date = parseISO(m.date);
        return date >= weekStart && date <= weekEnd;
      });

      // Aggregate
      const totalLoad = weekMetrics.reduce((sum, m) => sum + m.load, 0);
      const avgFitness = weekMetrics.length > 0 
        ? Math.round(weekMetrics.reduce((sum, m) => sum + m.fitness, 0) / weekMetrics.length)
        : 0;
      const avgFatigue = weekMetrics.length > 0
        ? Math.round(weekMetrics.reduce((sum, m) => sum + m.fatigue, 0) / weekMetrics.length)
        : 0;
      const avgForm = weekMetrics.length > 0
        ? Math.round(weekMetrics.reduce((sum, m) => sum + m.form, 0) / weekMetrics.length)
        : 0;
      const sessionsCount = weekMetrics.filter(m => m.load > 0).length;

      result.push({
        weekLabel: `W${idx + 1}`,
        weekStart: format(weekStart, 'd MMM', { locale: idLocale }),
        weekNumber: idx + 1,
        totalLoad,
        avgFitness,
        avgFatigue,
        avgForm,
        sessionsCount
      });
    });

    return result;
  }, [dailyMetrics]);

  // Calculate trends
  const getTrend = (data: WeeklyData[], key: keyof WeeklyData) => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-2);
    const diff = Number(recent[1][key]) - Number(recent[0][key]);
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  };

  const fitnessTrend = getTrend(weeklyData, 'avgFitness');
  const fatigueTrend = getTrend(weeklyData, 'avgFatigue');
  const formTrend = getTrend(weeklyData, 'avgForm');

  // Get current week stats
  const currentWeek = weeklyData[weeklyData.length - 1];
  const previousWeek = weeklyData[weeklyData.length - 2];

  // Calculate Y axis bounds for form
  const formValues = weeklyData.map(d => d.avgForm);
  const minForm = Math.min(...formValues, -30);
  const maxForm = Math.max(...formValues, 30);
  const yMinForm = Math.floor(minForm / 10) * 10 - 10;
  const yMaxForm = Math.ceil(maxForm / 10) * 10 + 10;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {data.weekLabel} - {data.weekStart}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                Total Load:
              </span>
              <span className="font-medium">{data.totalLoad} AU</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Avg Fitness:
              </span>
              <span className="font-medium">{data.avgFitness}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Avg Fatigue:
              </span>
              <span className="font-medium">{data.avgFatigue}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Avg Form:
              </span>
              <span className="font-medium">{data.avgForm}</span>
            </div>
            <div className="pt-1.5 mt-1.5 border-t border-border text-muted-foreground">
              Sesi latihan: {data.sessionsCount} sesi
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trend Performa Mingguan
            </CardTitle>
            <CardDescription>Perkembangan 8 minggu terakhir</CardDescription>
          </div>
          
          {/* Trend Badges */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px]",
                fitnessTrend === 'up' && "border-green-500 text-green-600",
                fitnessTrend === 'down' && "border-red-500 text-red-600"
              )}
            >
              CTL {fitnessTrend === 'up' ? '↑' : fitnessTrend === 'down' ? '↓' : '→'}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px]",
                fatigueTrend === 'up' && "border-yellow-500 text-yellow-600",
                fatigueTrend === 'down' && "border-green-500 text-green-600"
              )}
            >
              ATL {fatigueTrend === 'up' ? '↑' : fatigueTrend === 'down' ? '↓' : '→'}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px]",
                formTrend === 'up' && "border-blue-500 text-blue-600",
                formTrend === 'down' && "border-amber-500 text-amber-600"
              )}
            >
              TSB {formTrend === 'up' ? '↑' : formTrend === 'down' ? '↓' : '→'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {weeklyData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Belum ada data latihan</p>
              <p className="text-xs">Mulai catat latihan untuk melihat trend</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart 1: Load + Fitness + Fatigue */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
                Total Load & CTL/ATL Mingguan
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="loadBarGradientAthlete" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(45, 93%, 58%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis 
                      dataKey="weekLabel" 
                      tick={{ fontSize: 10 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 9 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={35}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 9 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
                      iconSize={8}
                    />
                    
                    {/* Total Load Bars */}
                    <Bar
                      yAxisId="left"
                      dataKey="totalLoad"
                      name="Total Load"
                      fill="url(#loadBarGradientAthlete)"
                      radius={[3, 3, 0, 0]}
                    />
                    
                    {/* Fitness Line */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgFitness"
                      name="Fitness (CTL)"
                      stroke="hsl(187, 85%, 53%)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: 'hsl(187, 85%, 53%)' }}
                    />
                    
                    {/* Fatigue Line */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgFatigue"
                      name="Fatigue (ATL)"
                      stroke="hsl(270, 70%, 60%)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: 'hsl(270, 70%, 60%)' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Form (TSB) with zones */}
            <div className="border-t border-border/50 pt-3">
              <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
                Form (TSB) Mingguan
              </div>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    {/* Background Zones */}
                    <ReferenceArea y1={20} y2={yMaxForm} fill="hsl(45, 93%, 77%)" fillOpacity={0.4} />
                    <ReferenceArea y1={5} y2={20} fill="hsl(210, 79%, 85%)" fillOpacity={0.4} />
                    <ReferenceArea y1={-10} y2={5} fill="hsl(0, 0%, 85%)" fillOpacity={0.4} />
                    <ReferenceArea y1={-30} y2={-10} fill="hsl(142, 76%, 80%)" fillOpacity={0.4} />
                    <ReferenceArea y1={yMinForm} y2={-30} fill="hsl(0, 84%, 85%)" fillOpacity={0.4} />
                    
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
                    <XAxis 
                      dataKey="weekLabel" 
                      tick={{ fontSize: 10 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      domain={[yMinForm, yMaxForm]}
                      tick={{ fontSize: 9 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={35}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference lines */}
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
                    
                    {/* Form Line */}
                    <Line
                      type="monotone"
                      dataKey="avgForm"
                      name="Form (TSB)"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'hsl(38, 92%, 50%)', strokeWidth: 2, stroke: 'white' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Zone Legend */}
              <div className="flex flex-wrap justify-center gap-2 text-[9px] mt-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-300" />
                  <span>High Risk</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-300" />
                  <span>Optimal</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  <span>Grey</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-300" />
                  <span>Fresh</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-200" />
                  <span>Transition</span>
                </div>
              </div>
            </div>

            {/* Week-over-Week Comparison */}
            {currentWeek && previousWeek && (
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground">Load</p>
                  <p className="text-sm font-bold">{currentWeek.totalLoad}</p>
                  <p className={cn(
                    "text-[10px]",
                    currentWeek.totalLoad > previousWeek.totalLoad ? "text-green-600" : "text-red-600"
                  )}>
                    {currentWeek.totalLoad > previousWeek.totalLoad ? '+' : ''}
                    {currentWeek.totalLoad - previousWeek.totalLoad}
                  </p>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground">Fitness</p>
                  <p className="text-sm font-bold text-cyan-600">{currentWeek.avgFitness}</p>
                  <p className={cn(
                    "text-[10px]",
                    currentWeek.avgFitness > previousWeek.avgFitness ? "text-green-600" : "text-red-600"
                  )}>
                    {currentWeek.avgFitness > previousWeek.avgFitness ? '+' : ''}
                    {currentWeek.avgFitness - previousWeek.avgFitness}
                  </p>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground">Fatigue</p>
                  <p className="text-sm font-bold text-purple-600">{currentWeek.avgFatigue}</p>
                  <p className={cn(
                    "text-[10px]",
                    currentWeek.avgFatigue < previousWeek.avgFatigue ? "text-green-600" : "text-yellow-600"
                  )}>
                    {currentWeek.avgFatigue > previousWeek.avgFatigue ? '+' : ''}
                    {currentWeek.avgFatigue - previousWeek.avgFatigue}
                  </p>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground">Form</p>
                  <p className="text-sm font-bold text-amber-600">{currentWeek.avgForm}</p>
                  <p className={cn(
                    "text-[10px]",
                    currentWeek.avgForm > previousWeek.avgForm ? "text-blue-600" : "text-amber-600"
                  )}>
                    {currentWeek.avgForm > previousWeek.avgForm ? '+' : ''}
                    {currentWeek.avgForm - previousWeek.avgForm}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
