import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Target, TrendingUp, TrendingDown, Minus, Edit2, Check, X, ChevronLeft, ChevronRight, Info, Sparkles, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TrainingLoad {
  id: string;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  session_load: number;
  training_type: string;
  notes: string | null;
}

interface WeekPlanData {
  wk: number;
  vol: number;
  int: number;
  fase: string;
  meso: string;
}

interface WeeklyLoadTargetProps {
  loads: TrainingLoad[];
  weeklyTarget: number | null;
  onTargetChange: (target: number | null) => void;
  currentWeekPlan?: WeekPlanData | null;
  baseLoadPerPhase?: Record<string, number>;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  label: string;
  totalLoad: number;
  sessions: number;
  avgRpe: number;
}

// Default base load targets per training phase (AU for 100% volume)
const DEFAULT_BASE_LOAD_PER_PHASE: Record<string, number> = {
  'Umum': 500,        // General phase - moderate volume
  'Khusus': 600,      // Specific phase - higher volume
  'Pra-Komp': 450,    // Pre-competition - reduced volume
  'Kompetisi': 300,   // Competition - maintenance
  'Transisi': 200,    // Transition - recovery
};

// Phase descriptions for guidance
const PHASE_GUIDANCE: Record<string, { description: string; tips: string[] }> = {
  'Umum': {
    description: 'Fase pembangunan dasar fisik dan teknik',
    tips: [
      'Volume tinggi, intensitas moderat (60-75%)',
      'Fokus pada adaptasi aerobik dan kekuatan dasar',
      'Target 4-6 sesi per minggu',
    ],
  },
  'Khusus': {
    description: 'Fase pengembangan kemampuan spesifik olahraga',
    tips: [
      'Volume moderat-tinggi, intensitas meningkat (70-85%)',
      'Fokus pada kecepatan dan power',
      'Target 5-6 sesi per minggu',
    ],
  },
  'Pra-Komp': {
    description: 'Fase persiapan menjelang kompetisi',
    tips: [
      'Volume menurun, intensitas tinggi (80-90%)',
      'Fokus pada sharpening dan taktik',
      'Target 3-5 sesi per minggu',
    ],
  },
  'Kompetisi': {
    description: 'Fase mempertahankan performa puncak',
    tips: [
      'Volume rendah, intensitas optimal (85-95%)',
      'Fokus pada recovery dan performa',
      'Target 2-4 sesi per minggu',
    ],
  },
  'Transisi': {
    description: 'Fase pemulihan dan regenerasi',
    tips: [
      'Volume rendah, intensitas rendah (40-60%)',
      'Fokus pada active recovery',
      'Target 2-3 sesi per minggu',
    ],
  },
};

