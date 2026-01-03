import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAthletes } from '@/hooks/useAthletes';
import { useTestNorms } from '@/hooks/useTestNorms';
import { useTestResults } from '@/hooks/useTestResults';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

const defaultUnits: Record<string, string> = {
  '1RM Back Squat': 'kg',
  '1RM Bench Press': 'kg',
  '1RM Deadlift': 'kg',
  'Push Up Max': 'reps',
  'Pull Up Max': 'reps',
  'Sprint 20m': 's',
  'Sprint 40m': 's',
  'Sprint 60m': 's',
  'Flying 30m': 's',
  'VO2Max Test': 'ml/kg/min',
  'Yo-Yo IR1': 'm',
  'Cooper Test': 'm',
  'Beep Test': 'level',
  'Illinois Test': 's',
  'T-Test': 's',
  '5-10-5 Drill': 's',
  'Sit and Reach': 'cm',
  'Shoulder Flexibility': 'cm',
  'Hexagon Test': 's',
  'Stork Stand': 's',
};

export function TestsSection() {
  const { athletes, loading: athletesLoading, addAthlete } = useAthletes();
  const { calculateScore, getNormForItem, loading: normsLoading } = useTestNorms();
  const { results, loading: resultsLoading, addResult, deleteResult } = useTestResults();
  
  const [form, setForm] = useState({
    athleteId: '',
    date: '',
    category: 'Kekuatan',
    item: '1RM Back Squat',
    value: '',
    unit: 'kg',
    notes: '',
  });

  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<string>('__all__');
  const [newAthleteDialog, setNewAthleteDialog] = useState(false);
  const [newAthlete, setNewAthlete] = useState({
    name: '',
    gender: 'M' as 'M' | 'F',
    birthDate: '',
    weight: '',
    sport: '',
  });

  // Get current athlete gender for norm lookup
  const currentAthlete = athletes.find(a => a.id === form.athleteId);
  const currentGender = currentAthlete?.gender || 'M';

  // Auto-calculate score when value changes
  useEffect(() => {
    if (form.value && !normsLoading) {
      const value = parseFloat(form.value);
      if (!isNaN(value)) {
        const score = calculateScore(form.category, form.item, value, currentGender);
        setCalculatedScore(score);
      }
    } else {
      setCalculatedScore(null);
    }
  }, [form.value, form.category, form.item, currentGender, normsLoading, calculateScore]);

  // Auto-set unit when item changes
  useEffect(() => {
    const unit = defaultUnits[form.item] || 'kg';
    setForm(prev => ({ ...prev, unit }));
  }, [form.item]);

  const handleSubmit = async () => {
    if (!form.athleteId || !form.date || !form.value) {
      toast.error('Lengkapi data wajib: Atlet, Tanggal, dan Nilai!');
      return;
    }

    const value = parseFloat(form.value);
    const score = calculatedScore || 3;

    await addResult({
      athlete_id: form.athleteId,
      test_date: form.date,
      category: form.category,
      item: form.item,
      value,
      unit: form.unit,
      score,
      notes: form.notes || null,
    });
    
    setForm(prev => ({
      ...prev,
      value: '',
      notes: '',
    }));
    setCalculatedScore(null);
  };

  const handleClear = () => {
    setForm({
      athleteId: '',
      date: '',
      category: 'Kekuatan',
      item: '1RM Back Squat',
      value: '',
      unit: 'kg',
      notes: '',
    });
    setCalculatedScore(null);
  };

  const handleAddAthlete = async () => {
    if (!newAthlete.name) {
      toast.error('Nama atlet wajib diisi!');
      return;
    }

    const result = await addAthlete({
      name: newAthlete.name,
      gender: newAthlete.gender,
      birth_date: newAthlete.birthDate || null,
      weight: newAthlete.weight ? parseFloat(newAthlete.weight) : null,
      sport: newAthlete.sport || null,
    });

    if (result) {
      setForm(prev => ({ ...prev, athleteId: result.id }));
      setNewAthleteDialog(false);
      setNewAthlete({ name: '', gender: 'M', birthDate: '', weight: '', sport: '' });
    }
  };

  // Get athlete name by ID
  const getAthleteName = (athleteId: string | null) => {
    if (!athleteId) return '-';
    const athlete = athletes.find(a => a.id === athleteId);
    return athlete?.name || '-';
  };

  // Get norm info for display
  const currentNorm = getNormForItem(form.category, form.item, currentGender);

  // Build radar data - only include categories with completed tests
  const radarData = categories
    .map(cat => {
      const categoryResults = results.filter(
        r => r.category === cat && (selectedAthlete === '__all__' || r.athlete_id === selectedAthlete)
      );
      
      // Get latest score for each category
      const latestResult = categoryResults.sort(
        (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
      )[0];

      return {
        category: cat,
        score: latestResult?.score || 0,
        fullMark: 5,
        hasData: categoryResults.length > 0,
      };
    })
    .filter(item => item.hasData);

  const scoreLabels: Record<number, string> = {
    1: 'Sangat Kurang',
    2: 'Kurang',
    3: 'Cukup',
    4: 'Baik',
    5: 'Sangat Baik',
  };

  if (athletesLoading || normsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

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
            {/* Athlete Selection */}
            <div className="col-span-2">
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Pilih Atlet
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Select
                  value={form.athleteId}
                  onValueChange={(v) => setForm({ ...form, athleteId: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pilih atlet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map(athlete => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.name} {athlete.gender ? `(${athlete.gender})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={newAthleteDialog} onOpenChange={setNewAthleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Atlet Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Nama Atlet *</Label>
                        <Input
                          value={newAthlete.name}
                          onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                          placeholder="Nama lengkap"
                          className="mt-1.5"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Jenis Kelamin</Label>
                          <Select
                            value={newAthlete.gender}
                            onValueChange={(v) => setNewAthlete({ ...newAthlete, gender: v as 'M' | 'F' })}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M">Laki-laki</SelectItem>
                              <SelectItem value="F">Perempuan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tanggal Lahir</Label>
                          <Input
                            type="date"
                            value={newAthlete.birthDate}
                            onChange={(e) => setNewAthlete({ ...newAthlete, birthDate: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Berat Badan (kg)</Label>
                          <Input
                            type="number"
                            value={newAthlete.weight}
                            onChange={(e) => setNewAthlete({ ...newAthlete, weight: e.target.value })}
                            placeholder="70"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Cabang Olahraga</Label>
                          <Input
                            value={newAthlete.sport}
                            onChange={(e) => setNewAthlete({ ...newAthlete, sport: e.target.value })}
                            placeholder="Sepak Bola"
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddAthlete} className="w-full">
                        Tambah Atlet
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                Nilai ({form.unit})
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="Masukkan nilai"
                className="mt-1.5"
              />
            </div>

            {/* Auto-calculated Score Display */}
            <div className="col-span-2">
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Skor Otomatis (Norma)
              </Label>
              <div className={`mt-1.5 p-3 rounded-lg border text-center font-bold ${
                calculatedScore === null ? 'bg-secondary/50 text-muted-foreground' :
                calculatedScore >= 4 ? 'bg-success/20 text-success border-success/50' :
                calculatedScore >= 3 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                'bg-destructive/20 text-destructive border-destructive/50'
              }`}>
                {calculatedScore !== null ? (
                  <span>
                    {calculatedScore}/5 - {scoreLabels[calculatedScore]}
                  </span>
                ) : (
                  <span>Masukkan nilai untuk melihat skor</span>
                )}
              </div>
              {currentNorm && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Norma: {currentNorm.lower_is_better ? 'Lebih kecil lebih baik' : 'Lebih besar lebih baik'} 
                  {' '}| Gender: {currentGender === 'M' ? 'Laki-laki' : 'Perempuan'}
                </p>
              )}
            </div>

            <div className="col-span-2 lg:col-span-2">
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
            <Button onClick={handleSubmit} className="flex-[2]" disabled={calculatedScore === null}>
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
                Skor otomatis dihitung dari norma berdasarkan jenis kelamin. Radar menampilkan skor terbaru per domain.
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
                <SelectItem value="__all__">Semua Atlet</SelectItem>
                {athletes.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
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

      {/* Heart Rate Training Zones */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Zona Latihan Berdasarkan Heart Rate</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Berdasarkan RPE 1-10 dan dihitung dari tanggal lahir atlet menggunakan rumus Karvonen
              </p>
            </div>
            <Select
              value={selectedAthlete === '__all__' ? '' : selectedAthlete}
              onValueChange={(v) => setSelectedAthlete(v || '__all__')}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih Atlet" />
              </SelectTrigger>
              <SelectContent>
                {athletes.filter(a => a.birth_date).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const athlete = athletes.find(a => a.id === selectedAthlete);
            if (!athlete?.birth_date) {
              return (
                <p className="text-center text-muted-foreground py-8">
                  Pilih atlet yang memiliki tanggal lahir untuk melihat zona HR
                </p>
              );
            }

            // Calculate age
            const birthDate = new Date(athlete.birth_date);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            // Max HR using Tanaka formula (208 - 0.7 x age)
            const maxHR = Math.round(208 - (0.7 * age));
            // Resting HR estimate (default 60 bpm)
            const restingHR = 60;
            // Heart Rate Reserve
            const hrr = maxHR - restingHR;

            // RPE to HR Zone mapping (Karvonen method)
            const zones = [
              { rpe: '1-2', zone: 'Zona 1 (Pemulihan)', intensity: '50-60%', hrMin: Math.round(restingHR + (hrr * 0.5)), hrMax: Math.round(restingHR + (hrr * 0.6)), color: 'bg-blue-100 text-blue-700 border-blue-300' },
              { rpe: '3-4', zone: 'Zona 2 (Aerobik Dasar)', intensity: '60-70%', hrMin: Math.round(restingHR + (hrr * 0.6)), hrMax: Math.round(restingHR + (hrr * 0.7)), color: 'bg-green-100 text-green-700 border-green-300' },
              { rpe: '5-6', zone: 'Zona 3 (Aerobik)', intensity: '70-80%', hrMin: Math.round(restingHR + (hrr * 0.7)), hrMax: Math.round(restingHR + (hrr * 0.8)), color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
              { rpe: '7-8', zone: 'Zona 4 (Ambang Laktat)', intensity: '80-90%', hrMin: Math.round(restingHR + (hrr * 0.8)), hrMax: Math.round(restingHR + (hrr * 0.9)), color: 'bg-orange-100 text-orange-700 border-orange-300' },
              { rpe: '9-10', zone: 'Zona 5 (VO2Max)', intensity: '90-100%', hrMin: Math.round(restingHR + (hrr * 0.9)), hrMax: maxHR, color: 'bg-red-100 text-red-700 border-red-300' },
            ];

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Usia</p>
                    <p className="text-lg font-bold">{age} tahun</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">HR Max</p>
                    <p className="text-lg font-bold text-destructive">{maxHR} bpm</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Resting HR (Est.)</p>
                    <p className="text-lg font-bold">{restingHR} bpm</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">HRR</p>
                    <p className="text-lg font-bold text-accent">{hrr} bpm</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-secondary/50">
                        <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">RPE</th>
                        <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Zona Latihan</th>
                        <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Intensitas</th>
                        <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">HR Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zones.map((z, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="p-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${z.color}`}>
                              {z.rpe}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-semibold">{z.zone}</td>
                          <td className="p-3 text-sm text-center">{z.intensity}</td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-accent">{z.hrMin} - {z.hrMax}</span>
                            <span className="text-muted-foreground text-xs ml-1">bpm</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Riwayat Tes</CardTitle>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
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
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground text-sm">
                        Belum ada data tes. Tambahkan hasil tes di form di atas.
                      </td>
                    </tr>
                  ) : (
                    results.map((test) => (
                      <tr key={test.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-3 text-sm">{new Date(test.test_date).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 text-sm font-semibold">{getAthleteName(test.athlete_id)}</td>
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
                            onClick={() => deleteResult(test.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
