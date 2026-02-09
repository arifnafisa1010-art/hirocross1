import { useState, useEffect, useRef } from 'react';
import { useTrainingStore, TrainingBlocks, TrainingBlock, BlockCategory, ScheduledEvent } from '@/stores/trainingStore';
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus, Settings, Loader2, Trophy, Merge, Split, FlaskConical, Flag, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ComposedChart, Bar } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [editingVolInt, setEditingVolInt] = useState<{ week: number; type: 'vol' | 'int' } | null>(null);
  const [editVolIntValue, setEditVolIntValue] = useState<number>(0);
  const [inlineEditingBlock, setInlineEditingBlock] = useState<{ category: BlockCategory; startWeek: number } | null>(null);
  const [inlineBlockText, setInlineBlockText] = useState('');
  const [selectedPhaseWeeks, setSelectedPhaseWeeks] = useState<number[]>([]);
  const [editingEventWeek, setEditingEventWeek] = useState<number | null>(null);
  const [editEventName, setEditEventName] = useState('');
  const [editEventType, setEditEventType] = useState<'test' | 'competition'>('test');
  const [isDraggingPhase, setIsDraggingPhase] = useState(false);
  const [dragStartWeek, setDragStartWeek] = useState<number | null>(null);
  const [hoveredWeek, setHoveredWeek] = useState<{ week: number; vol: number; int: number; x: number; y: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Global mouseup to end drag-select
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingPhase) {
        setIsDraggingPhase(false);
        setDragStartWeek(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDraggingPhase]);

  // Calculate biomotor targets based on volume percentage
  const calculateBiomotorTargets = (vol: number) => {
    const targets = setup.targets;
    return {
      strength: Math.round((targets.strength * vol) / 100),
      speed: Math.round((targets.speed * vol) / 100),
      endurance: Math.round((targets.endurance * vol) / 100),
      technique: Math.round((targets.technique * vol) / 100),
      tactic: Math.round((targets.tactic * vol) / 100),
    };
  };

  // Export to PDF function
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${setup.planName || 'Annual-Plan'}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

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
      // Start inline editing for existing block
      const block = trainingBlocks[category][existingBlockIndex];
      setInlineEditingBlock({ category, startWeek: block.startWeek });
      setInlineBlockText(block.text);
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

  const saveInlineBlockEdit = () => {
    if (!inlineEditingBlock) return;
    
    const blockIndex = trainingBlocks[inlineEditingBlock.category].findIndex(
      block => block.startWeek === inlineEditingBlock.startWeek
    );
    
    if (blockIndex === -1) return;

    if (!inlineBlockText.trim()) {
      // Delete block if text is empty
      const updatedBlocks: TrainingBlocks = {
        ...trainingBlocks,
        [inlineEditingBlock.category]: trainingBlocks[inlineEditingBlock.category].filter((_, i) => i !== blockIndex),
      };
      setTrainingBlocks(updatedBlocks);
    } else {
      // Update block text
      const updatedBlocks: TrainingBlocks = {
        ...trainingBlocks,
        [inlineEditingBlock.category]: trainingBlocks[inlineEditingBlock.category].map((block, i) =>
          i === blockIndex ? { ...block, text: inlineBlockText } : block
        ),
      };
      setTrainingBlocks(updatedBlocks);
    }
    
    setInlineEditingBlock(null);
    setInlineBlockText('');
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
    <div className="animate-fade-in space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold uppercase tracking-wide">
          {setup.planName}
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export PDF
          </Button>
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

      {/* Printable content wrapper */}
      <div ref={printRef} className="space-y-4">

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

      {/* Calendar Periodisasi - Combined */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-extrabold text-muted-foreground uppercase">
              Kalender Periodisasi
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Unified Container for Table + Chart */}
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full border-collapse table-fixed">
              {/* Bulan Row */}
              <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="p-1 text-left text-[8px] font-extrabold uppercase w-16 border-r border-orange-600 bg-orange-500">
                    Bulan
                  </th>
                  {monthGroups.map((group, i) => (
                    <th 
                      key={i} 
                      colSpan={group.weeks.length}
                      className="p-1 text-center text-[7px] font-extrabold uppercase border-r border-orange-600 last:border-r-0"
                    >
                      {group.month.substring(0, 3)}
                    </th>
                  ))}
                </tr>
                {/* Minggu Row */}
                <tr className="bg-orange-400 text-white">
                  <th className="p-1 text-left text-[8px] font-extrabold uppercase border-r border-orange-500 bg-orange-400">
                    Minggu
                  </th>
                  {planData.map((d) => (
                    <th 
                      key={d.wk} 
                      className="p-0.5 text-center text-[7px] font-bold border-r border-orange-500/50 last:border-r-0"
                    >
                      {d.wk}
                    </th>
                  ))}
                </tr>
                {/* Tanggal Row */}
                <tr className="bg-orange-300 text-orange-900">
                  <th className="p-1 text-left text-[8px] font-extrabold uppercase border-r border-orange-400 bg-orange-300">
                    Tanggal
                  </th>
                  {planData.map((d) => {
                    const { dateRange } = getWeekDateRange(d.wk);
                    return (
                      <th 
                        key={d.wk} 
                        className="p-0.5 text-center text-[6px] font-semibold border-r border-orange-400/50 last:border-r-0"
                      >
                        {dateRange}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Periode Row */}
                <tr className="bg-gray-700 text-white">
                  <td className="p-1 text-left text-[8px] font-extrabold uppercase border-r border-gray-600 bg-gray-700">
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
                          "p-0.5 text-center text-[7px] font-extrabold uppercase border-r border-gray-600 last:border-r-0",
                          group.period === 'PERSIAPAN' ? 'bg-gray-600' : 'bg-gray-800'
                        )}
                      >
                        {group.period.substring(0, 4)}
                      </td>
                    ));
                  })()}
                </tr>
                {/* Fase Row - Per-week drag-select */}
                <tr className="bg-secondary/70">
                  <td className="p-1 text-left text-[8px] font-extrabold uppercase border-r border-border bg-secondary/70">
                    Fase
                    {selectedPhaseWeeks.length > 0 && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        <span className="text-[6px] text-muted-foreground normal-case font-normal">{selectedPhaseWeeks.length} minggu</span>
                      </div>
                    )}
                  </td>
                  {planData.map((d, idx) => {
                    const isSelected = selectedPhaseWeeks.includes(d.wk);
                    const prevFase = idx > 0 ? planData[idx - 1].fase : null;
                    const nextFase = idx < planData.length - 1 ? planData[idx + 1].fase : null;
                    const isBlockStart = d.fase !== prevFase;
                    const isBlockEnd = d.fase !== nextFase;
                    
                    // Count consecutive weeks with same phase for label display
                    let blockSize = 0;
                    if (isBlockStart) {
                      for (let j = idx; j < planData.length && planData[j].fase === d.fase; j++) {
                        blockSize++;
                      }
                    }
                    
                    return (
                      <td
                        key={d.wk}
                        className={cn(
                          "p-0 text-center text-[6px] font-extrabold uppercase cursor-pointer transition-all relative select-none",
                          phaseClasses[d.fase],
                          isSelected && "ring-2 ring-accent ring-inset z-10",
                          !isBlockEnd && "border-r-0",
                          isBlockEnd && "border-r border-border",
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsDraggingPhase(true);
                          setDragStartWeek(d.wk);
                          setSelectedPhaseWeeks([d.wk]);
                        }}
                        onMouseEnter={() => {
                          if (isDraggingPhase && dragStartWeek !== null) {
                            const from = Math.min(dragStartWeek, d.wk);
                            const to = Math.max(dragStartWeek, d.wk);
                            const range = planData.filter(p => p.wk >= from && p.wk <= to).map(p => p.wk);
                            setSelectedPhaseWeeks(range);
                          }
                        }}
                        onMouseUp={() => {
                          setIsDraggingPhase(false);
                          setDragStartWeek(null);
                        }}
                        onClick={(e) => {
                          if (e.shiftKey && selectedPhaseWeeks.length > 0) {
                            const lastSelected = selectedPhaseWeeks[selectedPhaseWeeks.length - 1];
                            const from = Math.min(lastSelected, d.wk);
                            const to = Math.max(lastSelected, d.wk);
                            const range = planData.filter(p => p.wk >= from && p.wk <= to).map(p => p.wk);
                            setSelectedPhaseWeeks(prev => [...new Set([...prev, ...range])].sort((a, b) => a - b));
                          }
                        }}
                      >
                        <div className="py-1 min-h-[20px] flex items-center justify-center overflow-hidden">
                          {isBlockStart ? (
                            <span className="text-[6px] whitespace-nowrap">{blockSize >= 4 ? d.fase : d.fase.substring(0, 3)}</span>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {/* Phase Assignment Toolbar - shown when weeks are selected */}
                {selectedPhaseWeeks.length > 0 && (
                  <tr className="bg-muted/80 border-t border-accent">
                    <td className="p-1 text-left text-[7px] font-bold border-r border-border bg-muted" colSpan={1}>
                      Pilih Fase:
                    </td>
                    <td colSpan={planData.length} className="p-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(['Umum', 'Khusus', 'Pra-Komp', 'Kompetisi'] as const).map((fase) => (
                          <button
                            key={fase}
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-bold border transition-colors",
                              phaseClasses[fase],
                              "hover:opacity-80"
                            )}
                            onClick={() => {
                              const newPlanData = [...planData];
                              selectedPhaseWeeks.forEach(wk => {
                                const idx = newPlanData.findIndex(d => d.wk === wk);
                                if (idx !== -1) {
                                  newPlanData[idx] = { ...newPlanData[idx], fase };
                                }
                              });
                              setPlanData(newPlanData);
                              setSelectedPhaseWeeks([]);
                            }}
                          >
                            {fase}
                          </button>
                        ))}
                        <button
                          className="px-2 py-0.5 rounded text-[8px] font-bold border border-border text-muted-foreground hover:bg-secondary ml-1"
                          onClick={() => setSelectedPhaseWeeks([])}
                        >
                          Batal
                        </button>
                        <button
                          className="px-2 py-0.5 rounded text-[8px] font-bold border border-accent text-accent hover:bg-accent/10 ml-1"
                          onClick={() => setSelectedPhaseWeeks(planData.map(d => d.wk))}
                        >
                          Pilih Semua
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {/* Tes & Kompetisi Row */}
                <tr className="bg-card border-t border-border">
                  <td className="p-1 text-left text-[7px] font-extrabold uppercase border-r border-border bg-secondary/50">
                    Tes/Komp
                  </td>
                  {planData.map((d) => {
                    const event = getEventForWeek(d.wk);
                    const isEditingThis = editingEventWeek === d.wk;
                    return (
                      <td 
                        key={d.wk} 
                        className={cn(
                          "p-0.5 text-center border-r border-border/50 last:border-r-0 cursor-pointer transition-all relative",
                          event?.type === 'test' && "bg-blue-500/30",
                          event?.type === 'competition' && "bg-red-500/30",
                          !event && "hover:bg-secondary/50",
                          isEditingThis && "ring-2 ring-accent z-10"
                        )}
                        onClick={() => {
                          if (isEditingThis) return;
                          setEditingEventWeek(d.wk);
                          if (event) {
                            setEditEventName(event.name);
                            setEditEventType(event.type);
                          } else {
                            setEditEventName('');
                            setEditEventType('test');
                          }
                        }}
                      >
                        {event ? (
                          <div className="flex flex-col items-center" title={event.name}>
                            {event.type === 'test' ? (
                              <FlaskConical className="w-2 h-2 text-blue-600" />
                            ) : (
                              <Flag className="w-2 h-2 text-red-600" />
                            )}
                          </div>
                        ) : (
                          <span className="text-[6px] text-muted-foreground">+</span>
                        )}
                        {isEditingThis && (
                          <div 
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl p-3 w-48"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <div className="text-[10px] font-bold text-foreground">Minggu {d.wk}</div>
                              <div className="flex gap-1">
                                <button
                                  className={cn(
                                    "flex-1 text-[9px] font-bold py-1 rounded border transition-colors",
                                    editEventType === 'test' 
                                      ? "bg-blue-500/30 border-blue-500 text-blue-700" 
                                      : "border-border text-muted-foreground hover:border-blue-500/50"
                                  )}
                                  onClick={() => setEditEventType('test')}
                                >
                                  <FlaskConical className="w-3 h-3 mx-auto mb-0.5" />
                                  Tes
                                </button>
                                <button
                                  className={cn(
                                    "flex-1 text-[9px] font-bold py-1 rounded border transition-colors",
                                    editEventType === 'competition' 
                                      ? "bg-red-500/30 border-red-500 text-red-700" 
                                      : "border-border text-muted-foreground hover:border-red-500/50"
                                  )}
                                  onClick={() => setEditEventType('competition')}
                                >
                                  <Flag className="w-3 h-3 mx-auto mb-0.5" />
                                  Komp
                                </button>
                              </div>
                              <Input
                                type="text"
                                placeholder="Nama kegiatan..."
                                value={editEventName}
                                onChange={(e) => setEditEventName(e.target.value)}
                                className="h-7 text-[10px]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && editEventName.trim()) {
                                    // Remove existing event first
                                    const filtered = scheduledEvents.filter(ev => ev.week !== d.wk);
                                    const { fullDate } = getWeekDateRange(d.wk);
                                    setScheduledEvents([...filtered, { week: d.wk, type: editEventType, name: editEventName, date: fullDate }]);
                                    setEditingEventWeek(null);
                                  }
                                  if (e.key === 'Escape') setEditingEventWeek(null);
                                }}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="flex-1 h-6 text-[9px]"
                                  disabled={!editEventName.trim()}
                                  onClick={() => {
                                    const filtered = scheduledEvents.filter(ev => ev.week !== d.wk);
                                    const { fullDate } = getWeekDateRange(d.wk);
                                    setScheduledEvents([...filtered, { week: d.wk, type: editEventType, name: editEventName, date: fullDate }]);
                                    setEditingEventWeek(null);
                                  }}
                                >
                                  Simpan
                                </Button>
                                {event && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-6 text-[9px] px-2"
                                    onClick={() => {
                                      removeScheduledEvent(d.wk);
                                      setEditingEventWeek(null);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[9px] px-2"
                                  onClick={() => setEditingEventWeek(null)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {/* Mesocycle Row */}
                <tr className="bg-secondary/30 border-t border-border">
                  <td className="p-1 text-left text-[7px] font-extrabold uppercase border-r border-border bg-secondary/50">
                    Meso
                  </td>
                  {(() => {
                    const groups: { meso: string; weeks: number[] }[] = [];
                    let currentMeso = '';
                    let currentGroup: { meso: string; weeks: number[] } | null = null;

                    planData.forEach((d) => {
                      if (d.meso !== currentMeso) {
                        if (currentGroup) groups.push(currentGroup);
                        currentMeso = d.meso;
                        currentGroup = { meso: d.meso, weeks: [d.wk] };
                      } else {
                        currentGroup?.weeks.push(d.wk);
                      }
                    });
                    if (currentGroup) groups.push(currentGroup);

                    return groups.map((group, i) => (
                      <td 
                        key={i} 
                        colSpan={group.weeks.length}
                        className="p-0.5 text-center text-[6px] font-bold uppercase border-r border-border last:border-r-0"
                        style={{
                          backgroundColor: i % 2 === 0 ? 'hsl(222, 47%, 11%)' : 'hsl(215, 14%, 34%)',
                          color: 'white'
                        }}
                      >
                        {group.meso.replace('MESO ', 'M')}
                      </td>
                    ));
                  })()}
                </tr>
                {/* Tujuan Latihan Rows */}
                {(['kekuatan', 'kecepatan', 'dayaTahan', 'fleksibilitas', 'mental'] as BlockCategory[]).map((category) => {
                  const labels: Record<BlockCategory, string> = {
                    kekuatan: 'Kekuatan',
                    kecepatan: 'Kecepatan',
                    dayaTahan: 'D.Tahan',
                    fleksibilitas: 'Fleks',
                    mental: 'Mental',
                  };

                  const renderedWeeks = new Set<number>();

                  return (
                    <tr key={category} className="border-t border-border/50">
                      <td className={cn(
                        "p-1 font-bold text-[7px] border-r border-border",
                        blockColors[category].bg,
                        blockColors[category].text
                      )}>
                        {labels[category]}
                      </td>
                      {planData.map((d) => {
                        const week = d.wk;
                        
                        if (renderedWeeks.has(week)) return null;

                        const block = getBlockForWeek(category, week);
                        const span = getBlockSpan(category, week);

                        if (block && isBlockStart(category, week)) {
                          for (let w = block.startWeek; w <= block.endWeek; w++) {
                            renderedWeeks.add(w);
                          }

                          const isInlineEditing = inlineEditingBlock?.category === category && 
                            inlineEditingBlock?.startWeek === block.startWeek;

                          return (
                            <td
                              key={week}
                              colSpan={span}
                              className={cn(
                                "p-0.5 text-center cursor-pointer transition-all border",
                                blockColors[category].bg,
                                blockColors[category].text,
                                blockColors[category].border,
                                "hover:opacity-80 font-bold text-[6px]"
                              )}
                              onClick={() => !isInlineEditing && handleCellClick(category, week)}
                            >
                              {isInlineEditing ? (
                                <Input
                                  type="text"
                                  value={inlineBlockText}
                                  onChange={(e) => setInlineBlockText(e.target.value)}
                                  onBlur={saveInlineBlockEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveInlineBlockEdit();
                                    if (e.key === 'Escape') {
                                      setInlineEditingBlock(null);
                                      setInlineBlockText('');
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                  className="w-full h-4 text-[6px] text-center p-0 font-bold"
                                />
                              ) : (
                                block.text
                              )}
                            </td>
                          );
                        }

                        if (block) return null;

                        const isSelected = selectedCells.category === category && selectedCells.weeks.includes(week);

                        return (
                          <td
                            key={week}
                            className={cn(
                              "p-0.5 text-center cursor-pointer transition-all border border-border/30",
                              isSelected && "bg-accent/30 ring-1 ring-accent",
                              !isSelected && "hover:bg-secondary/50"
                            )}
                            onClick={() => handleCellClick(category, week)}
                          >
                            <span className="text-[6px] text-muted-foreground">-</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Volume & Intensity Line Chart - Aligned with table columns */}
            <div className="border-t border-border bg-gradient-to-b from-card to-card/80">
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-accent/60"></div>
                    <span className="text-[10px] font-semibold text-muted-foreground">Volume (%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-destructive/60"></div>
                    <span className="text-[10px] font-semibold text-muted-foreground">Intensitas (%)</span>
                  </div>
                </div>
              </div>
              {/* Line Chart with table-aligned grid */}
              <div className="relative flex">
                {/* Y-axis labels on the left - matching table first column width */}
                <div className="w-16 flex-shrink-0 flex flex-col justify-between py-2 pr-1 bg-muted/20 border-r border-border/30">
                  <div className="text-[7px] font-bold text-accent text-right">100%</div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[8px] font-bold text-accent">VOL</span>
                    <span className="text-[8px] font-bold text-destructive">INT</span>
                  </div>
                  <div className="text-[7px] font-bold text-muted-foreground text-right">0%</div>
                </div>
                
                {/* Chart area */}
                <div className="flex-1 relative">
                  {/* Grid lines matching table columns */}
                  <div className="absolute inset-0 flex">
                    {planData.map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 border-r border-border/10 last:border-r-0"
                      />
                    ))}
                  </div>
                  
                  {/* SVG Line Chart */}
                  <div className="h-32 relative w-full">
                    <svg 
                      viewBox={`0 0 ${planData.length * 100} 100`} 
                      preserveAspectRatio="none"
                      className="w-full h-full"
                    >
                    {/* Gradient definitions */}
                    <defs>
                      <linearGradient id="volumeGradientLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.05" />
                      </linearGradient>
                      <linearGradient id="intensitasGradientLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Horizontal grid lines */}
                    {[0, 25, 50, 75, 100].map((v) => (
                      <line
                        key={v}
                        x1="0"
                        y1={100 - v}
                        x2={planData.length * 100}
                        y2={100 - v}
                        stroke={v === 50 || v === 75 ? "hsl(var(--muted-foreground))" : "hsl(var(--border))"}
                        strokeWidth={v === 50 || v === 75 ? "0.8" : "0.3"}
                        strokeOpacity={v === 50 || v === 75 ? "0.6" : "0.5"}
                        strokeDasharray={v === 50 || v === 75 ? "4 2" : "0"}
                      />
                    ))}
                    
                    {/* Volume Area - starts from center of first column to center of last column */}
                    <path
                      d={`M ${50} ${100 - (planData[0]?.vol || 0)} ${planData.map((d, i) => `L ${i * 100 + 50} ${100 - d.vol}`).join(' ')} L ${(planData.length - 1) * 100 + 50} 100 L 50 100 Z`}
                      fill="url(#volumeGradientLine)"
                    />
                    
                    {/* Volume Line */}
                    <path
                      d={`M ${50} ${100 - (planData[0]?.vol || 0)} ${planData.map((d, i) => `L ${i * 100 + 50} ${100 - d.vol}`).join(' ')}`}
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Intensitas Area */}
                    <path
                      d={`M ${50} ${100 - (planData[0]?.int || 0)} ${planData.map((d, i) => `L ${i * 100 + 50} ${100 - d.int}`).join(' ')} L ${(planData.length - 1) * 100 + 50} 100 L 50 100 Z`}
                      fill="url(#intensitasGradientLine)"
                    />
                    
                    {/* Intensitas Line */}
                    <path
                      d={`M ${50} ${100 - (planData[0]?.int || 0)} ${planData.map((d, i) => `L ${i * 100 + 50} ${100 - d.int}`).join(' ')}`}
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Invisible hover areas for tooltips */}
                    {planData.map((d, i) => (
                      <rect
                        key={`hover-${i}`}
                        x={i * 100}
                        y="0"
                        width="100"
                        height="100"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredWeek({ week: d.wk, vol: d.vol, int: d.int, x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredWeek(null)}
                      />
                    ))}
                  </svg>
                </div>
                
                {/* Tooltip */}
                {hoveredWeek && (
                  <div 
                    className="fixed z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs"
                    style={{ 
                      left: hoveredWeek.x, 
                      top: hoveredWeek.y - 70,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="font-bold text-foreground mb-1">Minggu {hoveredWeek.week}</div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-sm bg-accent"></span>
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-semibold text-accent">{hoveredWeek.vol}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-sm bg-destructive"></span>
                      <span className="text-muted-foreground">Intensitas:</span>
                      <span className="font-semibold text-destructive">{hoveredWeek.int}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          
          {/* Volume & Intensity Edit Section - Below chart */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Edit Volume & Intensitas</h4>
              <span className="text-[10px] text-muted-foreground/70">(klik nilai untuk mengubah)</span>
            </div>
            <div className="rounded-lg border border-border overflow-hidden shadow-sm">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="p-1.5 text-left text-[9px] font-bold uppercase w-20 border-r border-border bg-muted">
                      Minggu
                    </th>
                    {planData.map((d) => (
                      <th key={d.wk} className="p-1 text-center text-[8px] font-semibold border-r border-border/50 last:border-r-0 text-muted-foreground">
                        {d.wk}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Volume Row */}
                  <tr className="bg-accent/5 hover:bg-accent/10 transition-colors">
                    <td className="p-1.5 text-left text-[9px] font-bold uppercase border-r border-border bg-accent/15 text-accent">
                      Volume (%)
                    </td>
                    {planData.map((d, idx) => (
                      <td 
                        key={d.wk} 
                        className="p-1 text-center border-r border-border/30 last:border-r-0 cursor-pointer hover:bg-accent/20 transition-colors group"
                        onClick={() => {
                          setEditingVolInt({ week: d.wk, type: 'vol' });
                          setEditVolIntValue(d.vol);
                        }}
                      >
                        {editingVolInt?.week === d.wk && editingVolInt?.type === 'vol' ? (
                          <Input
                            type="number"
                            value={editVolIntValue}
                            onChange={(e) => setEditVolIntValue(Number(e.target.value))}
                            onBlur={() => {
                              updatePlanWeek(idx, { vol: Math.max(0, Math.min(100, editVolIntValue)) });
                              setEditingVolInt(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updatePlanWeek(idx, { vol: Math.max(0, Math.min(100, editVolIntValue)) });
                                setEditingVolInt(null);
                              }
                              if (e.key === 'Escape') setEditingVolInt(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-8 h-5 text-[9px] text-center p-0 border-accent"
                            min={0}
                            max={100}
                          />
                        ) : (
                          <span className="text-[9px] font-semibold text-accent group-hover:font-bold">{d.vol}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  {/* Intensitas Row */}
                  <tr className="bg-destructive/5 hover:bg-destructive/10 transition-colors">
                    <td className="p-1.5 text-left text-[9px] font-bold uppercase border-r border-border bg-destructive/15 text-destructive">
                      Intensitas (%)
                    </td>
                    {planData.map((d, idx) => (
                      <td 
                        key={d.wk} 
                        className="p-1 text-center border-r border-border/30 last:border-r-0 cursor-pointer hover:bg-destructive/20 transition-colors group"
                        onClick={() => {
                          setEditingVolInt({ week: d.wk, type: 'int' });
                          setEditVolIntValue(d.int);
                        }}
                      >
                        {editingVolInt?.week === d.wk && editingVolInt?.type === 'int' ? (
                          <Input
                            type="number"
                            value={editVolIntValue}
                            onChange={(e) => setEditVolIntValue(Number(e.target.value))}
                            onBlur={() => {
                              updatePlanWeek(idx, { int: Math.max(0, Math.min(100, editVolIntValue)) });
                              setEditingVolInt(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updatePlanWeek(idx, { int: Math.max(0, Math.min(100, editVolIntValue)) });
                                setEditingVolInt(null);
                              }
                              if (e.key === 'Escape') setEditingVolInt(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-8 h-5 text-[9px] text-center p-0 border-destructive"
                            min={0}
                            max={100}
                          />
                        ) : (
                          <span className="text-[9px] font-semibold text-destructive group-hover:font-bold">{d.int}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <p className="text-[11px] text-muted-foreground mt-4 px-1">
            💡 <span className="font-medium">Tips:</span> Klik pada baris <b>Fase</b> untuk mengubah fase per minggu. Klik pada baris <b>Tes/Komp</b> untuk menambah/edit kegiatan tes atau kompetisi. Klik beberapa minggu pada baris Tujuan Latihan untuk memilih dan buat blok.
          </p>
          
          {/* Biomotor Targets Section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Target Biomotor per Minggu</h4>
              <span className="text-[10px] text-muted-foreground/70">(berdasarkan volume)</span>
            </div>
            <div className="rounded-lg border border-border overflow-hidden shadow-sm">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="p-1.5 text-left text-[9px] font-bold uppercase w-20 border-r border-border bg-muted">
                      Komponen
                    </th>
                    {planData.map((d) => (
                      <th key={d.wk} className="p-1 text-center text-[8px] font-semibold border-r border-border/50 last:border-r-0 text-muted-foreground">
                        {d.wk}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Kekuatan Row */}
                  <tr className="bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                    <td className="p-1.5 text-left text-[9px] font-bold uppercase border-r border-border bg-orange-500/15 text-orange-700">
                      Kekuatan
                    </td>
                    {planData.map((d) => {
                      const targets = calculateBiomotorTargets(d.vol);
                      return (
                        <td key={d.wk} className="p-1 text-center border-r border-border/30 last:border-r-0">
                          <span className="text-[8px] font-medium text-orange-700">{targets.strength}</span>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Kecepatan Row */}
                  <tr className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                    <td className="p-1.5 text-left text-[9px] font-bold uppercase border-r border-border bg-blue-500/15 text-blue-700">
                      Kecepatan
                    </td>
                    {planData.map((d) => {
                      const targets = calculateBiomotorTargets(d.vol);
                      return (
                        <td key={d.wk} className="p-1 text-center border-r border-border/30 last:border-r-0">
                          <span className="text-[8px] font-medium text-blue-700">{targets.speed}</span>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Daya Tahan Row */}
                  <tr className="bg-green-500/5 hover:bg-green-500/10 transition-colors">
                    <td className="p-1.5 text-left text-[9px] font-bold uppercase border-r border-border bg-green-500/15 text-green-700">
                      D.Tahan
                    </td>
                    {planData.map((d) => {
                      const targets = calculateBiomotorTargets(d.vol);
                      return (
                        <td key={d.wk} className="p-1 text-center border-r border-border/30 last:border-r-0">
                          <span className="text-[8px] font-medium text-green-700">{targets.endurance}</span>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Teknik Row */}
                  <tr className="bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                    <td className="p-1.5 text-left text-[9px] font-bold uppercase border-r border-border bg-purple-500/15 text-purple-700">
                      Teknik
                    </td>
                    {planData.map((d) => {
                      const targets = calculateBiomotorTargets(d.vol);
                      return (
                        <td key={d.wk} className="p-1 text-center border-r border-border/30 last:border-r-0">
                          <span className="text-[8px] font-medium text-purple-700">{targets.technique}</span>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Taktik Row */}
                  <tr className="bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                    <td className="p-1.5 text-left text-[9px] font-bold uppercase border-r border-border bg-rose-500/15 text-rose-700">
                      Taktik
                    </td>
                    {planData.map((d) => {
                      const targets = calculateBiomotorTargets(d.vol);
                      return (
                        <td key={d.wk} className="p-1 text-center border-r border-border/30 last:border-r-0">
                          <span className="text-[8px] font-medium text-rose-700">{targets.tactic}</span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      </div> {/* End of printable content wrapper */}

    </div>
  );
}
