import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
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

  // Animation effect
  useEffect(() => {
    if (dailyMetrics.length === 0) {
      setAnimatedData([]);
      return;
    }

    // Animate data points appearing
    setAnimatedData([]);
    const timer = setTimeout(() => {
      setAnimatedData(dailyMetrics);
    }, 100);

    return () => clearTimeout(timer);
  }, [dailyMetrics]);

  // Get last 28 days for display
  const displayData = animatedData.slice(-28).map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), 'dd/MM', { locale: idLocale }),
    fullDate: format(parseISO(d.date), 'dd MMMM yyyy', { locale: idLocale }),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.fullDate}</p>
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

  if (dailyMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trend Performa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada data untuk ditampilkan</p>
            <p className="text-sm mt-1">Input data training load untuk melihat tren</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trend Performa (28 Hari Terakhir)
        </CardTitle>
        <CardDescription>
          Monitoring Fitness, Fatigue, dan Form dari waktu ke waktu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fitness-fatigue">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="fitness-fatigue">Fitness & Fatigue</TabsTrigger>
            <TabsTrigger value="form">Form (TSB)</TabsTrigger>
            <TabsTrigger value="load">Training Load</TabsTrigger>
          </TabsList>

          {/* Fitness & Fatigue Chart */}
          <TabsContent value="fitness-fatigue">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                  <defs>
                    <linearGradient id="fitnessGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fatigueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="fitness"
                    name="Fitness (CTL)"
                    stroke="hsl(142, 76%, 36%)"
                    fill="url(#fitnessGradient)"
                    strokeWidth={2}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="fatigue"
                    name="Fatigue (ATL)"
                    stroke="hsl(0, 84%, 60%)"
                    fill="url(#fatigueGradient)"
                    strokeWidth={2}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p><strong>CTL (Chronic Training Load)</strong> = Fitness - rata-rata beban 42 hari</p>
              <p><strong>ATL (Acute Training Load)</strong> = Fatigue - rata-rata beban 7 hari</p>
            </div>
          </TabsContent>

          {/* Form Chart */}
          <TabsContent value="form">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                  <defs>
                    <linearGradient id="formPositiveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                  <Area
                    type="monotone"
                    dataKey="form"
                    name="Form (TSB)"
                    stroke="hsl(45, 93%, 47%)"
                    fill="url(#formPositiveGradient)"
                    strokeWidth={2}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <span className="font-medium text-red-600 dark:text-red-400">&lt; -15</span>
                <p className="text-muted-foreground">Kelelahan</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="font-medium text-green-600 dark:text-green-400">-10 to +10</span>
                <p className="text-muted-foreground">Optimal</p>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <span className="font-medium text-amber-600 dark:text-amber-400">&gt; +15</span>
                <p className="text-muted-foreground">Perlu Latihan</p>
              </div>
            </div>
          </TabsContent>

          {/* Load Chart */}
          <TabsContent value="load">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="load"
                    name="Training Load"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p><strong>Training Load</strong> = Durasi (menit) × RPE</p>
              <p>Satuan: AU (Arbitrary Units)</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
