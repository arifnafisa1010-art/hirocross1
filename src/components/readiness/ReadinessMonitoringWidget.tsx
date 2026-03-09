import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeartPulse } from 'lucide-react';
import { useReadiness, ReadinessEntry } from '@/hooks/useReadiness';
import { getReadinessInfo } from './readinessUtils';
import { ReadinessChart } from './ReadinessChart';
import { format } from 'date-fns';

interface ReadinessMonitoringWidgetProps {
  athleteId?: string | null;
}

export function ReadinessMonitoringWidget({ athleteId }: ReadinessMonitoringWidgetProps) {
  const { entries, loading } = useReadiness(athleteId || undefined);

  if (loading) return null;
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" />
            Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada data readiness</p>
        </CardContent>
      </Card>
    );
  }

  const latest = entries[0];
  const score = latest.readiness_score ? Number(latest.readiness_score) : 0;
  const info = getReadinessInfo(score);

  const chartData = [...entries]
    .slice(0, 14)
    .reverse()
    .map(e => ({
      date: format(new Date(e.check_date), 'dd/MM'),
      score: e.readiness_score ? Number(Number(e.readiness_score).toFixed(2)) : 0,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          Readiness Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{score.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(latest.check_date), 'dd/MM/yyyy')}
            </p>
          </div>
          <div className="text-right">
            <Badge className={`${info.color} text-white`}>{info.label}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{info.recommendation}</p>
          </div>
        </div>
        {chartData.length > 1 && <ReadinessChart chartData={chartData} />}
      </CardContent>
    </Card>
  );
}
