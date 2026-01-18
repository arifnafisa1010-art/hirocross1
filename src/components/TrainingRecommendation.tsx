import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Lightbulb,
  Dumbbell,
  BedDouble,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ACWRData {
  acwr: number;
  acuteLoad: number;
  chronicLoad: number;
  riskZone: 'undertrained' | 'optimal' | 'warning' | 'danger';
}

interface CurrentMetrics {
  fitness: number;
  fatigue: number;
  form: number;
}

interface TrainingRecommendationProps {
  acwrData: ACWRData;
  currentMetrics: CurrentMetrics;
}

interface Recommendation {
  type: 'intensity' | 'volume' | 'recovery' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function TrainingRecommendation({ acwrData, currentMetrics }: TrainingRecommendationProps) {
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const { acwr, riskZone } = acwrData;
    const { fitness, fatigue, form } = currentMetrics;

    // ACWR-based recommendations
    if (riskZone === 'danger') {
      recs.push({
        type: 'warning',
        priority: 'high',
        title: '🚨 Risiko Cedera Tinggi',
        description: 'ACWR sangat tinggi (>1.5). Segera kurangi beban latihan 30-50% dan tingkatkan recovery. Fokus pada latihan teknis ringan.',
        icon: <XCircle className="w-5 h-5" />,
        color: 'bg-red-100 dark:bg-red-950/30 border-red-500 text-red-700 dark:text-red-400',
      });
      recs.push({
        type: 'recovery',
        priority: 'high',
        title: 'Prioritaskan Recovery',
        description: 'Tambahkan sesi recovery aktif, stretching, dan pastikan tidur 8-9 jam. Pertimbangkan massage atau ice bath.',
        icon: <BedDouble className="w-5 h-5" />,
        color: 'bg-blue-100 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-400',
      });
    } else if (riskZone === 'warning') {
      recs.push({
        type: 'warning',
        priority: 'medium',
        title: '⚠️ Zona Peringatan',
        description: 'ACWR di zona warning (1.3-1.5). Hindari peningkatan beban mendadak. Pertahankan atau sedikit turunkan intensitas.',
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'bg-amber-100 dark:bg-amber-950/30 border-amber-500 text-amber-700 dark:text-amber-400',
      });
    } else if (riskZone === 'optimal') {
      recs.push({
        type: 'intensity',
        priority: 'low',
        title: '✓ Sweet Spot',
        description: 'ACWR optimal (0.8-1.3). Anda bisa melanjutkan program latihan normal. Tingkatkan beban secara bertahap jika diperlukan.',
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: 'bg-green-100 dark:bg-green-950/30 border-green-500 text-green-700 dark:text-green-400',
      });
    } else if (riskZone === 'undertrained') {
      recs.push({
        type: 'volume',
        priority: 'medium',
        title: '📉 Perlu Peningkatan',
        description: 'ACWR rendah (<0.8). Tingkatkan volume atau intensitas latihan secara bertahap (10-15% per minggu) untuk mencapai zona optimal.',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-blue-100 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-400',
      });
    }

    // Form-based recommendations
    if (form < -30) {
      recs.push({
        type: 'recovery',
        priority: 'high',
        title: 'Form Sangat Rendah',
        description: 'TSB menunjukkan kelelahan tinggi. Jadwalkan 2-3 hari recovery sebelum sesi intensitas tinggi berikutnya.',
        icon: <TrendingDown className="w-5 h-5" />,
        color: 'bg-red-100 dark:bg-red-950/30 border-red-500 text-red-700 dark:text-red-400',
      });
    } else if (form < -10) {
      recs.push({
        type: 'intensity',
        priority: 'medium',
        title: 'Fatigue Terakumulasi',
        description: 'Form negatif menunjukkan kelelahan. Pertimbangkan sesi intensitas rendah atau medium untuk hari ini.',
        icon: <Activity className="w-5 h-5" />,
        color: 'bg-amber-100 dark:bg-amber-950/30 border-amber-500 text-amber-700 dark:text-amber-400',
      });
    } else if (form > 15) {
      recs.push({
        type: 'intensity',
        priority: 'low',
        title: 'Form Positif - Siap Performa',
        description: 'Kondisi optimal untuk latihan intensitas tinggi atau kompetisi. Manfaatkan momentum ini!',
        icon: <Zap className="w-5 h-5" />,
        color: 'bg-green-100 dark:bg-green-950/30 border-green-500 text-green-700 dark:text-green-400',
      });
    }

    // Fitness-based recommendations
    if (fitness < 30 && fatigue < 30) {
      recs.push({
        type: 'volume',
        priority: 'medium',
        title: 'Bangun Base Fitness',
        description: 'Level fitness masih rendah. Fokus pada peningkatan volume latihan aerobik dan kekuatan dasar.',
        icon: <Dumbbell className="w-5 h-5" />,
        color: 'bg-purple-100 dark:bg-purple-950/30 border-purple-500 text-purple-700 dark:text-purple-400',
      });
    }

    // Prevent overreaching
    if (fatigue > 80) {
      recs.push({
        type: 'recovery',
        priority: 'high',
        title: 'Fatigue Sangat Tinggi',
        description: 'Level fatigue akut sangat tinggi. Wajib istirahat aktif atau deload untuk mencegah overtraining.',
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'bg-red-100 dark:bg-red-950/30 border-red-500 text-red-700 dark:text-red-400',
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [acwrData, currentMetrics]);

  // Get intensity recommendation
  const intensityRecommendation = useMemo(() => {
    const { riskZone } = acwrData;
    const { form } = currentMetrics;

    if (riskZone === 'danger' || form < -30) {
      return { level: 'Rest/Recovery', percentage: '0-30%', color: 'bg-red-500' };
    }
    if (riskZone === 'warning' || form < -10) {
      return { level: 'Low', percentage: '30-50%', color: 'bg-amber-500' };
    }
    if (riskZone === 'optimal' && form >= 0) {
      return { level: 'Medium-High', percentage: '70-90%', color: 'bg-green-500' };
    }
    if (riskZone === 'undertrained') {
      return { level: 'Medium', percentage: '50-70%', color: 'bg-blue-500' };
    }
    return { level: 'Medium', percentage: '50-70%', color: 'bg-blue-500' };
  }, [acwrData, currentMetrics]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Rekomendasi Latihan Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Intensity Recommendation */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Intensitas yang Disarankan</p>
              <p className="text-2xl font-bold mt-1">{intensityRecommendation.level}</p>
              <p className="text-sm text-muted-foreground">{intensityRecommendation.percentage} dari maksimal</p>
            </div>
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", intensityRecommendation.color)}>
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Detailed Recommendations */}
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border-l-4 transition-all",
                rec.color
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{rec.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{rec.title}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px]",
                        rec.priority === 'high' && "border-red-500 text-red-500",
                        rec.priority === 'medium' && "border-amber-500 text-amber-500",
                        rec.priority === 'low' && "border-green-500 text-green-500",
                      )}
                    >
                      {rec.priority === 'high' && 'Penting'}
                      {rec.priority === 'medium' && 'Perhatian'}
                      {rec.priority === 'low' && 'Info'}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-90">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Selalu dengarkan tubuh Anda, bukan hanya angka</li>
            <li>Peningkatan beban ideal: 10% per minggu</li>
            <li>Catat RPE setelah setiap sesi untuk akurasi data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
