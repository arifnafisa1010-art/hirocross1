import { useState, useMemo } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { useAthletes } from '@/hooks/useAthletes';
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms';
import { useTrainingLoads } from '@/hooks/useTrainingLoads';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { SessionModal } from './SessionModal';
import { TrainingLoadInput } from './TrainingLoadInput';
import { TrainingLoadHistory } from './TrainingLoadHistory';
import { WeeklyLoadTarget } from './WeeklyLoadTarget';
import { PremiumBadge } from './PremiumBadge';
import { Users, Save, Loader2, Target, TrendingUp, RefreshCw, CheckCircle2, Crown, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, addDays, startOfWeek } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const dayOffsets = [0, 1, 2, 3, 4, 5, 6]; // Monday = 0, Sunday = 6

export function MonthlySection() {
  const { planData, setup, sessions, mesocycles, competitions, selectedAthleteIds, setSelectedAthleteIds } = useTrainingStore();
  const { athletes } = useAthletes();
  const { saveProgram, currentProgram, loading: programLoading, resyncSessions } = useTrainingPrograms();
  const { hasPremium } = usePremiumAccess();
  const { loads, loading: loadsLoading, addLoad, deleteLoad } = useTrainingLoads();
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ week: number; day: string } | null>(null);
  const [showAthleteSelector, setShowAthleteSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [loadInputOpen, setLoadInputOpen] = useState(false);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(() => {
    // Load from localStorage or default to 400 AU
    const saved = localStorage.getItem('weeklyLoadTarget');
    return saved ? parseInt(saved) : 400;
  });

  const handleTargetChange = (target: number) => {
    setWeeklyTarget(target);
    localStorage.setItem('weeklyLoadTarget', target.toString());
  };
  // Group weeks into months (4 weeks per month)
  const months = useMemo(() => {
    const result: { label: string; weeks: number[] }[] = [];
    for (let i = 0; i < planData.length; i += 4) {
      const weekNums = planData.slice(i, i + 4).map(w => w.wk);
      result.push({
        label: `Bulan ${result.length + 1} (W${weekNums[0]}-W${weekNums[weekNums.length - 1]})`,
        weeks: weekNums,
      });
    }
    return result;
  }, [planData]);

  const currentMonthWeeks = months[selectedMonth]?.weeks || [];

  const getSessionKey = (wk: number, day: string) => `W${wk}-${day}`;

  // Calculate biomotor targets per week based on volume
  const calculateWeekBiomotorTargets = (volume: number) => {
    return {
      strength: Math.round(setup.targets.strength * (volume / 100)),
      speed: Math.round(setup.targets.speed * (volume / 100)),
      endurance: Math.round(setup.targets.endurance * (volume / 100)),
      technique: Math.round(setup.targets.technique * (volume / 100)),
      tactic: Math.round(setup.targets.tactic * (volume / 100)),
    };
  };

  // Calculate actual biomotor achieved from completed sessions
  const calculateActualBiomotor = (wk: number) => {
    const actual = {
      strength: 0,
      speed: 0,
      endurance: 0,
      technique: 0,
      tactic: 0,
    };

    days.forEach(day => {
      const key = getSessionKey(wk, day);
      const session = sessions[key];
      if (session?.isDone && session?.exercises) {
        session.exercises.forEach(ex => {
          const load = ex.load * ex.set * ex.rep;
          // Categorize based on exercise cat field
          switch (ex.cat) {
            case 'strength':
              actual.strength += load;
              break;
            case 'speed':
              actual.speed += load;
              break;
            case 'endurance':
              actual.endurance += load / 1000; // Convert to approximate km
              break;
            case 'technique':
              actual.technique += ex.rep * ex.set;
              break;
            case 'tactic':
              actual.tactic += ex.rep * ex.set;
              break;
            default:
              // Default to strength for unspecified
              actual.strength += load;
          }
        });
      }
    });

    return actual;
  };

  // Get date for a specific week and day
  const getDateForDay = (wk: number, dayIndex: number) => {
    if (!setup.startDate) return null;
    const startDate = new Date(setup.startDate);
    // Calculate the Monday of week 1 (adjust if start date is not Monday)
    const weekStart = addDays(startDate, (wk - 1) * 7);
    return addDays(weekStart, dayIndex);
  };

  // Get intensity recommendation based on volume and intensity percentage
  const getIntensityRecommendation = (vol: number, int: number): 'Rest' | 'Low' | 'Med' | 'High' => {
    if (int >= 80) return 'High';
    if (int >= 60) return 'Med';
    if (int >= 30) return 'Low';
    return 'Rest';
  };

  const handleDayClick = (week: number, day: string) => {
    setSelectedDay({ week, day });
    setModalOpen(true);
  };

  const toggleAthleteSelection = (athleteId: string) => {
    if (selectedAthleteIds.includes(athleteId)) {
      setSelectedAthleteIds(selectedAthleteIds.filter(id => id !== athleteId));
    } else {
      setSelectedAthleteIds([...selectedAthleteIds, athleteId]);
    }
  };

  const selectAllAthletes = () => {
    setSelectedAthleteIds(athletes.map(a => a.id));
  };

  const clearAthleteSelection = () => {
    setSelectedAthleteIds([]);
  };

  const handleSaveProgram = async () => {
    if (!setup.planName || !setup.startDate) {
      toast.error('Nama program dan tanggal mulai wajib diisi!');
      return;
    }
    if (competitions.length === 0) {
      toast.error('Tambahkan minimal satu kompetisi!');
      return;
    }

    setSaving(true);
    // Pass sessions from store to save to database
    const success = await saveProgram(
      setup, 
      mesocycles, 
      planData, 
      competitions, 
      selectedAthleteIds,
      undefined, // trainingBlocks
      undefined, // scheduledEvents
      sessions // Pass sessions from store
    );
    setSaving(false);

    if (success) {
      // Toast is already shown in saveProgram
    }
  };

  const handleResyncSessions = async () => {
    if (!currentProgram) {
      toast.error('Tidak ada program yang tersimpan. Simpan program terlebih dahulu!');
      return;
    }

    setResyncing(true);
    const success = await resyncSessions(currentProgram.id, planData, sessions);
    setResyncing(false);

    if (!success) {
      // Error toast is shown in resyncSessions
    }
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

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-extrabold">Kalender Kerja Bulanan</h2>
        <div className="flex items-center gap-3">
          {/* Re-sync Sessions Button */}
          {currentProgram && (
            <Button 
              variant="outline"
              onClick={handleResyncSessions}
              disabled={resyncing || programLoading}
              className="flex items-center gap-2"
              title="Sync ulang sesi latihan dari program yang sudah ada"
            >
              {resyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Re-sync Sesi
            </Button>
          )}
          
          {/* Save Program Button */}
          <Button 
            onClick={handleSaveProgram}
            disabled={saving || programLoading}
            className="flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan ke Database
          </Button>
          
          {/* Athlete Selection */}
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowAthleteSelector(!showAthleteSelector)}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {selectedAthleteIds.length === 0 
                ? 'Pilih Atlet' 
                : selectedAthleteIds.length === 1 
                  ? athletes.find(a => a.id === selectedAthleteIds[0])?.name 
                  : `${selectedAthleteIds.length} Atlet`}
            </Button>
            
            {showAthleteSelector && (
              <Card className="absolute right-0 top-full mt-2 z-50 w-72 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Pilih Atlet</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={selectAllAthletes} className="text-xs h-7">
                        Semua
                      </Button>
                      <Button size="sm" variant="ghost" onClick={clearAthleteSelection} className="text-xs h-7">
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {athletes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Belum ada atlet. Tambahkan di Tes & Pengukuran.
                      </p>
                    ) : (
                      athletes.map(athlete => (
                        <label 
                          key={athlete.id} 
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedAthleteIds.includes(athlete.id)}
                            onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                          />
                          <span className="text-sm font-medium">{athlete.name}</span>
                          {athlete.sport && (
                            <span className="text-[10px] text-muted-foreground">({athlete.sport})</span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3" 
                    onClick={() => setShowAthleteSelector(false)}
                  >
                    Selesai
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Athletes Display */}
      {selectedAthleteIds.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground">Program untuk:</span>
          {selectedAthleteIds.map(id => {
            const athlete = athletes.find(a => a.id === id);
            return athlete ? (
              <span 
                key={id} 
                className="px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full"
              >
                {athlete.name}
              </span>
            ) : null;
          })}
        </div>
      )}

      <div className="space-y-5">
        {currentMonthWeeks.map((wk) => {
          const weekData = planData.find(p => p.wk === wk);
          const biomotorTargets = weekData ? calculateWeekBiomotorTargets(weekData.vol) : null;
          const recommendedIntensity = weekData ? getIntensityRecommendation(weekData.vol, weekData.int) : 'Rest';
          
                  // RPE-based Load Map for calculating TSS from session data
                  const RPE_LOAD_MAP_WEEKLY: Record<number, number> = {
                    1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
                    6: 70, 7: 80, 8: 100, 9: 120, 10: 140,
                  };

                  // Calculate weekly internal load total (from database and calculated TSS)
                  const weeklyInternalLoad = days.reduce((total, day, dayIndex) => {
                    const dayDate = getDateForDay(wk, dayIndex);
                    if (!dayDate) return total;
                    const dayDateStr = format(dayDate, 'yyyy-MM-dd');
                    
                    // Get load from database
                    const dayDbLoad = loads.filter(l => l.session_date === dayDateStr).reduce((sum, l) => sum + (l.session_load || 0), 0);
                    
                    // Calculate from session RPE/Duration if no database load
                    const sessionKey = getSessionKey(wk, day);
                    const sessionData = sessions[sessionKey];
                    const sessionTSS = sessionData?.rpe && sessionData?.duration 
                      ? Math.round((sessionData.duration / 60) * (RPE_LOAD_MAP_WEEKLY[Math.min(10, Math.max(1, Math.round(sessionData.rpe)))] || 60))
                      : 0;
                    
                    return total + (dayDbLoad > 0 ? dayDbLoad : sessionTSS);
                  }, 0);
                  
          return (
            <div key={wk} className="space-y-2">
              {/* Week Info Row with Biomotor Targets */}
              <div className="grid grid-cols-8 gap-3">
                {/* Week Header */}
                <Card className="flex flex-col justify-center p-4 border-border shadow-card">
                  <div className="text-xs font-extrabold text-muted-foreground uppercase">
                    {weekData?.meso}
                  </div>
                  <div className="text-lg font-extrabold mt-1">W{wk}</div>
                  <div className={cn(
                    "mt-2 px-2 py-1 rounded text-[10px] font-bold text-center",
                    weekData?.fase === 'Umum' && 'phase-umum',
                    weekData?.fase === 'Khusus' && 'phase-khusus',
                    weekData?.fase === 'Pra-Komp' && 'phase-prakomp',
                    weekData?.fase === 'Kompetisi' && 'phase-kompetisi',
                  )}>
                    {weekData?.fase}
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    Vol: {weekData?.vol}% | Int: {weekData?.int}%
                  </div>
                  {/* Weekly Internal Load Total */}
                  {weeklyInternalLoad > 0 && (
                    <div className="mt-2 flex items-center gap-1 bg-primary/10 rounded px-1.5 py-1">
                      <Activity className="w-3 h-3 text-primary" />
                      <div className="text-[9px]">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold text-primary ml-1">{weeklyInternalLoad} AU</span>
                      </div>
                    </div>
                  )}
                  {/* Recommended Intensity */}
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-accent" />
                    <span className="text-[9px] text-muted-foreground">Rec:</span>
                    <Badge variant="outline" className={cn(
                      "text-[8px] px-1 py-0 h-4",
                      recommendedIntensity === 'High' && 'border-destructive text-destructive',
                      recommendedIntensity === 'Med' && 'border-warning text-warning',
                      recommendedIntensity === 'Low' && 'border-success text-success',
                      recommendedIntensity === 'Rest' && 'border-muted text-muted-foreground',
                    )}>
                      {recommendedIntensity}
                    </Badge>
                  </div>
                </Card>

                {/* Days */}
                {days.map((day, dayIndex) => {
                  const key = getSessionKey(wk, day);
                  const session = sessions[key];
                  const hasContent = session?.exercises?.length > 0;
                  const isDone = session?.isDone;
                  const intensity = session?.int || 'Rest';
                  const dayDate = getDateForDay(wk, dayIndex);
                  const dayDateStr = dayDate ? format(dayDate, 'yyyy-MM-dd') : null;

                  // Calculate total load from completed exercises
                  const totalLoad = session?.exercises?.reduce((sum, ex) => sum + (ex.load * ex.set * ex.rep), 0) || 0;

                  // Calculate load from session exercises by category (speed in m, endurance in km)
                  const exerciseLoadByCategory = session?.exercises?.reduce((acc, ex) => {
                    const totalReps = ex.set * ex.rep;
                    if (ex.cat === 'speed') {
                      acc.speed += ex.load * totalReps; // Load in meters
                    } else if (ex.cat === 'endurance') {
                      acc.endurance += (ex.load * totalReps) / 1000; // Convert to km
                    }
                    return acc;
                  }, { speed: 0, endurance: 0 }) || { speed: 0, endurance: 0 };

                  // Get internal load (TSS) from training_loads table for this day
                  const dayInternalLoad = dayDateStr 
                    ? loads.filter(l => l.session_date === dayDateStr).reduce((sum, l) => sum + (l.session_load || 0), 0)
                    : 0;

                  // RPE-based Load Map: Base load for 60 minutes at each RPE level
                  const RPE_LOAD_MAP: Record<number, number> = {
                    1: 20,   // Very light
                    2: 30,   // Light
                    3: 40,   // Light-moderate
                    4: 50,   // Moderate
                    5: 60,   // Moderate
                    6: 70,   // Moderate-hard
                    7: 80,   // Hard
                    8: 100,  // Very hard
                    9: 120,  // Very very hard
                    10: 140, // Maximum
                  };

                  // Calculate TSS from RPE and Duration using proper formula
                  // Base load is for 60 min, scale by actual duration
                  const calculatedTSS = session?.rpe && session?.duration 
                    ? Math.round((session.duration / 60) * (RPE_LOAD_MAP[Math.min(10, Math.max(1, Math.round(session.rpe)))] || 60))
                    : 0;

                  // Get TSS value for color gradient
                  const tssValue = dayInternalLoad > 0 ? dayInternalLoad : calculatedTSS;
                  
                  // Determine TSS color gradient: green=low (<50), yellow=medium (50-100), red=high (>100)
                  const getTSSColorClass = (tss: number) => {
                    if (tss === 0) return '';
                    if (tss < 50) return 'bg-gradient-to-br from-green-500/20 to-green-600/30 border-green-500/50';
                    if (tss < 100) return 'bg-gradient-to-br from-yellow-500/20 to-amber-600/30 border-yellow-500/50';
                    return 'bg-gradient-to-br from-red-500/20 to-red-600/30 border-red-500/50';
                  };
                  
                  const tssColorClass = getTSSColorClass(tssValue);

                  return (
                    <Card
                      key={day}
                      onClick={() => handleDayClick(wk, day)}
                      className={cn(
                        "p-3 min-h-28 cursor-pointer border-border shadow-card transition-all hover:-translate-y-1 hover:shadow-lg relative",
                        // TSS-based color gradient (takes priority if TSS exists)
                        tssValue > 0 && tssColorClass,
                        // Fallback to intensity colors when no TSS
                        tssValue === 0 && intensity === 'High' && 'intensity-high',
                        tssValue === 0 && intensity === 'Med' && 'intensity-med',
                        tssValue === 0 && intensity === 'Low' && 'intensity-low',
                        tssValue === 0 && intensity === 'Rest' && 'intensity-rest',
                      )}
                    >
                      <div className="absolute top-2 right-2 text-right">
                        <div className="text-[10px] font-bold text-muted-foreground">
                          {day.slice(0, 3)}
                        </div>
                        {dayDate && (
                          <div className="text-[9px] text-muted-foreground/70">
                            {format(dayDate, 'd MMM', { locale: idLocale })}
                          </div>
                        )}
                      </div>
                      
                      {hasContent && (
                        <div className="mt-4 space-y-1">
                          {session.exercises.slice(0, 2).map((ex, i) => (
                            <div key={i} className="text-[10px] font-semibold truncate">
                              {ex.name}
                            </div>
                          ))}
                          {session.exercises.length > 2 && (
                            <div className="text-[9px] text-muted-foreground">
                              +{session.exercises.length - 2} lainnya
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show speed and endurance loads by category */}
                      {(exerciseLoadByCategory.speed > 0 || exerciseLoadByCategory.endurance > 0) && (
                        <div className="mt-1 space-y-0.5">
                          {exerciseLoadByCategory.speed > 0 && (
                            <div className="text-[8px] text-orange-600 dark:text-orange-400 font-bold">
                              Kecepatan: {exerciseLoadByCategory.speed.toLocaleString()} m
                            </div>
                          )}
                          {exerciseLoadByCategory.endurance > 0 && (
                            <div className="text-[8px] text-blue-600 dark:text-blue-400 font-bold">
                              Daya Tahan: {exerciseLoadByCategory.endurance.toFixed(2)} km
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show total load if session is done (for strength) */}
                      {isDone && totalLoad > 0 && (
                        <div className="mt-1 text-[8px] text-accent font-bold">
                          Total: {totalLoad.toLocaleString()} kg
                        </div>
                      )}

                      {/* TSS/Load Display - calculated from RPE and Duration */}
                      {(calculatedTSS > 0 || dayInternalLoad > 0) && (
                        <div className="absolute bottom-8 left-2 right-2">
                          <div className="flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            <Activity className="w-3 h-3" />
                            <span className="text-[9px] font-bold">
                              TSS: {dayInternalLoad > 0 ? dayInternalLoad : calculatedTSS} AU
                            </span>
                          </div>
                        </div>
                      )}

                      {/* RPE & Duration display */}
                      <div className="absolute bottom-2 left-2 flex gap-1.5">
                        {session?.rpe && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                            RPE {session.rpe}
                          </span>
                        )}
                        {session?.duration && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {session.duration}m
                          </span>
                        )}
                      </div>

                      {isDone && (
                        <div className="absolute bottom-2 right-2 bg-success text-success-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                          ✓
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Weekly TSS Summary Row */}
              {weeklyInternalLoad > 0 && (
                <div className="flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <Activity className="w-5 h-5 text-primary" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">Total Internal Load Minggu {wk}:</span>
                    <span className={cn(
                      "text-lg font-extrabold px-3 py-1 rounded-lg",
                      weeklyInternalLoad < 300 ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                      weeklyInternalLoad < 500 ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                      "bg-red-500/20 text-red-700 dark:text-red-400"
                    )}>
                      {weeklyInternalLoad} AU
                    </span>
                  </div>
                  {/* Weekly target comparison */}
                  {weeklyTarget > 0 && (
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-primary/20">
                      <span className="text-xs text-muted-foreground">Target:</span>
                      <span className="text-sm font-bold text-primary">{weeklyTarget} AU</span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded",
                        weeklyInternalLoad >= weeklyTarget 
                          ? "bg-success/20 text-success" 
                          : "bg-warning/20 text-warning"
                      )}>
                        {weeklyInternalLoad >= weeklyTarget ? '✓ Tercapai' : `${Math.round((weeklyInternalLoad / weeklyTarget) * 100)}%`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Biomotor Targets Row */}
              {biomotorTargets && (() => {
                const actualBiomotor = calculateActualBiomotor(wk);
                const hasActualData = Object.values(actualBiomotor).some(v => v > 0);
                
                return (
                  <Card className="p-3 bg-accent/5 border-accent/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="text-xs font-bold text-accent">Target Biomotor Minggu {wk}</span>
                      {hasActualData && (
                        <Badge variant="outline" className="text-[9px] border-success text-success gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Ada Data Aktual
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        (berdasarkan volume {weekData?.vol}%)
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      <div className="text-center p-2 bg-card rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Kekuatan</div>
                        <div className="text-sm font-extrabold text-foreground">{biomotorTargets.strength} <span className="text-[9px] text-muted-foreground">kg</span></div>
                        {hasActualData && (
                          <div className={cn(
                            "text-[10px] font-bold mt-1",
                            actualBiomotor.strength >= biomotorTargets.strength ? "text-success" : "text-warning"
                          )}>
                            Aktual: {actualBiomotor.strength.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="text-center p-2 bg-card rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Kecepatan</div>
                        <div className="text-sm font-extrabold text-foreground">{biomotorTargets.speed} <span className="text-[9px] text-muted-foreground">m</span></div>
                        {hasActualData && (
                          <div className={cn(
                            "text-[10px] font-bold mt-1",
                            actualBiomotor.speed >= biomotorTargets.speed ? "text-success" : "text-warning"
                          )}>
                            Aktual: {actualBiomotor.speed.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="text-center p-2 bg-card rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Daya Tahan</div>
                        <div className="text-sm font-extrabold text-foreground">{biomotorTargets.endurance} <span className="text-[9px] text-muted-foreground">km</span></div>
                        {hasActualData && (
                          <div className={cn(
                            "text-[10px] font-bold mt-1",
                            actualBiomotor.endurance >= biomotorTargets.endurance ? "text-success" : "text-warning"
                          )}>
                            Aktual: {actualBiomotor.endurance.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="text-center p-2 bg-card rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Teknik</div>
                        <div className="text-sm font-extrabold text-foreground">{biomotorTargets.technique} <span className="text-[9px] text-muted-foreground">rep</span></div>
                        {hasActualData && (
                          <div className={cn(
                            "text-[10px] font-bold mt-1",
                            actualBiomotor.technique >= biomotorTargets.technique ? "text-success" : "text-warning"
                          )}>
                            Aktual: {actualBiomotor.technique.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="text-center p-2 bg-card rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Taktik</div>
                        <div className="text-sm font-extrabold text-foreground">{biomotorTargets.tactic} <span className="text-[9px] text-muted-foreground">rep</span></div>
                        {hasActualData && (
                          <div className={cn(
                            "text-[10px] font-bold mt-1",
                            actualBiomotor.tactic >= biomotorTargets.tactic ? "text-success" : "text-warning"
                          )}>
                            Aktual: {actualBiomotor.tactic.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Training Load Input Section (Premium Feature) */}
      {hasPremium && (
        <Collapsible open={loadInputOpen} onOpenChange={setLoadInputOpen}>
          <Card className="border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="w-5 h-5 text-amber-500" />
                    Input Training Load
                    <PremiumBadge size="sm" />
                  </CardTitle>
                  <Crown className={cn(
                    "w-5 h-5 text-amber-500 transition-transform",
                    loadInputOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CardDescription>
                Catat beban latihan harian untuk monitoring performa di Premium Dashboard
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-4 space-y-6">
                {/* Weekly Target Section */}
                <WeeklyLoadTarget 
                  loads={loads} 
                  weeklyTarget={weeklyTarget} 
                  onTargetChange={handleTargetChange} 
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrainingLoadInput onSubmit={addLoad} />
                  <TrainingLoadHistory 
                    loads={loads} 
                    loading={loadsLoading} 
                    onDelete={deleteLoad} 
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Premium Upsell for non-premium users */}
      {!hasPremium && (
        <Card className="border-dashed border-amber-400 bg-gradient-to-br from-amber-50/30 to-yellow-50/30 dark:from-amber-950/10 dark:to-yellow-950/10">
          <CardContent className="p-6 text-center">
            <Crown className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">Fitur Premium: Training Load Monitoring</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Catat beban latihan harian dan dapatkan analisis ACWR, Fitness, Fatigue, dan Form secara real-time.
            </p>
            <Button 
              variant="outline" 
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
              onClick={() => window.location.href = '/premium'}
            >
              <Crown className="w-4 h-4 mr-2" />
              Lihat Premium Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedDay && (
        <SessionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          week={selectedDay.week}
          day={selectedDay.day}
        />
      )}
    </div>
  );
}
