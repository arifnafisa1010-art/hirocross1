import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Ruler, Weight, Heart, Target,
  Activity, AlertCircle, Edit2, Save, X, Sparkles
} from 'lucide-react';
import { parseISO, differenceInYears } from 'date-fns';
import { SimpleRadarChart } from './SimpleRadarChart';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AthleteData {
  id: string;
  name: string;
  sport: string | null;
  position: string | null;
  birth_date: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  resting_hr: number | null;
  photo_url: string | null;
}

interface TestResult {
  id: string;
  category: string;
  item: string;
  value: number;
  score: number;
  unit: string;
  test_date: string;
}

interface AthleteProfileSectionProps {
  athleteId: string;
  athleteData: AthleteData;
  loading?: boolean;
  onProfileUpdate?: () => void;
}

const calculateRPEZones = (age: number, restingHR: number) => {
  const maxHR = 220 - age;
  const hrReserve = maxHR - restingHR;
  
  const rpeZones = [
    { rpe: 1, intensity: 0.50, name: 'Sangat Ringan', description: 'Pemulihan aktif, stretching', color: 'bg-slate-400' },
    { rpe: 2, intensity: 0.55, name: 'Ringan', description: 'Jogging ringan, pemanasan', color: 'bg-blue-400' },
    { rpe: 3, intensity: 0.60, name: 'Ringan-Sedang', description: 'Aerobik ringan', color: 'bg-cyan-400' },
    { rpe: 4, intensity: 0.65, name: 'Sedang', description: 'Latihan aerobik dasar', color: 'bg-green-400' },
    { rpe: 5, intensity: 0.70, name: 'Sedang-Berat', description: 'Tempo run, circuit training', color: 'bg-lime-500' },
    { rpe: 6, intensity: 0.75, name: 'Agak Berat', description: 'Threshold training', color: 'bg-yellow-500' },
    { rpe: 7, intensity: 0.80, name: 'Berat', description: 'Interval training', color: 'bg-amber-500' },
    { rpe: 8, intensity: 0.85, name: 'Sangat Berat', description: 'HIIT, speed work', color: 'bg-orange-500' },
    { rpe: 9, intensity: 0.90, name: 'Hampir Maksimal', description: 'Sprint intervals', color: 'bg-red-500' },
    { rpe: 10, intensity: 0.95, name: 'Maksimal', description: 'All-out effort, competition', color: 'bg-red-700' },
  ];

  return rpeZones.map((zone, index) => {
    const targetHR = Math.round(restingHR + (zone.intensity * hrReserve));
    const nextIntensity = index < rpeZones.length - 1 ? rpeZones[index + 1].intensity : 1.0;
    const nextHR = Math.round(restingHR + (nextIntensity * hrReserve));
    
    return {
      ...zone,
      hrMin: targetHR,
      hrMax: nextHR - 1,
      hrRange: `${targetHR} - ${nextHR - 1} bpm`,
      intensityPercent: `${Math.round(zone.intensity * 100)}%`,
    };
  });
};

const calculateHRZones = (age: number, restingHR: number) => {
  const maxHR = 220 - age;
  const hrReserve = maxHR - restingHR;
  
  return [
    { zone: 1, name: 'Pemulihan', min: Math.round(restingHR + hrReserve * 0.5), max: Math.round(restingHR + hrReserve * 0.6), intensity: '50-60%', color: 'bg-blue-500', description: 'Pemulihan aktif, pemanasan' },
    { zone: 2, name: 'Aerobik', min: Math.round(restingHR + hrReserve * 0.6), max: Math.round(restingHR + hrReserve * 0.7), intensity: '60-70%', color: 'bg-green-500', description: 'Membangun daya tahan dasar' },
    { zone: 3, name: 'Tempo', min: Math.round(restingHR + hrReserve * 0.7), max: Math.round(restingHR + hrReserve * 0.8), intensity: '70-80%', color: 'bg-yellow-500', description: 'Meningkatkan kapasitas aerobik' },
    { zone: 4, name: 'Threshold', min: Math.round(restingHR + hrReserve * 0.8), max: Math.round(restingHR + hrReserve * 0.9), intensity: '80-90%', color: 'bg-orange-500', description: 'Meningkatkan ambang laktat' },
    { zone: 5, name: 'VO2 Max', min: Math.round(restingHR + hrReserve * 0.9), max: maxHR, intensity: '90-100%', color: 'bg-red-500', description: 'Performa maksimal, sprint' },
  ].map(z => ({ ...z, range: `${z.min} - ${z.max} bpm` }));
};

