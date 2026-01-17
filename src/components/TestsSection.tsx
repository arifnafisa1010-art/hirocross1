import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Loader2, Edit2, TrendingUp, Download, BookOpen, FileText, GitCompare, LayoutDashboard } from 'lucide-react';
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestNormsTable } from './TestNormsTable';
import { AthleteEvaluationReport } from './AthleteEvaluationReport';
import { PeriodComparisonReport } from './PeriodComparisonReport';
import { BiomotorDashboard } from './BiomotorDashboard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Biomotor test categories matching database norms
const categories = [
  'Kekuatan',
  'Daya Tahan',
  'Kecepatan',
  'Fleksibilitas',
  'Power',
  'Kelincahan',
  'Keseimbangan',
  'Reaksi',
];

// Items for each biomotor category matching database norms
const items: Record<string, string[]> = {
  'Kekuatan': [
    'Push Up', 'Pull Up', 'Sit Up 60s', 'Hand Grip', 'Grip Strength Dynamometer',
    'Leg Press', 'Bench Press', 'Squat', 'Deadlift', 'Back Extension', 'Plank', 
    'Dips', 'Leg Dynamometer', 'Back Dynamometer', 'Arm Dynamometer'
  ],
  'Daya Tahan': ['Cooper Test 12min', 'Bleep Test', 'Yo-Yo IR1', 'Lari 2400m'],
  'Kecepatan': ['Sprint 30m', 'Sprint 60m', 'Sprint 100m'],
  'Fleksibilitas': ['Sit and Reach', 'Shoulder Flexibility', 'Trunk Rotation'],
  'Power': ['Vertical Jump', 'Standing Long Jump', 'Medicine Ball Throw'],
  'Kelincahan': ['Agility T-Test', 'Illinois Agility', 'Hexagon Test'],
  'Keseimbangan': ['Stork Stand Test', 'Y Balance Test', 'Single Leg Stance'],
  'Reaksi': ['Reaction Time', 'Audio Reaction', 'Visual Reaction'],
};

const defaultUnits: Record<string, string> = {
  // Kekuatan
  'Push Up': 'reps',
  'Pull Up': 'reps',
  'Sit Up 60s': 'reps',
  'Hand Grip': 'kg',
  'Grip Strength Dynamometer': 'kg',
  'Leg Press': 'kg',
  'Bench Press': 'xBW',
  'Squat': 'xBW',
  'Deadlift': 'xBW',
  'Back Extension': 'reps',
  'Plank': 's',
  'Dips': 'reps',
  'Leg Dynamometer': 'kg',
  'Back Dynamometer': 'kg',
  'Arm Dynamometer': 'kg',
  // Daya Tahan
  'Cooper Test 12min': 'm',
  'Bleep Test': 'level',
  'Yo-Yo IR1': 'level',
  'Lari 2400m': 'min',
  // Kecepatan
  'Sprint 30m': 's',
  'Sprint 60m': 's',
  'Sprint 100m': 's',
  // Fleksibilitas
  'Sit and Reach': 'cm',
  'Shoulder Flexibility': 'cm',
  'Trunk Rotation': 'degrees',
  // Power
  'Vertical Jump': 'cm',
  'Standing Long Jump': 'cm',
  'Medicine Ball Throw': 'm',
  // Kelincahan
  'Agility T-Test': 's',
  'Illinois Agility': 's',
  'Hexagon Test': 's',
  // Keseimbangan
  'Stork Stand Test': 's',
  'Y Balance Test': 'cm',
  'Single Leg Stance': 's',
  // Reaksi
  'Reaction Time': 'ms',
  'Audio Reaction': 'ms',
  'Visual Reaction': 'ms',
};

// Body weight ratio tests - need special handling
const bodyWeightRatioTests = ['Bench Press', 'Squat', 'Deadlift'];

