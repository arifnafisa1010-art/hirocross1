import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, Circle, Dumbbell, Clock, Flame, 
  Calendar, Activity, Trophy, Zap, Save, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, addWeeks, addDays, isToday, isBefore } from 'date-fns';
import { getWeekStartDate, getOrderedDays } from '@/lib/dateUtils';
import { id as idLocale } from 'date-fns/locale';

interface Exercise {
  name: string;
  cat: string;
  set: number;
  rep: number;
  load: number;
}

interface Session {
  id: string;
  session_key: string;
  warmup: string | null;
  exercises: Exercise[] | null;
  cooldown: string | null;
  recovery: string | null;
  intensity: string | null;
  is_done: boolean | null;
  program_id: string | null;
}

interface PlanWeek {
  wk: number;
  meso: string;
  fase: string;
  vol: number;
  int: number;
}

interface AthleteCalendarViewProps {
  programId: string;
  programName: string;
  startDate: string;
  planData: PlanWeek[];
  competitions?: any[];
  athleteId?: string;
}

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// RPE-based TSS calculation
const RPE_LOAD_MAP: Record<number, number> = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140,
};

const calculateSessionLoad = (rpe: number, durationMinutes: number): number => {
  const baseLoad = RPE_LOAD_MAP[rpe] || 60;
  return Math.round(baseLoad * (durationMinutes / 60));
};

