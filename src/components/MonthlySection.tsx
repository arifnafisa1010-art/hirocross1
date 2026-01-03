import { useState, useMemo } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { useAthletes } from '@/hooks/useAthletes';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { SessionModal } from './SessionModal';
import { Users } from 'lucide-react';

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function MonthlySection() {
  const { planData, setup, sessions, selectedAthleteIds, setSelectedAthleteIds } = useTrainingStore();
  const { athletes } = useAthletes();
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ week: number; day: string } | null>(null);
  const [showAthleteSelector, setShowAthleteSelector] = useState(false);

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

  const currentMonthWeeks = months[selectedMonth]?.weeks || [];

  const getSessionKey = (wk: number, day: string) => `W${wk}-${day}`;

  const handleDayClick = (week: number, day: string) => {
    setSelectedDay({ week, day });
    setModalOpen(true);
  };

  const toggleAthleteSelection = (athleteId: string) => {
    if (selectedAthleteIds.includes(athleteId)) {
      setSelectedAthleteIds(selectedAthleteIds.filter(id => id !== athleteId));
    } else {
      setSelectedAthleteIds([...selectedAthleteIds, athleteId]);
    }
  };

  const selectAllAthletes = () => {
    setSelectedAthleteIds(athletes.map(a => a.id));
  };

  const clearAthleteSelection = () => {
    setSelectedAthleteIds([]);
  };

  if (planData.length === 0) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground mb-4">Belum ada program. Silakan generate dari tab Setup.</p>
        <Button onClick={() => useTrainingStore.getState().setActiveTab('setup')}>
          Ke Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-extrabold">Kalender Kerja Bulanan</h2>
        <div className="flex items-center gap-3">
          {/* Athlete Selection */}
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowAthleteSelector(!showAthleteSelector)}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {selectedAthleteIds.length === 0 
                ? 'Pilih Atlet' 
                : selectedAthleteIds.length === 1 
                  ? athletes.find(a => a.id === selectedAthleteIds[0])?.name 
                  : `${selectedAthleteIds.length} Atlet`}
            </Button>
            
            {showAthleteSelector && (
              <Card className="absolute right-0 top-full mt-2 z-50 w-72 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Pilih Atlet</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={selectAllAthletes} className="text-xs h-7">
                        Semua
                      </Button>
                      <Button size="sm" variant="ghost" onClick={clearAthleteSelection} className="text-xs h-7">
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {athletes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Belum ada atlet. Tambahkan di Tes & Pengukuran.
                      </p>
                    ) : (
                      athletes.map(athlete => (
                        <label 
                          key={athlete.id} 
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedAthleteIds.includes(athlete.id)}
                            onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                          />
                          <span className="text-sm font-medium">{athlete.name}</span>
                          {athlete.sport && (
                            <span className="text-[10px] text-muted-foreground">({athlete.sport})</span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3" 
                    onClick={() => setShowAthleteSelector(false)}
                  >
                    Selesai
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-64">
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
      </div>

      {/* Selected Athletes Display */}
      {selectedAthleteIds.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground">Program untuk:</span>
          {selectedAthleteIds.map(id => {
            const athlete = athletes.find(a => a.id === id);
            return athlete ? (
              <span 
                key={id} 
                className="px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full"
              >
                {athlete.name}
              </span>
            ) : null;
          })}
        </div>
      )}

      <div className="space-y-5">
        {currentMonthWeeks.map((wk) => {
          const weekData = planData.find(p => p.wk === wk);
          
          return (
            <div key={wk} className="grid grid-cols-8 gap-3">
              {/* Week Header */}
              <Card className="flex flex-col justify-center p-4 border-border shadow-card">
                <div className="text-xs font-extrabold text-muted-foreground uppercase">
                  {weekData?.meso}
                </div>
                <div className="text-lg font-extrabold mt-1">W{wk}</div>
                <div className={cn(
                  "mt-2 px-2 py-1 rounded text-[10px] font-bold text-center",
                  weekData?.fase === 'Umum' && 'phase-umum',
                  weekData?.fase === 'Khusus' && 'phase-khusus',
                  weekData?.fase === 'Pra-Komp' && 'phase-prakomp',
                  weekData?.fase === 'Kompetisi' && 'phase-kompetisi',
                )}>
                  {weekData?.fase}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">
                  Vol: {weekData?.vol}% | Int: {weekData?.int}%
                </div>
              </Card>

              {/* Days */}
              {days.map((day) => {
                const key = getSessionKey(wk, day);
                const session = sessions[key];
                const hasContent = session?.exercises?.length > 0;
                const isDone = session?.isDone;
                const intensity = session?.int || 'Rest';

                return (
                  <Card
                    key={day}
                    onClick={() => handleDayClick(wk, day)}
                    className={cn(
                      "p-3 min-h-28 cursor-pointer border-border shadow-card transition-all hover:-translate-y-1 hover:shadow-lg relative",
                      intensity === 'High' && 'intensity-high',
                      intensity === 'Med' && 'intensity-med',
                      intensity === 'Low' && 'intensity-low',
                      intensity === 'Rest' && 'intensity-rest',
                    )}
                  >
                    <div className="absolute top-2 right-2 text-[10px] font-bold text-muted-foreground">
                      {day.slice(0, 3)}
                    </div>
                    
                    {hasContent && (
                      <div className="mt-4 space-y-1">
                        {session.exercises.slice(0, 2).map((ex, i) => (
                          <div key={i} className="text-[10px] font-semibold truncate">
                            {ex.name}
                          </div>
                        ))}
                        {session.exercises.length > 2 && (
                          <div className="text-[9px] text-muted-foreground">
                            +{session.exercises.length - 2} lainnya
                          </div>
                        )}
                      </div>
                    )}

                    {/* RPE & Duration display */}
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                      {session?.rpe && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                          RPE {session.rpe}
                        </span>
                      )}
                      {session?.duration && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          {session.duration}m
                        </span>
                      )}
                    </div>

                    {isDone && (
                      <div className="absolute bottom-2 right-2 bg-success text-success-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                        ✓
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <SessionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          week={selectedDay.week}
          day={selectedDay.day}
        />
      )}
    </div>
  );
}
