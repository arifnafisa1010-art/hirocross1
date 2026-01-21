import { useState, useEffect } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { useTrainingLoads, calculateSessionLoad } from '@/hooks/useTrainingLoads';
import { useAuth } from '@/hooks/useAuth';
import { DaySession, Exercise } from '@/types/training';
import { format, addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week: number;
  day: string;
  athleteId?: string;
}

const defaultSession: DaySession = {
  warmup: '',
  exercises: [],
  cooldown: '',
  recovery: '',
  int: 'Rest',
  isDone: false,
  rpe: undefined,
  duration: undefined,
};

const defaultExercise: Exercise = {
  name: '',
  cat: 'strength',
  set: 3,
  rep: 10,
  load: 0,
};

const dayToIndex: Record<string, number> = {
  'Senin': 0,
  'Selasa': 1,
  'Rabu': 2,
  'Kamis': 3,
  'Jumat': 4,
  'Sabtu': 5,
  'Minggu': 6,
};

// Map intensity to default RPE
const intensityToRpe: Record<string, number> = {
  'Rest': 1,
  'Low': 4,
  'Med': 6,
  'High': 8,
};

export function SessionModal({ open, onOpenChange, week, day, athleteId }: SessionModalProps) {
  const { sessions, updateSession, setup, selectedAthleteIds } = useTrainingStore();
  const { addLoad } = useTrainingLoads(athleteId);
  const { user } = useAuth();
  const key = `W${week}-${day}`;
  
  const [session, setSession] = useState<DaySession>(defaultSession);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate the actual date for this session
  const getSessionDate = (): string | null => {
    if (!setup.startDate) return null;
    const startDate = new Date(setup.startDate);
    const dayIndex = dayToIndex[day] ?? 0;
    const sessionDate = addDays(startDate, (week - 1) * 7 + dayIndex);
    return format(sessionDate, 'yyyy-MM-dd');
  };

  const sessionDate = getSessionDate();

  useEffect(() => {
    if (open) {
      const existingSession = sessions[key] || defaultSession;
      // Set default RPE based on intensity if not already set
      if (!existingSession.rpe && existingSession.int) {
        existingSession.rpe = intensityToRpe[existingSession.int] || 5;
      }
      // Set default duration if not set
      if (!existingSession.duration) {
        existingSession.duration = 60;
      }
      setSession(existingSession);
    }
  }, [open, key, sessions]);

  // Calculate session load preview
  const sessionLoad = session.rpe && session.duration 
    ? calculateSessionLoad(session.duration, session.rpe)
    : 0;

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update session in store
      updateSession(key, session);
      
      // If session is marked as done with RPE and duration, auto-sync to training_loads
      if (session.isDone && session.rpe && session.duration && sessionDate && user) {
        // Determine training type based on exercises - use "training" as fallback
        const getTrainingType = (): string => {
          if (session.exercises.length === 0) return 'training';
          const firstCat = session.exercises[0].cat;
          switch (firstCat) {
            case 'strength': return 'strength';
            case 'endurance': return 'conditioning';
            case 'technique': return 'technical';
            case 'tactic': return 'tactical';
            case 'speed': return 'conditioning';
            default: return 'training';
          }
        };
        const trainingType = getTrainingType();
        
        // Create notes from session info
        const notes = [
          `W${week} ${day}`,
          session.warmup ? `Warmup: ${session.warmup.substring(0, 50)}` : '',
          session.exercises.length > 0 ? `${session.exercises.length} exercises` : '',
        ].filter(Boolean).join(' | ');

        // Get the athlete ID to use (from props, selected in store, or null for coach's own data)
        const targetAthleteId = athleteId || (selectedAthleteIds.length === 1 ? selectedAthleteIds[0] : undefined);

        const result = await addLoad({
          session_date: sessionDate,
          duration_minutes: session.duration,
          rpe: session.rpe,
          training_type: trainingType,
          notes: notes,
          athlete_id: targetAthleteId,
        });

        if (result.success) {
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-bold">Sesi berhasil disimpan!</span>
              <span className="text-xs text-muted-foreground">
                Load {sessionLoad} AU auto-sync ke Monitoring Performa
              </span>
            </div>
          );
        } else {
          // Session saved to store but failed to sync to training_loads
          toast.warning(
            <div className="flex flex-col gap-1">
              <span className="font-bold">Sesi disimpan ke kalender</span>
              <span className="text-xs">Gagal sync ke monitoring: {result.error}</span>
            </div>
          );
        }
      } else {
        toast.success('Sesi disimpan!');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Gagal menyimpan sesi');
    } finally {
      setIsSaving(false);
    }
  };

  const addExercise = () => {
    setSession(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...defaultExercise }],
    }));
  };

  const updateExercise = (index: number, data: Partial<Exercise>) => {
    setSession(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, ...data } : ex),
    }));
  };

  const removeExercise = (index: number) => {
    setSession(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const getRpeColor = (rpe: number) => {
    if (rpe <= 3) return 'bg-green-500';
    if (rpe <= 5) return 'bg-blue-500';
    if (rpe <= 7) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-extrabold">
                W{week} - {day}
              </DialogTitle>
              {sessionDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(sessionDate), 'dd MMMM yyyy')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-success font-bold">
                <Checkbox
                  checked={session.isDone}
                  onCheckedChange={(checked) => setSession(prev => ({ ...prev, isDone: !!checked }))}
                />
                SELESAI
              </label>
              <Select
                value={session.int}
                onValueChange={(v) => {
                  const newInt = v as DaySession['int'];
                  setSession(prev => ({ 
                    ...prev, 
                    int: newInt,
                    // Auto-suggest RPE based on intensity if user hasn't set it
                    rpe: prev.rpe || intensityToRpe[newInt] || 5,
                  }));
                }}
              >
                <SelectTrigger className="w-32 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rest">REST</SelectItem>
                  <SelectItem value="Low">LOW</SelectItem>
                  <SelectItem value="Med">MEDIUM</SelectItem>
                  <SelectItem value="High">HIGH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Warmup */}
          <div>
            <Label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
              🔥 Warm Up
            </Label>
            <Textarea
              value={session.warmup}
              onChange={(e) => setSession(prev => ({ ...prev, warmup: e.target.value }))}
              placeholder="Contoh: Jogging 10 menit..."
              className="mt-1.5"
              rows={2}
            />
          </div>

          {/* Main Set */}
          <div>
            <Label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2 mb-2">
              🎯 Main Set
            </Label>
            
            <div className="space-y-2">
              {session.exercises.map((ex, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-secondary/30 p-2 rounded-lg">
                  <div className="col-span-4">
                    <Input
                      value={ex.name}
                      onChange={(e) => updateExercise(i, { name: e.target.value })}
                      placeholder="Nama exercise"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={ex.cat}
                      onValueChange={(v) => updateExercise(i, { cat: v as Exercise['cat'] })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="speed">Speed</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                        <SelectItem value="technique">Technique</SelectItem>
                        <SelectItem value="tactic">Tactic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={ex.set}
                      onChange={(e) => updateExercise(i, { set: Number(e.target.value) })}
                      placeholder="Set"
                      className="h-9 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={ex.rep}
                      onChange={(e) => updateExercise(i, { rep: Number(e.target.value) })}
                      placeholder="Rep"
                      className="h-9 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={ex.load}
                      onChange={(e) => updateExercise(i, { load: Number(e.target.value) })}
                      placeholder="Load"
                      className="h-9 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeExercise(i)}
                      className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={addExercise}
              size="sm"
              variant="outline"
              className="mt-3 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Tambah Item
            </Button>
          </div>

          {/* Cooldown */}
          <div>
            <Label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
              ❄️ Cooling Down
            </Label>
            <Textarea
              value={session.cooldown}
              onChange={(e) => setSession(prev => ({ ...prev, cooldown: e.target.value }))}
              placeholder="Contoh: Static stretching..."
              className="mt-1.5"
              rows={2}
            />
          </div>

          {/* Recovery */}
          <div className="bg-success/10 p-4 rounded-xl">
            <Label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
              🌿 Recovery & Notes
            </Label>
            <Textarea
              value={session.recovery}
              onChange={(e) => setSession(prev => ({ ...prev, recovery: e.target.value }))}
              className="mt-1.5 bg-card"
              rows={2}
            />
          </div>

          {/* RPE & Duration - Enhanced with auto-sync info */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-extrabold text-primary flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Data untuk Monitoring Performa
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs">
                      Ketika sesi ditandai <strong>SELESAI</strong> dengan RPE dan durasi, 
                      data akan otomatis tersimpan ke Monitoring Performa (ACWR, Fitness, Fatigue).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  💪 RPE (1-10)
                </Label>
                <Select
                  value={session.rpe?.toString() || ''}
                  onValueChange={(v) => setSession(prev => ({ ...prev, rpe: v ? Number(v) : undefined }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Pilih RPE..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} - {n <= 2 ? 'Sangat Ringan' : n <= 4 ? 'Ringan' : n <= 6 ? 'Sedang' : n <= 8 ? 'Berat' : 'Maksimal'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  ⏱️ Durasi (menit)
                </Label>
                <Input
                  type="number"
                  value={session.duration || ''}
                  onChange={(e) => setSession(prev => ({ ...prev, duration: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="60"
                  className="mt-1.5"
                  min="1"
                  max="480"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase">
                  ⚡ Session Load
                </Label>
                <div className="mt-1.5 h-10 flex items-center justify-center rounded-md border bg-card">
                  {session.rpe && session.duration ? (
                    <div className="flex items-center gap-2">
                      <Badge className={getRpeColor(session.rpe)}>RPE {session.rpe}</Badge>
                      <span className="font-bold text-lg">{sessionLoad} AU</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Isi RPE & Durasi</span>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-sync notice */}
            {session.isDone && session.rpe && session.duration && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-700 dark:text-green-400">
                <Zap className="w-4 h-4" />
                <span>
                  Data akan otomatis sync ke <strong>Monitoring Performa</strong> saat disimpan
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave} className="flex-[2]" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'SIMPAN'}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="secondary" className="flex-1">
            BATAL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}