import { useState, useMemo } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SessionModal } from './SessionModal';

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function MonthlySection() {
  const { planData, setup, sessions } = useTrainingStore();
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ week: number; day: string } | null>(null);

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">Kalender Kerja Bulanan</h2>
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