// Validation ranges for test items
const testValueRanges: Record<string, { min: number; max: number; hint: string }> = {
  // Kekuatan
  'Push Up': { min: 0, max: 150, hint: '0-150 reps' },
  'Pull Up': { min: 0, max: 50, hint: '0-50 reps' },
  'Sit Up 60s': { min: 0, max: 100, hint: '0-100 reps' },
  'Hand Grip': { min: 5, max: 100, hint: '5-100 kg' },
  'Grip Strength Dynamometer': { min: 5, max: 100, hint: '5-100 kg' },
  'Leg Press': { min: 20, max: 500, hint: '20-500 kg' },
  'Bench Press': { min: 0.1, max: 4, hint: '0.1-4x berat badan (masukkan rasio)' },
  'Squat': { min: 0.1, max: 4, hint: '0.1-4x berat badan (masukkan rasio)' },
  'Deadlift': { min: 0.1, max: 5, hint: '0.1-5x berat badan (masukkan rasio)' },
  'Back Extension': { min: 0, max: 80, hint: '0-80 reps' },
  'Plank': { min: 5, max: 300, hint: '5-300 detik' },
  'Dips': { min: 0, max: 50, hint: '0-50 reps' },
  'Leg Dynamometer': { min: 20, max: 500, hint: '20-500 kg' },
  'Back Dynamometer': { min: 20, max: 400, hint: '20-400 kg' },
  'Arm Dynamometer': { min: 5, max: 100, hint: '5-100 kg' },
  // Daya Tahan
  'Cooper Test 12min': { min: 800, max: 4000, hint: '800-4000 m' },
  'Bleep Test': { min: 1, max: 21, hint: 'Level 1-21' },
  'Yo-Yo IR1': { min: 1, max: 23, hint: 'Level 1-23' },
  'Lari 2400m': { min: 6, max: 25, hint: '6-25 menit' },
  // Kecepatan
  'Sprint 30m': { min: 3, max: 10, hint: '3-10 detik' },
  'Sprint 60m': { min: 6, max: 18, hint: '6-18 detik' },
  'Sprint 100m': { min: 10, max: 25, hint: '10-25 detik' },
  // Fleksibilitas
  'Sit and Reach': { min: -20, max: 60, hint: '-20 sampai 60 cm' },
  'Shoulder Flexibility': { min: -25, max: 25, hint: '-25 sampai 25 cm' },
  'Trunk Rotation': { min: 10, max: 90, hint: '10-90 derajat' },
  // Power
  'Vertical Jump': { min: 5, max: 100, hint: '5-100 cm' },
  'Standing Long Jump': { min: 80, max: 380, hint: '80-380 cm' },
  'Medicine Ball Throw': { min: 1, max: 20, hint: '1-20 m' },
  // Kelincahan
  'Agility T-Test': { min: 7, max: 20, hint: '7-20 detik' },
  'Illinois Agility': { min: 12, max: 30, hint: '12-30 detik' },
  'Hexagon Test': { min: 8, max: 25, hint: '8-25 detik' },
  // Keseimbangan
  'Stork Stand Test': { min: 3, max: 120, hint: '3-120 detik' },
  'Y Balance Test': { min: 40, max: 160, hint: '40-160 cm' },
  'Single Leg Stance': { min: 3, max: 120, hint: '3-120 detik' },
  // Reaksi
  'Reaction Time': { min: 80, max: 600, hint: '80-600 ms' },
  'Audio Reaction': { min: 60, max: 500, hint: '60-500 ms' },
  'Visual Reaction': { min: 80, max: 600, hint: '80-600 ms' },
};

// Validation function for test values
const validateTestValue = (item: string, value: number): { valid: boolean; error?: string } => {
  const range = testValueRanges[item];
  if (!range) {
    // For unknown items, just ensure non-negative for most tests
    return { valid: true };
  }
  
  if (value < range.min || value > range.max) {
    return { 
      valid: false, 
      error: `Nilai harus antara ${range.min} dan ${range.max} (${range.hint})` 
    };
  }
  
  return { valid: true };
};