export function AthleteCalendarView({ 
  programId, 
  programName,
  startDate, 
  planData,
  competitions = [],
  athleteId
}: AthleteCalendarViewProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);
  const [activeSessionTab, setActiveSessionTab] = useState<number>(0);
  
  // RPE and Duration input state - single session
  const [sessionSlots, setSessionSlots] = useState<Array<{ rpe: number; duration: number; enabled: boolean }>>([
    { rpe: 5, duration: 60, enabled: true },
  ]);
  const [sessionInputs, setSessionInputs] = useState<Record<string, { rpe: number; duration: number }>>({});
  const [rpe, setRpe] = useState<number>(5);
  const [duration, setDuration] = useState<number>(60);
  const [saving, setSaving] = useState(false);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('program_id', programId);

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions((data || []).map(s => ({
        ...s,
        exercises: Array.isArray(s.exercises) ? s.exercises as unknown as Exercise[] : null
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [programId]);

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

  // Get current week number
  const getCurrentWeek = () => {
    const programStart = parseISO(startDate);
    const now = new Date();
    const diffWeeks = Math.floor((now.getTime() - programStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, diffWeeks + 1);
  };

  const currentWeek = getCurrentWeek();

  // Auto-select current month on load
  useEffect(() => {
    const monthIndex = months.findIndex(m => m.weeks.includes(currentWeek));
    if (monthIndex >= 0) {
      setSelectedMonth(monthIndex);
    }
  }, [months, currentWeek]);

  const currentMonthWeeks = months[selectedMonth]?.weeks || [];

  // Get all sessions for a specific week and day (multi-session support)
  const getSessionsForDay = (week: number, dayIndex: number): Session[] => {
    const prefix = `week-${week}-day-${dayIndex + 1}-session-`;
    return sessions.filter(s => s.session_key.startsWith(prefix)).sort((a, b) => a.session_key.localeCompare(b.session_key));
  };

  // Get first session for a specific week and day (backward compat)
  const getSession = (week: number, dayIndex: number): Session | null => {
    const daySessions = getSessionsForDay(week, dayIndex);
    return daySessions[0] || null;
  };

  // Get date for a specific week and day
  const getDateForDay = (week: number, dayIndex: number) => {
    const programStart = parseISO(startDate);
    // Athlete calendar always uses 'startDay' mode since it follows the program
    const weekStart = getWeekStartDate(programStart, week, 'startDay');
    return addDays(weekStart, dayIndex);
  };

  // Save training load to database for a specific session
  const saveTrainingLoadForSession = async (session: Session, sessionRpe: number, sessionDuration: number, sessionIndex: number) => {
    if (!user || !selectedSessionDate) return false;

    const sessionLoad = calculateSessionLoad(sessionRpe, sessionDuration);

    let trainingType = 'training';
    if (session.exercises && session.exercises.length > 0) {
      const firstCat = session.exercises[0].cat;
      if (firstCat === 'strength') trainingType = 'strength';
      else if (firstCat === 'endurance') trainingType = 'conditioning';
      else if (firstCat === 'technique') trainingType = 'technical';
      else if (firstCat === 'tactic') trainingType = 'tactical';
    }

    // Use date + session index as unique key
    const sessionDateKey = `${selectedSessionDate}-S${sessionIndex + 1}`;

    // Check if load already exists for this date+session
    const { data: existing } = await supabase
      .from('training_loads')
      .select('id')
      .eq('session_date', selectedSessionDate)
      .eq('athlete_id', athleteId || null)
      .eq('notes', `session-${sessionIndex + 1}`)
      .maybeSingle();

    let error;
    if (existing) {
      const result = await supabase
        .from('training_loads')
        .update({
          rpe: sessionRpe,
          duration_minutes: sessionDuration,
          session_load: sessionLoad,
          training_type: trainingType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('training_loads')
        .insert({
          user_id: user.id,
          athlete_id: athleteId || null,
          session_date: selectedSessionDate,
          rpe: sessionRpe,
          duration_minutes: sessionDuration,
          session_load: sessionLoad,
          training_type: trainingType,
          notes: `session-${sessionIndex + 1}`,
        });
      error = result.error;
    }

    if (error) {
      console.error('Error saving training load:', error);
      return false;
    }

    // Mark session as done
    if (!session.is_done) {
      await toggleSessionDone(session);
    }

    return true;
  };

  // Save enabled session slots
  const saveAllTrainingLoads = async () => {
    if (!user || !selectedSessionDate) {
      toast.error('Data tidak lengkap');
      return;
    }

    setSaving(true);

    const enabledSlots = sessionSlots.filter(s => s.enabled);
    let allSuccess = true;
    let totalTSS = 0;

    for (let i = 0; i < enabledSlots.length; i++) {
      const slot = enabledSlots[i];
      const session = selectedSessions[i] || null;
      const sessionLoad = calculateSessionLoad(slot.rpe, slot.duration);
      totalTSS += sessionLoad;

      let trainingType = 'training';
      if (session?.exercises && session.exercises.length > 0) {
        const firstCat = session.exercises[0].cat;
        if (firstCat === 'strength') trainingType = 'strength';
        else if (firstCat === 'endurance') trainingType = 'conditioning';
        else if (firstCat === 'technique') trainingType = 'technical';
        else if (firstCat === 'tactic') trainingType = 'tactical';
      }

      const { data: existing } = await supabase
        .from('training_loads')
        .select('id')
        .eq('session_date', selectedSessionDate)
        .eq('athlete_id', athleteId || null)
        .eq('notes', `session-${i + 1}`)
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from('training_loads')
          .update({
            rpe: slot.rpe,
            duration_minutes: slot.duration,
            session_load: sessionLoad,
            training_type: trainingType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('training_loads')
          .insert({
            user_id: user.id,
            athlete_id: athleteId || null,
            session_date: selectedSessionDate,
            rpe: slot.rpe,
            duration_minutes: slot.duration,
            session_load: sessionLoad,
            training_type: trainingType,
            notes: `session-${i + 1}`,
          });
        error = result.error;
      }

      if (error) {
        console.error('Error saving training load:', error);
        allSuccess = false;
      } else if (session && !session.is_done) {
        await toggleSessionDone(session);
      }
    }

    if (allSuccess) {
      toast.success(`Data tersimpan! Total TSS: ${totalTSS} AU`);
    } else {
      toast.error('Beberapa sesi gagal disimpan');
    }

    setSaving(false);
    fetchSessions();
  };

  // Toggle session done status
  const toggleSessionDone = async (session: Session) => {
    setUpdatingSession(session.id);
    
    const { error } = await supabase
      .from('training_sessions')
      .update({ is_done: !session.is_done })
      .eq('id', session.id);

    if (error) {
      console.error('Error updating session:', error);
      toast.error('Gagal mengupdate status sesi');
    } else {
      setSessions(prev => prev.map(s => 
        s.id === session.id ? { ...s, is_done: !session.is_done } : s
      ));
    }
    
    setUpdatingSession(null);
  };

  // Check if a date has competition
  const hasCompetition = (date: Date) => {
    return competitions.some(c => {
      const compDate = parseISO(c.date);
      return format(compDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const getCompetition = (date: Date) => {
    return competitions.find(c => {
      const compDate = parseISO(c.date);
      return format(compDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  // Open session detail with date - now supports multi-session
  const openSessionDetail = (session: Session | null, dayDate: Date) => {
    const dayOfWeek = dayDate.getDay();
    const actualDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const programStart = parseISO(startDate);
    const weekStartDate = getWeekStartDate(programStart, 1, 'startDay');
    const diffWeeks = Math.floor((dayDate.getTime() - weekStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const wk = Math.max(1, diffWeeks + 1);
    
    const allDaySessions = getSessionsForDay(wk, actualDayIndex);
    
    setSelectedSession(session || allDaySessions[0] || null);
    setSelectedSessions(allDaySessions);
    setSelectedSessionDate(format(dayDate, 'yyyy-MM-dd'));
    setActiveSessionTab(0);
    
    // Single session slot
    setSessionSlots([
      { rpe: 5, duration: 60, enabled: true },
    ]);
    
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const calculatedTSS = calculateSessionLoad(rpe, duration);

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Kalender Latihan</h3>
          <Badge variant="outline">Minggu {currentWeek}</Badge>
        </div>
        
        <Select
          value={selectedMonth.toString()}
          onValueChange={(v) => setSelectedMonth(parseInt(v))}
        >
          <SelectTrigger className="w-56">
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

      {/* Calendar Grid */}
      <div className="space-y-6">
        {currentMonthWeeks.map((wk) => {
          const weekData = planData.find(p => p.wk === wk);
          const weekSessions = days.map((_, idx) => getSession(wk, idx));
          const completedCount = weekSessions.filter(s => s?.is_done).length;
          const totalWithContent = weekSessions.filter(s => s && s.exercises && s.exercises.length > 0).length;
          const isCurrentWeek = wk === currentWeek;

          return (
            <div key={wk} className="space-y-2">
              {/* Week Header */}
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                isCurrentWeek ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
              )}>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Minggu {wk}</span>
                      <span className="text-sm text-muted-foreground">({weekData?.meso})</span>
                      {isCurrentWeek && (
                        <Badge variant="default" className="text-xs">Sekarang</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        weekData?.fase === 'Umum' && 'border-blue-500 text-blue-600',
                        weekData?.fase === 'Khusus' && 'border-green-500 text-green-600',
                        weekData?.fase === 'Pra-Komp' && 'border-orange-500 text-orange-600',
                        weekData?.fase === 'Kompetisi' && 'border-red-500 text-red-600',
                      )}>
                        {weekData?.fase}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Vol: {weekData?.vol}% | Int: {weekData?.int}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{completedCount}/{totalWithContent || 7}</p>
                    <p className="text-xs text-muted-foreground">selesai</p>
                  </div>
                </div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
              {days.map((day, dayIndex) => {
                  const session = getSession(wk, dayIndex);
                  const allDaySessions = getSessionsForDay(wk, dayIndex);
                  const sessionCount = allDaySessions.length;
                  const dayDate = getDateForDay(wk, dayIndex);
                  const isSessionToday = isToday(dayDate);
                  const isPast = isBefore(dayDate, new Date()) && !isSessionToday;
                  const hasContent = session?.exercises && session.exercises.length > 0;
                  const isDone = session?.is_done;
                  const intensity = session?.intensity || 'Rest';
                  const competition = getCompetition(dayDate);

                  return (
                    <Card
                      key={day}
                      onClick={() => openSessionDetail(session, dayDate)}
                      className={cn(
                        "p-2 min-h-[120px] cursor-pointer transition-all hover:shadow-md relative",
                        isSessionToday && "ring-2 ring-primary ring-offset-2",
                        isDone && "bg-green-50 dark:bg-green-950/30 border-green-300",
                        !isDone && isPast && hasContent && "bg-orange-50 dark:bg-orange-950/30 border-orange-200",
                        intensity === 'High' && !isDone && 'border-red-300',
                        intensity === 'Med' && !isDone && 'border-yellow-300',
                        intensity === 'Low' && !isDone && 'border-green-300',
                      )}
                    >
                      {/* Day header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground">
                            {day.slice(0, 3)}
                          </div>
                          <div className="text-[9px] text-muted-foreground/70">
                            {format(dayDate, 'd MMM', { locale: idLocale })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {sessionCount > 1 && (
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">
                              {sessionCount}x
                            </Badge>
                          )}
                          {isDone && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>

                      {/* Competition badge */}
                      {competition && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500 text-yellow-950 rounded text-[8px] font-bold mb-1">
                          <Trophy className="h-2.5 w-2.5" />
                          <span className="truncate">{competition.name}</span>
                        </div>
                      )}

                      {/* Intensity badge */}
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[8px] px-1 py-0 mb-1",
                          intensity === 'High' && 'border-red-500 text-red-600 bg-red-50',
                          intensity === 'Med' && 'border-yellow-500 text-yellow-600 bg-yellow-50',
                          intensity === 'Low' && 'border-green-500 text-green-600 bg-green-50',
                          intensity === 'Rest' && 'border-gray-300 text-gray-500',
                        )}
                      >
                        <Flame className="h-2 w-2 mr-0.5" />
                        {intensity}
                      </Badge>

                      {/* Exercises preview */}
                      {hasContent && (
                        <div className="space-y-0.5 mt-1">
                          {session.exercises!.slice(0, 2).map((ex, i) => (
                            <div key={i} className="text-[9px] font-medium truncate text-muted-foreground">
                              • {ex.name}
                            </div>
                          ))}
                          {session.exercises!.length > 2 && (
                            <div className="text-[8px] text-muted-foreground/70">
                              +{session.exercises!.length - 2} lainnya
                            </div>
                          )}
                        </div>
                      )}

                      {!hasContent && intensity === 'Rest' && (
                        <div className="text-[9px] text-muted-foreground/60 mt-2">
                          Istirahat
                        </div>
                      )}

                      {!hasContent && intensity !== 'Rest' && (
                        <div className="text-[9px] text-muted-foreground/60 mt-2">
                          Belum ada detail
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Catat Latihan
              <span className="text-sm font-normal text-muted-foreground">
                {selectedSessionDate && format(parseISO(selectedSessionDate), 'd MMMM yyyy', { locale: idLocale })}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Session Tab Selector - always 2 tabs */}
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((idx) => {
                const slot = sessionSlots[idx];
                const session = selectedSessions[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveSessionTab(idx);
                      if (!slot.enabled) {
                        setSessionSlots(prev => prev.map((s, i) => i === idx ? { ...s, enabled: true } : s));
                      }
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all",
                      activeSessionTab === idx
                        ? "border-primary bg-primary/10"
                        : slot.enabled
                          ? "border-border bg-muted/50 hover:bg-muted"
                          : "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">Sesi {idx + 1}</span>
                      {slot.enabled ? (
                        <Badge variant="outline" className="text-[10px]">
                          RPE {slot.rpe} · {slot.duration}m
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Tap untuk isi
                        </Badge>
                      )}
                    </div>
                    {slot.enabled && (
                      <div className="text-xs text-muted-foreground mt-1">
                        TSS: {calculateSessionLoad(slot.rpe, slot.duration)} AU
                      </div>
                    )}
                    {session && session.exercises && session.exercises.length > 0 && (
                      <div className="text-[10px] text-muted-foreground/70 mt-1 truncate">
                        {session.exercises.slice(0, 2).map(e => e.name).join(', ')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Session Content */}
            {(() => {
              const idx = activeSessionTab;
              const slot = sessionSlots[idx];
              const session = selectedSessions[idx] || null;

              return (
                <div className="space-y-4">
                  {/* Session detail from coach (if exists) */}
                  {session && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={session.is_done ? "default" : "outline"}>
                          {session.is_done ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" />Selesai</>
                          ) : (
                            <><Circle className="h-3 w-3 mr-1" />Belum</>
                          )}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={cn(
                            session.intensity === 'High' && 'border-red-500 text-red-600',
                            session.intensity === 'Med' && 'border-yellow-500 text-yellow-600',
                            session.intensity === 'Low' && 'border-green-500 text-green-600',
                          )}
                        >
                          <Flame className="h-3 w-3 mr-1" />
                          {session.intensity || 'Rest'}
                        </Badge>
                      </div>

                      {session.warmup && (
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-500" />Pemanasan
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">{session.warmup}</p>
                        </div>
                      )}

                      {session.exercises && session.exercises.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Dumbbell className="h-4 w-4 text-primary" />Latihan Inti
                          </h4>
                          <div className="space-y-2 pl-6">
                            {session.exercises.map((ex, i) => (
                              <div key={i} className="p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{ex.name}</p>
                                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                      <span>{ex.set} set</span>
                                      <span>{ex.rep} reps</span>
                                      {ex.load > 0 && <span>{ex.load} kg</span>}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[10px]">
                                    {ex.cat === 'strength' && 'Kekuatan'}
                                    {ex.cat === 'speed' && 'Kecepatan'}
                                    {ex.cat === 'endurance' && 'Daya Tahan'}
                                    {ex.cat === 'technique' && 'Teknik'}
                                    {ex.cat === 'tactic' && 'Taktik'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.cooldown && (
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />Pendinginan
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">{session.cooldown}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!session && (
                    <div className="text-center py-3 text-sm text-muted-foreground">
                      Tidak ada program dari pelatih untuk sesi ini. Anda tetap bisa mencatat beban latihan.
                    </div>
                  )}

                  {/* RPE & Duration Input */}
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Catat Beban - Sesi {idx + 1}
                    </h4>
                    
                    {/* RPE Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">RPE (Rating of Perceived Exertion)</Label>
                        <Badge variant="outline" className="font-bold">{slot.rpe}</Badge>
                      </div>
                      <Slider
                        value={[slot.rpe]}
                        onValueChange={(v) => setSessionSlots(prev => prev.map((s, i) => i === idx ? { ...s, rpe: v[0] } : s))}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>1 Sangat Ringan</span>
                        <span>5 Sedang</span>
                        <span>10 Maksimal</span>
                      </div>
                    </div>

                    {/* Duration Input */}
                    <div className="space-y-2">
                      <Label className="text-sm">Durasi (menit)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={slot.duration}
                          onChange={(e) => setSessionSlots(prev => prev.map((s, i) => i === idx ? { ...s, duration: parseInt(e.target.value) || 0 } : s))}
                          min={0}
                          max={480}
                          className="w-24"
                        />
                        <div className="flex gap-1">
                          {[30, 45, 60, 90].map(d => (
                            <Button 
                              key={d} 
                              size="sm" 
                              variant={slot.duration === d ? "default" : "outline"}
                              onClick={() => setSessionSlots(prev => prev.map((s, i) => i === idx ? { ...s, duration: d } : s))}
                              className="text-xs h-8 px-2"
                            >
                              {d}m
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* TSS Preview */}
                    <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">TSS Sesi {idx + 1}</span>
                      </div>
                      <Badge className="font-bold">{calculateSessionLoad(slot.rpe, slot.duration)} AU</Badge>
                    </div>

                    {/* Toggle off button for session 2 */}
                    {idx === 1 && slot.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => setSessionSlots(prev => prev.map((s, i) => i === 1 ? { ...s, enabled: false } : s))}
                      >
                        Hapus Sesi 2
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Total TSS summary */}
            {sessionSlots.filter(s => s.enabled).length > 1 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Total TSS Hari Ini</span>
                </div>
                <Badge className="text-lg font-bold">
                  {sessionSlots.filter(s => s.enabled).reduce((total, s) => total + calculateSessionLoad(s.rpe, s.duration), 0)} AU
                </Badge>
              </div>
            )}

            {/* Save Button */}
            <Button 
              className="w-full" 
              onClick={saveAllTrainingLoads}
              disabled={saving || !sessionSlots.some(s => s.enabled)}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan {sessionSlots.filter(s => s.enabled).length > 1 ? '2 Sesi' : 'Sesi'} & Tandai Selesai
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
