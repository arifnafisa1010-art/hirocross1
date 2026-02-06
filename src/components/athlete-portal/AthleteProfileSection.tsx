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
  Activity, AlertCircle, Edit2, Save, X
} from 'lucide-react';
import { parseISO, differenceInYears } from 'date-fns';
import { SimpleRadarChart } from './SimpleRadarChart';
import { toast } from 'sonner';

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

// HR Zones calculation based on Karvonen formula
const calculateHRZones = (age: number, restingHR: number) => {
  const maxHR = 220 - age;
  const hrReserve = maxHR - restingHR;
  
  return [
    { 
      zone: 1, 
      name: 'Pemulihan', 
      range: `${Math.round(restingHR + hrReserve * 0.5)} - ${Math.round(restingHR + hrReserve * 0.6)} bpm`,
      min: Math.round(restingHR + hrReserve * 0.5),
      max: Math.round(restingHR + hrReserve * 0.6),
      intensity: '50-60%',
      color: 'bg-blue-500',
      description: 'Pemulihan aktif, pemanasan'
    },
    { 
      zone: 2, 
      name: 'Aerobik', 
      range: `${Math.round(restingHR + hrReserve * 0.6)} - ${Math.round(restingHR + hrReserve * 0.7)} bpm`,
      min: Math.round(restingHR + hrReserve * 0.6),
      max: Math.round(restingHR + hrReserve * 0.7),
      intensity: '60-70%',
      color: 'bg-green-500',
      description: 'Membangun daya tahan dasar'
    },
    { 
      zone: 3, 
      name: 'Tempo', 
      range: `${Math.round(restingHR + hrReserve * 0.7)} - ${Math.round(restingHR + hrReserve * 0.8)} bpm`,
      min: Math.round(restingHR + hrReserve * 0.7),
      max: Math.round(restingHR + hrReserve * 0.8),
      intensity: '70-80%',
      color: 'bg-yellow-500',
      description: 'Meningkatkan kapasitas aerobik'
    },
    { 
      zone: 4, 
      name: 'Threshold', 
      range: `${Math.round(restingHR + hrReserve * 0.8)} - ${Math.round(restingHR + hrReserve * 0.9)} bpm`,
      min: Math.round(restingHR + hrReserve * 0.8),
      max: Math.round(restingHR + hrReserve * 0.9),
      intensity: '80-90%',
      color: 'bg-orange-500',
      description: 'Meningkatkan ambang laktat'
    },
    { 
      zone: 5, 
      name: 'VO2 Max', 
      range: `${Math.round(restingHR + hrReserve * 0.9)} - ${maxHR} bpm`,
      min: Math.round(restingHR + hrReserve * 0.9),
      max: maxHR,
      intensity: '90-100%',
      color: 'bg-red-500',
      description: 'Performa maksimal, sprint'
    },
  ];
};

const BIOMOTOR_CATEGORIES = [
  'Kekuatan',
  'Daya Tahan',
  'Kecepatan',
  'Fleksibilitas',
  'Power',
  'Kelincahan',
  'Keseimbangan',
  'Reaksi'
];