const BIOMOTOR_CATEGORIES = ['Kekuatan', 'Daya Tahan', 'Kecepatan', 'Fleksibilitas', 'Power', 'Kelincahan', 'Keseimbangan', 'Reaksi'];

export function AthleteProfileSection({ 
  athleteId, 
  athleteData,
  loading = false,
  onProfileUpdate
}: AthleteProfileSectionProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [editingField, setEditingField] = useState<'height' | 'weight' | 'hr' | null>(null);
  const [heightInput, setHeightInput] = useState<string>(athleteData.height?.toString() || '');
  const [weightInput, setWeightInput] = useState<string>(athleteData.weight?.toString() || '');
  const [restingHRInput, setRestingHRInput] = useState<string>(athleteData.resting_hr?.toString() || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHeightInput(athleteData.height?.toString() || '');
    setWeightInput(athleteData.weight?.toString() || '');
    setRestingHRInput(athleteData.resting_hr?.toString() || '');
  }, [athleteData.height, athleteData.weight, athleteData.resting_hr]);

  const handleSaveField = async (field: 'height' | 'weight' | 'hr') => {
    let updateData: Record<string, number> = {};
    if (field === 'height') {
      const value = parseFloat(heightInput);
      if (isNaN(value) || value < 100 || value > 250) { toast.error('Tinggi harus antara 100-250 cm'); return; }
      updateData = { height: value };
    } else if (field === 'weight') {
      const value = parseFloat(weightInput);
      if (isNaN(value) || value < 30 || value > 200) { toast.error('Berat harus antara 30-200 kg'); return; }
      updateData = { weight: value };
    } else if (field === 'hr') {
      const value = parseInt(restingHRInput);
      if (isNaN(value) || value < 30 || value > 120) { toast.error('HR istirahat harus antara 30-120 bpm'); return; }
      updateData = { resting_hr: value };
    }
    setSaving(true);
    const { error } = await supabase.from('athletes').update(updateData).eq('id', athleteId);
    if (error) { toast.error('Gagal menyimpan data'); } else { toast.success('Data berhasil diperbarui'); setEditingField(null); onProfileUpdate?.(); }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setHeightInput(athleteData.height?.toString() || '');
    setWeightInput(athleteData.weight?.toString() || '');
    setRestingHRInput(athleteData.resting_hr?.toString() || '');
    setEditingField(null);
  };

  useEffect(() => {
    const fetchTestResults = async () => {
      if (!athleteId) return;
      const { data, error } = await supabase.from('test_results').select('*').eq('athlete_id', athleteId).order('test_date', { ascending: false });
      if (!error) setTestResults(data || []);
      setLoadingTests(false);
    };
    fetchTestResults();
  }, [athleteId]);

  const age = useMemo(() => {
    if (!athleteData.birth_date) return null;
    return differenceInYears(new Date(), parseISO(athleteData.birth_date));
  }, [athleteData.birth_date]);

  const bmi = useMemo(() => {
    if (!athleteData.height || !athleteData.weight) return null;
    const h = athleteData.height / 100;
    return (athleteData.weight / (h * h)).toFixed(1);
  }, [athleteData.height, athleteData.weight]);

  const hrZones = useMemo(() => {
    if (!age || !athleteData.resting_hr) return null;
    return calculateHRZones(age, athleteData.resting_hr);
  }, [age, athleteData.resting_hr]);

  const rpeZones = useMemo(() => {
    if (!age || !athleteData.resting_hr) return null;
    return calculateRPEZones(age, athleteData.resting_hr);
  }, [age, athleteData.resting_hr]);

  const maxHR = useMemo(() => age ? 220 - age : null, [age]);

  const latestTestsByCategory = useMemo(() => {
    const grouped: Record<string, TestResult> = {};
    testResults.forEach(result => {
      if (!grouped[result.category] || parseISO(result.test_date) > parseISO(grouped[result.category].test_date)) {
        grouped[result.category] = result;
      }
    });
    return grouped;
  }, [testResults]);

  const radarData = useMemo(() => {
    return BIOMOTOR_CATEGORIES
      .filter(cat => latestTestsByCategory[cat] && latestTestsByCategory[cat].score > 0)
      .map(cat => ({ category: cat, value: latestTestsByCategory[cat].score, fullMark: 5 }));
  }, [latestTestsByCategory]);

  const overallScore = useMemo(() => {
    const scores = Object.values(latestTestsByCategory).map(r => r.score);
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }, [latestTestsByCategory]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-muted/50 rounded-xl" />
        <div className="h-64 bg-muted/50 rounded-xl" />
      </div>
    );
  }

  const initials = athleteData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const StatCard = ({ icon: Icon, label, value, unit, field, iconColor = 'text-primary' }: {
    icon: any; label: string; value: string | number | null; unit: string; field?: 'height' | 'weight' | 'hr'; iconColor?: string;
  }) => (
    <div className="relative group">
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col items-center gap-1.5">
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center bg-primary/5", iconColor === 'text-destructive' && 'bg-destructive/5')}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          {editingField === field && field ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={field === 'height' ? heightInput : field === 'weight' ? weightInput : restingHRInput}
                onChange={(e) => {
                  if (field === 'height') setHeightInput(e.target.value);
                  else if (field === 'weight') setWeightInput(e.target.value);
                  else setRestingHRInput(e.target.value);
                }}
                className="h-7 text-center text-sm w-16"
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveField(field)} disabled={saving}>
                <Save className="h-3 w-3 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit} disabled={saving}>
                <X className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold tracking-tight">{value || '-'}</p>
              <p className="text-[11px] text-muted-foreground">{unit}</p>
            </>
          )}
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          {field && editingField !== field && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditingField(field)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero Profile Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none shadow-lg overflow-hidden">
          {/* Gradient Background */}
          <div className="relative bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-6 pb-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
            <div className="relative flex items-center gap-5">
              <Avatar className="h-20 w-20 border-4 border-background shadow-xl ring-2 ring-primary/20">
                <AvatarImage src={athleteData.photo_url || undefined} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold tracking-tight truncate">{athleteData.name}</h2>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {athleteData.sport && (
                    <Badge variant="secondary" className="font-medium text-xs">{athleteData.sport}</Badge>
                  )}
                  {athleteData.position && (
                    <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">{athleteData.position}</Badge>
                  )}
                  {age && (
                    <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">{age} tahun</Badge>
                  )}
                  {athleteData.gender && (
                    <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">
                      {athleteData.gender === 'male' || athleteData.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Overall Score Floating Card */}
          <div className="px-6 -mt-10 relative z-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={Ruler} label="Tinggi" value={athleteData.height} unit="cm" field="height" />
              <StatCard icon={Weight} label="Berat" value={athleteData.weight} unit="kg" field="weight" />
              <StatCard icon={Activity} label="BMI" value={bmi} unit="index" />
              <StatCard icon={Heart} label="HR Istirahat" value={athleteData.resting_hr} unit="bpm" field="hr" iconColor="text-destructive" />
            </div>
          </div>

          {/* Score Bar */}
          <CardContent className="pt-4 pb-5 px-6">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-accent/5 to-transparent">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">Skor Biomotor Rata-rata</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent">{overallScore}</span>
                <span className="text-xs text-muted-foreground">/ 5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="biomotor" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50">
          <TabsTrigger value="biomotor" className="gap-1.5 data-[state=active]:shadow-sm">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Profil Biomotor</span>
            <span className="sm:hidden text-xs">Biomotor</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="gap-1.5 data-[state=active]:shadow-sm">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Zona Latihan HR</span>
            <span className="sm:hidden text-xs">Zona HR</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="biomotor" className="mt-4 space-y-4">
          {/* Radar Chart */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-primary" />
                </div>
                Profil Kemampuan Biomotor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTests ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              ) : testResults.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="font-medium text-muted-foreground">Belum ada data hasil tes</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Hasil tes dari pelatih akan tampil di sini</p>
                </div>
              ) : (
                <div className="h-[300px]">
                  <SimpleRadarChart data={radarData} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results Grid */}
          {testResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BIOMOTOR_CATEGORIES.map((cat, idx) => {
                const result = latestTestsByCategory[cat];
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      "border-none shadow-sm transition-all hover:shadow-md",
                      result ? "" : "opacity-40"
                    )}>
                      <CardContent className="p-3.5">
                        <p className="text-[11px] font-medium text-muted-foreground truncate uppercase tracking-wider">{cat}</p>
                        <div className="flex items-end justify-between mt-1.5">
                          <span className="text-2xl font-bold tracking-tight">{result?.score || '-'}</span>
                          <span className="text-[10px] text-muted-foreground mb-1">/ 5</span>
                        </div>
                        {result && (
                          <div className="mt-2.5">
                            <Progress value={(result.score / 5) * 100} className="h-1.5" />
                            <p className="text-[9px] text-muted-foreground mt-1.5">
                              {result.item}: {result.value} {result.unit}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="zones" className="mt-4 space-y-4">
          {/* RPE with HR Zones */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                Panduan RPE & Heart Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!rpeZones ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="font-medium text-muted-foreground">Data tidak lengkap</p>
                  <p className="text-xs text-muted-foreground/70">Diperlukan: tanggal lahir dan HR istirahat</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* HR Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-primary/5 rounded-xl text-center">
                      <p className="text-[10px] text-primary uppercase tracking-wider font-medium">HR Istirahat</p>
                      <p className="text-xl font-bold text-primary mt-0.5">{athleteData.resting_hr} <span className="text-xs font-normal">bpm</span></p>
                    </div>
                    <div className="p-3 bg-destructive/5 rounded-xl text-center">
                      <p className="text-[10px] text-destructive uppercase tracking-wider font-medium">HR Maksimal</p>
                      <p className="text-xl font-bold text-destructive mt-0.5">{maxHR} <span className="text-xs font-normal">bpm</span></p>
                    </div>
                    <div className="p-3 bg-secondary rounded-xl text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">HR Reserve</p>
                      <p className="text-xl font-bold mt-0.5">{maxHR! - athleteData.resting_hr!} <span className="text-xs font-normal">bpm</span></p>
                    </div>
                  </div>

                  {/* RPE Zones */}
                  <div className="rounded-xl border overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2.5 grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <div className="col-span-1 text-center">RPE</div>
                      <div className="col-span-3">Intensitas</div>
                      <div className="col-span-4">Deskripsi</div>
                      <div className="col-span-2 text-center">%HR</div>
                      <div className="col-span-2 text-right">Target HR</div>
                    </div>
                    <div className="divide-y divide-border/50">
                      {rpeZones.map(zone => (
                        <div key={zone.rpe} className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center text-sm hover:bg-muted/20 transition-colors">
                          <div className="col-span-1 flex justify-center">
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs", zone.color)}>
                              {zone.rpe}
                            </div>
                          </div>
                          <div className="col-span-3 font-medium text-xs">{zone.name}</div>
                          <div className="col-span-4 text-[11px] text-muted-foreground">{zone.description}</div>
                          <div className="col-span-2 text-center">
                            <Badge variant="outline" className="text-[10px]">{zone.intensityPercent}</Badge>
                          </div>
                          <div className="col-span-2 text-right font-mono text-xs font-bold">{zone.hrMin}-{zone.hrMax}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guide */}
                  <div className="p-4 bg-accent/5 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-accent" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground mb-1.5">Cara Menggunakan</p>
                        <ul className="space-y-1">
                          <li>• <strong>RPE 1-3:</strong> Pemanasan dan pemulihan aktif</li>
                          <li>• <strong>RPE 4-6:</strong> Latihan aerobik dan tempo</li>
                          <li>• <strong>RPE 7-8:</strong> Interval training dan HIIT</li>
                          <li>• <strong>RPE 9-10:</strong> Sprint dan performa maksimal</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classic 5 HR Zones */}
          {hrZones && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Heart className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  5 Zona Latihan Klasik (Karvonen)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hrZones.map(zone => (
                    <div key={zone.zone} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={cn("w-1.5 h-12 rounded-full", zone.color)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">Z{zone.zone}</span>
                            <Badge variant="outline" className="text-[10px]">{zone.name}</Badge>
                          </div>
                          <span className="text-xs font-mono font-bold">{zone.range}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] text-muted-foreground">{zone.description}</p>
                          <Badge variant="secondary" className="text-[10px]">{zone.intensity}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
