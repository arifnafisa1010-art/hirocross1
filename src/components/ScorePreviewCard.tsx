import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, ArrowRight, Target } from 'lucide-react';
import { TestNorm } from '@/hooks/useTestNorms';

interface ScorePreviewCardProps {
  value: number | null;
  calculatedScore: number | null;
  norm: TestNorm | null;
  item: string;
  unit: string;
  athleteGender: string;
  athleteAge: number;
}

const scoreConfig: Record<number, { label: string; color: string; bgColor: string; description: string }> = {
  1: { label: 'Sangat Kurang', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-900', description: 'Perlu peningkatan intensif' },
  2: { label: 'Kurang', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-950/30 border-orange-300 dark:border-orange-900', description: 'Di bawah standar' },
  3: { label: 'Cukup', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900', description: 'Mencapai standar dasar' },
  4: { label: 'Baik', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-950/30 border-green-300 dark:border-green-900', description: 'Di atas standar' },
  5: { label: 'Sangat Baik', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900', description: 'Level elite' },
};

export function ScorePreviewCard({ 
  value, 
  calculatedScore, 
  norm, 
  item, 
  unit, 
  athleteGender, 
  athleteAge 
}: ScorePreviewCardProps) {
  
  // Calculate score ranges for display
  const scoreRanges = useMemo(() => {
    if (!norm) return null;
    
    const lowerIsBetter = norm.lower_is_better || false;
    const ranges: { score: number; range: string; isCurrent: boolean }[] = [];
    
    if (lowerIsBetter) {
      // For time-based tests (lower is better)
      // Score 1: value >= s1 (slowest/worst)
      // Score 5: value < s4 (fastest/best)
      if (norm.score_1_max) ranges.push({ score: 1, range: `≥ ${norm.score_1_max}`, isCurrent: calculatedScore === 1 });
      if (norm.score_2_max) ranges.push({ score: 2, range: `${norm.score_1_max || '∞'} - ${norm.score_2_max}`, isCurrent: calculatedScore === 2 });
      if (norm.score_3_max) ranges.push({ score: 3, range: `${norm.score_2_max || '∞'} - ${norm.score_3_max}`, isCurrent: calculatedScore === 3 });
      if (norm.score_4_max) ranges.push({ score: 4, range: `${norm.score_3_max || '∞'} - ${norm.score_4_max}`, isCurrent: calculatedScore === 4 });
      ranges.push({ score: 5, range: `< ${norm.score_4_max || '0'}`, isCurrent: calculatedScore === 5 });
    } else {
      // For distance/reps tests (higher is better)
      ranges.push({ score: 1, range: `< ${norm.score_2_max || '0'}`, isCurrent: calculatedScore === 1 });
      if (norm.score_2_max) ranges.push({ score: 2, range: `${norm.score_2_max} - ${norm.score_3_max || '∞'}`, isCurrent: calculatedScore === 2 });
      if (norm.score_3_max) ranges.push({ score: 3, range: `${norm.score_3_max} - ${norm.score_4_max || '∞'}`, isCurrent: calculatedScore === 3 });
      if (norm.score_4_max) ranges.push({ score: 4, range: `${norm.score_4_max} - ${norm.score_5_max || '∞'}`, isCurrent: calculatedScore === 4 });
      if (norm.score_5_max) ranges.push({ score: 5, range: `≥ ${norm.score_5_max}`, isCurrent: calculatedScore === 5 });
    }
    
    return ranges;
  }, [norm, calculatedScore]);

  // Calculate distance to next score
  const distanceToNext = useMemo(() => {
    if (!norm || value === null || calculatedScore === null || calculatedScore >= 5) return null;
    
    const lowerIsBetter = norm.lower_is_better || false;
    
    if (lowerIsBetter) {
      // Need to go lower for better score
      const nextThreshold = calculatedScore === 1 ? norm.score_2_max :
                           calculatedScore === 2 ? norm.score_3_max :
                           calculatedScore === 3 ? norm.score_4_max :
                           null;
      if (nextThreshold !== null && nextThreshold !== undefined) {
        const diff = value - nextThreshold;
        return { diff: Math.abs(diff).toFixed(2), direction: 'kurangi', unit };
      }
    } else {
      // Need to go higher for better score
      const nextThreshold = calculatedScore === 1 ? norm.score_2_max :
                           calculatedScore === 2 ? norm.score_3_max :
                           calculatedScore === 3 ? norm.score_4_max :
                           calculatedScore === 4 ? norm.score_5_max :
                           null;
      if (nextThreshold !== null && nextThreshold !== undefined) {
        const diff = nextThreshold - value;
        return { diff: Math.abs(diff).toFixed(2), direction: 'tambah', unit };
      }
    }
    
    return null;
  }, [norm, value, calculatedScore, unit]);

  if (value === null || calculatedScore === null) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-4 text-center">
          <Target className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Masukkan nilai untuk melihat preview skor</p>
        </CardContent>
      </Card>
    );
  }

  const config = scoreConfig[calculatedScore] || scoreConfig[3];

  return (
    <Card className={`border-2 ${config.bgColor} transition-all duration-300`}>
      <CardContent className="p-4 space-y-4">
        {/* Main Score Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${config.color} bg-white dark:bg-background shadow-inner`}>
              {calculatedScore}
            </div>
            <div>
              <p className={`text-lg font-bold ${config.color}`}>{config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Nilai Anda</p>
            <p className="text-2xl font-bold">{value} <span className="text-sm font-normal text-muted-foreground">{unit}</span></p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Skor 1</span>
            <span>Skor 5</span>
          </div>
          <Progress value={calculatedScore * 20} className="h-3" />
        </div>

        {/* Norm Info */}
        {norm && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 rounded-lg p-2">
            {norm.lower_is_better ? (
              <TrendingDown className="w-4 h-4 text-blue-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-green-500" />
            )}
            <span>
              {norm.lower_is_better ? 'Rendah lebih baik (waktu)' : 'Tinggi lebih baik'} | 
              {athleteGender === 'M' ? ' Laki-laki' : ' Perempuan'} | 
              Usia {athleteAge} tahun
            </span>
          </div>
        )}

        {/* Score Ranges Table */}
        {scoreRanges && scoreRanges.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Range Skor ({item})</p>
            <div className="grid grid-cols-5 gap-1">
              {scoreRanges.map(range => (
                <div 
                  key={range.score}
                  className={`p-2 rounded text-center text-xs transition-all ${
                    range.isCurrent 
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                      : 'bg-background border'
                  }`}
                >
                  <p className="font-bold">{range.score}</p>
                  <p className="text-[10px] truncate">{range.range}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distance to Next Score */}
        {distanceToNext && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
            <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Untuk skor {calculatedScore + 1}:
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {distanceToNext.direction === 'kurangi' 
                  ? `Kurangi ${distanceToNext.diff} ${distanceToNext.unit}`
                  : `Tambah ${distanceToNext.diff} ${distanceToNext.unit}`
                }
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              +{distanceToNext.diff} {distanceToNext.unit}
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-center">
          {calculatedScore >= 4 ? (
            <Badge className="bg-green-500 text-white gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Target Tercapai
            </Badge>
          ) : calculatedScore <= 2 ? (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="w-3 h-3" />
              Perlu Peningkatan
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Target className="w-3 h-3" />
              Mencapai Standar Dasar
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}