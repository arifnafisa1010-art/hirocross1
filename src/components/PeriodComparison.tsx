import { useState, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowRight, BarChart3, GitCompare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface PeriodComparisonProps {
  dailyMetrics: DailyMetric[];
}

type PeriodType = 'this-month' | 'last-month' | 'last-7-days' | 'last-14-days' | 'last-28-days';

interface PeriodStats {
  avgFitness: number;
  avgFatigue: number;
  avgForm: number;
  totalLoad: number;
  sessions: number;
  maxLoad: number;
}

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'this-month', label: 'Bulan Ini' },
  { value: 'last-month', label: 'Bulan Lalu' },
  { value: 'last-7-days', label: '7 Hari Terakhir' },
  { value: 'last-14-days', label: '14 Hari Terakhir' },
  { value: 'last-28-days', label: '28 Hari Terakhir' },
];

function getPeriodDates(period: PeriodType): { start: Date; end: Date } {
  const today = new Date();
  
  switch (period) {
    case 'this-month':
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    case 'last-month':
      const lastMonth = subMonths(today, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    case 'last-7-days':
      return {
        start: subDays(today, 6),
        end: today,
      };
    case 'last-14-days':
      return {
        start: subDays(today, 13),
        end: today,
      };
    case 'last-28-days':
      return {
        start: subDays(today, 27),
        end: today,
      };
    default:
      return {
        start: startOfMonth(today),
        end: today,
      };
  }
}

function filterMetricsByPeriod(metrics: DailyMetric[], start: Date, end: Date): DailyMetric[] {
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');
  
  return metrics.filter(m => m.date >= startStr && m.date <= endStr);
}

function calculatePeriodStats(metrics: DailyMetric[]): PeriodStats {
  if (metrics.length === 0) {
    return {
      avgFitness: 0,
      avgFatigue: 0,
      avgForm: 0,
      totalLoad: 0,
      sessions: 0,
      maxLoad: 0,
    };
  }

  const sessionsWithLoad = metrics.filter(m => m.load > 0);
  
  return {
    avgFitness: Math.round(metrics.reduce((sum, m) => sum + m.fitness, 0) / metrics.length),
    avgFatigue: Math.round(metrics.reduce((sum, m) => sum + m.fatigue, 0) / metrics.length),
    avgForm: Math.round(metrics.reduce((sum, m) => sum + m.form, 0) / metrics.length),
    totalLoad: metrics.reduce((sum, m) => sum + m.load, 0),
    sessions: sessionsWithLoad.length,
    maxLoad: Math.max(...metrics.map(m => m.load), 0),
  };
}

function getChangeIndicator(current: number, previous: number) {
  const diff = current - previous;
  const percentage = previous !== 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;
  
  if (diff > 0) {
    return { icon: TrendingUp, color: 'text-green-500', text: `+${percentage}%` };
  } else if (diff < 0) {
    return { icon: TrendingDown, color: 'text-red-500', text: `${percentage}%` };
  }
  return { icon: Minus, color: 'text-muted-foreground', text: '0%' };
}

export function PeriodComparison({ dailyMetrics }: PeriodComparisonProps) {
  const [period1, setPeriod1] = useState<PeriodType>('this-month');
  const [period2, setPeriod2] = useState<PeriodType>('last-month');

  const { stats1, stats2, period1Label, period2Label } = useMemo(() => {
    const dates1 = getPeriodDates(period1);
    const dates2 = getPeriodDates(period2);
    
    const metrics1 = filterMetricsByPeriod(dailyMetrics, dates1.start, dates1.end);
    const metrics2 = filterMetricsByPeriod(dailyMetrics, dates2.start, dates2.end);
    
    return {
      stats1: calculatePeriodStats(metrics1),
      stats2: calculatePeriodStats(metrics2),
      period1Label: format(dates1.start, 'dd MMM', { locale: idLocale }) + ' - ' + format(dates1.end, 'dd MMM', { locale: idLocale }),
      period2Label: format(dates2.start, 'dd MMM', { locale: idLocale }) + ' - ' + format(dates2.end, 'dd MMM', { locale: idLocale }),
    };
  }, [dailyMetrics, period1, period2]);

  const comparisonData = useMemo(() => [
    {
      name: 'Fitness',
      period1: stats1.avgFitness,
      period2: stats2.avgFitness,
      period1Label: PERIOD_OPTIONS.find(p => p.value === period1)?.label || '',
      period2Label: PERIOD_OPTIONS.find(p => p.value === period2)?.label || '',
    },
    {
      name: 'Fatigue',
      period1: stats1.avgFatigue,
      period2: stats2.avgFatigue,
      period1Label: PERIOD_OPTIONS.find(p => p.value === period1)?.label || '',
      period2Label: PERIOD_OPTIONS.find(p => p.value === period2)?.label || '',
    },
    {
      name: 'Form',
      period1: stats1.avgForm,
      period2: stats2.avgForm,
      period1Label: PERIOD_OPTIONS.find(p => p.value === period1)?.label || '',
      period2Label: PERIOD_OPTIONS.find(p => p.value === period2)?.label || '',
    },
    {
      name: 'Total Load',
      period1: stats1.totalLoad,
      period2: stats2.totalLoad,
      period1Label: PERIOD_OPTIONS.find(p => p.value === period1)?.label || '',
      period2Label: PERIOD_OPTIONS.find(p => p.value === period2)?.label || '',
    },
  ], [stats1, stats2, period1, period2]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const fitnessChange = getChangeIndicator(stats1.avgFitness, stats2.avgFitness);
  const fatigueChange = getChangeIndicator(stats1.avgFatigue, stats2.avgFatigue);
  const formChange = getChangeIndicator(stats1.avgForm, stats2.avgForm);
  const loadChange = getChangeIndicator(stats1.totalLoad, stats2.totalLoad);

  const hasData = dailyMetrics.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Perbandingan Periode
            </CardTitle>
            <CardDescription>
              Bandingkan performa antar periode waktu
            </CardDescription>
          </div>
        </div>
        
        {/* Period Selectors */}
        <div className="flex items-center gap-2 flex-wrap mt-4">
          <Select value={period1} onValueChange={(v) => setPeriod1(v as PeriodType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-muted-foreground">vs</span>
          
          <Select value={period2} onValueChange={(v) => setPeriod2(v as PeriodType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Fitness</p>
                <div className={`flex items-center gap-1 text-xs ${fitnessChange.color}`}>
                  <fitnessChange.icon className="w-3 h-3" />
                  {fitnessChange.text}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">{stats1.avgFitness}</span>
                <span className="text-sm text-muted-foreground">vs {stats2.avgFitness}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Fatigue</p>
                <div className={`flex items-center gap-1 text-xs ${fatigueChange.color}`}>
                  <fatigueChange.icon className="w-3 h-3" />
                  {fatigueChange.text}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">{stats1.avgFatigue}</span>
                <span className="text-sm text-muted-foreground">vs {stats2.avgFatigue}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Form</p>
                <div className={`flex items-center gap-1 text-xs ${formChange.color}`}>
                  <formChange.icon className="w-3 h-3" />
                  {formChange.text}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats1.avgForm}</span>
                <span className="text-sm text-muted-foreground">vs {stats2.avgForm}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Load</p>
                <div className={`flex items-center gap-1 text-xs ${loadChange.color}`}>
                  <loadChange.icon className="w-3 h-3" />
                  {loadChange.text}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats1.totalLoad}</span>
                <span className="text-sm text-muted-foreground">vs {stats2.totalLoad}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="period1" 
                name={PERIOD_OPTIONS.find(p => p.value === period1)?.label || 'Periode 1'} 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
              />
              <Bar 
                dataKey="period2" 
                name={PERIOD_OPTIONS.find(p => p.value === period2)?.label || 'Periode 2'} 
                fill="hsl(var(--muted-foreground))" 
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Period Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">{PERIOD_OPTIONS.find(p => p.value === period1)?.label}</span>
              <span className="text-xs text-muted-foreground">({period1Label})</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Sesi:</span>
                <span className="ml-2 font-medium">{stats1.sessions}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Load Max:</span>
                <span className="ml-2 font-medium">{stats1.maxLoad} AU</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{PERIOD_OPTIONS.find(p => p.value === period2)?.label}</span>
              <span className="text-xs text-muted-foreground">({period2Label})</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Sesi:</span>
                <span className="ml-2 font-medium">{stats2.sessions}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Load Max:</span>
                <span className="ml-2 font-medium">{stats2.maxLoad} AU</span>
              </div>
            </div>
          </div>
        </div>

        {!hasData && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>Grafik menampilkan data baseline. Input data training untuk melihat perbandingan nyata.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
