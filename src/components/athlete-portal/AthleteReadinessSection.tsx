import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, Plus } from 'lucide-react';
import { useReadiness } from '@/hooks/useReadiness';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ReadinessChart } from '@/components/readiness/ReadinessChart';
import { ReadinessForm } from '@/components/readiness/ReadinessForm';
import { ReadinessScoreSummary } from '@/components/readiness/ReadinessScoreSummary';
import { ReadinessZoneInfo } from '@/components/readiness/ReadinessZoneInfo';
import { getReadinessInfo } from '@/components/readiness/readinessUtils';
import { PremiumLockedOverlay } from '@/components/PremiumLockedOverlay';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AthleteReadinessSectionProps {
  athleteId: string;
  athleteName: string;
  restingHr?: number | null;
  coachHasPremium: boolean;
  premiumLoading: boolean;
}

export function AthleteReadinessSection({
  athleteId,
  athleteName,
  restingHr,
  coachHasPremium,
  premiumLoading,
}: AthleteReadinessSectionProps) {
  const { user } = useAuth();
  const { entries, loading, addEntry } = useReadiness(athleteId);
  const [formOpen, setFormOpen] = useState(false);

  const autoVjBaseline = useMemo(() => {
    if (entries.length === 0) return '';
    const last5 = entries.slice(0, 5);
    const avg = last5.reduce((sum, e) => sum + Number(e.vj_today), 0) / last5.length;
    return avg.toFixed(1);
  }, [entries]);

  const autoHrBaseline = restingHr ? String(restingHr) : '';

  const chartData = [...entries]
    .reverse()
    .map(e => ({
      date: format(new Date(e.check_date), 'dd/MM'),
      score: e.readiness_score ? Number(Number(e.readiness_score).toFixed(2)) : 0,
    }));

  const latestScore = entries[0]?.readiness_score ? Number(entries[0].readiness_score) : null;
  const prevScore = entries[1]?.readiness_score ? Number(entries[1].readiness_score) : null;

  const handleSubmit = async (data: any) => {
    if (!user) return;
    // Athletes insert with their own user_id
    const { error } = await supabase
      .from('athlete_readiness')
      .insert({
        ...data,
        athlete_id: athleteId,
        user_id: user.id,
      } as any);
    
    if (error) {
      const { toast } = await import('sonner');
      toast.error('Gagal menyimpan data readiness');
      console.error(error);
      return;
    }
    const { toast } = await import('sonner');
    toast.success('Data readiness berhasil disimpan!');
    setFormOpen(false);
    // Trigger refetch via the hook
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          Readiness Check
        </h2>
      </div>

      <div className="relative">
        <div className="space-y-4">
          {/* Score Summary */}
          {latestScore !== null && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReadinessScoreSummary latestScore={latestScore} prevScore={prevScore} />
              <ReadinessZoneInfo />
            </div>
          )}

          {/* Chart */}
          {chartData.length > 1 && <ReadinessChart chartData={chartData} />}

          {/* Input Form */}
          {!formOpen ? (
            <Button onClick={() => setFormOpen(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Input Readiness Hari Ini
            </Button>
          ) : (
            <ReadinessForm
              athletes={[]}
              selectedAthleteId={athleteId}
              onSelectAthlete={() => {}}
              autoVjBaseline={autoVjBaseline}
              autoHrBaseline={autoHrBaseline}
              onSubmit={handleSubmit}
              onCancel={() => setFormOpen(false)}
              hideAthleteSelector
            />
          )}

          {/* History */}
          {entries.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Riwayat Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.slice(0, 10).map(entry => {
                        const score = entry.readiness_score ? Number(entry.readiness_score) : 0;
                        const info = getReadinessInfo(score);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">
                              {format(new Date(entry.check_date), 'dd MMM yyyy', { locale: localeId })}
                            </TableCell>
                            <TableCell className="font-bold">{score.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={`${info.color} text-white text-xs`}>{info.label}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {!premiumLoading && !coachHasPremium && (
          <PremiumLockedOverlay
            title="Readiness Check Terkunci"
            description="Fitur ini memerlukan langganan Premium dari pelatih Anda."
          />
        )}
      </div>
    </div>
  );
}
