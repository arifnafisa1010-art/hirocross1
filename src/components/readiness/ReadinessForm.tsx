import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getReadinessInfo } from './readinessUtils';
import { Athlete } from '@/hooks/useAthletes';

interface ReadinessFormProps {
  athletes: Athlete[];
  selectedAthleteId: string;
  onSelectAthlete: (id: string) => void;
  autoVjBaseline: string;
  autoHrBaseline: string;
  onSubmit: (data: {
    athlete_id?: string | null;
    check_date: string;
    vj_today: number;
    vj_baseline: number;
    hr_today: number;
    hr_baseline: number;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  hideAthleteSelector?: boolean;
}

export function ReadinessForm({
  athletes,
  selectedAthleteId,
  onSelectAthlete,
  autoVjBaseline,
  autoHrBaseline,
  onSubmit,
  onCancel,
  hideAthleteSelector = false,
}: ReadinessFormProps) {
  const [form, setForm] = useState({
    check_date: format(new Date(), 'yyyy-MM-dd'),
    vj_today: '',
    vj_baseline: autoVjBaseline,
    hr_today: '',
    hr_baseline: autoHrBaseline,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vjToday = parseFloat(form.vj_today);
    const vjBaseline = parseFloat(form.vj_baseline);
    const hrToday = parseInt(form.hr_today);
    const hrBaseline = parseInt(form.hr_baseline);

    if (!vjToday || !vjBaseline || !hrToday || !hrBaseline) return;

    await onSubmit({
      athlete_id: selectedAthleteId || null,
      check_date: form.check_date,
      vj_today: vjToday,
      vj_baseline: vjBaseline,
      hr_today: hrToday,
      hr_baseline: hrBaseline,
      notes: form.notes || undefined,
    });

    setForm({ check_date: format(new Date(), 'yyyy-MM-dd'), vj_today: '', vj_baseline: autoVjBaseline, hr_today: '', hr_baseline: autoHrBaseline, notes: '' });
  };

  return (
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
            {!hideAthleteSelector && (
              <div>
                <Label>Atlet</Label>
                <Select value={selectedAthleteId} onValueChange={onSelectAthlete}>
                  <SelectTrigger><SelectValue placeholder="Pilih atlet" /></SelectTrigger>
                  <SelectContent>
                    {athletes.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>VJ Hari Ini (cm)</Label>
              <Input type="number" step="0.1" placeholder="e.g. 45" value={form.vj_today} onChange={e => setForm(f => ({ ...f, vj_today: e.target.value }))} required />
            </div>
            <div>
              <Label>VJ Baseline (cm) {autoVjBaseline && <span className="text-xs text-muted-foreground">• auto dari rata-rata</span>}</Label>
              <Input type="number" step="0.1" placeholder="e.g. 42" value={form.vj_baseline} onChange={e => setForm(f => ({ ...f, vj_baseline: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>HR Hari Ini (bpm)</Label>
              <Input type="number" placeholder="e.g. 68" value={form.hr_today} onChange={e => setForm(f => ({ ...f, hr_today: e.target.value }))} required />
            </div>
            <div>
              <Label>HR Baseline (bpm) {autoHrBaseline && <span className="text-xs text-muted-foreground">• dari profil</span>}</Label>
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
            <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
