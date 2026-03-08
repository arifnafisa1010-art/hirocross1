import { useState, useEffect, useMemo } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { useTrainingLoads, calculateSessionLoad } from '@/hooks/useTrainingLoads';
import { useAuth } from '@/hooks/useAuth';
import { DaySession, Exercise } from '@/types/training';
import { format, addDays, startOfWeek } from 'date-fns';
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
import { Plus, X, Zap, Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week: number;
  day: string;
  athleteId?: string;
  initialSessionNumber?: number;
  hasSavedProgram?: boolean;
  saveSessionToDb?: (storeKey: string, session: DaySession) => Promise<boolean>;
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
  'Senin': 0, 'Selasa': 1, 'Rabu': 2, 'Kamis': 3,
  'Jumat': 4, 'Sabtu': 5, 'Minggu': 6,
};

const intensityToRpe: Record<string, number> = {
  'Rest': 1, 'Low': 4, 'Med': 6, 'High': 8,
};

// Helper to get all session numbers for a day from store
function getSessionNumbersForDay(sessions: Record<string, DaySession>, week: number, day: string): number[] {
  const prefix = `W${week}-${day}-S`;
  const nums: number[] = [];
  Object.keys(sessions).forEach(k => {
    if (k.startsWith(prefix)) {
      const match = k.match(/-S(\d+)$/);
      if (match) nums.push(parseInt(match[1]));
    }
  });
  // Check old format
  const oldKey = `W${week}-${day}`;
  if (sessions[oldKey] && nums.length === 0) {
    nums.push(1);
  }
  if (nums.length === 0) nums.push(1);
  return nums.sort((a, b) => a - b);
}

