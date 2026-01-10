import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Dumbbell, Clock, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, addWeeks, startOfWeek, addDays, isSameDay, isToday, isBefore, isAfter } from 'date-fns';
import { id } from 'date-fns/locale';

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  rest?: string;
  notes?: string;
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

interface AthleteSessionsViewProps {
  programId: string;
  startDate: string;
  planData: any[];
}

export function AthleteSessionsView({ programId, startDate, planData }: AthleteSessionsViewProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);

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

  const toggleSessionDone = async (sessionId: string, currentStatus: boolean) => {
    setUpdatingSession(sessionId);
    
    const { error } = await supabase
      .from('training_sessions')
      .update({ is_done: !currentStatus })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session:', error);
      toast.error('Gagal mengupdate status sesi');
    } else {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, is_done: !currentStatus } : s
      ));
      toast.success(!currentStatus ? 'Sesi ditandai selesai!' : 'Sesi dibatalkan');
    }
    
    setUpdatingSession(null);
  };

  const parseSessionKey = (sessionKey: string) => {
    // Format: week-1-day-1-session-1
    const parts = sessionKey.split('-');
    const week = parseInt(parts[1]);
    const day = parseInt(parts[3]);
    const session = parseInt(parts[5]);
    return { week, day, session };
  };

  const getSessionDate = (sessionKey: string) => {
    const { week, day } = parseSessionKey(sessionKey);
    const programStart = parseISO(startDate);
    const weekStart = addWeeks(programStart, week - 1);
    return addDays(weekStart, day - 1);
  };

  const getIntensityColor = (intensity: string | null) => {
    switch (intensity?.toLowerCase()) {
      case 'rest': return 'bg-gray-100 text-gray-700';
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'very high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPhaseForWeek = (week: number) => {
    const weekPlan = planData.find((p: any) => p.week === week);
    return weekPlan?.phase || '-';
  };

  // Group sessions by week
  const sessionsByWeek = sessions.reduce((acc, session) => {
    const { week } = parseSessionKey(session.session_key);
    if (!acc[week]) acc[week] = [];
    acc[week].push(session);
    return acc;
  }, {} as Record<number, Session[]>);

  // Sort weeks
  const sortedWeeks = Object.keys(sessionsByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  // Get current week based on date
  const getCurrentWeek = () => {
    const now = new Date();
    const programStart = parseISO(startDate);
    const diffWeeks = Math.floor((now.getTime() - programStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, diffWeeks + 1);
  };

  const currentWeek = getCurrentWeek();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada sesi latihan yang dijadwalkan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedWeeks.map(week => {
        const weekSessions = sessionsByWeek[week].sort((a, b) => {
          const aInfo = parseSessionKey(a.session_key);
          const bInfo = parseSessionKey(b.session_key);
          if (aInfo.day !== bInfo.day) return aInfo.day - bInfo.day;
          return aInfo.session - bInfo.session;
        });

        const completedCount = weekSessions.filter(s => s.is_done).length;
        const isCurrentWeek = week === currentWeek;

        return (
          <Collapsible 
            key={week} 
            defaultOpen={isCurrentWeek}
            className="border rounded-lg"
          >
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${isCurrentWeek ? 'bg-primary/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Minggu {week}</span>
                      {isCurrentWeek && (
                        <Badge variant="default" className="text-xs">Sekarang</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fase: {getPhaseForWeek(week)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{completedCount}/{weekSessions.length}</p>
                    <p className="text-xs text-muted-foreground">selesai</p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t p-4 space-y-3">
                {weekSessions.map(session => {
                  const { day, session: sessionNum } = parseSessionKey(session.session_key);
                  const sessionDate = getSessionDate(session.session_key);
                  const isExpanded = expandedSession === session.id;
                  const isPast = isBefore(sessionDate, new Date()) && !isToday(sessionDate);
                  const isSessionToday = isToday(sessionDate);

                  return (
                    <div 
                      key={session.id}
                      className={`border rounded-lg overflow-hidden ${
                        session.is_done ? 'bg-green-50 border-green-200' : 
                        isSessionToday ? 'bg-primary/5 border-primary/30' : ''
                      }`}
                    >
                      <div className="flex items-center p-3 gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                          disabled={updatingSession === session.id}
                          onClick={() => toggleSessionDone(session.id, session.is_done || false)}
                        >
                          {session.is_done ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground" />
                          )}
                        </Button>
                        
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${session.is_done ? 'line-through text-muted-foreground' : ''}`}>
                              Hari {day} - Sesi {sessionNum}
                            </span>
                            {isSessionToday && !session.is_done && (
                              <Badge variant="outline" className="text-xs border-primary text-primary">
                                Hari Ini
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(sessionDate, 'EEEE, d MMMM', { locale: id })}
                          </p>
                        </div>

                        <Badge className={getIntensityColor(session.intensity)}>
                          <Flame className="h-3 w-3 mr-1" />
                          {session.intensity || 'Rest'}
                        </Badge>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="border-t p-4 bg-background space-y-4">
                          {session.warmup && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Pemanasan</h4>
                              <p className="text-sm">{session.warmup}</p>
                            </div>
                          )}

                          {session.exercises && session.exercises.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-2">Latihan</h4>
                              <div className="space-y-2">
                                {session.exercises.map((ex, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg"
                                  >
                                    <Dumbbell className="h-4 w-4 mt-0.5 text-primary" />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{ex.name}</p>
                                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                        {ex.sets && <span>{ex.sets} set</span>}
                                        {ex.reps && <span>{ex.reps} reps</span>}
                                        {ex.rest && <span>Rest: {ex.rest}</span>}
                                      </div>
                                      {ex.notes && (
                                        <p className="text-xs text-muted-foreground mt-1">{ex.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {session.cooldown && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Pendinginan</h4>
                              <p className="text-sm">{session.cooldown}</p>
                            </div>
                          )}

                          {session.recovery && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Pemulihan</h4>
                              <p className="text-sm">{session.recovery}</p>
                            </div>
                          )}

                          {!session.warmup && !session.exercises?.length && !session.cooldown && !session.recovery && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              {session.intensity === 'Rest' ? 'Hari istirahat' : 'Detail sesi belum diisi'}
                            </p>
                          )}

                          <div className="pt-2">
                            <Button
                              className="w-full"
                              variant={session.is_done ? "outline" : "default"}
                              disabled={updatingSession === session.id}
                              onClick={() => toggleSessionDone(session.id, session.is_done || false)}
                            >
                              {session.is_done ? 'Batalkan Selesai' : 'Tandai Selesai'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}