export function WeeklyLoadTarget({ 
  loads, 
  weeklyTarget, 
  onTargetChange,
  currentWeekPlan,
  baseLoadPerPhase = DEFAULT_BASE_LOAD_PER_PHASE,
}: WeeklyLoadTargetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(weeklyTarget?.toString() || '');
  const [weekOffset, setWeekOffset] = useState(0);
  const [useAutoTarget, setUseAutoTarget] = useState(true);

  // Calculate auto target based on phase and volume
  const autoCalculatedTarget = useMemo(() => {
    if (!currentWeekPlan) return null;
    
    const fase = currentWeekPlan.fase || 'Umum';
    const baseLoad = baseLoadPerPhase[fase] || 500;
    const volume = currentWeekPlan.vol || 100;
    
    // Calculate target: baseLoad * (volume / 100)
    return Math.round(baseLoad * (volume / 100));
  }, [currentWeekPlan, baseLoadPerPhase]);

  // Effective target (auto or manual)
  const effectiveTarget = useMemo(() => {
    if (weeklyTarget !== null && !useAutoTarget) {
      return weeklyTarget;
    }
    return autoCalculatedTarget;
  }, [weeklyTarget, autoCalculatedTarget, useAutoTarget]);

  // Sync edit value when target changes
  useEffect(() => {
    setEditValue(effectiveTarget?.toString() || '');
  }, [effectiveTarget]);

  // Calculate weekly stats for the last 4 weeks
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weeks: WeekData[] = [];

    for (let i = 0; i >= -3; i--) {
      const targetDate = subWeeks(today, -i);
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

      const weekLoads = loads.filter(load => {
        const loadDate = parseISO(load.session_date);
        return isWithinInterval(loadDate, { start: weekStart, end: weekEnd });
      });

      const totalLoad = weekLoads.reduce((sum, load) => sum + (load.session_load || 0), 0);
      const avgRpe = weekLoads.length > 0 
        ? weekLoads.reduce((sum, load) => sum + load.rpe, 0) / weekLoads.length 
        : 0;

      weeks.push({
        weekStart,
        weekEnd,
        label: i === 0 ? 'Minggu Ini' : i === -1 ? 'Minggu Lalu' : `${format(weekStart, 'd MMM', { locale: idLocale })} - ${format(weekEnd, 'd MMM', { locale: idLocale })}`,
        totalLoad,
        sessions: weekLoads.length,
        avgRpe: Math.round(avgRpe * 10) / 10,
      });
    }

    return weeks;
  }, [loads]);

  const currentWeek = weeklyData[Math.abs(weekOffset)] || weeklyData[0];
  const previousWeek = weeklyData[Math.abs(weekOffset) + 1];

  const progressPercentage = effectiveTarget && effectiveTarget > 0 
    ? Math.min(100, Math.round((currentWeek.totalLoad / effectiveTarget) * 100))
    : 0;

  const getProgressColor = (progress: number) => {
    if (progress >= 90 && progress <= 110) return 'bg-green-500';
    if (progress >= 70 && progress < 90) return 'bg-amber-500';
    if (progress > 110) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const getProgressStatus = (progress: number) => {
    if (progress >= 90 && progress <= 110) return { text: 'Target Tercapai', color: 'text-green-500' };
    if (progress >= 70 && progress < 90) return { text: 'Hampir Tercapai', color: 'text-amber-500' };
    if (progress > 110) return { text: 'Melebihi Target', color: 'text-red-500' };
    if (progress >= 50) return { text: 'Dalam Progress', color: 'text-blue-500' };
    return { text: 'Baru Dimulai', color: 'text-muted-foreground' };
  };

  const handleSaveTarget = () => {
    const newTarget = editValue === '' ? null : parseInt(editValue);
    if (newTarget === null || newTarget >= 0) {
      setUseAutoTarget(false);
      onTargetChange(newTarget);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(effectiveTarget?.toString() || '');
    setIsEditing(false);
  };

  const handleResetToAuto = () => {
    setUseAutoTarget(true);
    onTargetChange(null);
    setIsEditing(false);
  };

  // Calculate change from previous week
  const loadChange = previousWeek 
    ? currentWeek.totalLoad - previousWeek.totalLoad 
    : 0;
  const changePercentage = previousWeek && previousWeek.totalLoad > 0
    ? Math.round((loadChange / previousWeek.totalLoad) * 100)
    : 0;

  const status = getProgressStatus(progressPercentage);
  const currentPhase = currentWeekPlan?.fase || 'Umum';
  const phaseGuidance = PHASE_GUIDANCE[currentPhase] || PHASE_GUIDANCE['Umum'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Target Load Mingguan
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Tracking progress terhadap target beban latihan
              {currentWeekPlan && (
                <Badge variant="outline" className="text-[10px]">
                  W{currentWeekPlan.wk} - {currentPhase}
                </Badge>
              )}
            </CardDescription>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setWeekOffset(Math.max(-3, weekOffset - 1))}
              disabled={weekOffset <= -3}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {currentWeek.label}
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setWeekOffset(Math.min(0, weekOffset + 1))}
              disabled={weekOffset >= 0}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phase Guidance Banner */}
        {currentWeekPlan && (
          <div className={cn(
            "p-3 rounded-lg border",
            currentPhase === 'Umum' && 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
            currentPhase === 'Khusus' && 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
            currentPhase === 'Pra-Komp' && 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
            currentPhase === 'Kompetisi' && 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
            currentPhase === 'Transisi' && 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
          )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={cn(
                    "text-xs",
                    currentPhase === 'Umum' && 'bg-blue-500',
                    currentPhase === 'Khusus' && 'bg-purple-500',
                    currentPhase === 'Pra-Komp' && 'bg-amber-500',
                    currentPhase === 'Kompetisi' && 'bg-red-500',
                    currentPhase === 'Transisi' && 'bg-green-500',
                  )}>
                    Fase {currentPhase}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Vol: {currentWeekPlan.vol}% | Int: {currentWeekPlan.int}%
                  </span>
                </div>
                <p className="text-sm font-medium">{phaseGuidance.description}</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-2">Panduan Fase {currentPhase}:</p>
                    <ul className="text-xs space-y-1">
                      {phaseGuidance.tips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Target Setting */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">Target Mingguan</p>
              {useAutoTarget && autoCalculatedTarget && (
                <Badge variant="secondary" className="text-[9px] gap-1">
                  <Sparkles className="w-3 h-3" />
                  Auto
                </Badge>
              )}
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Kosongkan untuk auto"
                  className="w-32 h-8 text-lg font-bold"
                  min="0"
                  step="50"
                />
                <span className="text-sm text-muted-foreground">AU</span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveTarget}>
                  <Check className="w-4 h-4 text-green-500" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  {effectiveTarget !== null ? `${effectiveTarget} AU` : '- AU'}
                </span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                {!useAutoTarget && autoCalculatedTarget && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleResetToAuto}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Reset ke auto ({autoCalculatedTarget} AU)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            {autoCalculatedTarget && useAutoTarget && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Kalkulasi: {baseLoadPerPhase[currentPhase] || 500} × {currentWeekPlan?.vol || 100}%
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tercapai</p>
            <p className="text-2xl font-bold">{currentWeek.totalLoad} AU</p>
          </div>
        </div>

        {/* Progress Bar */}
        {effectiveTarget !== null && effectiveTarget > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={cn("font-medium", status.color)}>{status.text}</span>
              <span className="font-bold">{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 AU</span>
              <span>{effectiveTarget} AU</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Sesi</p>
            <p className="text-xl font-bold">{currentWeek.sessions}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">RPE Rata-rata</p>
            <p className="text-xl font-bold">{currentWeek.avgRpe || '-'}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">vs Minggu Lalu</p>
            <div className="flex items-center justify-center gap-1">
              {loadChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : loadChange < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={cn(
                "text-xl font-bold",
                loadChange > 0 ? "text-green-500" : loadChange < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {loadChange > 0 ? '+' : ''}{changePercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Comparison Mini Chart */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Riwayat 4 Minggu Terakhir</p>
          <div className="grid grid-cols-4 gap-2">
            {weeklyData.map((week, index) => {
              const weekProgress = effectiveTarget && effectiveTarget > 0 
                ? Math.min(100, Math.round((week.totalLoad / effectiveTarget) * 100))
                : 0;
              const isCurrentView = index === Math.abs(weekOffset);
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "p-2 rounded-lg text-center cursor-pointer transition-all",
                    isCurrentView ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/30 hover:bg-muted/50"
                  )}
                  onClick={() => setWeekOffset(-index)}
                >
                  <p className="text-[10px] text-muted-foreground truncate">
                    {index === 0 ? 'Ini' : index === 1 ? 'Lalu' : `W-${index}`}
                  </p>
                  <p className="text-sm font-bold">{week.totalLoad}</p>
                  {effectiveTarget && effectiveTarget > 0 && (
                    <>
                      <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", getProgressColor(weekProgress))}
                          style={{ width: `${weekProgress}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{weekProgress}%</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Base Load Reference Table */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="font-medium text-sm mb-2 flex items-center gap-2">
            📊 Target Base per Fase (100% Volume)
          </p>
          <div className="grid grid-cols-5 gap-1 text-center">
            {Object.entries(baseLoadPerPhase).map(([fase, load]) => (
              <div 
                key={fase}
                className={cn(
                  "p-2 rounded text-xs",
                  fase === currentPhase ? "bg-primary/20 ring-1 ring-primary" : "bg-muted/50"
                )}
              >
                <p className="font-medium truncate">{fase}</p>
                <p className="text-muted-foreground">{load} AU</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
