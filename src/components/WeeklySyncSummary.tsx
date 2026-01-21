import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  Clock, 
  CloudOff,
  Cloud
} from 'lucide-react';
import { DaySession } from '@/types/training';

interface TrainingLoad {
  id: string;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  session_load: number | null;
  training_type: string;
  notes: string | null;
}

interface WeeklySyncSummaryProps {
  weekNumber: number;
  startDate: string;
  sessions: Record<string, DaySession>;
  loads: TrainingLoad[];
  weeklyTarget: number | null;
  phaseName: string;
  volumePercent: number;
  intensityPercent: number;
}

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// RPE-based Load Map for calculating TSS
const RPE_LOAD_MAP: Record<number, number> = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140,
};

const calculateTSS = (rpe: number, duration: number): number => {
  const baseLoad = RPE_LOAD_MAP[Math.min(10, Math.max(1, Math.round(rpe)))] || 60;
  return Math.round((duration / 60) * baseLoad);
};

export function WeeklySyncSummary({
  weekNumber,
  startDate,
  sessions,
  loads,
  weeklyTarget,
  phaseName,
  volumePercent,
  intensityPercent,
}: WeeklySyncSummaryProps) {
  // Calculate session sync status for each day
  const daySyncStatus = useMemo(() => {
    const programStartDate = new Date(startDate);
    
    return days.map((day, dayIndex) => {
      const sessionKey = `W${weekNumber}-${day}`;
      const session = sessions[sessionKey];
      const dayDate = addDays(programStartDate, (weekNumber - 1) * 7 + dayIndex);
      const dayDateStr = format(dayDate, 'yyyy-MM-dd');
      
      // Find matching load in database
      const dbLoad = loads.find(l => l.session_date === dayDateStr);
      
      // Calculate expected TSS from session
      const expectedTSS = session?.rpe && session?.duration 
        ? calculateTSS(session.rpe, session.duration)
        : 0;
      
      // Determine sync status
      const hasSession = session?.isDone && session?.rpe && session?.duration;
      const isSynced = !!dbLoad;
      const loadValue = dbLoad?.session_load || expectedTSS;
      
      return {
        day,
        date: dayDate,
        dateStr: dayDateStr,
        session,
        dbLoad,
        expectedTSS,
        actualLoad: loadValue,
        hasSession,
        isSynced,
        status: !hasSession ? 'empty' : isSynced ? 'synced' : 'pending',
      };
    });
  }, [weekNumber, startDate, sessions, loads]);

  // Calculate totals
  const totals = useMemo(() => {
    const completedSessions = daySyncStatus.filter(d => d.hasSession).length;
    const syncedSessions = daySyncStatus.filter(d => d.isSynced).length;
    const totalLoad = daySyncStatus.reduce((sum, d) => sum + d.actualLoad, 0);
    const totalSyncedLoad = daySyncStatus.filter(d => d.isSynced).reduce((sum, d) => sum + d.actualLoad, 0);
    
    return {
      completedSessions,
      syncedSessions,
      totalLoad,
      totalSyncedLoad,
      syncPercentage: completedSessions > 0 ? Math.round((syncedSessions / completedSessions) * 100) : 0,
      targetPercentage: weeklyTarget ? Math.round((totalLoad / weeklyTarget) * 100) : 0,
    };
  }, [daySyncStatus, weeklyTarget]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <Cloud className="w-3 h-3 text-green-500" />;
      case 'pending':
        return <CloudOff className="w-3 h-3 text-amber-500" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-600 border-green-500/30">Synced</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/30">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] text-muted-foreground">-</Badge>;
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Ringkasan Minggu {weekNumber}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {phaseName} • Vol: {volumePercent}% • Int: {intensityPercent}%
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Cloud className="w-3 h-3" />
                    {totals.syncedSessions}/{totals.completedSessions}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{totals.syncedSessions} dari {totals.completedSessions} sesi ter-sync ke monitoring</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session List */}
        <div className="grid grid-cols-7 gap-1.5">
          {daySyncStatus.map((dayData, idx) => (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "p-2 rounded-lg border text-center transition-all cursor-default",
                      dayData.status === 'synced' && "bg-green-500/10 border-green-500/30",
                      dayData.status === 'pending' && "bg-amber-500/10 border-amber-500/30",
                      dayData.status === 'empty' && "bg-muted/30 border-border",
                    )}
                  >
                    <div className="text-[10px] font-bold text-muted-foreground">
                      {dayData.day.slice(0, 3)}
                    </div>
                    <div className="text-[9px] text-muted-foreground/70">
                      {format(dayData.date, 'd/M')}
                    </div>
                    <div className="mt-1 flex justify-center">
                      {getStatusIcon(dayData.status)}
                    </div>
                    {dayData.actualLoad > 0 && (
                      <div className="mt-1 text-[9px] font-bold text-primary">
                        {dayData.actualLoad} AU
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-xs">
                      {dayData.day} - {format(dayData.date, 'd MMMM yyyy', { locale: idLocale })}
                    </p>
                    {dayData.hasSession ? (
                      <>
                        <div className="flex items-center gap-2 text-xs">
                          <span>RPE: {dayData.session?.rpe}</span>
                          <span>Durasi: {dayData.session?.duration}m</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span>Load: {dayData.actualLoad} AU</span>
                          {getStatusBadge(dayData.status)}
                        </div>
                        {dayData.dbLoad?.notes && (
                          <p className="text-[10px] text-muted-foreground">{dayData.dbLoad.notes}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Belum ada sesi selesai</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 bg-card rounded-lg border text-center">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Total Load</div>
            <div className="text-lg font-extrabold text-primary">{totals.totalLoad} AU</div>
          </div>
          <div className="p-2 bg-card rounded-lg border text-center">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Synced</div>
            <div className="text-lg font-extrabold text-green-600">{totals.totalSyncedLoad} AU</div>
          </div>
          <div className="p-2 bg-card rounded-lg border text-center">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Target</div>
            <div className="text-lg font-extrabold">{weeklyTarget || '-'} AU</div>
          </div>
        </div>

        {/* Progress Bar */}
        {weeklyTarget && weeklyTarget > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress ke Target</span>
              <span className={cn(
                "font-bold",
                totals.targetPercentage >= 100 ? "text-green-600" :
                totals.targetPercentage >= 70 ? "text-amber-600" : "text-red-600"
              )}>
                {totals.targetPercentage}%
              </span>
            </div>
            <Progress 
              value={Math.min(100, totals.targetPercentage)} 
              className="h-2"
            />
          </div>
        )}

        {/* Sync Status Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Cloud className="w-3 h-3 text-green-500" />
            <span>Synced ke Monitoring</span>
          </div>
          <div className="flex items-center gap-1">
            <CloudOff className="w-3 h-3 text-amber-500" />
            <span>Belum Sync</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>Belum Selesai</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}