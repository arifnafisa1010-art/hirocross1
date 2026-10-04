import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Radio, SkipForward, Trash2, CheckCircle2, Timer } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumFeatureGate } from '@/components/PremiumFeatureGate';
import { VBTSensor } from '@/components/vbt/VBTSensor';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAthletes } from '@/hooks/useAthletes';
import { useVbtSets } from '@/hooks/useVbtSets';
import {
  buildLvProfile, guessLvExercise, loadFromProfile, velocityLossPercent, type VbtRep,
} from '@/lib/vbt';
import { toast } from 'sonner';

interface PlanItem { name: string; sets: number; reps: number; load: string; targetMpv: string }
interface DoneSet { exercise: string; set: number; load: number | null; reps: number; best: number; loss: number }

export default function LiveSession() {
  const { hasPremium, loading } = usePremiumAccess();
  const { athletes } = useAthletes();
  const [athleteId, setAthleteId] = useState('');
  const { sets: history, saveSet } = useVbtSets(athleteId || null);
  const [plan, setPlan] = useState<PlanItem[]>([
    { name: 'Back Squat', sets: 3, reps: 5, load: '', targetMpv: '0.6' },
  ]);
  const [restSec, setRestSec] = useState(120);
  const [cutoff, setCutoff] = useState(20);
  const [running, setRunning] = useState(false);
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(1);
  const [load, setLoad] = useState('');
  const [reps, setReps] = useState<VbtRep[]>([]);
  const [rest, setRest] = useState(0);
  const [done, setDone] = useState<DoneSet[]>([]);
  const [saving, setSaving] = useState(false);

  const current = plan[exIdx];
  const totalSets = plan.reduce((s, p) => s + p.sets, 0);

  // Saran beban dari profil L-V individual
  const suggested = useMemo(() => {
    if (!current) return null;
    const pts = history
      .filter((s) => s.exercise_name === current.name && s.load_kg && s.best_mpv)
      .map((s) => ({ load: Number(s.load_kg), mpv: Number(s.best_mpv) }));
    const prof = buildLvProfile(pts, guessLvExercise(current.name));
    const t = Number(current.targetMpv);
    return prof && t ? loadFromProfile(prof, t) : null;
  }, [history, current]);

  useEffect(() => {
    if (running && current) setLoad(current.load || (suggested ? String(suggested) : ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exIdx, running]);

  useEffect(() => {
    if (rest <= 0) return;
    const t = setTimeout(() => {
      setRest((r) => r - 1);
      if (rest === 1) {
        navigator.vibrate?.([200, 100, 200]);
        toast.info('Istirahat selesai — set berikutnya!');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const best = reps.reduce((m, r) => Math.max(m, r.mpv), 0);
  const loss = reps.length ? velocityLossPercent(best, reps[reps.length - 1].mpv) : 0;
  const target = Number(current?.targetMpv) || 0;
  const advice = !reps.length || !target ? null
    : reps[0].mpv > target * 1.1 ? 'Rep pertama terlalu cepat — naikkan beban ±5% set berikutnya.'
    : reps[0].mpv < target * 0.9 ? 'Rep pertama terlalu lambat — turunkan beban ±5% set berikutnya.'
    : 'Kecepatan sesuai target.';

  const start = () => {
    if (!athleteId) return toast.error('Pilih atlet dulu');
    if (!plan.length || plan.some((p) => !p.name.trim())) return toast.error('Lengkapi daftar latihan');
    setExIdx(0); setSetIdx(1); setDone([]); setReps([]); setRunning(true);
  };

  const advance = () => {
    setReps([]);
    if (setIdx < current.sets) setSetIdx((s) => s + 1);
    else if (exIdx < plan.length - 1) { setExIdx((i) => i + 1); setSetIdx(1); }
    else { setRunning(false); toast.success('Sesi selesai! Semua set tersimpan.'); return; }
    setRest(restSec);
  };

  const finishSet = async () => {
    if (!reps.length) return toast.error('Belum ada repetisi terekam');
    setSaving(true);
    const res = await saveSet({
      athleteId, exerciseName: current.name,
      sessionDate: format(new Date(), 'yyyy-MM-dd'),
      loadKg: load ? Number(load) : null, reps, source: 'live',
      notes: `Live Session · set ${setIdx}/${current.sets}`,
    });
    setSaving(false);
    if (!res) return;
    setDone((d) => [...d, { exercise: current.name, set: setIdx, load: load ? Number(load) : null, reps: reps.length, best, loss }]);
    advance();
  };

  const updatePlan = (i: number, patch: Partial<PlanItem>) =>
    setPlan((p) => p.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  const setup = (
    <Card>
      <CardHeader><CardTitle>Susun Sesi</CardTitle><CardDescription>Atlet, daftar latihan, target set/rep/kecepatan</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Atlet</Label>
            <Select value={athleteId} onValueChange={setAthleteId}>
              <SelectTrigger><SelectValue placeholder="Pilih atlet" /></SelectTrigger>
              <SelectContent>{athletes.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Istirahat (detik)</Label>
            <Input type="number" value={restSec} onChange={(e) => setRestSec(Number(e.target.value) || 0)} /></div>
          <div className="space-y-1"><Label>Cutoff velocity loss (%)</Label>
            <Input type="number" value={cutoff} onChange={(e) => setCutoff(Number(e.target.value) || 0)} /></div>
        </div>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
            <span>Latihan</span><span>Set</span><span>Rep</span><span>Beban (kg)</span><span>Target MPV</span><span />
          </div>
          {plan.map((p, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2">
              <Input className="col-span-2 sm:col-span-1" value={p.name} onChange={(e) => updatePlan(i, { name: e.target.value })} placeholder="Nama latihan" />
              <Input type="number" value={p.sets} onChange={(e) => updatePlan(i, { sets: Math.max(1, Number(e.target.value)) })} />
              <Input type="number" value={p.reps} onChange={(e) => updatePlan(i, { reps: Math.max(1, Number(e.target.value)) })} />
              <Input type="number" value={p.load} onChange={(e) => updatePlan(i, { load: e.target.value })} placeholder="auto" />
              <Input type="number" step="0.05" value={p.targetMpv} onChange={(e) => updatePlan(i, { targetMpv: e.target.value })} />
              <Button variant="ghost" size="icon" onClick={() => setPlan((pl) => pl.filter((_, k) => k !== i))}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPlan((p) => [...p, { name: '', sets: 3, reps: 5, load: '', targetMpv: '0.6' }])}>
            <Plus className="w-4 h-4 mr-1" /> Tambah latihan
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Beban kosong = diisi otomatis dari profil load–velocity atlet (jika datanya cukup).</p>
        <Button onClick={start} className="w-full sm:w-auto"><Radio className="w-4 h-4 mr-2" /> Mulai Live Session</Button>
      </CardContent>
    </Card>
  );

  const live = current && (
    <div className="grid xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Latihan {exIdx + 1}/{plan.length}</p>
                <h2 className="text-2xl font-bold">{current.name}</h2>
                <p className="text-sm">Set {setIdx}/{current.sets} · target {current.reps} rep · MPV {current.targetMpv} m/s</p>
              </div>
              <div className="w-32 space-y-1">
                <Label className="text-xs">Beban (kg)</Label>
                <Input type="number" value={load} onChange={(e) => setLoad(e.target.value)} />
                {suggested && <p className="text-[10px] text-muted-foreground">Saran profil: {suggested} kg</p>}
              </div>
            </div>
            <Progress value={(done.length / totalSets) * 100} />
            {rest > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 p-3">
                <span className="flex items-center gap-2 font-semibold"><Timer className="w-5 h-5" /> Istirahat {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</span>
                <Button size="sm" variant="ghost" onClick={() => setRest(0)}><SkipForward className="w-4 h-4 mr-1" /> Lewati</Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">Rep: {reps.length}/{current.reps}</Badge>
              <Badge variant="secondary">Best MPV: {best.toFixed(2)}</Badge>
              <Badge variant={loss >= cutoff ? 'destructive' : 'secondary'}>VL: {loss.toFixed(0)}%</Badge>
            </div>
            {loss >= cutoff && <p className="text-sm text-destructive font-semibold">Velocity loss melewati {cutoff}% — hentikan set.</p>}
            {reps.length >= current.reps && <p className="text-sm text-primary font-semibold">Target rep tercapai.</p>}
            {advice && <p className="text-xs text-muted-foreground">{advice}</p>}
            <div className="flex gap-2">
              <Button onClick={finishSet} disabled={saving}><CheckCircle2 className="w-4 h-4 mr-2" /> Selesai Set & Simpan</Button>
              <Button variant="outline" onClick={() => setRunning(false)}>Akhiri Sesi</Button>
            </div>
          </CardContent>
        </Card>
        <VBTSensor key={`${exIdx}-${setIdx}`} onRepsChange={setReps} />
      </div>
      <Card>
        <CardHeader><CardTitle>Set Selesai</CardTitle><CardDescription>Otomatis masuk riwayat VBT, TSS & ACWR</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {!done.length && <p className="text-sm text-muted-foreground">Belum ada.</p>}
          {done.map((d, i) => (
            <div key={i} className="flex justify-between text-sm border-b border-border pb-1">
              <span>{d.exercise} · S{d.set}</span>
              <span className="text-muted-foreground">{d.load ?? '–'} kg · {d.reps} rep · {d.best.toFixed(2)} m/s · {d.loss.toFixed(0)}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const content = (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><Radio className="w-6 h-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold">Live Session</h1>
          <p className="text-sm text-muted-foreground">Pandu latihan set demi set dengan sensor HP, timer istirahat, dan penyimpanan otomatis.</p>
        </div>
      </div>
      {running ? live : setup}
      {!running && done.length > 0 && (
        <Card><CardContent className="pt-6 text-sm">Sesi terakhir: {done.length} set tersimpan.</CardContent></Card>
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
              <PremiumFeatureGate featureName="Live Session" description="Jalankan sesi latihan langsung: set demi set, sensor kecepatan, timer istirahat, dan simpan otomatis.">
                {content}
              </PremiumFeatureGate>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
