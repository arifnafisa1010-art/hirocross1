import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, HeartPulse, Activity, Plus, ArrowLeft, TrendingUp, TrendingDown, Minus, Diamond, Loader2 } from 'lucide-react';
import { useReadiness } from '@/hooks/useReadiness';
import { useAthletes } from '@/hooks/useAthletes';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PremiumBadge } from '@/components/PremiumBadge';
import { PremiumPricingPackages } from '@/components/PremiumPricingPackages';
import { ReadinessChart } from '@/components/readiness/ReadinessChart';
import { ReadinessForm } from '@/components/readiness/ReadinessForm';
import { ReadinessScoreSummary } from '@/components/readiness/ReadinessScoreSummary';
import { ReadinessZoneInfo } from '@/components/readiness/ReadinessZoneInfo';
import { getReadinessInfo } from '@/components/readiness/readinessUtils';

export default function Readiness() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPremium, loading: premiumLoading } = usePremiumAccess();
  const { athletes } = useAthletes();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const { entries, loading, addEntry, deleteEntry } = useReadiness(selectedAthleteId || undefined);

  const [formOpen, setFormOpen] = useState(false);

  // Calculate VJ baseline from last 5 entries average for selected athlete
  const autoVjBaseline = useMemo(() => {
    if (entries.length === 0) return '';
    const last5 = entries.slice(0, 5);
    const avg = last5.reduce((sum, e) => sum + Number(e.vj_today), 0) / last5.length;
    return avg.toFixed(1);
  }, [entries]);

  // Get HR baseline from athlete profile
  const autoHrBaseline = useMemo(() => {
    if (!selectedAthleteId) return '';
    const athlete = athletes.find(a => a.id === selectedAthleteId);
    return athlete?.resting_hr ? String(athlete.resting_hr) : '';
  }, [selectedAthleteId, athletes]);

  const chartData = [...entries]
    .reverse()
    .map(e => ({
      date: format(new Date(e.check_date), 'dd/MM'),
      score: e.readiness_score ? Number(Number(e.readiness_score).toFixed(2)) : 0,
    }));

  const latestScore = entries[0]?.readiness_score ? Number(entries[0].readiness_score) : null;
  const prevScore = entries[1]?.readiness_score ? Number(entries[1].readiness_score) : null;

  if (authLoading || premiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Premium gate
  if (!hasPremium) {
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <HeartPulse className="h-6 w-6 text-primary" />
                    Readiness Check
                    <PremiumBadge size="sm" />
                  </h1>
                  <p className="text-sm text-muted-foreground">Akses premium diperlukan</p>
                </div>
              </div>

              <Card className="relative overflow-hidden border-amber-300">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-yellow-400/10 pointer-events-none" />
                <CardHeader className="text-center">
                  <Diamond className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                  <CardTitle className="text-xl">Fitur Premium Readiness Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                      <HeartPulse className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="font-medium">Readiness Monitoring</p>
                        <p className="text-xs text-muted-foreground">Pantau kesiapan atlet harian</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                      <Activity className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium">Trend Analysis</p>
                        <p className="text-xs text-muted-foreground">Deteksi fatigue kronis</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <PremiumPricingPackages />

              <div className="text-center">
                <Button variant="ghost" onClick={() => navigate('/app')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Aplikasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <HeartPulse className="h-6 w-6 text-primary" />
                  Readiness Check
                  <PremiumBadge size="sm" />
                </h1>
                <p className="text-sm text-muted-foreground">Monitor kesiapan atlet dengan Vertical Jump & Heart Rate</p>
              </div>
            </div>

            {/* Athlete Selector */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Label className="whitespace-nowrap font-medium">Pilih Atlet:</Label>
                  <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Semua atlet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua atlet</SelectItem>
                      {athletes.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Score Summary */}
            {latestScore !== null && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReadinessScoreSummary latestScore={latestScore} prevScore={prevScore} />
                <ReadinessZoneInfo />
              </div>
            )}

            {/* Trend Chart */}
            {chartData.length > 1 && <ReadinessChart chartData={chartData} />}

            {/* Add Entry Button / Form */}
            {!formOpen ? (
              <Button onClick={() => setFormOpen(true)} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Tambah Data Readiness
              </Button>
            ) : (
              <ReadinessForm
                athletes={athletes}
                selectedAthleteId={selectedAthleteId}
                onSelectAthlete={setSelectedAthleteId}
                autoVjBaseline={autoVjBaseline}
                autoHrBaseline={autoHrBaseline}
                onSubmit={async (data) => {
                  await addEntry(data);
                  setFormOpen(false);
                }}
                onCancel={() => setFormOpen(false)}
              />
            )}

            {/* History Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Riwayat Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Memuat...</p>
                ) : entries.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Belum ada data readiness</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>VJ Today</TableHead>
                          <TableHead>VJ Baseline</TableHead>
                          <TableHead>HR Today</TableHead>
                          <TableHead>HR Baseline</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map(entry => {
                          const score = entry.readiness_score ? Number(entry.readiness_score) : 0;
                          const info = getReadinessInfo(score);
                          return (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                {format(new Date(entry.check_date), 'dd MMM yyyy', { locale: localeId })}
                              </TableCell>
                              <TableCell>{entry.vj_today} cm</TableCell>
                              <TableCell>{entry.vj_baseline} cm</TableCell>
                              <TableCell>{entry.hr_today} bpm</TableCell>
                              <TableCell>{entry.hr_baseline} bpm</TableCell>
                              <TableCell className="font-bold">{score.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={`${info.color} text-white text-xs`}>{info.label}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