export function AthleteProfileSection({ 
  athleteId, 
  athleteData,
  loading = false,
  onProfileUpdate
}: AthleteProfileSectionProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  
  // Edit states
  const [editingField, setEditingField] = useState<'height' | 'weight' | 'hr' | null>(null);
  const [heightInput, setHeightInput] = useState<string>(athleteData.height?.toString() || '');
  const [weightInput, setWeightInput] = useState<string>(athleteData.weight?.toString() || '');
  const [restingHRInput, setRestingHRInput] = useState<string>(athleteData.resting_hr?.toString() || '');
  const [saving, setSaving] = useState(false);

  // Update inputs when athleteData changes
  useEffect(() => {
    setHeightInput(athleteData.height?.toString() || '');
    setWeightInput(athleteData.weight?.toString() || '');
    setRestingHRInput(athleteData.resting_hr?.toString() || '');
  }, [athleteData.height, athleteData.weight, athleteData.resting_hr]);

  const handleSaveField = async (field: 'height' | 'weight' | 'hr') => {
    let updateData: Record<string, number> = {};
    
    if (field === 'height') {
      const value = parseFloat(heightInput);
      if (isNaN(value) || value < 100 || value > 250) {
        toast.error('Tinggi harus antara 100-250 cm');
        return;
      }
      updateData = { height: value };
    } else if (field === 'weight') {
      const value = parseFloat(weightInput);
      if (isNaN(value) || value < 30 || value > 200) {
        toast.error('Berat harus antara 30-200 kg');
        return;
      }
      updateData = { weight: value };
    } else if (field === 'hr') {
      const value = parseInt(restingHRInput);
      if (isNaN(value) || value < 30 || value > 120) {
        toast.error('HR istirahat harus antara 30-120 bpm');
        return;
      }
      updateData = { resting_hr: value };
    }

    setSaving(true);
    const { error } = await supabase
      .from('athletes')
      .update(updateData)
      .eq('id', athleteId);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal menyimpan data');
    } else {
      toast.success('Data berhasil diperbarui');
      setEditingField(null);
      onProfileUpdate?.();
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setHeightInput(athleteData.height?.toString() || '');
    setWeightInput(athleteData.weight?.toString() || '');
    setRestingHRInput(athleteData.resting_hr?.toString() || '');
    setEditingField(null);
  };

  // Fetch test results for this athlete
  useEffect(() => {
    const fetchTestResults = async () => {
      if (!athleteId) return;
      
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('test_date', { ascending: false });

      if (error) {
        console.error('Error fetching test results:', error);
      } else {
        setTestResults(data || []);
      }
      setLoadingTests(false);
    };

    fetchTestResults();
  }, [athleteId]);

  // Calculate age
  const age = useMemo(() => {
    if (!athleteData.birth_date) return null;
    return differenceInYears(new Date(), parseISO(athleteData.birth_date));
  }, [athleteData.birth_date]);

  // Calculate BMI
  const bmi = useMemo(() => {
    if (!athleteData.height || !athleteData.weight) return null;
    const heightInM = athleteData.height / 100;
    return (athleteData.weight / (heightInM * heightInM)).toFixed(1);
  }, [athleteData.height, athleteData.weight]);

  // HR Zones
  const hrZones = useMemo(() => {
    if (!age || !athleteData.resting_hr) return null;
    return calculateHRZones(age, athleteData.resting_hr);
  }, [age, athleteData.resting_hr]);

  // Max HR
  const maxHR = useMemo(() => {
    if (!age) return null;
    return 220 - age;
  }, [age]);

  // Group test results by category and get latest for each
  const latestTestsByCategory = useMemo(() => {
    const grouped: Record<string, TestResult> = {};
    
    testResults.forEach(result => {
      if (!grouped[result.category] || 
          parseISO(result.test_date) > parseISO(grouped[result.category].test_date)) {
        grouped[result.category] = result;
      }
    });

    return grouped;
  }, [testResults]);

  // Radar chart data
  const radarData = useMemo(() => {
    return BIOMOTOR_CATEGORIES.map(cat => ({
      category: cat,
      value: latestTestsByCategory[cat]?.score || 0,
      fullMark: 5
    }));
  }, [latestTestsByCategory]);

  // Overall score
  const overallScore = useMemo(() => {
    const scores = Object.values(latestTestsByCategory).map(r => r.score);
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }, [latestTestsByCategory]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Card className="h-48 bg-muted/50" />
        <Card className="h-64 bg-muted/50" />
      </div>
    );
  }

  const initials = athleteData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage src={athleteData.photo_url || undefined} />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{athleteData.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {athleteData.sport && (
                  <Badge variant="secondary">{athleteData.sport}</Badge>
                )}
                {athleteData.position && (
                  <Badge variant="outline">{athleteData.position}</Badge>
                )}
                {athleteData.gender && (
                  <Badge variant="outline" className="capitalize">
                    {athleteData.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                  </Badge>
                )}
              </div>
              {age && (
                <p className="text-sm text-muted-foreground mt-2">
                  {age} tahun
                </p>
              )}
            </div>
            {/* Overall Score */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary">
                <span className="text-xl font-bold text-primary">{overallScore}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Skor Rata-rata</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <Ruler className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold">{athleteData.height || '-'} <span className="text-xs font-normal">cm</span></p>
              <p className="text-xs text-muted-foreground">Tinggi</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <Weight className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold">{athleteData.weight || '-'} <span className="text-xs font-normal">kg</span></p>
              <p className="text-xs text-muted-foreground">Berat</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <Activity className="h-4 w-4 mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold">{bmi || '-'}</p>
              <p className="text-xs text-muted-foreground">BMI</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center relative group">
              <Heart className="h-4 w-4 mx-auto text-red-500 mb-1" />
              {isEditingHR ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={restingHRInput}
                    onChange={(e) => setRestingHRInput(e.target.value)}
                    className="h-7 text-center text-sm w-16"
                    min={30}
                    max={120}
                    placeholder="60"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handleSaveRestingHR}
                    disabled={savingHR}
                  >
                    <Save className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handleCancelEdit}
                    disabled={savingHR}
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold">{athleteData.resting_hr || '-'} <span className="text-xs font-normal">bpm</span></p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingHR(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              <p className="text-xs text-muted-foreground">HR Istirahat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Profile Content */}
      <Tabs defaultValue="biomotor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="biomotor" className="gap-1">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Profil Biomotor</span>
            <span className="sm:hidden">Biomotor</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="gap-1">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Zona Latihan HR</span>
            <span className="sm:hidden">Zona HR</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="biomotor" className="mt-4 space-y-4">
          {/* Radar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Profil Kemampuan Biomotor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTests ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : testResults.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground">Belum ada data hasil tes</p>
                  <p className="text-xs text-muted-foreground/70">
                    Hasil tes dari pelatih akan tampil di sini
                  </p>
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
              {BIOMOTOR_CATEGORIES.map(cat => {
                const result = latestTestsByCategory[cat];
                return (
                  <Card key={cat} className={cn(
                    "transition-all",
                    result ? "bg-gradient-to-br from-primary/5 to-transparent" : "opacity-50"
                  )}>
                    <CardContent className="p-3">
                      <p className="text-xs font-medium text-muted-foreground truncate">{cat}</p>
                      <div className="flex items-end justify-between mt-1">
                        <span className="text-2xl font-bold">
                          {result?.score || '-'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/ 5</span>
                      </div>
                      {result && (
                        <div className="mt-2">
                          <Progress value={(result.score / 5) * 100} className="h-1.5" />
                          <p className="text-[9px] text-muted-foreground mt-1">
                            {result.item}: {result.value} {result.unit}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="zones" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Zona Latihan Berdasarkan Heart Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hrZones ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground">Data tidak lengkap</p>
                  <p className="text-xs text-muted-foreground/70">
                    Diperlukan: tanggal lahir dan HR istirahat
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* HR Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400">HR Istirahat</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {athleteData.resting_hr} <span className="text-xs font-normal">bpm</span>
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                      <p className="text-xs text-red-600 dark:text-red-400">HR Maksimal</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {maxHR} <span className="text-xs font-normal">bpm</span>
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                      <p className="text-xs text-purple-600 dark:text-purple-400">HR Reserve</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {maxHR! - athleteData.resting_hr!} <span className="text-xs font-normal">bpm</span>
                      </p>
                    </div>
                  </div>

                  {/* HR Zones */}
                  <div className="space-y-2">
                    {hrZones.map(zone => (
                      <div key={zone.zone} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={cn("w-3 h-full min-h-[48px] rounded-full", zone.color)} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">Zona {zone.zone}</span>
                              <Badge variant="outline" className="text-[10px]">{zone.name}</Badge>
                            </div>
                            <span className="text-sm font-mono font-bold">{zone.range}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">{zone.description}</p>
                            <Badge variant="secondary" className="text-[10px]">{zone.intensity}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info Note */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 mt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        <p className="font-semibold">Metode Karvonen</p>
                        <p className="mt-1">
                          Zona HR dihitung menggunakan formula Karvonen: Target HR = HR Istirahat + (Intensitas × HR Reserve)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
