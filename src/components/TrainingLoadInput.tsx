import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar, Clock, Dumbbell, MessageSquare, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TrainingLoadInputProps {
  onSubmit: (data: {
    session_date: string;
    duration_minutes: number;
    rpe: number;
    training_type: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  athleteId?: string;
}

const TRAINING_TYPES = [
  { value: 'training', label: 'Latihan' },
  { value: 'match', label: 'Pertandingan' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'strength', label: 'Kekuatan' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'technical', label: 'Teknik' },
  { value: 'tactical', label: 'Taktik' },
];

const RPE_DESCRIPTIONS: { [key: number]: string } = {
  1: 'Sangat Ringan',
  2: 'Ringan',
  3: 'Sedang-Ringan',
  4: 'Sedang',
  5: 'Sedang-Berat',
  6: 'Berat',
  7: 'Sangat Berat',
  8: 'Sangat-Sangat Berat',
  9: 'Hampir Maksimal',
  10: 'Maksimal',
};

export function TrainingLoadInput({ onSubmit, athleteId }: TrainingLoadInputProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [duration, setDuration] = useState<number>(60);
  const [rpe, setRpe] = useState<number>(5);
  const [trainingType, setTrainingType] = useState<string>('training');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionLoad = duration * rpe;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (duration <= 0) {
      toast.error('Durasi harus lebih dari 0 menit');
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit({
      session_date: format(date, 'yyyy-MM-dd'),
      duration_minutes: duration,
      rpe,
      training_type: trainingType,
      notes: notes || undefined,
    });

    if (result.success) {
      toast.success('Data training load berhasil ditambahkan!');
      // Reset form
      setDuration(60);
      setRpe(5);
      setNotes('');
    } else {
      toast.error('Gagal menambahkan data: ' + result.error);
    }
    setIsSubmitting(false);
  };

  const getRpeColor = (value: number) => {
    if (value <= 3) return 'text-green-500';
    if (value <= 5) return 'text-blue-500';
    if (value <= 7) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Input Training Load
        </CardTitle>
        <CardDescription>
          Catat data sesi latihan untuk menghitung ACWR dan monitoring performa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tanggal Sesi
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, 'dd MMMM yyyy', { locale: idLocale }) : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Training Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Jenis Latihan
              </Label>
              <Select value={trainingType} onValueChange={setTrainingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis latihan" />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Durasi (menit)
              </Label>
              <Input
                type="number"
                min="1"
                max="480"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                placeholder="60"
              />
            </div>

            {/* Session Load Preview */}
            <div className="space-y-2">
              <Label>Session Load (sRPE)</Label>
              <div className="h-10 flex items-center justify-center bg-primary/10 rounded-md font-bold text-xl text-primary">
                {sessionLoad} AU
              </div>
            </div>
          </div>

          {/* RPE Slider */}
          <div className="space-y-4">
            <Label className="flex items-center justify-between">
              <span>RPE (Rating of Perceived Exertion)</span>
              <span className={cn("font-bold text-lg", getRpeColor(rpe))}>
                {rpe} - {RPE_DESCRIPTIONS[rpe]}
              </span>
            </Label>
            <div className="px-2">
              <Slider
                value={[rpe]}
                onValueChange={([value]) => setRpe(value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 - Sangat Ringan</span>
                <span>10 - Maksimal</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Catatan (opsional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan tentang sesi latihan..."
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Simpan Training Load
              </>
            )}
          </Button>

          {/* Info Box */}
          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p><strong>Session Load = Durasi × RPE</strong></p>
            <p className="mt-1">Contoh: 60 menit × RPE 7 = 420 AU (Arbitrary Units)</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
