import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, GitCompare, Trash2, Calendar, Users, TrendingUp, TrendingDown, Minus, Loader2, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAthletes, Athlete } from '@/hooks/useAthletes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PremiumBadge } from './PremiumBadge';

interface TeamSnapshot {
  id: string;
  name: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  athletes: AthleteSnapshotData[];
  summary: {
    totalLoad: number;
    avgLoad: number;
    athleteCount: number;
    avgACWR: number;
  };
}

interface AthleteSnapshotData {
  athleteId: string;
  athleteName: string;
  totalLoad: number;
  avgLoad: number;
  sessionsCount: number;
  acwr: number;
}

const TRAINING_TYPES = ['strength', 'conditioning', 'technical', 'tactical', 'recovery'];

const RPE_LOAD_MAP: Record<number, number> = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140
};

const calculateTSS = (rpe: number, duration: number): number => {
  const baseLoad = RPE_LOAD_MAP[rpe] || rpe * 10;
  return Math.round(baseLoad * (duration / 60));
};

export function TeamSnapshotComparison() {
  const { user } = useAuth();
  const { athletes, loading: athletesLoading } = useAthletes();
  const [snapshots, setSnapshots] = useState<TeamSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [periodStart, setPeriodStart] = useState(format(subDays(new Date(), 28), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [snapshot1Id, setSnapshot1Id] = useState<string>('');
  const [snapshot2Id, setSnapshot2Id] = useState<string>('');

  // Load snapshots from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`team-snapshots-${user?.id}`);
    if (saved) {
      try {
        setSnapshots(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing snapshots:', e);
      }
    }
  }, [user?.id]);

  // Save snapshots to localStorage
  const saveSnapshots = (newSnapshots: TeamSnapshot[]) => {
    setSnapshots(newSnapshots);
    localStorage.setItem(`team-snapshots-${user?.id}`, JSON.stringify(newSnapshots));
  };

  // Create new snapshot
  const createSnapshot = async () => {
    if (!snapshotName || athletes.length === 0) {
      toast.error('Masukkan nama snapshot dan pastikan ada atlet terdaftar');
      return;
    }

    setSaving(true);
    try {
      const athleteData: AthleteSnapshotData[] = [];
      
      for (const athlete of athletes) {
        const { data: loads } = await supabase
          .from('training_loads')
          .select('*')
          .eq('athlete_id', athlete.id)
          .gte('session_date', periodStart)
          .lte('session_date', periodEnd);

        const loadData = loads || [];
        const totalLoad = loadData.reduce((sum, l) => 
          sum + (l.session_load || calculateTSS(l.rpe, l.duration_minutes)), 0);
        
        // Calculate ACWR (simplified)
        const days = Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24));
        const avgDailyLoad = days > 0 ? totalLoad / days : 0;
        
        athleteData.push({
          athleteId: athlete.id,
          athleteName: athlete.name,
          totalLoad,
          avgLoad: Math.round(avgDailyLoad),
          sessionsCount: loadData.length,
          acwr: Math.round(avgDailyLoad * 10) / 10, // Simplified
        });
      }

      const newSnapshot: TeamSnapshot = {
        id: crypto.randomUUID(),
        name: snapshotName,
        createdAt: new Date().toISOString(),
        periodStart,
        periodEnd,
        athletes: athleteData,
        summary: {
          totalLoad: athleteData.reduce((sum, a) => sum + a.totalLoad, 0),
          avgLoad: Math.round(athleteData.reduce((sum, a) => sum + a.avgLoad, 0) / athleteData.length),
          athleteCount: athleteData.length,
          avgACWR: Math.round(athleteData.reduce((sum, a) => sum + a.acwr, 0) / athleteData.length * 10) / 10,
        }
      };

      saveSnapshots([newSnapshot, ...snapshots].slice(0, 10)); // Keep max 10 snapshots
      setCreateDialogOpen(false);
      setSnapshotName('');
      toast.success('Snapshot tim berhasil disimpan!');
    } catch (error) {
      console.error('Error creating snapshot:', error);
      toast.error('Gagal membuat snapshot');
    } finally {
      setSaving(false);
    }
  };

  // Delete snapshot
  const deleteSnapshot = (id: string) => {
    saveSnapshots(snapshots.filter(s => s.id !== id));
    if (snapshot1Id === id) setSnapshot1Id('');
    if (snapshot2Id === id) setSnapshot2Id('');
    toast.success('Snapshot dihapus');
  };

  // Get selected snapshots for comparison
  const selectedSnapshot1 = snapshots.find(s => s.id === snapshot1Id);
  const selectedSnapshot2 = snapshots.find(s => s.id === snapshot2Id);

  // Comparison data
  const comparisonData = useMemo(() => {
    if (!selectedSnapshot1 || !selectedSnapshot2) return null;

    const athleteComparison: {
      name: string;
      load1: number;
      load2: number;
      change: number;
      changePercent: number;
    }[] = [];

    // Match athletes between snapshots
    selectedSnapshot1.athletes.forEach(a1 => {
      const a2 = selectedSnapshot2.athletes.find(a => a.athleteId === a1.athleteId);
      if (a2) {
        const change = a2.totalLoad - a1.totalLoad;
        const changePercent = a1.totalLoad > 0 ? Math.round((change / a1.totalLoad) * 100) : 0;
        athleteComparison.push({
          name: a1.athleteName,
          load1: a1.totalLoad,
          load2: a2.totalLoad,
          change,
          changePercent
        });
      }
    });

    return {
      athletes: athleteComparison,
      summary: {
        totalLoadChange: selectedSnapshot2.summary.totalLoad - selectedSnapshot1.summary.totalLoad,
        avgLoadChange: selectedSnapshot2.summary.avgLoad - selectedSnapshot1.summary.avgLoad,
      }
    };
  }, [selectedSnapshot1, selectedSnapshot2]);

  // Chart data for comparison
  const barChartData = useMemo(() => {
    if (!comparisonData) return [];
    return comparisonData.athletes.map(a => ({
      name: a.name.split(' ')[0], // First name only for chart
      [selectedSnapshot1?.name || 'Periode 1']: a.load1,
      [selectedSnapshot2?.name || 'Periode 2']: a.load2,
    }));
  }, [comparisonData, selectedSnapshot1, selectedSnapshot2]);

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
          <Camera className="w-5 h-5 text-primary" />
          Snapshot Performa Tim
        </CardTitle>
        <CardDescription>
          Simpan dan bandingkan snapshot performa tim dari periode berbeda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Snapshot Button */}
        <div className="flex items-center justify-between">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Save className="w-4 h-4" />
                Buat Snapshot Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Snapshot Performa Tim</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nama Snapshot</Label>
                  <Input
                    value={snapshotName}
                    onChange={(e) => setSnapshotName(e.target.value)}
                    placeholder="Contoh: Minggu 1 Januari"
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Periode Mulai</Label>
                    <Input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Periode Akhir</Label>
                    <Input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Users className="w-4 h-4 inline mr-1" />
                    {athletes.length} atlet akan disimpan dalam snapshot
                  </p>
                </div>
                <Button onClick={createSnapshot} className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Snapshot
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <p className="text-sm text-muted-foreground">
            {snapshots.length} snapshot tersimpan
          </p>
        </div>

        {/* Saved Snapshots List */}
        {snapshots.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Snapshot Tersimpan</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
              {snapshots.map(snapshot => (
                <div 
                  key={snapshot.id}
                  className="p-3 bg-muted/50 rounded-lg border space-y-2 group hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{snapshot.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteSnapshot(snapshot.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(snapshot.periodStart), 'd MMM', { locale: idLocale })} - 
                    {format(new Date(snapshot.periodEnd), 'd MMM yyyy', { locale: idLocale })}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {snapshot.summary.athleteCount} atlet
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {snapshot.summary.totalLoad} AU
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Selector */}
        {snapshots.length >= 2 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              <Label className="text-base font-medium">Bandingkan Snapshot</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Snapshot 1 (Baseline)</Label>
                <Select value={snapshot1Id} onValueChange={setSnapshot1Id}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Pilih snapshot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshots.filter(s => s.id !== snapshot2Id).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Snapshot 2 (Perbandingan)</Label>
                <Select value={snapshot2Id} onValueChange={setSnapshot2Id}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Pilih snapshot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshots.filter(s => s.id !== snapshot1Id).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {comparisonData && selectedSnapshot1 && selectedSnapshot2 && (
          <div className="space-y-4 pt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border text-center ${
                comparisonData.summary.totalLoadChange > 0 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                  : comparisonData.summary.totalLoadChange < 0
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                  : 'bg-muted/50'
              }`}>
                <p className="text-xs text-muted-foreground uppercase">Perubahan Total Load</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {comparisonData.summary.totalLoadChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : comparisonData.summary.totalLoadChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-xl font-bold ${
                    comparisonData.summary.totalLoadChange > 0 ? 'text-green-600' :
                    comparisonData.summary.totalLoadChange < 0 ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                    {comparisonData.summary.totalLoadChange > 0 ? '+' : ''}
                    {comparisonData.summary.totalLoadChange} AU
                  </span>
                </div>
              </div>
              <div className={`p-4 rounded-lg border text-center ${
                comparisonData.summary.avgLoadChange > 0 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                  : comparisonData.summary.avgLoadChange < 0
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                  : 'bg-muted/50'
              }`}>
                <p className="text-xs text-muted-foreground uppercase">Perubahan Rata-rata</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {comparisonData.summary.avgLoadChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : comparisonData.summary.avgLoadChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-xl font-bold ${
                    comparisonData.summary.avgLoadChange > 0 ? 'text-green-600' :
                    comparisonData.summary.avgLoadChange < 0 ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                    {comparisonData.summary.avgLoadChange > 0 ? '+' : ''}
                    {comparisonData.summary.avgLoadChange} AU/hari
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} AU`, '']}
                  />
                  <Legend />
                  <Bar dataKey={selectedSnapshot1.name} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={selectedSnapshot2.name} fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Individual Athlete Changes */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Atlet</th>
                    <th className="text-center py-2 px-3 font-medium">{selectedSnapshot1.name}</th>
                    <th className="text-center py-2 px-3 font-medium">{selectedSnapshot2.name}</th>
                    <th className="text-center py-2 px-3 font-medium">Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.athletes.map(athlete => (
                    <tr key={athlete.name} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium">{athlete.name}</td>
                      <td className="text-center py-2 px-3">{athlete.load1} AU</td>
                      <td className="text-center py-2 px-3">{athlete.load2} AU</td>
                      <td className={`text-center py-2 px-3 font-medium ${
                        athlete.change > 0 ? 'text-green-600' :
                        athlete.change < 0 ? 'text-red-600' :
                        'text-muted-foreground'
                      }`}>
                        {athlete.change > 0 ? '+' : ''}{athlete.change} AU
                        <span className="text-xs ml-1">({athlete.changePercent > 0 ? '+' : ''}{athlete.changePercent}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {snapshots.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada snapshot tersimpan</p>
            <p className="text-sm">Buat snapshot untuk menyimpan kondisi performa tim saat ini</p>
          </div>
        )}

        {snapshots.length === 1 && (
          <div className="text-center py-4 text-muted-foreground bg-muted/30 rounded-lg">
            <p className="text-sm">Buat minimal 2 snapshot untuk membandingkan performa tim</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}