export function TestsSection() {
  const { athletes, loading: athletesLoading, addAthlete, updateAthlete } = useAthletes();
  const { calculateScore, getNormForItem, loading: normsLoading, getUnitForItem } = useTestNorms();
  const { results, loading: resultsLoading, addResult, deleteResult } = useTestResults();
  const historyRef = useRef<HTMLDivElement>(null);
  const [exportingHistory, setExportingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [form, setForm] = useState({
    athleteId: '',
    date: '',
    category: 'Kekuatan',
    item: 'Push Up',
    value: '',
    unit: 'reps',
    notes: '',
  });

  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<string>('__all__');
  const [selectedAthletesForComparison, setSelectedAthletesForComparison] = useState<string[]>([]);
  const [trendItem, setTrendItem] = useState<string>('');
  const [trendAthleteId, setTrendAthleteId] = useState<string>('');
  const [newAthleteDialog, setNewAthleteDialog] = useState(false);
  const [newAthlete, setNewAthlete] = useState({
    name: '',
    gender: 'M' as 'M' | 'F',
    birthDate: '',
    weight: '',
    sport: '',
    restingHr: '',
  });
  const [editingHrAthleteId, setEditingHrAthleteId] = useState<string | null>(null);
  const [editingHrValue, setEditingHrValue] = useState('');
  
  // Body weight ratio calculator states
  const [liftedWeight, setLiftedWeight] = useState<string>('');
  const [calculatedRatio, setCalculatedRatio] = useState<number | null>(null);

  // Get current athlete gender and age for norm lookup
  const currentAthlete = athletes.find(a => a.id === form.athleteId);
  const currentGender = currentAthlete?.gender || 'M';
  
  // Calculate athlete age from birth date
  const calculateAge = (birthDate: string | null): number => {
    if (!birthDate) return 20; // Default age
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  
  const currentAge = calculateAge(currentAthlete?.birth_date || null);

  // Auto-calculate score when value changes
  useEffect(() => {
    if (form.value && !normsLoading) {
      const value = parseFloat(form.value);
      if (!isNaN(value)) {
        const score = calculateScore(form.category, form.item, value, currentGender, currentAge);
        setCalculatedScore(score);
      }
    } else {
      setCalculatedScore(null);
    }
  }, [form.value, form.category, form.item, currentGender, currentAge, normsLoading, calculateScore]);

  // Auto-set unit when item changes
  useEffect(() => {
    const unit = defaultUnits[form.item] || 'kg';
    setForm(prev => ({ ...prev, unit }));
    // Reset ratio calculator when item changes
    setLiftedWeight('');
    setCalculatedRatio(null);
  }, [form.item]);

  // Calculate ratio when lifted weight changes
  useEffect(() => {
    if (bodyWeightRatioTests.includes(form.item) && liftedWeight && currentAthlete?.weight) {
      const lifted = parseFloat(liftedWeight);
      const bw = currentAthlete.weight;
      if (!isNaN(lifted) && bw > 0) {
        const ratio = Math.round((lifted / bw) * 100) / 100;
        setCalculatedRatio(ratio);
      } else {
        setCalculatedRatio(null);
      }
    } else {
      setCalculatedRatio(null);
    }
  }, [liftedWeight, currentAthlete?.weight, form.item]);

  const handleSubmit = async () => {
    if (!form.athleteId || !form.date || !form.value) {
      toast.error('Lengkapi data wajib: Atlet, Tanggal, dan Nilai!');
      return;
    }

    const value = parseFloat(form.value);
    
    // Validate the value is a valid number
    if (isNaN(value)) {
      toast.error('Nilai harus berupa angka yang valid!');
      return;
    }
    
    // Validate against realistic ranges
    const validation = validateTestValue(form.item, value);
    if (!validation.valid) {
      toast.error(validation.error || 'Nilai tidak valid!');
      return;
    }
    
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
      item: 'Push Up',
      value: '',
      unit: 'reps',
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
      resting_hr: newAthlete.restingHr ? parseInt(newAthlete.restingHr) : 60,
    });

    if (result) {
      setForm(prev => ({ ...prev, athleteId: result.id }));
      setNewAthleteDialog(false);
      setNewAthlete({ name: '', gender: 'M', birthDate: '', weight: '', sport: '', restingHr: '' });
    }
  };

  // Get athlete name by ID
  const getAthleteName = (athleteId: string | null) => {
    if (!athleteId) return '-';
    const athlete = athletes.find(a => a.id === athleteId);
    return athlete?.name || '-';
  };

  // Get norm info for display
  const currentNorm = getNormForItem(form.category, form.item, currentGender, currentAge);

  // Athlete colors for comparison chart
  const athleteColors = [
    'hsl(var(--accent))',
    'hsl(220, 70%, 50%)',
    'hsl(340, 70%, 50%)',
    'hsl(160, 70%, 40%)',
    'hsl(45, 80%, 45%)',
    'hsl(280, 60%, 50%)',
  ];

  // Build radar data for multi-athlete comparison
  const comparisonRadarData = useMemo(() => {
    if (selectedAthletesForComparison.length === 0) return [];

    // Get all unique items from all selected athletes
    const allItems = new Set<string>();
    const athleteItemScores: Record<string, Record<string, number>> = {};

    selectedAthletesForComparison.forEach(athleteId => {
      athleteItemScores[athleteId] = {};
      const athleteResults = results.filter(r => r.athlete_id === athleteId);
      
      // Get latest score per item
      const itemScores: Record<string, { score: number; date: string }> = {};
      athleteResults.forEach(r => {
        allItems.add(r.item);
        const existing = itemScores[r.item];
        if (!existing || new Date(r.test_date) > new Date(existing.date)) {
          itemScores[r.item] = { score: r.score, date: r.test_date };
        }
      });

      Object.entries(itemScores).forEach(([item, data]) => {
        athleteItemScores[athleteId][item] = data.score;
      });
    });

    // Create data array with all items
    return Array.from(allItems).map(item => {
      const dataPoint: Record<string, string | number> = { item };
      selectedAthletesForComparison.forEach(athleteId => {
        const athlete = athletes.find(a => a.id === athleteId);
        const key = athlete?.name || athleteId;
        dataPoint[key] = athleteItemScores[athleteId]?.[item] || 0;
      });
      return dataPoint;
    });
  }, [selectedAthletesForComparison, results, athletes]);

  // Build radar data - show each test item separately (not grouped by category)
  const radarData = useMemo(() => {
    const filteredResults = results.filter(
      r => selectedAthlete === '__all__' || r.athlete_id === selectedAthlete
    );

    // Group by item and get latest score for each item
    const itemScores: Record<string, { item: string; category: string; score: number; date: string }> = {};
    
    filteredResults.forEach(r => {
      const existing = itemScores[r.item];
      if (!existing || new Date(r.test_date) > new Date(existing.date)) {
        itemScores[r.item] = {
          item: r.item,
          category: r.category,
          score: r.score,
          date: r.test_date,
        };
      }
    });

    return Object.values(itemScores).map(entry => ({
      category: entry.item, // Use item name as radar axis label
      originalCategory: entry.category,
      score: entry.score,
      fullMark: 5,
      hasData: true,
    }));
  }, [results, selectedAthlete]);

  // Trend data for progress chart
  const trendData = useMemo(() => {
    if (!trendItem || !trendAthleteId) return [];

    const athleteResults = results
      .filter(r => r.athlete_id === trendAthleteId && r.item === trendItem)
      .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());

    return athleteResults.map(r => ({
      date: new Date(r.test_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }),
      value: r.value,
      score: r.score,
      unit: r.unit,
    }));
  }, [results, trendItem, trendAthleteId]);

  // Get unique test items from results
  const uniqueTestItems = useMemo(() => {
    const items = new Set<string>();
    results.forEach(r => items.add(r.item));
    return Array.from(items);
  }, [results]);

  const scoreLabels: Record<number, string> = {
    1: 'Sangat Kurang',
    2: 'Kurang',
    3: 'Cukup',
    4: 'Baik',
    5: 'Sangat Baik',
  };

  const toggleAthleteForComparison = (athleteId: string) => {
    setSelectedAthletesForComparison(prev => {
      if (prev.includes(athleteId)) {
        return prev.filter(id => id !== athleteId);
      }
      if (prev.length >= 6) {
        toast.error('Maksimal 6 atlet untuk perbandingan');
        return prev;
      }
      return [...prev, athleteId];
    });
  };

  // Export test history to PDF
  const handleExportHistoryPDF = async () => {
    if (!historyRef.current) return;

    setExportingHistory(true);
    try {
      const canvas = await html2canvas(historyRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Riwayat_Tes_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('PDF berhasil diexport!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Gagal export PDF');
    } finally {
      setExportingHistory(false);
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">Tes & Pengukuran Fisik</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Input Tes</span>
          </TabsTrigger>
          <TabsTrigger value="norms" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Norma Tes</span>
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Evaluasi</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            <span className="hidden sm:inline">Perbandingan</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Analisis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <BiomotorDashboard />
        </TabsContent>

        <TabsContent value="input" className="space-y-6 mt-6">

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
                      <div>
                        <Label>Resting Heart Rate (bpm)</Label>
                        <Input
                          type="number"
                          value={newAthlete.restingHr}
                          onChange={(e) => setNewAthlete({ ...newAthlete, restingHr: e.target.value })}
                          placeholder="60"
                          className="mt-1.5"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Ukur saat bangun tidur. Default: 60 bpm
                        </p>
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

            {/* Body Weight Ratio Calculator */}
            {bodyWeightRatioTests.includes(form.item) && (
              <div className="col-span-2 p-3 bg-accent/10 rounded-lg border border-accent/30">
                <Label className="text-xs font-extrabold text-accent uppercase">
                  Kalkulator Rasio Berat Badan
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Berat Angkat (kg)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={liftedWeight}
                      onChange={(e) => setLiftedWeight(e.target.value)}
                      placeholder="Contoh: 80"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">BB Atlet (kg)</Label>
                    <div className="mt-1 h-8 px-3 flex items-center bg-secondary rounded-md text-sm font-medium">
                      {currentAthlete?.weight ? `${currentAthlete.weight} kg` : 'Belum diisi'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Hasil Rasio</Label>
                    <div className={`mt-1 h-8 px-3 flex items-center justify-center rounded-md text-sm font-bold ${
                      calculatedRatio !== null ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {calculatedRatio !== null ? `${calculatedRatio}x BW` : '-'}
                    </div>
                  </div>
                </div>
                {calculatedRatio !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full h-7 text-xs"
                    onClick={() => setForm({ ...form, value: String(calculatedRatio) })}
                  >
                    Gunakan Rasio {calculatedRatio}x sebagai Nilai
                  </Button>
                )}
                {!currentAthlete?.weight && currentAthlete && (
                  <p className="text-[10px] text-destructive mt-2">
                    ⚠️ Berat badan atlet belum diisi. Silakan update data atlet terlebih dahulu.
                  </p>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Nilai ({form.unit})
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={bodyWeightRatioTests.includes(form.item) ? "Rasio (misal: 1.5)" : "Masukkan nilai"}
                className="mt-1.5"
              />
              {bodyWeightRatioTests.includes(form.item) && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Masukkan rasio (berat angkat ÷ berat badan) atau gunakan kalkulator di atas
                </p>
              )}
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

      {/* Multi-Athlete Comparison Chart */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Perbandingan Antar Atlet
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Pilih maksimal 6 atlet untuk membandingkan profil tes dalam satu radar chart
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {athletes.map((athlete, index) => (
              <label
                key={athlete.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                  selectedAthletesForComparison.includes(athlete.id)
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:bg-secondary/50'
                }`}
              >
                <Checkbox
                  checked={selectedAthletesForComparison.includes(athlete.id)}
                  onCheckedChange={() => toggleAthleteForComparison(athlete.id)}
                />
                <span className="text-sm font-medium">{athlete.name}</span>
                {selectedAthletesForComparison.includes(athlete.id) && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: athleteColors[selectedAthletesForComparison.indexOf(athlete.id)] }}
                  />
                )}
              </label>
            ))}
          </div>
          
          {selectedAthletesForComparison.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={comparisonRadarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="item" 
                    tick={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--foreground))' }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 5]} 
                    tick={{ fontSize: 10 }}
                  />
                  {selectedAthletesForComparison.map((athleteId, index) => {
                    const athlete = athletes.find(a => a.id === athleteId);
                    const name = athlete?.name || athleteId;
                    return (
                      <Radar
                        key={athleteId}
                        name={name}
                        dataKey={name}
                        stroke={athleteColors[index]}
                        fill={athleteColors[index]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    );
                  })}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              Pilih atlet untuk melihat perbandingan
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Grafik Tren Perkembangan
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Lihat perkembangan hasil tes atlet dari waktu ke waktu
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Pilih Atlet
              </Label>
              <Select value={trendAthleteId} onValueChange={setTrendAthleteId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Pilih atlet..." />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Pilih Item Tes
              </Label>
              <Select value={trendItem} onValueChange={setTrendItem}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Pilih item tes..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTestItems.map(item => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {trendData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ 
                      value: `Nilai (${trendData[0]?.unit || ''})`, 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
                    }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 5]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ 
                      value: 'Skor', 
                      angle: 90, 
                      position: 'insideRight',
                      style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'value') return [`${value} ${trendData[0]?.unit || ''}`, 'Nilai'];
                      if (name === 'score') return [`${value}/5`, 'Skor'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="value" 
                    name="Nilai"
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="score" 
                    name="Skor"
                    stroke="hsl(220, 70%, 50%)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(220, 70%, 50%)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              {trendAthleteId && trendItem 
                ? 'Belum ada data untuk item tes ini'
                : 'Pilih atlet dan item tes untuk melihat tren'
              }
            </div>
          )}
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
            // Resting HR from athlete data or default 60 bpm
            const restingHR = athlete.resting_hr || 60;
            // Heart Rate Reserve
            const hrr = maxHR - restingHR;

            // RPE to HR Zone mapping (Karvonen method) - individual RPE 1-10
            const zones = [
              { rpe: 1, zone: 'Istirahat Aktif', intensity: '50-55%', hrMin: Math.round(restingHR + (hrr * 0.50)), hrMax: Math.round(restingHR + (hrr * 0.55)), color: 'bg-slate-100 text-slate-700 border-slate-300' },
              { rpe: 2, zone: 'Pemulihan Ringan', intensity: '55-60%', hrMin: Math.round(restingHR + (hrr * 0.55)), hrMax: Math.round(restingHR + (hrr * 0.60)), color: 'bg-blue-100 text-blue-700 border-blue-300' },
              { rpe: 3, zone: 'Aerobik Ringan', intensity: '60-65%', hrMin: Math.round(restingHR + (hrr * 0.60)), hrMax: Math.round(restingHR + (hrr * 0.65)), color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
              { rpe: 4, zone: 'Aerobik Dasar', intensity: '65-70%', hrMin: Math.round(restingHR + (hrr * 0.65)), hrMax: Math.round(restingHR + (hrr * 0.70)), color: 'bg-green-100 text-green-700 border-green-300' },
              { rpe: 5, zone: 'Aerobik Sedang', intensity: '70-75%', hrMin: Math.round(restingHR + (hrr * 0.70)), hrMax: Math.round(restingHR + (hrr * 0.75)), color: 'bg-lime-100 text-lime-700 border-lime-300' },
              { rpe: 6, zone: 'Tempo', intensity: '75-80%', hrMin: Math.round(restingHR + (hrr * 0.75)), hrMax: Math.round(restingHR + (hrr * 0.80)), color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
              { rpe: 7, zone: 'Ambang Laktat', intensity: '80-85%', hrMin: Math.round(restingHR + (hrr * 0.80)), hrMax: Math.round(restingHR + (hrr * 0.85)), color: 'bg-amber-100 text-amber-700 border-amber-300' },
              { rpe: 8, zone: 'VO2Max Submaksimal', intensity: '85-90%', hrMin: Math.round(restingHR + (hrr * 0.85)), hrMax: Math.round(restingHR + (hrr * 0.90)), color: 'bg-orange-100 text-orange-700 border-orange-300' },
              { rpe: 9, zone: 'VO2Max', intensity: '90-95%', hrMin: Math.round(restingHR + (hrr * 0.90)), hrMax: Math.round(restingHR + (hrr * 0.95)), color: 'bg-red-100 text-red-600 border-red-300' },
              { rpe: 10, zone: 'Maksimal', intensity: '95-100%', hrMin: Math.round(restingHR + (hrr * 0.95)), hrMax: maxHR, color: 'bg-red-200 text-red-800 border-red-400' },
            ];

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg flex-wrap">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Usia</p>
                    <p className="text-lg font-bold">{age} tahun</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">HR Max</p>
                    <p className="text-lg font-bold text-destructive">{maxHR} bpm</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Resting HR</p>
                    {editingHrAthleteId === athlete.id ? (
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          value={editingHrValue}
                          onChange={(e) => setEditingHrValue(e.target.value)}
                          className="w-16 h-8 text-center text-sm"
                          placeholder="60"
                        />
                        <Button 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={async () => {
                            const newHr = parseInt(editingHrValue) || 60;
                            await updateAthlete(athlete.id, { resting_hr: newHr });
                            setEditingHrAthleteId(null);
                            setEditingHrValue('');
                          }}
                        >
                          ✓
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2"
                          onClick={() => {
                            setEditingHrAthleteId(null);
                            setEditingHrValue('');
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <p className="text-lg font-bold">{restingHR} bpm</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingHrAthleteId(athlete.id);
                            setEditingHrValue(restingHR.toString());
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Riwayat Tes</CardTitle>
            <Button 
              onClick={handleExportHistoryPDF} 
              disabled={exportingHistory || results.length === 0}
              variant="outline"
              size="sm"
            >
              {exportingHistory ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <div ref={historyRef} className="bg-white p-4 rounded-lg">
              <div className="text-center mb-4 pb-4 border-b border-border">
                <h3 className="font-bold text-lg">Riwayat Hasil Tes Fisik</h3>
                <p className="text-xs text-muted-foreground">
                  Tanggal: {format(new Date(), 'd MMMM yyyy', { locale: idLocale })}
                </p>
              </div>
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
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase w-16 print:hidden">Hapus</th>
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
                          <td className="p-3 text-center print:hidden">
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
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="norms" className="space-y-6 mt-6">
          <TestNormsTable />
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-6 mt-6">
          <AthleteEvaluationReport />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6 mt-6">
          <PeriodComparisonReport />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6 mt-6">
          {/* Radar Chart */}
          <Card className="border-border shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-base">Profil Performa Atlet</CardTitle>
                <Select
                  value={selectedAthlete}
                  onValueChange={setSelectedAthlete}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Atlet" />
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
              {radarData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis 
                        dataKey="item" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 5]} 
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Skor"
                        dataKey="score"
                        stroke="hsl(var(--accent))"
                        fill="hsl(var(--accent))"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Belum ada data tes untuk ditampilkan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card className="border-border shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tren Perkembangan
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Select
                    value={trendAthleteId}
                    onValueChange={setTrendAthleteId}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Pilih Atlet" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={trendItem}
                    onValueChange={setTrendItem}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Pilih Item" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        items[cat]?.map(item => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('id-ID')}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="Nilai"
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Skor"
                        stroke="hsl(220, 70%, 50%)" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: 'hsl(220, 70%, 50%)', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  {trendAthleteId && trendItem 
                    ? 'Belum ada data untuk item tes ini'
                    : 'Pilih atlet dan item tes untuk melihat tren'
                  }
                </div>
              )}
            </CardContent>
          </Card>

          {/* Heart Rate Zones */}
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

                const birthDate = new Date(athlete.birth_date);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                const maxHR = Math.round(208 - (0.7 * age));
                const restingHR = athlete.resting_hr || 60;
                const hrr = maxHR - restingHR;

                const zones = [
                  { rpe: 1, zone: 'Istirahat Aktif', intensity: '50-55%', hrMin: Math.round(restingHR + (hrr * 0.50)), hrMax: Math.round(restingHR + (hrr * 0.55)), color: 'bg-slate-100 text-slate-700 border-slate-300' },
                  { rpe: 2, zone: 'Pemulihan Ringan', intensity: '55-60%', hrMin: Math.round(restingHR + (hrr * 0.55)), hrMax: Math.round(restingHR + (hrr * 0.60)), color: 'bg-blue-100 text-blue-700 border-blue-300' },
                  { rpe: 3, zone: 'Aerobik Ringan', intensity: '60-65%', hrMin: Math.round(restingHR + (hrr * 0.60)), hrMax: Math.round(restingHR + (hrr * 0.65)), color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
                  { rpe: 4, zone: 'Aerobik Dasar', intensity: '65-70%', hrMin: Math.round(restingHR + (hrr * 0.65)), hrMax: Math.round(restingHR + (hrr * 0.70)), color: 'bg-green-100 text-green-700 border-green-300' },
                  { rpe: 5, zone: 'Aerobik Sedang', intensity: '70-75%', hrMin: Math.round(restingHR + (hrr * 0.70)), hrMax: Math.round(restingHR + (hrr * 0.75)), color: 'bg-lime-100 text-lime-700 border-lime-300' },
                  { rpe: 6, zone: 'Tempo', intensity: '75-80%', hrMin: Math.round(restingHR + (hrr * 0.75)), hrMax: Math.round(restingHR + (hrr * 0.80)), color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                  { rpe: 7, zone: 'Ambang Laktat', intensity: '80-85%', hrMin: Math.round(restingHR + (hrr * 0.80)), hrMax: Math.round(restingHR + (hrr * 0.85)), color: 'bg-amber-100 text-amber-700 border-amber-300' },
                  { rpe: 8, zone: 'VO2Max Submaksimal', intensity: '85-90%', hrMin: Math.round(restingHR + (hrr * 0.85)), hrMax: Math.round(restingHR + (hrr * 0.90)), color: 'bg-orange-100 text-orange-700 border-orange-300' },
                  { rpe: 9, zone: 'VO2Max', intensity: '90-95%', hrMin: Math.round(restingHR + (hrr * 0.90)), hrMax: Math.round(restingHR + (hrr * 0.95)), color: 'bg-red-100 text-red-600 border-red-300' },
                  { rpe: 10, zone: 'Maksimal', intensity: '95-100%', hrMin: Math.round(restingHR + (hrr * 0.95)), hrMax: maxHR, color: 'bg-red-200 text-red-800 border-red-400' },
                ];

                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg flex-wrap">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Usia</p>
                        <p className="text-lg font-bold">{age} tahun</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">HR Max</p>
                        <p className="text-lg font-bold text-destructive">{maxHR} bpm</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Resting HR</p>
                        {editingHrAthleteId === athlete.id ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Input
                              type="number"
                              value={editingHrValue}
                              onChange={(e) => setEditingHrValue(e.target.value)}
                              className="w-16 h-8 text-center text-sm"
                              placeholder="60"
                            />
                            <Button 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={async () => {
                                const newHr = parseInt(editingHrValue) || 60;
                                await updateAthlete(athlete.id, { resting_hr: newHr });
                                setEditingHrAthleteId(null);
                                setEditingHrValue('');
                              }}
                            >
                              ✓
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2"
                              onClick={() => {
                                setEditingHrAthleteId(null);
                                setEditingHrValue('');
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <p className="text-lg font-bold">{restingHR} bpm</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setEditingHrAthleteId(athlete.id);
                                setEditingHrValue(restingHR.toString());
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
