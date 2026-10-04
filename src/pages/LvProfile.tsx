import { useMemo, useState } from 'react';
import { LineChart as LineIcon } from 'lucide-react';
import {
  CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis,
} from 'recharts';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PremiumFeatureGate } from '@/components/PremiumFeatureGate';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAthletes } from '@/hooks/useAthletes';
import { useVbtSets } from '@/hooks/useVbtSets';
import { buildLvProfile, guessLvExercise, loadFromProfile } from '@/lib/vbt';

const ZONES = [
  { label: 'Kekuatan maksimal', mpv: 0.4 },
  { label: 'Kekuatan', mpv: 0.55 },
  { label: 'Kekuatan-kecepatan', mpv: 0.75 },
  { label: 'Kecepatan-kekuatan', mpv: 1.0 },
  { label: 'Kecepatan', mpv: 1.3 },
];

export default function LvProfile() {
  const { hasPremium, loading } = usePremiumAccess();
  const { athletes } = useAthletes();
  const [athleteId, setAthleteId] = useState<string>('');
  const { sets } = useVbtSets(athleteId || null);
  const exercises = useMemo(
    () => Array.from(new Set(sets.filter((s) => s.load_kg).map((s) => s.exercise_name))),
    [sets],
  );
  const [exercise, setExercise] = useState('');
  const ex = exercise && exercises.includes(exercise) ? exercise : exercises[0] ?? '';
  const lvType = guessLvExercise(ex);

  const points = useMemo(
    () =>
      sets
        .filter((s) => s.exercise_name === ex && s.load_kg && s.best_mpv)
        .map((s) => ({ load: Number(s.load_kg), mpv: Number(s.best_mpv), date: s.session_date })),
    [sets, ex],
  );
  const profile = useMemo(() => buildLvProfile(points, lvType), [points, lvType]);

  const chartData = useMemo(() => {
    if (!points.length) return [];
    const maxL = Math.max(...points.map((p) => p.load), profile?.oneRm ?? 0);
    const rows: { load: number; mpv?: number; fit?: number }[] = points.map((p) => ({ load: p.load, mpv: p.mpv }));
    if (profile) {
      for (let i = 0; i <= 10; i++) {
        const l = (maxL * i) / 10;
        rows.push({ load: Number(l.toFixed(1)), fit: Number((profile.intercept + profile.slope * l).toFixed(3)) });
      }
    }
    return rows.sort((a, b) => a.load - b.load);
  }, [points, profile]);

  const content = (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><LineIcon className="w-6 h-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold">Profil Load–Velocity</h1>
          <p className="text-sm text-muted-foreground">
            Dibangun otomatis dari set VBT yang tersimpan: estimasi 1RM individual dan beban per zona latihan.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="space-y-1">
          <Label>Atlet</Label>
          <Select value={athleteId} onValueChange={setAthleteId}>
            <SelectTrigger><SelectValue placeholder="Pilih atlet" /></SelectTrigger>
            <SelectContent>
              {athletes.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Latihan</Label>
          <Select value={ex} onValueChange={setExercise} disabled={!exercises.length}>
            <SelectTrigger><SelectValue placeholder="Belum ada data" /></SelectTrigger>
            <SelectContent>
              {exercises.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!athleteId ? (
        <p className="text-muted-foreground text-sm">Pilih atlet untuk melihat profilnya.</p>
      ) : !profile ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          Butuh minimal 2 set dengan beban berbeda (dan beban terisi) untuk latihan ini. Rekam set di VBT Kamera atau Live Session.
        </CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Estimasi 1RM', profile.oneRm ? `${profile.oneRm} kg` : '–'],
              ['V0 (tanpa beban)', `${profile.v0} m/s`],
              ['MVT', `${profile.mvt} m/s`],
              ['Akurasi (R²)', profile.r2.toFixed(2)],
            ].map(([k, v]) => (
              <Card key={k}><CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-2xl font-bold">{v}</p>
              </CardContent></Card>
            ))}
          </div>
          {profile.r2 < 0.8 && (
            <Badge variant="outline" className="text-amber-500 border-amber-500/50">
              R² rendah — tambahkan set dengan rentang beban lebih lebar agar profil lebih akurat.
            </Badge>
          )}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Grafik Load–Velocity</CardTitle>
                <CardDescription>{profile.n} set · titik = MPV terbaik per set, garis = regresi</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="load" type="number" unit=" kg" className="text-xs" />
                    <YAxis unit=" m/s" className="text-xs" domain={[0, 'auto']} />
                    <Tooltip />
                    <Line dataKey="fit" name="Regresi" stroke="hsl(var(--primary))" dot={false} connectNulls />
                    <Scatter dataKey="mpv" name="MPV" fill="hsl(var(--accent-foreground))" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Beban per Zona</CardTitle><CardDescription>Dari profil individual</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Zona</TableHead><TableHead>MPV</TableHead><TableHead>Beban</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ZONES.map((z) => {
                      const l = loadFromProfile(profile, z.mpv);
                      return (
                        <TableRow key={z.label}>
                          <TableCell className="text-xs">{z.label}</TableCell>
                          <TableCell>{z.mpv}</TableCell>
                          <TableCell className="font-semibold">{l ? `${l} kg` : '–'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1">
            {loading ? <div className="p-6">Memuat...</div> : hasPremium ? content : (
              <PremiumFeatureGate featureName="Profil Load–Velocity" description="Profil kecepatan-beban individual otomatis dari data VBT, lengkap dengan estimasi 1RM dan beban per zona.">
                {content}
              </PremiumFeatureGate>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
