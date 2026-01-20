import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Users, TrendingUp, Activity, RefreshCw, Loader2 } from 'lucide-react';
import { format, subDays, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAthletes, Athlete } from '@/hooks/useAthletes';
import { useAuth } from '@/hooks/useAuth';
import { PremiumBadge } from './PremiumBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AthleteLoadData {
  athleteId: string;
  athleteName: string;
  color: string;
  dailyLoads: { date: string; load: number }[];
  weeklyLoads: { week: string; load: number }[];
  totalLoad: number;
  avgLoad: number;
  sessionsCount: number;
}

const ATHLETE_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)', // Green
  'hsl(48, 96%, 53%)',  // Yellow
  'hsl(0, 84%, 60%)',   // Red
  'hsl(262, 83%, 58%)', // Purple
  'hsl(199, 89%, 48%)', // Blue
  'hsl(25, 95%, 53%)',  // Orange
  'hsl(173, 80%, 40%)', // Teal
];

// RPE to TSS mapping for 60-minute session
const RPE_LOAD_MAP: Record<number, number> = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140
};

const calculateTSS = (rpe: number, duration: number): number => {
  const baseLoad = RPE_LOAD_MAP[rpe] || rpe * 10;
  return Math.round(baseLoad * (duration / 60));
};

export function MultiAthleteComparison() {
  const { user } = useAuth();
  const { athletes, loading: athletesLoading } = useAthletes();
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [athleteData, setAthleteData] = useState<AthleteLoadData[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewDays, setViewDays] = useState(28);
  const [chartType, setChartType] = useState<'daily' | 'weekly'>('weekly');

  // Toggle athlete selection
  const toggleAthlete = (athleteId: string) => {
    setSelectedAthleteIds(prev => 
      prev.includes(athleteId) 
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId].slice(0, 8) // Max 8 athletes
    );
  };

  // Fetch load data for selected athletes
  const fetchAthleteData = async () => {
    if (selectedAthleteIds.length === 0 || !user) return;

    setLoading(true);
    try {
      const startDate = format(subDays(new Date(), viewDays), 'yyyy-MM-dd');
      
      const dataPromises = selectedAthleteIds.map(async (athleteId, index) => {
        const athlete = athletes.find(a => a.id === athleteId);
        if (!athlete) return null;

        const { data: loads } = await supabase
          .from('training_loads')
          .select('*')
          .eq('athlete_id', athleteId)
          .gte('session_date', startDate)
          .order('session_date', { ascending: true });

        const loadData = loads || [];
        
        // Calculate daily loads
        const dailyMap = new Map<string, number>();
        loadData.forEach(l => {
          const date = l.session_date;
          const load = l.session_load || calculateTSS(l.rpe, l.duration_minutes);
          dailyMap.set(date, (dailyMap.get(date) || 0) + load);
        });

        // Fill in missing dates with 0
        const dailyLoads: { date: string; load: number }[] = [];
        for (let i = viewDays; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          dailyLoads.push({
            date,
            load: dailyMap.get(date) || 0
          });
        }

        // Calculate weekly loads
        const weeklyMap = new Map<string, number>();
        dailyLoads.forEach(d => {
          const weekStart = startOfWeek(parseISO(d.date), { weekStartsOn: 1 });
          const weekLabel = format(weekStart, 'd MMM', { locale: idLocale });
          weeklyMap.set(weekLabel, (weeklyMap.get(weekLabel) || 0) + d.load);
        });

        const weeklyLoads = Array.from(weeklyMap.entries()).map(([week, load]) => ({
          week,
          load: Math.round(load)
        }));

        const totalLoad = dailyLoads.reduce((sum, d) => sum + d.load, 0);

        return {
          athleteId,
          athleteName: athlete.name,
          color: ATHLETE_COLORS[index % ATHLETE_COLORS.length],
          dailyLoads,
          weeklyLoads,
          totalLoad,
          avgLoad: Math.round(totalLoad / viewDays),
          sessionsCount: loadData.length
        };
      });

      const results = await Promise.all(dataPromises);
      setAthleteData(results.filter(Boolean) as AthleteLoadData[]);
    } catch (error) {
      console.error('Error fetching athlete data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthleteData();
  }, [selectedAthleteIds, viewDays]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (athleteData.length === 0) return [];

    if (chartType === 'daily') {
      // Merge all daily data
      const dateMap = new Map<string, Record<string, string | number>>();
      
      athleteData.forEach(ad => {
        ad.dailyLoads.forEach(dl => {
          if (!dateMap.has(dl.date)) {
            dateMap.set(dl.date, { date: dl.date });
          }
          const entry = dateMap.get(dl.date)!;
          entry[ad.athleteName] = dl.load;
        });
      });

      return Array.from(dateMap.values()).sort((a, b) => 
        (a.date as string).localeCompare(b.date as string)
      );
    } else {
      // Get all unique weeks
      const allWeeks = new Set<string>();
      athleteData.forEach(ad => {
        ad.weeklyLoads.forEach(wl => allWeeks.add(wl.week));
      });

      const sortedWeeks = Array.from(allWeeks);
      
      return sortedWeeks.map(week => {
        const entry: Record<string, string | number> = { week };
        athleteData.forEach(ad => {
          const weekData = ad.weeklyLoads.find(wl => wl.week === week);
          entry[ad.athleteName] = weekData?.load || 0;
        });
        return entry;
      });
    }
  }, [athleteData, chartType]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (athleteData.length === 0) return null;

    const sorted = [...athleteData].sort((a, b) => b.totalLoad - a.totalLoad);
    return {
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
      avgTeamLoad: Math.round(athleteData.reduce((sum, a) => sum + a.totalLoad, 0) / athleteData.length)
    };
  }, [athleteData]);

  if (athletesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <PremiumBadge size="sm" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Perbandingan Load Multi-Atlet
        </CardTitle>
        <CardDescription>
          Bandingkan beban latihan beberapa atlet dalam satu grafik untuk analisis tim
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Athlete Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Pilih Atlet (maks. 8)</p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAthleteData}
                disabled={loading || selectedAthleteIds.length === 0}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
            {athletes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada atlet terdaftar</p>
            ) : (
              athletes.map(athlete => (
                <label
                  key={athlete.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                    selectedAthleteIds.includes(athlete.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border hover:bg-muted'
                  }`}
                >
                  <Checkbox
                    checked={selectedAthleteIds.includes(athlete.id)}
                    onCheckedChange={() => toggleAthlete(athlete.id)}
                    className="hidden"
                  />
                  <span className="text-sm">{athlete.name}</span>
                  {athlete.sport && (
                    <Badge variant="secondary" className="text-xs">
                      {athlete.sport}
                    </Badge>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {selectedAthleteIds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Pilih minimal 2 atlet untuk membandingkan beban latihan mereka</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Period & Chart Type Selector */}
            <div className="flex items-center justify-between">
              <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'daily' | 'weekly')}>
                <TabsList>
                  <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                  <TabsTrigger value="daily">Harian</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                {[14, 28, 60].map(days => (
                  <Button
                    key={days}
                    variant={viewDays === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewDays(days)}
                  >
                    {days} Hari
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            {summaryStats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center border border-green-200 dark:border-green-900">
                  <p className="text-xs text-green-600 dark:text-green-400 uppercase font-medium">Tertinggi</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{summaryStats.highest.athleteName}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{summaryStats.highest.totalLoad} AU</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-900">
                  <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-medium">Rata-rata Tim</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{summaryStats.avgTeamLoad} AU</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total {viewDays} hari</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-900">
                  <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-medium">Terendah</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{summaryStats.lowest.athleteName}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">{summaryStats.lowest.totalLoad} AU</p>
                </div>
              </div>
            )}

            {/* Main Comparison Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'weekly' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fontSize: 11 }} 
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }} 
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value} AU`, '']}
                    />
                    <Legend />
                    {athleteData.map(ad => (
                      <Bar 
                        key={ad.athleteId}
                        dataKey={ad.athleteName} 
                        fill={ad.color}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      className="text-muted-foreground"
                      tickFormatter={(value) => format(parseISO(value), 'd/M')}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }} 
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => format(parseISO(value as string), 'dd MMM yyyy', { locale: idLocale })}
                      formatter={(value: number) => [`${value} AU`, '']}
                    />
                    <Legend />
                    {athleteData.map(ad => (
                      <Line 
                        key={ad.athleteId}
                        type="monotone"
                        dataKey={ad.athleteName} 
                        stroke={ad.color}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Individual Stats Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Atlet</th>
                    <th className="text-center py-2 px-3 font-medium">Sesi</th>
                    <th className="text-center py-2 px-3 font-medium">Total Load</th>
                    <th className="text-center py-2 px-3 font-medium">Rata-rata/Hari</th>
                    <th className="text-center py-2 px-3 font-medium">vs Tim</th>
                  </tr>
                </thead>
                <tbody>
                  {athleteData.map(ad => {
                    const vsTeam = summaryStats ? Math.round(((ad.totalLoad - summaryStats.avgTeamLoad) / summaryStats.avgTeamLoad) * 100) : 0;
                    return (
                      <tr key={ad.athleteId} className="border-b last:border-0">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ad.color }} />
                            <span className="font-medium">{ad.athleteName}</span>
                          </div>
                        </td>
                        <td className="text-center py-2 px-3">{ad.sessionsCount}</td>
                        <td className="text-center py-2 px-3 font-medium">{ad.totalLoad} AU</td>
                        <td className="text-center py-2 px-3">{ad.avgLoad} AU</td>
                        <td className={`text-center py-2 px-3 font-medium ${
                          vsTeam > 0 ? 'text-green-600 dark:text-green-400' : 
                          vsTeam < 0 ? 'text-red-600 dark:text-red-400' : 
                          'text-muted-foreground'
                        }`}>
                          {vsTeam > 0 ? '+' : ''}{vsTeam}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              {athleteData.map(ad => (
                <div key={ad.athleteId} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: ad.color }} />
                  <span className="text-muted-foreground">{ad.athleteName}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
