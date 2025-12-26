import { useState } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { TestResult } from '@/types/training';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

const categories = [
  'Kekuatan',
  'Kecepatan',
  'Daya Tahan',
  'Kelincahan',
  'Fleksibilitas',
  'Koordinasi',
];

const items: Record<string, string[]> = {
  'Kekuatan': ['1RM Back Squat', '1RM Bench Press', '1RM Deadlift', 'Push Up Max', 'Pull Up Max'],
  'Kecepatan': ['Sprint 20m', 'Sprint 40m', 'Sprint 60m', 'Flying 30m'],
  'Daya Tahan': ['VO2Max Test', 'Yo-Yo IR1', 'Cooper Test', 'Beep Test'],
  'Kelincahan': ['Illinois Test', 'T-Test', '5-10-5 Drill'],
  'Fleksibilitas': ['Sit and Reach', 'Shoulder Flexibility'],
  'Koordinasi': ['Hexagon Test', 'Stork Stand'],
};

export function TestsSection() {
  const { tests, addTest, removeTest } = useTrainingStore();
  
  const [form, setForm] = useState({
    athlete: '',
    date: '',
    category: 'Kekuatan',
    item: '1RM Back Squat',
    value: '',
    unit: 'kg',
    score: 3,
    notes: '',
  });

  const handleSubmit = () => {
    if (!form.athlete || !form.date || !form.value) {
      toast.error('Lengkapi data wajib: Atlet, Tanggal, dan Nilai!');
      return;
    }

    const newTest: TestResult = {
      id: Date.now().toString(),
      athlete: form.athlete,
      date: form.date,
      category: form.category,
      item: form.item,
      value: parseFloat(form.value),
      unit: form.unit,
      score: form.score,
      notes: form.notes,
    };

    addTest(newTest);
    toast.success('Hasil tes disimpan!');
    
    setForm(prev => ({
      ...prev,
      value: '',
      notes: '',
    }));
  };

  const handleClear = () => {
    setForm({
      athlete: '',
      date: '',
      category: 'Kekuatan',
      item: '1RM Back Squat',
      value: '',
      unit: 'kg',
      score: 3,
      notes: '',
    });
  };

  // Get unique athletes for radar filter
  const athletes = [...new Set(tests.map(t => t.athlete))];
  const [selectedAthlete, setSelectedAthlete] = useState<string>('');

  // Build radar data
  const radarData = categories.map(cat => {
    const categoryTests = tests.filter(
      t => t.category === cat && (!selectedAthlete || t.athlete === selectedAthlete)
    );
    
    // Get latest score for each category
    const latestTest = categoryTests.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    return {
      category: cat,
      score: latestTest?.score || 0,
      fullMark: 5,
    };
  });

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-extrabold">Tes & Pengukuran Fisik</h2>

      {/* Input Form */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Input Tes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Nama Atlet
              </Label>
              <Input
                value={form.athlete}
                onChange={(e) => setForm({ ...form, athlete: e.target.value })}
                placeholder="Contoh: Atlet A"
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Tanggal Tes
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Kategori Tes
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ 
                  ...form, 
                  category: v, 
                  item: items[v]?.[0] || '' 
                })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Item Tes
              </Label>
              <Select
                value={form.item}
                onValueChange={(v) => setForm({ ...form, item: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(items[form.category] || []).map(item => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Nilai Utama
              </Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="Contoh: 120"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Satuan
              </Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm({ ...form, unit: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="s">detik</SelectItem>
                  <SelectItem value="reps">reps</SelectItem>
                  <SelectItem value="ml/kg/min">ml/kg/min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Skor (1-5)
              </Label>
              <Select
                value={form.score.toString()}
                onValueChange={(v) => setForm({ ...form, score: parseInt(v) })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Sangat Kurang</SelectItem>
                  <SelectItem value="2">2 - Kurang</SelectItem>
                  <SelectItem value="3">3 - Cukup</SelectItem>
                  <SelectItem value="4">4 - Baik</SelectItem>
                  <SelectItem value="5">5 - Sangat Baik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 lg:col-span-3">
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Catatan
              </Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Opsional: kondisi tes, alat, protokol, dll."
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSubmit} className="flex-[2]">
              SIMPAN HASIL TES
            </Button>
            <Button onClick={handleClear} variant="secondary" className="flex-1">
              RESET FORM
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Radar Profil (Skala 1–5)</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Skor otomatis dari norma usia+jenis kelamin. Radar menampilkan skor terbaru per domain.
              </p>
            </div>
            <Select
              value={selectedAthlete}
              onValueChange={setSelectedAthlete}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih Atlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Atlet</SelectItem>
                {athletes.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 5]} 
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Test History Table */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Riwayat Tes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Tanggal</th>
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Atlet</th>
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Kategori</th>
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Item</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Nilai</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Skor</th>
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Catatan</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase w-16">Hapus</th>
                </tr>
              </thead>
              <tbody>
                {tests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground text-sm">
                      Belum ada data tes. Tambahkan hasil tes di form di atas.
                    </td>
                  </tr>
                ) : (
                  tests.map((test) => (
                    <tr key={test.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-3 text-sm">{new Date(test.date).toLocaleDateString('id-ID')}</td>
                      <td className="p-3 text-sm font-semibold">{test.athlete}</td>
                      <td className="p-3 text-sm">{test.category}</td>
                      <td className="p-3 text-sm">{test.item}</td>
                      <td className="p-3 text-sm text-center font-bold text-accent">
                        {test.value} {test.unit}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          test.score >= 4 ? 'bg-success/20 text-success' :
                          test.score >= 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {test.score}/5
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{test.notes || '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeTest(test.id)}
                          className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors mx-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
