import { useState, useEffect } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { DaySession, Exercise } from '@/types/training';
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
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week: number;
  day: string;
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

export function SessionModal({ open, onOpenChange, week, day }: SessionModalProps) {
  const { sessions, updateSession } = useTrainingStore();
  const key = `W${week}-${day}`;
  
  const [session, setSession] = useState<DaySession>(defaultSession);

  useEffect(() => {
    if (open) {
      setSession(sessions[key] || defaultSession);
    }
  }, [open, key, sessions]);

  const handleSave = () => {
    updateSession(key, session);
    toast.success('Sesi disimpan!');
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-extrabold">
              W{week} - {day}
            </DialogTitle>
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
                onValueChange={(v) => setSession(prev => ({ ...prev, int: v as DaySession['int'] }))}
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

          {/* RPE & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
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
              <Label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
                ⏱️ Durasi (menit)
              </Label>
              <Input
                type="number"
                value={session.duration || ''}
                onChange={(e) => setSession(prev => ({ ...prev, duration: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Contoh: 60"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave} className="flex-[2]">
            SIMPAN
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="secondary" className="flex-1">
            BATAL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
