import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Target, TrendingUp, TrendingDown, Minus, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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

interface WeeklyLoadTargetProps {
  loads: TrainingLoad[];
  weeklyTarget: number;
  onTargetChange: (target: number) => void;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  label: string;
  totalLoad: number;
  sessions: number;
  avgRpe: number;
}

export function WeeklyLoadTarget({ loads, weeklyTarget, onTargetChange }: WeeklyLoadTargetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(weeklyTarget.toString());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, etc.

  // Calculate weekly stats for the last 4 weeks
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weeks: WeekData[] = [];

    for (let i = 0; i >= -3; i--) {
      const targetDate = subWeeks(today, -i);
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday

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

  const progressPercentage = weeklyTarget > 0 
    ? Math.min(100, Math.round((currentWeek.totalLoad / weeklyTarget) * 100))
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
    const newTarget = parseInt(editValue) || 0;
    if (newTarget >= 0) {
      onTargetChange(newTarget);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(weeklyTarget.toString());
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Target Load Mingguan
            </CardTitle>
            <CardDescription>
              Tracking progress terhadap target beban latihan
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
        {/* Target Setting */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Target Mingguan</p>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-24 h-8 text-lg font-bold"
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
                <span className="text-2xl font-bold">{weeklyTarget} AU</span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tercapai</p>
            <p className="text-2xl font-bold">{currentWeek.totalLoad} AU</p>
          </div>
        </div>

        {/* Progress Bar */}
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
            <span>{weeklyTarget} AU</span>
          </div>
        </div>

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
              const weekProgress = weeklyTarget > 0 
                ? Math.min(100, Math.round((week.totalLoad / weeklyTarget) * 100))
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
                  <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", getProgressColor(weekProgress))}
                      style={{ width: `${weekProgress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{weekProgress}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Target Info */}
        <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">💡 Tips Target Mingguan</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>Target ideal: tingkatkan 5-10% per minggu</li>
            <li>Jangan melebihi 150% dari rata-rata 4 minggu terakhir</li>
            <li>Sesuaikan dengan fase latihan (Umum, Khusus, dll)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