export function SessionModal({ open, onOpenChange, week, day, athleteId, initialSessionNumber }: SessionModalProps) {
  const { sessions, updateSession, removeSession, setup, selectedAthleteIds } = useTrainingStore();
  const { addLoad } = useTrainingLoads(athleteId);
  const { saveSession: saveSessionToDb, currentProgram } = useTrainingPrograms();
  const { user } = useAuth();

  const [activeSessionNum, setActiveSessionNum] = useState(1);
  const [session, setSession] = useState<DaySession>({ ...defaultSession });
  const [isSaving, setIsSaving] = useState(false);

  // Get all session numbers for this day
  const sessionNumbers = useMemo(() => {
    if (!open) return [1];
    return getSessionNumbersForDay(sessions, week, day);
  }, [sessions, week, day, open]);

  const getStoreKey = (num: number) => `W${week}-${day}-S${num}`;

  // Calculate the actual date for this session
  const getSessionDate = (): string | null => {
    if (!setup.startDate) return null;
    const startDate = new Date(setup.startDate);
    const monday = startOfWeek(startDate, { weekStartsOn: 1 });
    const dayIndex = dayToIndex[day] ?? 0;
    const sessionDate = addDays(monday, (week - 1) * 7 + dayIndex);
    return format(sessionDate, 'yyyy-MM-dd');
  };

  const sessionDate = getSessionDate();

  // Reset active tab when modal opens
  useEffect(() => {
    if (open) {
      const nums = getSessionNumbersForDay(sessions, week, day);
      setActiveSessionNum(initialSessionNumber || nums[0] || 1);
    }
  }, [open]);

  // Load session data when active tab changes
  useEffect(() => {
    if (open) {
      const key = getStoreKey(activeSessionNum);
      // Also check old format for backward compat
      const oldKey = `W${week}-${day}`;
      const existingSession = sessions[key] || (activeSessionNum === 1 ? sessions[oldKey] : null) || { ...defaultSession };
      
      const sessionCopy = { ...existingSession, exercises: [...(existingSession.exercises || [])] };
      
      // Set default RPE based on intensity if not already set
      if (!sessionCopy.rpe && sessionCopy.int) {
        sessionCopy.rpe = intensityToRpe[sessionCopy.int] || 5;
      }
      if (!sessionCopy.duration) {
        sessionCopy.duration = 60;
      }
      setSession(sessionCopy);
    }
  }, [open, activeSessionNum, week, day]);

  // Calculate session load preview
  const sessionLoad = session.rpe && session.duration
    ? calculateSessionLoad(session.duration, session.rpe)
    : 0;

  const handleAddSession = () => {
    const nextNum = sessionNumbers.length > 0 ? Math.max(...sessionNumbers) + 1 : 1;
    const newKey = getStoreKey(nextNum);
    updateSession(newKey, { ...defaultSession, duration: 60, rpe: 5 });
    setActiveSessionNum(nextNum);
  };

  const handleDeleteSession = async (num: number) => {
    if (sessionNumbers.length <= 1) {
      toast.error('Minimal harus ada 1 sesi per hari');
      return;
    }
    const key = getStoreKey(num);
    removeSession(key);

    // Delete from DB too
    if (currentProgram) {
      await saveSessionToDb(key, { ...defaultSession, int: 'Rest', isDone: false } as DaySession);
    }

    const remaining = sessionNumbers.filter(n => n !== num);
    setActiveSessionNum(remaining[0] || 1);
    toast.success(`Sesi ${num} dihapus`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await autoSaveCurrentSession();
      toast.success(`Sesi ${activeSessionNum} disimpan!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Gagal menyimpan sesi');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save before switching tabs
  const handleTabSwitch = async (num: number) => {
    if (num === activeSessionNum) return;
    // Save current session before switching
    const currentKey = getStoreKey(activeSessionNum);
    const oldKey = `W${week}-${day}`;
    if (sessions[oldKey] && activeSessionNum === 1) {
      removeSession(oldKey);
    }
    updateSession(currentKey, session);
    if (currentProgram) {
      await saveSessionToDb(currentKey, session);
    }
    setActiveSessionNum(num);
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

  // Auto-save current session to store + DB when modal closes or tab switches
  const autoSaveCurrentSession = async () => {
    const currentKey = getStoreKey(activeSessionNum);
    
    // Migrate old key if needed
    const oldKey = `W${week}-${day}`;
    if (sessions[oldKey] && activeSessionNum === 1) {
      removeSession(oldKey);
    }

    // Update local store
    updateSession(currentKey, session);

    // Persist to DB if program exists
    if (currentProgram) {
      await saveSessionToDb(currentKey, session);
    }

    // If marked done with RPE + duration, sync to training_loads
    if (session.isDone && session.rpe && session.duration && sessionDate && user) {
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

      const notes = [
        `W${week} ${day} Sesi-${activeSessionNum}`,
        session.warmup ? `Warmup: ${session.warmup.substring(0, 50)}` : '',
        session.exercises.length > 0 ? `${session.exercises.length} exercises` : '',
      ].filter(Boolean).join(' | ');

      const targetAthleteId = athleteId || (selectedAthleteIds.length === 1 ? selectedAthleteIds[0] : undefined);

      await addLoad({
        session_date: sessionDate,
        duration_minutes: session.duration,
        rpe: session.rpe,
        training_type: getTrainingType(),
        notes: notes,
        athlete_id: targetAthleteId,
      });
    }
  };

  const handleModalClose = async (isOpen: boolean) => {
    if (!isOpen && open) {
      // Modal is closing — auto-save
      await autoSaveCurrentSession();
      toast.success(`Sesi ${activeSessionNum} tersimpan otomatis`);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
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

        {/* Session Tabs */}
        <div className="flex items-center gap-1 border-b border-border pb-0 -mt-1">
          {sessionNumbers.map(num => (
            <button
              key={num}
              onClick={() => handleTabSwitch(num)}
              className={cn(
                "relative px-4 py-2 text-sm font-bold rounded-t-lg transition-colors group",
                activeSessionNum === num
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              Sesi {num}
              {sessionNumbers.length > 1 && activeSessionNum === num && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(num); }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </button>
          ))}
          <button
            onClick={handleAddSession}
            className="px-3 py-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-t-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Sesi
          </button>
        </div>

        <div className="space-y-4 mt-2">
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

          {/* RPE & Duration */}
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
                      Semua sesi dalam 1 hari akan diakumulasi.
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
            {isSaving ? 'Menyimpan...' : `SIMPAN SESI ${activeSessionNum}`}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="secondary" className="flex-1">
            BATAL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
