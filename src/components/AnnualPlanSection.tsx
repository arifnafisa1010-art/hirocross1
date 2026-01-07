import { useState, useEffect } from 'react';
import { useTrainingStore, TrainingBlocks, TrainingBlock, BlockCategory, ScheduledEvent } from '@/stores/trainingStore';
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus, Settings, Loader2, Trophy, Merge, Split, FlaskConical, Flag } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, addWeeks, getDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const phaseColors: Record<string, string> = {
  'Umum': 'hsl(195, 53%, 79%)',
  'Khusus': 'hsl(120, 73%, 75%)',
  'Pra-Komp': 'hsl(39, 100%, 65%)',
  'Kompetisi': 'hsl(0, 86%, 60%)',
};

// Helper function to determine period based on phase
const getPeriodForPhase = (fase: string): string => {
  if (fase === 'Umum' || fase === 'Khusus') return 'PERSIAPAN';
  return 'PERTANDINGAN';
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

const blockColors: Record<BlockCategory, { bg: string; text: string; border: string }> = {
  kekuatan: { bg: 'bg-orange-500/30', text: 'text-orange-800', border: 'border-orange-500' },
  kecepatan: { bg: 'bg-blue-500/30', text: 'text-blue-800', border: 'border-blue-500' },
  dayaTahan: { bg: 'bg-green-500/30', text: 'text-green-800', border: 'border-green-500' },
  fleksibilitas: { bg: 'bg-purple-500/30', text: 'text-purple-800', border: 'border-purple-500' },
  mental: { bg: 'bg-rose-500/30', text: 'text-rose-800', border: 'border-rose-500' },
};

export function AnnualPlanSection() {
  const { 
    setup, 
    mesocycles, 
    planData, 
    totalWeeks,
    competitions,
    trainingBlocks,
    setTrainingBlocks,
    scheduledEvents,
    setScheduledEvents,
    selectedAthleteIds,
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

  const [selectedCells, setSelectedCells] = useState<{ category: BlockCategory; weeks: number[] }>({ category: 'kekuatan', weeks: [] });
  const [editingBlock, setEditingBlock] = useState<{ category: BlockCategory; index: number } | null>(null);
  const [blockText, setBlockText] = useState('');
  const [addingEvent, setAddingEvent] = useState<{ week: number } | null>(null);
  const [newEventType, setNewEventType] = useState<'test' | 'competition'>('test');
  const [newEventName, setNewEventName] = useState('');

  // Calculate week dates based on start date
  const getWeekDateRange = (weekNumber: number) => {
    if (!setup.startDate) return { start: '', end: '', month: '' };
    
    const startDate = new Date(setup.startDate);
    const weekStart = addWeeks(startDate, weekNumber - 1);
    const weekEnd = addDays(weekStart, 6);
    
    const startDay = format(weekStart, 'd', { locale: localeID });
    const endDay = format(weekEnd, 'd', { locale: localeID });
    const month = format(weekStart, 'MMMM', { locale: localeID }).toUpperCase();
    
    return { 
      start: startDay, 
      end: endDay, 
      month,
      dateRange: `${startDay}-${endDay}`,
      fullDate: format(weekStart, 'yyyy-MM-dd')
    };
  };

  // Group weeks by month for header
  const getMonthGroups = () => {
    if (!setup.startDate || planData.length === 0) return [];
    
    const groups: { month: string; weeks: number[] }[] = [];
    let currentMonth = '';
    let currentGroup: { month: string; weeks: number[] } | null = null;

    planData.forEach((d) => {
      const { month } = getWeekDateRange(d.wk);
      if (month !== currentMonth) {
        if (currentGroup) groups.push(currentGroup);
        currentMonth = month;
        currentGroup = { month, weeks: [d.wk] };
      } else {
        currentGroup?.weeks.push(d.wk);
      }
    });
    if (currentGroup) groups.push(currentGroup);
    return groups;
  };

  const addScheduledEvent = () => {
    if (!addingEvent || !newEventName.trim()) return;
    
    const { fullDate } = getWeekDateRange(addingEvent.week);
    const newEvent: ScheduledEvent = { week: addingEvent.week, type: newEventType, name: newEventName, date: fullDate };
    setScheduledEvents([...scheduledEvents, newEvent]);
    setAddingEvent(null);
    setNewEventName('');
    setNewEventType('test');
  };

  const removeScheduledEvent = (week: number) => {
    setScheduledEvents(scheduledEvents.filter(e => e.week !== week));
  };

  const getEventForWeek = (week: number) => {
    return scheduledEvents.find(e => e.week === week);
  };

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
    await saveProgram(setup, mesocycles, planData, competitions, selectedAthleteIds, trainingBlocks, scheduledEvents);
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

  // Block management functions
  const handleCellClick = (category: BlockCategory, week: number) => {
    // Check if this week is part of an existing block
    const existingBlockIndex = trainingBlocks[category].findIndex(
      block => week >= block.startWeek && week <= block.endWeek
    );

    if (existingBlockIndex !== -1) {
      // Edit existing block
      setEditingBlock({ category, index: existingBlockIndex });
      setBlockText(trainingBlocks[category][existingBlockIndex].text);
      return;
    }

    // Add/remove from selection
    if (selectedCells.category !== category) {
      setSelectedCells({ category, weeks: [week] });
    } else {
      if (selectedCells.weeks.includes(week)) {
        setSelectedCells({ ...selectedCells, weeks: selectedCells.weeks.filter(w => w !== week) });
      } else {
        setSelectedCells({ ...selectedCells, weeks: [...selectedCells.weeks, week].sort((a, b) => a - b) });
      }
    }
  };

  const createBlock = () => {
    if (selectedCells.weeks.length === 0 || !blockText.trim()) return;

    const startWeek = Math.min(...selectedCells.weeks);
    const endWeek = Math.max(...selectedCells.weeks);

    // Check for overlapping blocks
    const hasOverlap = trainingBlocks[selectedCells.category].some(
      block => !(endWeek < block.startWeek || startWeek > block.endWeek)
    );

    if (hasOverlap) {
      return; // Don't create if overlapping
    }

    const newBlock: TrainingBlock = { startWeek, endWeek, text: blockText };
    const updatedBlocks: TrainingBlocks = {
      ...trainingBlocks,
      [selectedCells.category]: [...trainingBlocks[selectedCells.category], newBlock].sort((a, b) => a.startWeek - b.startWeek),
    };
    setTrainingBlocks(updatedBlocks);

    setSelectedCells({ category: selectedCells.category, weeks: [] });
    setBlockText('');
  };

  const updateBlock = () => {
    if (!editingBlock || !blockText.trim()) return;

    const updatedBlocks: TrainingBlocks = {
      ...trainingBlocks,
      [editingBlock.category]: trainingBlocks[editingBlock.category].map((block, i) =>
        i === editingBlock.index ? { ...block, text: blockText } : block
      ),
    };
    setTrainingBlocks(updatedBlocks);

    setEditingBlock(null);
    setBlockText('');
  };

  const deleteBlock = () => {
    if (!editingBlock) return;

    const updatedBlocks: TrainingBlocks = {
      ...trainingBlocks,
      [editingBlock.category]: trainingBlocks[editingBlock.category].filter((_, i) => i !== editingBlock.index),
    };
    setTrainingBlocks(updatedBlocks);

    setEditingBlock(null);
    setBlockText('');
  };

  const getBlockForWeek = (category: BlockCategory, week: number) => {
    const categoryBlocks = trainingBlocks?.[category] || [];
    return categoryBlocks.find(block => week >= block.startWeek && week <= block.endWeek);
  };

  const isBlockStart = (category: BlockCategory, week: number) => {
    const block = getBlockForWeek(category, week);
    return block?.startWeek === week;
  };

  const getBlockSpan = (category: BlockCategory, week: number) => {
    const block = getBlockForWeek(category, week);
    if (!block || block.startWeek !== week) return 0;
    return block.endWeek - block.startWeek + 1;
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

  const monthGroups = getMonthGroups();

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
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

      {/* Calendar Table: Bulan, Minggu, Tanggal, Tes & Komp */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold text-muted-foreground uppercase">
            Kalender Periodisasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse">
              {/* Bulan Row */}
              <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="p-2 text-left text-[10px] font-extrabold uppercase w-24 border-r border-orange-600">
                    Bulan
                  </th>
                  {monthGroups.map((group, i) => (
                    <th 
                      key={i} 
                      colSpan={group.weeks.length}
                      className="p-2 text-center text-[10px] font-extrabold uppercase border-r border-orange-600 last:border-r-0"
                    >
                      {group.month}
                    </th>
                  ))}
                </tr>
                {/* Minggu Row */}
                <tr className="bg-orange-400 text-white">
                  <th className="p-2 text-left text-[10px] font-extrabold uppercase border-r border-orange-500">
                    Minggu
                  </th>
                  {planData.map((d) => (
                    <th 
                      key={d.wk} 
                      className="p-1 text-center text-[10px] font-bold border-r border-orange-500/50 last:border-r-0 min-w-[45px]"
                    >
                      {d.wk}
                    </th>
                  ))}
                </tr>
                {/* Tanggal Row */}
                <tr className="bg-orange-300 text-orange-900">
                  <th className="p-2 text-left text-[10px] font-extrabold uppercase border-r border-orange-400">
                    Tanggal
                  </th>
                  {planData.map((d) => {
                    const { dateRange } = getWeekDateRange(d.wk);
                    return (
                      <th 
                        key={d.wk} 
                        className="p-1 text-center text-[9px] font-semibold border-r border-orange-400/50 last:border-r-0"
                      >
                        {dateRange}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              {/* Periode & Fase Rows + Tes & Kompetisi Row */}
              <tbody>
                {/* Periode Row */}
                <tr className="bg-gray-700 text-white">
                  <td className="p-2 text-left text-[10px] font-extrabold uppercase border-r border-gray-600">
                    Periode
                  </td>
                  {(() => {
                    const groups: { period: string; weeks: number[] }[] = [];
                    let currentPeriod = '';
                    let currentGroup: { period: string; weeks: number[] } | null = null;

                    planData.forEach((d) => {
                      const period = getPeriodForPhase(d.fase);
                      if (period !== currentPeriod) {
                        if (currentGroup) groups.push(currentGroup);
                        currentPeriod = period;
                        currentGroup = { period, weeks: [d.wk] };
                      } else {
                        currentGroup?.weeks.push(d.wk);
                      }
                    });
                    if (currentGroup) groups.push(currentGroup);

                    return groups.map((group, i) => (
                      <td 
                        key={i} 
                        colSpan={group.weeks.length}
                        className={cn(
                          "p-2 text-center text-[10px] font-extrabold uppercase border-r border-gray-600 last:border-r-0",
                          group.period === 'PERSIAPAN' ? 'bg-gray-600' : 'bg-gray-800'
                        )}
                      >
                        {group.period}
                      </td>
                    ));
                  })()}
                </tr>
                {/* Fase Row */}
                <tr className="bg-secondary/70">
                  <td className="p-2 text-left text-[10px] font-extrabold uppercase border-r border-border">
                    Fase
                  </td>
                  {(() => {
                    const groups: { fase: string; weeks: number[] }[] = [];
                    let currentFase = '';
                    let currentGroup: { fase: string; weeks: number[] } | null = null;

                    planData.forEach((d) => {
                      if (d.fase !== currentFase) {
                        if (currentGroup) groups.push(currentGroup);
                        currentFase = d.fase;
                        currentGroup = { fase: d.fase, weeks: [d.wk] };
                      } else {
                        currentGroup?.weeks.push(d.wk);
                      }
                    });
                    if (currentGroup) groups.push(currentGroup);

                    return groups.map((group, i) => (
                      <td 
                        key={i} 
                        colSpan={group.weeks.length}
                        className={cn(
                          "p-2 text-center text-[10px] font-extrabold uppercase border-r border-border last:border-r-0",
                          phaseClasses[group.fase]
                        )}
                      >
                        {group.fase}
                      </td>
                    ));
                  })()}
                </tr>
                {/* Tes & Kompetisi Row */}
                <tr className="bg-card border-t-2 border-border">
                  <td className="p-2 text-left text-[10px] font-extrabold uppercase border-r border-border bg-secondary/50">
                    Tes & Komp
                  </td>
                  {planData.map((d) => {
                    const event = getEventForWeek(d.wk);
                    return (
                      <td 
                        key={d.wk} 
                        className={cn(
                          "p-1 text-center border-r border-border/50 last:border-r-0 cursor-pointer transition-all",
                          event?.type === 'test' && "bg-blue-500/30",
                          event?.type === 'competition' && "bg-red-500/30",
                          !event && "hover:bg-secondary/50"
                        )}
                        onClick={() => {
                          if (event) {
                            removeScheduledEvent(d.wk);
                          } else {
                            setAddingEvent({ week: d.wk });
                          }
                        }}
                      >
                        {event ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {event.type === 'test' ? (
                              <FlaskConical className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Flag className="w-3 h-3 text-red-600" />
                            )}
                            <span className={cn(
                              "text-[8px] font-bold truncate max-w-[40px]",
                              event.type === 'test' ? 'text-blue-700' : 'text-red-700'
                            )}>
                              {event.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={!!addingEvent} onOpenChange={(open) => !open && setAddingEvent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Tes atau Kompetisi - Minggu {addingEvent?.week}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipe</Label>
              <Select value={newEventType} onValueChange={(v) => setNewEventType(v as 'test' | 'competition')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">
                    <span className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-blue-500" />
                      Tes
                    </span>
                  </SelectItem>
                  <SelectItem value="competition">
                    <span className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-500" />
                      Kompetisi
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nama</Label>
              <Input 
                value={newEventName} 
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder={newEventType === 'test' ? 'Contoh: Tes Fisik' : 'Contoh: Kejuaraan Nasional'}
                className="mt-1"
              />
            </div>
            <Button onClick={addScheduledEvent} className="w-full" disabled={!newEventName.trim()}>
              Tambah
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                    {/* Scheduled Events Reference Lines */}
                    {scheduledEvents.map((event, i) => (
                      <ReferenceLine
                        key={`event-${i}`}
                        x={`W${event.week}`}
                        stroke={event.type === 'test' ? 'hsl(217, 91%, 60%)' : 'hsl(var(--destructive))'}
                        strokeWidth={2}
                        strokeDasharray={event.type === 'test' ? '3 3' : '5 5'}
                        label={{
                          value: event.type === 'test' ? `🧪 ${event.name}` : `🏁 ${event.name}`,
                          position: 'top',
                          fill: event.type === 'test' ? 'hsl(217, 91%, 60%)' : 'hsl(var(--destructive))',
                          fontSize: 9,
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

      {/* Tujuan Latihan Table with Blocks */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-extrabold text-muted-foreground uppercase">
              Tujuan Latihan Per Minggu (Blok)
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedCells.weeks.length > 0 && (
                <>
                  <Input
                    type="text"
                    placeholder="Nama blok (contoh: Adaptasi Anatomi)"
                    value={blockText}
                    onChange={(e) => setBlockText(e.target.value)}
                    className="w-64 h-8 text-xs"
                  />
                  <Button size="sm" onClick={createBlock} disabled={!blockText.trim()}>
                    <Merge className="w-3 h-3 mr-1" />
                    Buat Blok ({selectedCells.weeks.length} minggu)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedCells({ ...selectedCells, weeks: [] })}>
                    Batal
                  </Button>
                </>
              )}
              {editingBlock && (
                <>
                  <Input
                    type="text"
                    placeholder="Edit nama blok"
                    value={blockText}
                    onChange={(e) => setBlockText(e.target.value)}
                    className="w-64 h-8 text-xs"
                  />
                  <Button size="sm" onClick={updateBlock}>
                    Simpan
                  </Button>
                  <Button size="sm" variant="destructive" onClick={deleteBlock}>
                    <Split className="w-3 h-3 mr-1" />
                    Hapus Blok
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingBlock(null); setBlockText(''); }}>
                    Batal
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Klik beberapa minggu untuk memilih, lalu buat blok dengan warna. Klik blok yang sudah ada untuk mengedit.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase w-32 border-r border-border">
                    Tujuan Latihan
                  </th>
                  {planData.map((d) => (
                    <th key={d.wk} className="p-2 text-center text-[10px] font-extrabold text-muted-foreground uppercase min-w-[60px] border-r border-border last:border-r-0">
                      W{d.wk}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['kekuatan', 'kecepatan', 'dayaTahan', 'fleksibilitas', 'mental'] as BlockCategory[]).map((category) => {
                  const labels: Record<BlockCategory, string> = {
                    kekuatan: 'Kekuatan',
                    kecepatan: 'Kecepatan',
                    dayaTahan: 'Daya Tahan',
                    fleksibilitas: 'Fleksibilitas',
                    mental: 'Mental',
                  };

                  const renderedWeeks = new Set<number>();

                  return (
                    <tr key={category} className="border-t border-border/50">
                      <td className={cn(
                        "p-3 font-bold text-sm border-r border-border",
                        blockColors[category].bg,
                        blockColors[category].text
                      )}>
                        {labels[category]}
                      </td>
                      {planData.map((d) => {
                        const week = d.wk;
                        
                        // Skip if already rendered as part of a block
                        if (renderedWeeks.has(week)) return null;

                        const block = getBlockForWeek(category, week);
                        const span = getBlockSpan(category, week);

                        if (block && isBlockStart(category, week)) {
                          // Mark all weeks in this block as rendered
                          for (let w = block.startWeek; w <= block.endWeek; w++) {
                            renderedWeeks.add(w);
                          }

                          return (
                            <td
                              key={week}
                              colSpan={span}
                              className={cn(
                                "p-2 text-center cursor-pointer transition-all border-2",
                                blockColors[category].bg,
                                blockColors[category].text,
                                blockColors[category].border,
                                "hover:opacity-80 font-bold text-xs rounded-lg"
                              )}
                              onClick={() => handleCellClick(category, week)}
                            >
                              {block.text}
                            </td>
                          );
                        }

                        // Check if this week is already part of a block but not the start
                        if (block) return null;

                        const isSelected = selectedCells.category === category && selectedCells.weeks.includes(week);

                        return (
                          <td
                            key={week}
                            className={cn(
                              "p-1 text-center cursor-pointer transition-all border border-border/30",
                              isSelected && "bg-accent/30 ring-2 ring-accent",
                              !isSelected && "hover:bg-secondary/50"
                            )}
                            onClick={() => handleCellClick(category, week)}
                          >
                            <span className="text-xs text-muted-foreground">-</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
