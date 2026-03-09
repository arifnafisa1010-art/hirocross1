import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, HeartPulse, Activity, Plus, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useReadiness } from '@/hooks/useReadiness';
import { useAthletes } from '@/hooks/useAthletes';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

function getReadinessInfo(score: number) {
  if (score > 2.0) return { label: 'Sangat Siap', color: 'bg-green-500', textColor: 'text-green-700', recommendation: 'Latihan intensitas tinggi', zone: 'supercompensation' };
  if (score >= 1.8) return { label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-700', recommendation: 'Latihan sesuai program', zone: 'normal' };
  if (score >= 1.6) return { label: 'Mulai Fatigue', color: 'bg-amber-500', textColor: 'text-amber-700', recommendation: 'Kurangi intensitas', zone: 'fatigue' };
  return { label: 'Fatigue Tinggi', color: 'bg-red-500', textColor: 'text-red-700', recommendation: 'Recovery / rest', zone: 'danger' };
}

export default function Readiness() {
  const navigate = useNavigate();
  const { athletes } = useAthletes();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const { entries, loading, addEntry, deleteEntry } = useReadiness(selectedAthleteId || undefined);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    check_date: format(new Date(), 'yyyy-MM-dd'),
    vj_today: '',
    vj_baseline: '',
    hr_today: '',
    hr_baseline: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vjToday = parseFloat(form.vj_today);
    const vjBaseline = parseFloat(form.vj_baseline);
    const hrToday = parseInt(form.hr_today);
    const hrBaseline = parseInt(form.hr_baseline);

    if (!vjToday || !vjBaseline || !hrToday || !hrBaseline) {
      return;
    }

    await addEntry({
      athlete_id: selectedAthleteId || null,
      check_date: form.check_date,
      vj_today: vjToday,
      vj_baseline: vjBaseline,
      hr_today: hrToday,
      hr_baseline: hrBaseline,
      notes: form.notes || undefined,
    });

    setForm({ check_date: format(new Date(), 'yyyy-MM-dd'), vj_today: '', vj_baseline: '', hr_today: '', hr_baseline: '', notes: '' });
    setFormOpen(false);
  };

  const chartData = [...entries]
    .reverse()
    .map(e => ({
      date: format(new Date(e.check_date), 'dd/MM'),
      score: e.readiness_score ? Number(Number(e.readiness_score).toFixed(2)) : 0,
    }));

  const latestScore = entries[0]?.readiness_score ? Number(entries[0].readiness_score) : null;
  const prevScore = entries[1]?.readiness_score ? Number(entries[1].readiness_score) : null;

  return (
    <div className="min-h-screen bg-background">
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
            <Card className="md:col-span-1">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Readiness Terakhir</p>
                <p className="text-4xl font-bold">{latestScore.toFixed(2)}</p>
                <Badge className={`mt-2 ${getReadinessInfo(latestScore).color} text-white`}>
                  {getReadinessInfo(latestScore).label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {getReadinessInfo(latestScore).recommendation}
                </p>
                {prevScore !== null && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm">
                    {latestScore > prevScore ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : latestScore < prevScore ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={latestScore > prevScore ? 'text-green-600' : latestScore < prevScore ? 'text-red-600' : 'text-muted-foreground'}>
                      {(latestScore - prevScore).toFixed(2)} vs sebelumnya
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interpretation Card */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Zona Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { min: '> 2.00', label: 'Sangat siap (supercompensation)', rec: 'Latihan intensitas tinggi', color: 'bg-green-100 text-green-800 border-green-200' },
                    { min: '1.80 – 2.00', label: 'Kondisi normal', rec: 'Latihan sesuai program', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                    { min: '1.60 – 1.79', label: 'Mulai fatigue', rec: 'Kurangi intensitas', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                    { min: '< 1.60', label: 'Fatigue tinggi', rec: 'Recovery / rest', color: 'bg-red-100 text-red-800 border-red-200' },
                  ].map(z => (
                    <div key={z.min} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${z.color}`}>
                      <span className="font-mono font-medium">{z.min}</span>
                      <span>{z.label}</span>
                      <span className="text-xs opacity-75">{z.rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trend Chart */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Trend Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[1.2, 2.4]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(val: number) => [val.toFixed(2), 'Readiness']} />
                    <ReferenceArea y1={2.0} y2={2.4} fill="hsl(var(--chart-2))" fillOpacity={0.08} />
                    <ReferenceArea y1={1.8} y2={2.0} fill="hsl(var(--chart-1))" fillOpacity={0.08} />
                    <ReferenceArea y1={1.6} y2={1.8} fill="hsl(var(--chart-4))" fillOpacity={0.08} />
                    <ReferenceArea y1={1.2} y2={1.6} fill="hsl(var(--chart-5))" fillOpacity={0.08} />
                    <ReferenceLine y={2.0} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
                    <ReferenceLine y={1.8} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" />
                    <ReferenceLine y={1.6} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Entry Button / Form */}
        {!formOpen ? (
          <Button onClick={() => setFormOpen(true)} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Tambah Data Readiness
          </Button>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Input Data Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tanggal</Label>
                    <Input type="date" value={form.check_date} onChange={e => setForm(f => ({ ...f, check_date: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Atlet</Label>
                    <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                      <SelectTrigger><SelectValue placeholder="Pilih atlet" /></SelectTrigger>
                      <SelectContent>
                        {athletes.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>VJ Hari Ini (cm)</Label>
                    <Input type="number" step="0.1" placeholder="e.g. 45" value={form.vj_today} onChange={e => setForm(f => ({ ...f, vj_today: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>VJ Baseline (cm)</Label>
                    <Input type="number" step="0.1" placeholder="e.g. 42" value={form.vj_baseline} onChange={e => setForm(f => ({ ...f, vj_baseline: e.target.value }))} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>HR Hari Ini (bpm)</Label>
                    <Input type="number" placeholder="e.g. 68" value={form.hr_today} onChange={e => setForm(f => ({ ...f, hr_today: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>HR Baseline (bpm)</Label>
                    <Input type="number" placeholder="e.g. 60" value={form.hr_baseline} onChange={e => setForm(f => ({ ...f, hr_baseline: e.target.value }))} required />
                  </div>
                </div>

                {/* Live Preview */}
                {form.vj_today && form.vj_baseline && form.hr_today && form.hr_baseline && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">Preview Skor:</p>
                    {(() => {
                      const score = (parseFloat(form.vj_today) / parseFloat(form.vj_baseline)) + (parseInt(form.hr_baseline) / parseInt(form.hr_today));
                      const info = getReadinessInfo(score);
                      return (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-2xl font-bold">{score.toFixed(2)}</span>
                          <Badge className={`${info.color} text-white`}>{info.label}</Badge>
                          <span className="text-sm text-muted-foreground">→ {info.recommendation}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <Label>Catatan (opsional)</Label>
                  <Input placeholder="Kondisi atlet, kualitas tidur, dll." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Simpan</Button>
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
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

        {/* Formula Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rumus Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono bg-background px-3 py-2 rounded border">
              Readiness = (VJ<sub>today</sub> / VJ<sub>baseline</sub>) + (HR<sub>baseline</sub> / HR<sub>today</sub>)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Skor optimal: 2.00 (VJ dan HR sama dengan baseline). Skor &gt; 2.00 menandakan supercompensation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
