import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getReadinessInfo } from './readinessUtils';

interface ReadinessScoreSummaryProps {
  latestScore: number;
  prevScore: number | null;
}

export function ReadinessScoreSummary({ latestScore, prevScore }: ReadinessScoreSummaryProps) {
  const info = getReadinessInfo(latestScore);

  return (
    <Card className="md:col-span-1">
      <CardContent className="pt-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Readiness Terakhir</p>
        <p className="text-4xl font-bold">{latestScore.toFixed(2)}</p>
        <Badge className={`mt-2 ${info.color} text-white`}>
          {info.label}
        </Badge>
        <p className="text-xs text-muted-foreground mt-2">
          {info.recommendation}
        </p>
        {prevScore !== null && (
          <div className="flex items-center justify-center gap-1 mt-2 text-sm">
            {latestScore > prevScore ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : latestScore < prevScore ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={latestScore > prevScore ? 'text-green-600' : latestScore < prevScore ? 'text-red-600' : 'text-muted-foreground'}>
              {(latestScore - prevScore).toFixed(2)} vs sebelumnya
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
