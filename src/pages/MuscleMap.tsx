import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Info, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { MuscleBodyMap } from '@/components/MuscleBodyMap';
import { MuscleHistoryPanel } from '@/components/MuscleHistoryPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';


import {
  EXERCISES,
  EXERCISE_CATEGORIES,
  MUSCLE_LABELS,
  type Exercise,
  type MuscleId,
} from '@/lib/muscleExercises';
import { PremiumFeatureGate } from '@/components/PremiumFeatureGate';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';

export default function MuscleMap() {
  const navigate = useNavigate();
  const { hasPremium, loading } = usePremiumAccess();
  const [selected, setSelected] = useState<Exercise[]>([EXERCISES[0]]);
  const [category, setCategory] = useState<string>('all');
  const [hovered, setHovered] = useState<MuscleId | null>(null);

  const [showAll, setShowAll] = useState(false);

  const intensities = useMemo(() => {
    const map: Partial<Record<MuscleId, 0 | 1 | 2 | 3>> = {};
    if (showAll) {
      (Object.keys(MUSCLE_LABELS) as MuscleId[]).forEach((m) => {
        map[m] = 3;
      });
      return map;
    }
    const bump = (m: MuscleId, v: 1 | 2 | 3) => {
      map[m] = (Math.max(map[m] ?? 0, v) as 0 | 1 | 2 | 3);
    };
    selected.forEach((ex) => {
      ex.primary.forEach((m) => bump(m, 3));
      ex.secondary.forEach((m) => bump(m, 2));
      ex.tertiary?.forEach((m) => bump(m, 1));
    });
    return map;
  }, [selected, showAll]);


  const activeMuscles = useMemo(() => {
    return (Object.entries(intensities) as [MuscleId, 1 | 2 | 3][])
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [intensities]);

  const filteredExercises = useMemo(
    () => (category === 'all' ? EXERCISES : EXERCISES.filter((e) => e.category === category)),
    [category],
  );

  const toggleExercise = (ex: Exercise) => {
    setSelected((prev) =>
      prev.find((x) => x.id === ex.id) ? prev.filter((x) => x.id !== ex.id) : [...prev, ex],
    );
  };

  const intensityLabel = (v: number) =>
    v === 3 ? 'Dominan' : v === 2 ? 'Sekunder' : 'Pendukung';
  const intensityColor = (v: number) =>
    v === 3 ? 'bg-red-500' : v === 2 ? 'bg-orange-400' : 'bg-yellow-400';

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

  const simulator = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* LEFT: exercise picker */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Pilih Latihan</CardTitle>
            <CardDescription>Pilih satu atau beberapa gerakan untuk melihat kombinasi otot yang bekerja.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Tampilkan semua otot</p>
                <p className="text-[11px] text-muted-foreground">Sorot seluruh otot tanpa memilih latihan.</p>
              </div>
              <Switch checked={showAll} onCheckedChange={setShowAll} aria-label="Tampilkan semua otot" />
            </div>


            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {EXERCISE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-muted/40 rounded-md">
                {selected.map((ex) => (
                  <Badge key={ex.id} variant="secondary" className="gap-1">
                    {ex.name}
                    <button onClick={() => toggleExercise(ex)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-1 pr-1">
              {filteredExercises.map((ex) => {
                const active = !!selected.find((x) => x.id === ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => toggleExercise(ex)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm border transition-all flex items-center justify-between ${
                      active
                        ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                        : 'bg-card border-border hover:bg-muted'
                    }`}
                  >
                    <span>
                      <span className="block">{ex.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{ex.category}</span>
                    </span>
                    <Plus className={`w-4 h-4 shrink-0 transition-transform ${active ? 'rotate-45' : ''}`} />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CENTER: body map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Aktivasi Otot</span>
              {hovered && (
                <Badge variant="outline" className="font-normal">
                  {MUSCLE_LABELS[hovered]}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {showAll
                ? 'Menampilkan semua kelompok otot'
                : selected.length === 0
                  ? 'Pilih latihan di sebelah kiri atau aktifkan "Tampilkan semua otot".'
                  : `Menampilkan aktivasi untuk ${selected.length} gerakan`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MuscleBodyMap intensities={intensities} onHover={setHovered} />

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-red-500" /> Dominan (tersorot)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-orange-400" /> Sekunder
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-yellow-400" /> Pendukung
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-black border border-border" /> Tidak dipilih (hitam)
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Detail */}
      {activeMuscles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Otot yang Terlibat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {activeMuscles.map(([m, v]) => (
                <div key={m} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <span className={`w-2 h-8 rounded-sm ${intensityColor(v)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{MUSCLE_LABELS[m]}</p>
                    <p className="text-xs text-muted-foreground">{intensityLabel(v)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const content = (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            Peta Otot Latihan
          </h1>
          <p className="text-sm text-muted-foreground">
            Simulasikan gerakan atau lihat riwayat otot yang sudah dilatih.
          </p>
        </div>
      </div>

      <Tabs defaultValue="simulasi">
        <TabsList>
          <TabsTrigger value="simulasi">Simulasi Latihan</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat & Statistik</TabsTrigger>
        </TabsList>
        <TabsContent value="simulasi" className="mt-4">
          {simulator}
        </TabsContent>
        <TabsContent value="riwayat" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Pilih Atlet
              </CardTitle>
              <CardDescription>
                Lihat riwayat otot tiap atlet tanpa perlu login ke akun atlet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={athleteFilter} onValueChange={setAthleteFilter}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Semua atlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Atlet</SelectItem>
                  {athletes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <MuscleHistoryPanel athleteId={athleteFilter === 'all' ? null : athleteFilter} />
        </TabsContent>

      </Tabs>
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
              <PremiumFeatureGate featureName="Peta Otot Latihan">
                {content}
              </PremiumFeatureGate>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
