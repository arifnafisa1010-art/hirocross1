import { useTrainingStore } from '@/stores/trainingStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

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

export function AnnualPlanSection() {
  const { 
    setup, 
    mesocycles, 
    planData, 
    totalWeeks,
    addMesocycle, 
    removeMesocycle, 
    updateMesocycle,
    updatePlanWeek,
    generatePlan,
  } = useTrainingStore();

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
  }));

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
      <h2 className="text-2xl font-extrabold text-center uppercase tracking-wide">
        {setup.planName}
      </h2>

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
                  onClick={() => removeMesocycle(i)}
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
                    setTimeout(generatePlan, 0);
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
                {planData.map((d, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 font-bold text-sm">W{d.wk}</td>
                    <td className="p-3 text-sm">{d.meso}</td>
                    <td className={cn("p-3 font-bold text-sm rounded", phaseClasses[d.fase])}>
                      {d.fase}
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
