import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useReadiness } from '@/hooks/useReadiness';
import { useAuth } from '@/hooks/useAuth';
import { ReadinessChart } from '@/components/readiness/ReadinessChart';
import { ReadinessForm } from '@/components/readiness/ReadinessForm';
import { ReadinessScoreSummary } from '@/components/readiness/ReadinessScoreSummary';
import { ReadinessZoneInfo } from '@/components/readiness/ReadinessZoneInfo';
import { getReadinessInfo } from '@/components/readiness/readinessUtils';
import { PremiumLockedOverlay } from '@/components/PremiumLockedOverlay';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { entries, loading, addEntry, refetch } = useReadiness(athleteId);
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
    const result = await addEntry({
      ...data,
      athlete_id: athleteId,
    });
    if (result) {
      setFormOpen(false);
    }
  };

  const trendIcon = latestScore !== null && prevScore !== null
    ? latestScore > prevScore ? <TrendingUp className="h-4 w-4 text-green-500" />
    : latestScore < prevScore ? <TrendingDown className="h-4 w-4 text-red-500" />
    : <Minus className="h-4 w-4 text-muted-foreground" />
    : null;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <HeartPulse className="h-4 w-4 text-rose-500" />
          </div>
          Readiness Check
        </h2>
        {trendIcon && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {trendIcon}
            <span>vs kemarin</span>
          </div>
        )}
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
          {chartData.length > 1 && (
            <Card className="border-none shadow-md overflow-hidden">
              <CardContent className="p-0">
                <ReadinessChart chartData={chartData} />
              </CardContent>
            </Card>
          )}

          {/* Input Form */}
          <AnimatePresence mode="wait">
            {!formOpen ? (
              <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button 
                  onClick={() => setFormOpen(true)} 
                  className="w-full gap-2 h-12 text-sm font-semibold shadow-md bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  <Plus className="h-4 w-4" /> Input Readiness Hari Ini
                </Button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-none shadow-lg">
                  <CardContent className="p-4">
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
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {entries.length > 0 && (
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  Riwayat Readiness
                  <Badge variant="secondary" className="text-[10px] ml-auto">{entries.length} data</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="divide-y divide-border/50">
                  {entries.slice(0, 10).map((entry, idx) => {
                    const score = entry.readiness_score ? Number(entry.readiness_score) : 0;
                    const info = getReadinessInfo(score);
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${info.color}`} />
                          <span className="text-sm font-medium">
                            {format(new Date(entry.check_date), 'dd MMM yyyy', { locale: localeId })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold tabular-nums">{score.toFixed(2)}</span>
                          <Badge className={`${info.color} text-white text-[10px] min-w-[60px] justify-center`}>{info.label}</Badge>
                        </div>
                      </motion.div>
                    );
                  })}
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
