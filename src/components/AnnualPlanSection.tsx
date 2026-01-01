import { useState } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus, Settings, Loader2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

const phaseColors: Record<string, string> = {
  'Umum': 'hsl(195, 53%, 79%)',
  'Khusus': 'hsl(120, 73%, 75%)',
  'Pra-Komp': 'hsl(39, 100%, 65%)',
  'Kompetisi': 'hsl(0, 86%, 60%)',
};

const phaseClasses: Record<string, string> = {
  'Umum': 'phase-umum',
  'Khusus': 'phase-khusus',
  'Pra-Komp': 'phase-prakomp',
  'Kompetisi': 'phase-kompetisi',
};

interface PhaseSettings {
  umum: number;
  khusus: number;
  prakomp: number;
  kompetisi: number;
}

export function AnnualPlanSection() {
  const { 
    setup, 
    mesocycles, 
    planData, 
    totalWeeks,
    competitions,
    addMesocycle, 
    removeMesocycle, 
    updateMesocycle,
    updatePlanWeek,
    setPlanData,
    setMesocycles,
    setTotalWeeks,
  } = useTrainingStore();

  const { currentProgram, saveProgram } = useTrainingPrograms();
  const [saving, setSaving] = useState(false);
  const [phaseSettingsOpen, setPhaseSettingsOpen] = useState(false);
  const [phaseSettings, setPhaseSettings] = useState<PhaseSettings>({
    umum: 40,
    khusus: 30,
    prakomp: 20,
    kompetisi: 10,
  });

  const usedWeeks = mesocycles.reduce((acc, m) => acc + m.weeks, 0);
  const diff = totalWeeks - usedWeeks;

  // Build reference areas for phases
  const phaseAreas: { x1: number; x2: number; fase: string }[] = [];
  let currentFase = planData[0]?.fase;
  let startIdx = 0;

  planData.forEach((d, i) => {
    if (d.fase !== currentFase || i === planData.length - 1) {
      phaseAreas.push({
        x1: startIdx,
        x2: i === planData.length - 1 ? i : i - 1,
        fase: currentFase,
      });
      currentFase = d.fase;
      startIdx = i;
    }
  });

  const chartData = planData.map((d) => ({
    name: `W${d.wk}`,
    volume: d.vol,
    intensitas: d.int,
    fase: d.fase,
    competitionId: d.competitionId,
  }));

  // Get competition weeks for reference lines
  const competitionWeeks = planData
    .filter(d => d.competitionId)
    .map(d => ({
      week: d.wk,
      competition: competitions.find(c => c.id === d.competitionId),
    }));

  const handleSave = async () => {
    setSaving(true);
    await saveProgram(setup, mesocycles, planData, competitions);
    setSaving(false);
  };

  const applyPhaseSettings = () => {
    const total = phaseSettings.umum + phaseSettings.khusus + phaseSettings.prakomp + phaseSettings.kompetisi;
    if (total !== 100) {
      return;
    }

    const newPlanData = planData.map((week, index) => {
      const progress = (index + 1) / planData.length * 100;
      
      let fase: 'Umum' | 'Khusus' | 'Pra-Komp' | 'Kompetisi';
      let vol: number;
      let int: number;
      
      if (progress <= phaseSettings.umum) {
        fase = 'Umum';
        vol = 90;
        int = 30;
      } else if (progress <= phaseSettings.umum + phaseSettings.khusus) {
        fase = 'Khusus';
        vol = 75;
        int = 60;
      } else if (progress <= phaseSettings.umum + phaseSettings.khusus + phaseSettings.prakomp) {
        fase = 'Pra-Komp';
        vol = 55;
        int = 85;
      } else {
        fase = 'Kompetisi';
        vol = 35;
        int = 100;
      }

      return { ...week, fase, vol, int };
    });

    setPlanData(newPlanData);
    setPhaseSettingsOpen(false);
  };

  const regeneratePlan = () => {
    if (!setup.startDate || !setup.matchDate) return;

    const start = new Date(setup.startDate);
    const match = new Date(setup.matchDate);
    const totalWks = Math.ceil((match.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));

    if (totalWks <= 0) return;

    // Apply current mesocycles structure
    const plan: typeof planData = [];
    let wkCount = 1;

    mesocycles.forEach((m) => {
      for (let i = 1; i <= m.weeks; i++) {
        if (wkCount > totalWks) break;
        const prog = wkCount / totalWks * 100;

        let fase: 'Umum' | 'Khusus' | 'Pra-Komp' | 'Kompetisi';
        let vol: number;
        let int: number;

        if (prog <= phaseSettings.umum) {
          fase = 'Umum'; vol = 90; int = 30;
        } else if (prog <= phaseSettings.umum + phaseSettings.khusus) {
          fase = 'Khusus'; vol = 75; int = 60;
        } else if (prog <= phaseSettings.umum + phaseSettings.khusus + phaseSettings.prakomp) {
          fase = 'Pra-Komp'; vol = 55; int = 85;
        } else {
          fase = 'Kompetisi'; vol = 35; int = 100;
        }

        // Deload on last week of mesocycle
        if (i === m.weeks) {
          vol -= 15;
          int -= 5;
        }

        plan.push({ wk: wkCount, meso: m.name, fase, vol, int });
        wkCount++;
      }
    });

    setTotalWeeks(totalWks);
    setPlanData(plan);
  };

  if (planData.length === 0) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground mb-4">Belum ada program. Silakan generate dari tab Setup.</p>
        <Button onClick={() => useTrainingStore.getState().setActiveTab('setup')}>
          Ke Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold uppercase tracking-wide">
          {setup.planName}
        </h2>
        <div className="flex gap-2">
          <Dialog open={phaseSettingsOpen} onOpenChange={setPhaseSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan Fase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Pengaturan Distribusi Fase</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Persiapan Umum</Label>
                    <span className="text-sm font-bold">{phaseSettings.umum}%</span>
                  </div>
                  <Slider
                    value={[phaseSettings.umum]}
                    onValueChange={([v]) => setPhaseSettings(prev => ({ ...prev, umum: v }))}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Persiapan Khusus</Label>
                    <span className="text-sm font-bold">{phaseSettings.khusus}%</span>
                  </div>
                  <Slider
                    value={[phaseSettings.khusus]}
                    onValueChange={([v]) => setPhaseSettings(prev => ({ ...prev, khusus: v }))}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Pra-Kompetisi</Label>
                    <span className="text-sm font-bold">{phaseSettings.prakomp}%</span>
                  </div>
                  <Slider
                    value={[phaseSettings.prakomp]}
                    onValueChange={([v]) => setPhaseSettings(prev => ({ ...prev, prakomp: v }))}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Kompetisi</Label>
                    <span className="text-sm font-bold">{phaseSettings.kompetisi}%</span>
                  </div>
                  <Slider
                    value={[phaseSettings.kompetisi]}
                    onValueChange={([v]) => setPhaseSettings(prev => ({ ...prev, kompetisi: v }))}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className={cn(
                  "p-3 rounded-lg text-center text-sm font-bold",
                  phaseSettings.umum + phaseSettings.khusus + phaseSettings.prakomp + phaseSettings.kompetisi === 100
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive"
                )}>
                  Total: {phaseSettings.umum + phaseSettings.khusus + phaseSettings.prakomp + phaseSettings.kompetisi}%
                  {phaseSettings.umum + phaseSettings.khusus + phaseSettings.prakomp + phaseSettings.kompetisi !== 100 && ' (harus 100%)'}
                </div>
                <Button 
                  onClick={applyPhaseSettings} 
                  className="w-full"
                  disabled={phaseSettings.umum + phaseSettings.khusus + phaseSettings.prakomp + phaseSettings.kompetisi !== 100}
                >
                  Terapkan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* Mesocycle Editor */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold text-muted-foreground uppercase">
            Editor Struktur Mesocycle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {mesocycles.map((m, i) => (
              <div
                key={i}
                className="relative bg-card p-3 rounded-xl border border-border shadow-sm w-32"
              >
                <button
                  onClick={() => { removeMesocycle(i); setTimeout(regeneratePlan, 0); }}
                  className="absolute -right-1 -top-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:scale-110 transition-transform"
                >
                  <X className="w-3 h-3" />
                </button>
                <Input
                  value={m.name}
                  onChange={(e) => updateMesocycle(i, { name: e.target.value })}
                  className="text-xs font-bold mb-2 h-8"
                />
                <Input
                  type="number"
                  value={m.weeks}
                  min={1}
                  onChange={(e) => {
                    updateMesocycle(i, { weeks: parseInt(e.target.value) || 1 });
                    setTimeout(regeneratePlan, 0);
                  }}
                  className="text-xs h-8"
                />
              </div>
            ))}
            <button
              onClick={addMesocycle}
              className="w-32 h-24 rounded-xl border-2 border-dashed border-border bg-card hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-1 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              MESO
            </button>
          </div>

          <div className={cn(
            "mt-4 pt-3 border-t border-border text-xs font-bold",
            diff > 0 ? "text-amber-600" : diff < 0 ? "text-destructive" : "text-success"
          )}>
            {diff > 0 ? `⚠️ SISA ${diff} MINGGU` : 
             diff < 0 ? `❌ LEBIH ${Math.abs(diff)} MINGGU` : 
             `✅ STRUKTUR PAS (${totalWeeks} Minggu)`}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border-border shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Legend */}
            <div className="flex flex-col justify-center gap-6 pr-4 border-r-2 border-border">
              <div className="writing-mode-vertical transform rotate-180 text-xs font-extrabold text-accent uppercase tracking-widest"
                   style={{ writingMode: 'vertical-rl' }}>
                Volume Load
              </div>
              <div className="writing-mode-vertical transform rotate-180 text-xs font-extrabold text-destructive uppercase tracking-widest"
                   style={{ writingMode: 'vertical-rl' }}>
                Intensitas
              </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      domain={[0, 140]}
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      stroke="hsl(var(--muted-foreground))"
                      orientation="right"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    {phaseAreas.map((area, i) => (
                      <ReferenceArea
                        key={i}
                        x1={`W${area.x1 + 1}`}
                        x2={`W${area.x2 + 1}`}
                        fill={phaseColors[area.fase]}
                        fillOpacity={0.3}
                      />
                    ))}
                    {competitionWeeks.map((cw, i) => (
                      <ReferenceLine
                        key={`comp-${i}`}
                        x={`W${cw.week}`}
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{
                          value: `🏆 ${cw.competition?.name || 'Kompetisi'}`,
                          position: 'top',
                          fill: 'hsl(var(--destructive))',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      />
                    ))}
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="intensitas" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Mesocycle Strip */}
              <div className="flex h-6 mt-2 rounded overflow-hidden">
                {mesocycles.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                    style={{ 
                      flex: m.weeks,
                      backgroundColor: i % 2 === 0 ? 'hsl(222, 47%, 11%)' : 'hsl(215, 14%, 34%)',
                    }}
                  >
                    {m.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border shadow-card">
        <CardContent className="pt-6">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase w-14">Wk</th>
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase w-28">Meso</th>
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase w-24">Phase</th>
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase w-32">Kompetisi</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase w-20">Vol%</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase w-20">Int%</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Kekuatan</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Kecepatan</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">D.Tahan</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Teknik</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Taktik</th>
                </tr>
              </thead>
              <tbody>
                {planData.map((d, i) => {
                  const competition = d.competitionId ? competitions.find(c => c.id === d.competitionId) : null;
                  return (
                    <tr key={i} className={cn(
                      "border-t border-border/50 hover:bg-secondary/30 transition-colors",
                      competition && "bg-destructive/10"
                    )}>
                      <td className="p-3 font-bold text-sm">W{d.wk}</td>
                      <td className="p-3 text-sm">{d.meso}</td>
                      <td className={cn("p-3 font-bold text-sm rounded", phaseClasses[d.fase])}>
                        {d.fase}
                      </td>
                      <td className="p-3 text-sm">
                        {competition ? (
                          <span className="flex items-center gap-1 text-destructive font-bold">
                            <Trophy className="w-3 h-3" />
                            {competition.name}
                          </span>
                        ) : '-'}
                      </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={d.vol}
                        onChange={(e) => updatePlanWeek(i, { vol: Number(e.target.value) })}
                        className="text-center text-accent font-bold h-8 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={d.int}
                        onChange={(e) => updatePlanWeek(i, { int: Number(e.target.value) })}
                        className="text-center text-accent font-bold h-8 text-sm"
                      />
                    </td>
                    <td className="p-3 text-center text-sm font-semibold">
                      {Math.round(setup.targets.strength * d.vol / 100)}
                    </td>
                    <td className="p-3 text-center text-sm font-semibold">
                      {Math.round(setup.targets.speed * d.vol / 100)}
                    </td>
                    <td className="p-3 text-center text-sm font-semibold">
                      {(setup.targets.endurance * d.vol / 100).toFixed(1)}
                    </td>
                    <td className="p-3 text-center text-sm font-semibold">
                      {Math.round(setup.targets.technique * d.vol / 100)}
                    </td>
                    <td className="p-3 text-center text-sm font-semibold">
                      {Math.round(setup.targets.tactic * d.vol / 100)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
