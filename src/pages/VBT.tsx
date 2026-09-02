import { useMemo, useState } from 'react';
import { Gauge, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PremiumFeatureGate } from '@/components/PremiumFeatureGate';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAthletes } from '@/hooks/useAthletes';
import { useVbtSets } from '@/hooks/useVbtSets';
import { VBTCamera } from '@/components/vbt/VBTCamera';
import { velocityLossPercent, velocityZone, type VbtRep } from '@/lib/vbt';

export default function VBT() {
  const { hasPremium, loading } = usePremiumAccess();
  const [reps, setReps] = useState<VbtRep[]>([]);
  const { athletes } = useAthletes();
  const [athleteId, setAthleteId] = useState<string>('none');
  const [exerciseName, setExerciseName] = useState('Back Squat');
  const [loadKg, setLoadKg] = useState<string>('');
  const [sessionDate, setSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);
  const { sets, loading: setsLoading, saveSet, deleteSet } = useVbtSets(
    athleteId === 'none' ? null : athleteId,
  );


  const bestMpv = useMemo(() => reps.reduce((m, r) => Math.max(m, r.mpv), 0), [reps]);
  const avgMpv = useMemo(
    () => (reps.length ? reps.reduce((s, r) => s + r.mpv, 0) / reps.length : 0),
    [reps],
  );
  const lastLoss = reps.length ? velocityLossPercent(bestMpv, reps[reps.length - 1].mpv) : 0;

  const handleSave = async () => {
    if (!exerciseName.trim()) {
      toast.error('Isi nama latihan terlebih dahulu');
      return;
    }
    setSaving(true);
    const res = await saveSet({
      athleteId: athleteId === 'none' ? null : athleteId,
      exerciseName: exerciseName.trim(),
      sessionDate,
      loadKg: loadKg ? Number(loadKg) : null,
      reps,
      source: 'camera',
    });
    setSaving(false);
    if (res) setReps([]);
  };


  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">Memuat...</div>
        </div>
      </SidebarProvider>
    );
  }

  const content = (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Gauge className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">VBT Kamera</h1>
          <p className="text-sm text-muted-foreground">
            Ukur MPV, peak velocity, dan velocity loss langsung dari kamera HP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <VBTCamera onRepsChange={setReps} />
        </div>

        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Riwayat Rep (Set Berjalan)</CardTitle>
              <CardDescription>Detail tiap repetisi konsentrik.</CardDescription>
            </div>
            {reps.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setReps([])}>
                Reset
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border p-2">
                <p className="text-[11px] text-muted-foreground">Rep</p>
                <p className="text-lg font-bold">{reps.length}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-[11px] text-muted-foreground">Best MPV</p>
                <p className="text-lg font-bold">{bestMpv.toFixed(2)}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-[11px] text-muted-foreground">Vel. Loss</p>
                <p className="text-lg font-bold">{lastLoss.toFixed(0)}%</p>
              </div>
            </div>

            {reps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada repetisi terdeteksi. Mulai kamera dan kunci marker untuk merekam.
              </p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>MPV</TableHead>
                      <TableHead>Peak</TableHead>
                      <TableHead>ROM</TableHead>
                      <TableHead>Loss</TableHead>
                      <TableHead>Zona</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reps.map((r) => {
                      const zone = velocityZone(r.mpv);
                      return (
                        <TableRow key={r.index}>
                          <TableCell className="font-medium">{r.index}</TableCell>
                          <TableCell>{r.mpv.toFixed(2)}</TableCell>
                          <TableCell>{r.peak.toFixed(2)}</TableCell>
                          <TableCell>{(r.rom * 100).toFixed(0)} cm</TableCell>
                          <TableCell>{velocityLossPercent(bestMpv, r.mpv).toFixed(0)}%</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {zone.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {reps.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Rata-rata MPV set ini: <span className="font-semibold">{avgMpv.toFixed(2)} m/s</span>
              </p>
            )}

            {/* Simpan set */}
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-semibold">Simpan Set</p>
              <div className="space-y-1">
                <Label className="text-xs">Atlet</Label>
                <Select value={athleteId} onValueChange={setAthleteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tanpa atlet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa atlet (pribadi)</SelectItem>
                    {athletes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nama latihan</Label>
                <Input
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="Back Squat"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Beban (kg)</Label>
                  <Input
                    type="number"
                    value={loadKg}
                    onChange={(e) => setLoadKg(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal</Label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleSave}
                disabled={saving || reps.length === 0}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Menyimpan...' : 'Simpan Set ke Database'}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Set yang disimpan otomatis ikut menghitung otot terkena di Peta Otot.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Riwayat set tersimpan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Set Tersimpan</CardTitle>
          <CardDescription>
            {athleteId === 'none'
              ? 'Semua set VBT milik Anda.'
              : `Set VBT untuk ${athletes.find((a) => a.id === athleteId)?.name ?? 'atlet terpilih'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {setsLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Memuat riwayat...</p>
          ) : sets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Belum ada set VBT tersimpan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Latihan</TableHead>
                    <TableHead>Beban</TableHead>
                    <TableHead>Rep</TableHead>
                    <TableHead>Best MPV</TableHead>
                    <TableHead>Avg MPV</TableHead>
                    <TableHead>Vel. Loss</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sets.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.session_date}</TableCell>
                      <TableCell className="font-medium">{s.exercise_name}</TableCell>
                      <TableCell>{s.load_kg ? `${s.load_kg} kg` : '—'}</TableCell>
                      <TableCell>{s.reps.length}</TableCell>
                      <TableCell>{s.best_mpv?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell>{s.avg_mpv?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell>{s.velocity_loss?.toFixed(0) ?? '—'}%</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteSet(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1">
            {hasPremium ? (
              content
            ) : (
              <PremiumFeatureGate
                featureName="VBT Kamera"
                description="Ukur kecepatan angkat (MPV & peak velocity) memakai kamera HP, lengkap dengan kalibrasi skala dan notifikasi velocity loss."
              >
                {content}
              </PremiumFeatureGate>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
