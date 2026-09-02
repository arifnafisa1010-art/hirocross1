import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, PieChart as PieIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { MuscleBodyMap } from '@/components/MuscleBodyMap';
import { useMuscleHistory } from '@/hooks/useMuscleHistory';
import { weightsToIntensities } from '@/lib/muscleMatch';
import { MUSCLE_LABELS, type MuscleId } from '@/lib/muscleExercises';

const RANGES = [
  { value: '7', label: '7 hari terakhir' },
  { value: '30', label: '30 hari terakhir' },
  { value: '90', label: '90 hari terakhir' },
  { value: 'all', label: 'Semua waktu' },
];

const COLORS = [
  '#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#a3e635', '#f43f5e', '#0ea5e9',
];

export function MuscleHistoryPanel({ athleteId }: { athleteId?: string | null }) {
  const { entries, dates, loading, aggregate } = useMuscleHistory(athleteId);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [range, setRange] = useState<string>('30');
  const [hovered, setHovered] = useState<MuscleId | null>(null);

  useEffect(() => {
    if (dates.length === 0) {
      if (selectedDate) setSelectedDate('');
      return;
    }
    if (!selectedDate || !dates.includes(selectedDate)) setSelectedDate(dates[0]);
  }, [dates, selectedDate]);

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate),
    [entries, selectedDate],
  );

  const dayIntensities = useMemo(() => {
    const weights: Record<string, number> = {};
    dayEntries.forEach((e) =>
      Object.entries(e.weights).forEach(([m, v]) => (weights[m] = (weights[m] ?? 0) + (v ?? 0))),
    );
    return weightsToIntensities(weights as Partial<Record<MuscleId, number>>);
  }, [dayEntries]);

  const pieData = useMemo(() => {
    const from = range === 'all' ? undefined : format(subDays(new Date(), parseInt(range, 10)), 'yyyy-MM-dd');
    const weights = aggregate(from);
    const total = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0);
    if (!total) return [];
    return (Object.entries(weights) as [MuscleId, number][])
      .map(([m, v]) => ({
        id: m,
        name: MUSCLE_LABELS[m].split(' (')[0],
        value: v,
        percent: (v / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [aggregate, range]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat riwayat latihan...</div>;
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Belum ada sesi latihan yang ditandai <strong>selesai</strong>. Tandai sesi di halaman Bulanan
          agar otot yang dilatih tercatat otomatis di sini.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Riwayat per tanggal */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Tanggal Latihan
            </CardTitle>
            <CardDescription>Pilih tanggal untuk melihat otot yang terlatih hari itu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[360px] overflow-y-auto space-y-1 pr-1">
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm border transition-all ${
                    selectedDate === d
                      ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                      : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  {format(parseISO(d), 'EEEE, d MMM yyyy', { locale: localeId })}
                </button>
              ))}
            </div>

            {dayEntries.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Latihan hari ini</p>
                {dayEntries.map((e) => (
                  <div key={e.sessionKey} className="text-xs space-y-1">
                    <p className="text-muted-foreground">{e.programName}</p>
                    <div className="flex flex-wrap gap-1">
                      {e.exercises.map((ex, i) => (
                        <Badge key={i} variant={ex.matched ? 'secondary' : 'outline'} className="font-normal">
                          {ex.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Body map tanggal terpilih */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>
                Otot Terlatih{' '}
                {selectedDate && (
                  <span className="text-muted-foreground font-normal">
                    — {format(parseISO(selectedDate), 'd MMM yyyy', { locale: localeId })}
                  </span>
                )}
              </span>
              {hovered && (
                <Badge variant="outline" className="font-normal">
                  {MUSCLE_LABELS[hovered]}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Warna menunjukkan seberapa dominan otot bekerja pada sesi yang sudah dijalankan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MuscleBodyMap intensities={dayIntensities} onHover={setHovered} />
          </CardContent>
        </Card>
      </div>

      {/* Distribusi otot */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-primary" /> Distribusi Latihan Otot
              </CardTitle>
              <CardDescription>Persentase porsi latihan tiap kelompok otot.</CardDescription>
            </div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada data latihan pada rentang waktu ini.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={d.id} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, n: string, p: any) =>
                        [`${p.payload.percent.toFixed(1)}%`, n]
                      }
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {pieData.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm flex-1 truncate">{MUSCLE_LABELS[d.id]}</span>
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${d.percent}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {d.percent.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
