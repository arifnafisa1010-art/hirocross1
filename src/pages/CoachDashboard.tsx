import { useEffect, useMemo, useState } from 'react';
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, LayoutDashboard, Users } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAthletes } from '@/hooks/useAthletes';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { PremiumFeatureGate } from '@/components/PremiumFeatureGate';
import { MuscleBodyMap } from '@/components/MuscleBodyMap';
import { useMuscleHistory } from '@/hooks/useMuscleHistory';
import { MUSCLE_LABELS, type MuscleId } from '@/lib/muscleExercises';
import { calculateSessionLoad } from '@/hooks/useTrainingLoads';
import { cn } from '@/lib/utils';

interface LoadRow {
  athlete_id: string | null;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  session_load: number | null;
  training_type: string;
}

interface VbtRow {
  athlete_id: string | null;
  session_date: string;
  exercise_name: string;
  load_kg: number | null;
  best_mpv: number | null;
  velocity_loss: number | null;
  source: string;
}

function acwrTone(acwr: number) {
  if (!acwr) return 'text-muted-foreground';
  if (acwr < 0.8) return 'text-blue-400';
  if (acwr <= 1.3) return 'text-emerald-400';
  if (acwr <= 1.5) return 'text-amber-400';
  return 'text-red-400';
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const { hasPremium, loading: premiumLoading } = usePremiumAccess();
  const { athletes, loading: athletesLoading } = useAthletes();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [vbt, setVbt] = useState<VbtRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const from = format(subDays(weekStart, 21), 'yyyy-MM-dd');
  const wStart = format(weekStart, 'yyyy-MM-dd');
  const wEnd = format(weekEnd, 'yyyy-MM-dd');

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const [{ data: l }, { data: v }] = await Promise.all([
        supabase
          .from('training_loads')
          .select('athlete_id, session_date, duration_minutes, rpe, session_load, training_type')
          .eq('user_id', user.id)
          .gte('session_date', from)
          .lte('session_date', wEnd),
        supabase
          .from('vbt_sets')
          .select('athlete_id, session_date, exercise_name, load_kg, best_mpv, velocity_loss, source')
          .eq('user_id', user.id)
          .gte('session_date', wStart)
          .lte('session_date', wEnd),
      ]);
      if (cancel) return;
      setLoads((l ?? []) as LoadRow[]);
      setVbt((v ?? []) as VbtRow[]);
    })();
    return () => {
      cancel = true;
    };
  }, [user?.id, from, wStart, wEnd]);

  const stats = useMemo(() => {
    return athletes.map((a) => {
      const mine = loads.filter((l) => l.athlete_id === a.id);
      const loadOf = (r: LoadRow) =>
        r.session_load || calculateSessionLoad(r.duration_minutes, r.rpe);
      const week = mine.filter((r) => r.session_date >= wStart && r.session_date <= wEnd);
      const tss = week.reduce((s, r) => s + loadOf(r), 0);
      const acute = tss;
      const chronic =
        mine.filter((r) => r.session_date >= from && r.session_date <= wEnd)
          .reduce((s, r) => s + loadOf(r), 0) / 4;
      const acwr = chronic > 0 ? acute / chronic : 0;
      const vbtSets = vbt.filter((s) => s.athlete_id === a.id);
      const bestMpv = vbtSets.reduce((m, s) => Math.max(m, s.best_mpv ?? 0), 0);
      return {
        athlete: a,
        sessions: week.length,
        tss,
        acwr,
        vbtCount: vbtSets.length,
        bestMpv,
      };
    });
  }, [athletes, loads, vbt, wStart, wEnd, from]);

  const totalTss = stats.reduce((s, r) => s + r.tss, 0);
  const totalSessions = stats.reduce((s, r) => s + r.sessions, 0);
  const totalVbt = stats.reduce((s, r) => s + r.vbtCount, 0);

  const activeAthlete = selected ?? athletes[0]?.id ?? null;
  const { aggregate } = useMuscleHistory(activeAthlete);

  const intensities = useMemo(() => {
    const weights = aggregate(wStart, wEnd);
    const map: Partial<Record<MuscleId, 0 | 1 | 2 | 3>> = {};
    const values = Object.values(weights);
    const max = values.length ? Math.max(...values) : 0;
    if (!max) return map;
    (Object.entries(weights) as [MuscleId, number][]).forEach(([m, v]) => {
      const ratio = v / max;
      map[m] = ratio >= 0.66 ? 3 : ratio >= 0.33 ? 2 : 1;
    });
    return map;
  }, [aggregate, wStart, wEnd]);

  const topMuscles = useMemo(
    () =>
      (Object.entries(intensities) as [MuscleId, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [intensities],
  );

  const athleteVbt = vbt.filter((s) => s.athlete_id === activeAthlete);

  if (premiumLoading || athletesLoading) {
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard Pelatih</h1>
            <p className="text-sm text-muted-foreground">
              Semua atlet, sesi, VBT, TSS, ACWR, dan Peta Otot dalam satu layar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(subDays(weekStart, 7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[190px] text-center text-sm font-medium">
            {format(weekStart, 'd MMM', { locale: idLocale })} –{' '}
            {format(weekEnd, 'd MMM yyyy', { locale: idLocale })}
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Minggu ini
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Summary label="Atlet" value={String(athletes.length)} />
        <Summary label="Sesi minggu ini" value={String(totalSessions)} />
        <Summary label="Total TSS" value={String(totalTss)} />
        <Summary label="Set VBT" value={String(totalVbt)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Ringkasan Atlet
            </CardTitle>
            <CardDescription>Klik nama atlet untuk melihat detail dan peta ototnya.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada atlet terdaftar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atlet</TableHead>
                      <TableHead>Sesi</TableHead>
                      <TableHead>TSS</TableHead>
                      <TableHead>ACWR</TableHead>
                      <TableHead>Set VBT</TableHead>
                      <TableHead>Best MPV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((s) => (
                      <TableRow
                        key={s.athlete.id}
                        onClick={() => setSelected(s.athlete.id)}
                        className={cn(
                          'cursor-pointer',
                          activeAthlete === s.athlete.id && 'bg-muted/50',
                        )}
                      >
                        <TableCell className="font-medium">{s.athlete.name}</TableCell>
                        <TableCell>{s.sessions}</TableCell>
                        <TableCell>{s.tss}</TableCell>
                        <TableCell className={cn('font-semibold', acwrTone(s.acwr))}>
                          {s.acwr ? s.acwr.toFixed(2) : '—'}
                        </TableCell>
                        <TableCell>{s.vbtCount}</TableCell>
                        <TableCell>{s.bestMpv ? `${s.bestMpv.toFixed(2)} m/s` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peta Otot Mingguan</CardTitle>
            <CardDescription>
              {athletes.find((a) => a.id === activeAthlete)?.name ?? 'Pilih atlet'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MuscleBodyMap intensities={intensities} />
            {topMuscles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center">
                Belum ada latihan tercatat pada minggu ini.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topMuscles.map(([m, v]) => (
                  <Badge key={m} variant="secondary" className="text-[11px]">
                    {MUSCLE_LABELS[m]} · {v === 3 ? 'Dominan' : v === 2 ? 'Sekunder' : 'Pendukung'}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Set VBT Minggu Ini</CardTitle>
          <CardDescription>
            {athletes.find((a) => a.id === activeAthlete)?.name ?? 'Atlet terpilih'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {athleteVbt.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada set VBT pada minggu ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Latihan</TableHead>
                    <TableHead>Beban</TableHead>
                    <TableHead>Best MPV</TableHead>
                    <TableHead>Vel. Loss</TableHead>
                    <TableHead>Sumber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {athleteVbt.map((s, i) => (
                    <TableRow key={`${s.session_date}-${i}`}>
                      <TableCell>{s.session_date}</TableCell>
                      <TableCell className="font-medium">{s.exercise_name}</TableCell>
                      <TableCell>{s.load_kg ? `${s.load_kg} kg` : '—'}</TableCell>
                      <TableCell>{s.best_mpv?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell>{s.velocity_loss?.toFixed(0) ?? '—'}%</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{s.source}</Badge>
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
                featureName="Dashboard Pelatih"
                description="Pantau semua atlet, sesi, VBT, TSS, ACWR, dan Peta Otot dalam satu layar dengan filter mingguan."
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
