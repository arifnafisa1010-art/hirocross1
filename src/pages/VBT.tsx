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
          </CardContent>
        </Card>
      </div>
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
