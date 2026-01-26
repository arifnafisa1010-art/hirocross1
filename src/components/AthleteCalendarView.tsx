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
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);
  
  // RPE and Duration input state
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

  // Get session for a specific week and day
  const getSession = (week: number, dayIndex: number): Session | null => {
    const sessionKey = `week-${week}-day-${dayIndex + 1}-session-1`;
    return sessions.find(s => s.session_key === sessionKey) || null;
  };

  // Get date for a specific week and day
  const getDateForDay = (week: number, dayIndex: number) => {
    const programStart = parseISO(startDate);
    const weekStart = addWeeks(programStart, week - 1);
    return addDays(weekStart, dayIndex);
  };

  // Save training load to database
  const saveTrainingLoad = async () => {
    if (!user || !selectedSessionDate) {
      toast.error('Data tidak lengkap');
      return;
    }

    setSaving(true);

    const sessionLoad = calculateSessionLoad(rpe, duration);

    // Determine training type from session's first exercise category
    let trainingType = 'training';
    if (selectedSession?.exercises && selectedSession.exercises.length > 0) {
      const firstCat = selectedSession.exercises[0].cat;
      if (firstCat === 'strength') trainingType = 'strength';
      else if (firstCat === 'endurance') trainingType = 'conditioning';
      else if (firstCat === 'technique') trainingType = 'technical';
      else if (firstCat === 'tactic') trainingType = 'tactical';
    }

    // Check if load already exists for this date
    const { data: existing } = await supabase
      .from('training_loads')
      .select('id')
      .eq('session_date', selectedSessionDate)
      .eq('athlete_id', athleteId || null)
      .maybeSingle();

    let error;
    if (existing) {
      // Update existing
      const result = await supabase
        .from('training_loads')
        .update({
          rpe,
          duration_minutes: duration,
          session_load: sessionLoad,
          training_type: trainingType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      error = result.error;
    } else {
      // Insert new
      const result = await supabase
        .from('training_loads')
        .insert({
          user_id: user.id,
          athlete_id: athleteId || null,
          session_date: selectedSessionDate,
          rpe,
          duration_minutes: duration,
          session_load: sessionLoad,
          training_type: trainingType,
        });
      error = result.error;
    }

    if (error) {
      console.error('Error saving training load:', error);
      toast.error('Gagal menyimpan data latihan');
    } else {
      toast.success(`Data latihan tersimpan! TSS: ${sessionLoad} AU`);
      
      // Also mark session as done if not already
      if (selectedSession && !selectedSession.is_done) {
        await toggleSessionDone(selectedSession);
        setSelectedSession(prev => prev ? { ...prev, is_done: true } : null);
      }
    }

    setSaving(false);
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

  // Open session detail with date
  const openSessionDetail = (session: Session | null, dayDate: Date) => {
    setSelectedSession(session);
    setSelectedSessionDate(format(dayDate, 'yyyy-MM-dd'));
    setRpe(5);
    setDuration(60);
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
                        {isDone && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
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

      {/* Session Detail Dialog with RPE Input */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Detail Sesi Latihan
            </DialogTitle>
          </DialogHeader>

          {selectedSession ? (
            <div className="space-y-4">
              {/* Session info */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedSession.is_done ? "default" : "outline"}>
                    {selectedSession.is_done ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Selesai
                      </>
                    ) : (
                      <>
                        <Circle className="h-3 w-3 mr-1" />
                        Belum Selesai
                      </>
                    )}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={cn(
                      selectedSession.intensity === 'High' && 'border-red-500 text-red-600',
                      selectedSession.intensity === 'Med' && 'border-yellow-500 text-yellow-600',
                      selectedSession.intensity === 'Low' && 'border-green-500 text-green-600',
                    )}
                  >
                    <Flame className="h-3 w-3 mr-1" />
                    {selectedSession.intensity || 'Rest'}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedSessionDate && format(parseISO(selectedSessionDate), 'd MMM yyyy', { locale: idLocale })}
                </span>
              </div>

              {/* Warmup */}
              {selectedSession.warmup && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    Pemanasan
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">{selectedSession.warmup}</p>
                </div>
              )}

              {/* Exercises */}
              {selectedSession.exercises && selectedSession.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    Latihan Inti
                  </h4>
                  <div className="space-y-2 pl-6">
                    {selectedSession.exercises.map((ex, idx) => (
                      <div 
                        key={idx}
                        className="p-3 bg-muted/50 rounded-lg"
                      >
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

              {/* Cooldown */}
              {selectedSession.cooldown && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Pendinginan
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">{selectedSession.cooldown}</p>
                </div>
              )}

              {/* Recovery */}
              {selectedSession.recovery && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    Pemulihan
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">{selectedSession.recovery}</p>
                </div>
              )}

              {/* Empty state */}
              {!selectedSession.warmup && 
               !selectedSession.exercises?.length && 
               !selectedSession.cooldown && 
               !selectedSession.recovery && (
                <div className="text-center py-4 text-muted-foreground">
                  {selectedSession.intensity === 'Rest' 
                    ? 'Hari istirahat - tidak ada latihan' 
                    : 'Detail sesi belum diisi oleh pelatih'}
                </div>
              )}

              {/* RPE & Duration Input */}
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Catat Beban Latihan
                </h4>
                
                {/* RPE Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">RPE (Rating of Perceived Exertion)</Label>
                    <Badge variant="outline" className="font-bold">{rpe}</Badge>
                  </div>
                  <Slider
                    value={[rpe]}
                    onValueChange={(v) => setRpe(v[0])}
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
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      min={0}
                      max={480}
                      className="w-24"
                    />
                    <div className="flex gap-1">
                      {[30, 45, 60, 90].map(d => (
                        <Button 
                          key={d} 
                          size="sm" 
                          variant={duration === d ? "default" : "outline"}
                          onClick={() => setDuration(d)}
                          className="text-xs h-8 px-2"
                        >
                          {d}m
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TSS Preview */}
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Session Load (TSS)</span>
                  </div>
                  <Badge className="text-lg font-bold">{calculatedTSS} AU</Badge>
                </div>

                {/* Save Button */}
                <Button 
                  className="w-full" 
                  onClick={saveTrainingLoad}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan & Tandai Selesai
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Tidak ada sesi untuk tanggal ini</p>
              <p className="text-sm mt-1">{selectedSessionDate && format(parseISO(selectedSessionDate), 'd MMMM yyyy', { locale: idLocale })}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
