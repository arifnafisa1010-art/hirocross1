import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Crown, AlertCircle } from 'lucide-react';
import { AthletePerformanceDashboard } from '@/components/AthletePerformanceDashboard';
import { AthleteWeeklyTrendChart } from '@/components/AthleteWeeklyTrendChart';
import { PremiumLockedOverlay } from '@/components/PremiumLockedOverlay';

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

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

interface AthletePerformanceSectionProps {
  dailyMetrics: DailyMetric[];
  acwrData: ACWRData;
  currentMetrics: CurrentMetrics;
  loading?: boolean;
  coachHasPremium: boolean;
  premiumLoading: boolean;
}

export function AthletePerformanceSection({
  dailyMetrics,
  acwrData,
  currentMetrics,
  loading = false,
  coachHasPremium,
  premiumLoading
}: AthletePerformanceSectionProps) {
  
  return (
    <div className="space-y-6">
      {/* Performance Dashboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Dashboard Performa
          </h2>
          {coachHasPremium && (
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-2">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        <div className="relative">
          <AthletePerformanceDashboard
            dailyMetrics={coachHasPremium ? dailyMetrics : []}
            acwrData={coachHasPremium ? acwrData : { acwr: 0, acuteLoad: 0, chronicLoad: 0, riskZone: 'undertrained' as const }}
            currentMetrics={coachHasPremium ? currentMetrics : { fitness: 0, fatigue: 0, form: 0 }}
            loading={loading || premiumLoading}
          />
          {!premiumLoading && !coachHasPremium && (
            <PremiumLockedOverlay 
              title="Dashboard Performa Terkunci"
              description="Fitur ini memerlukan langganan Premium dari pelatih Anda."
            />
          )}
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trend Perkembangan
          </h2>
          {coachHasPremium && (
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-2">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        <div className="relative">
          <AthleteWeeklyTrendChart
            dailyMetrics={coachHasPremium ? dailyMetrics : []}
            loading={loading || premiumLoading}
          />
          {!premiumLoading && !coachHasPremium && (
            <PremiumLockedOverlay 
              title="Trend Perkembangan Terkunci"
              description="Fitur ini memerlukan langganan Premium dari pelatih Anda."
            />
          )}
        </div>
      </div>

      {/* Performance Tips */}
      {coachHasPremium && !loading && !premiumLoading && dailyMetrics.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Tips Performa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              {acwrData.riskZone === 'optimal' && (
                <p className="text-green-600">
                  ✅ Beban latihan Anda dalam zona optimal! Pertahankan konsistensi ini.
                </p>
              )}
              {acwrData.riskZone === 'undertrained' && (
                <p className="text-blue-600">
                  💡 Anda bisa meningkatkan intensitas latihan untuk adaptasi yang lebih baik.
                </p>
              )}
              {acwrData.riskZone === 'warning' && (
                <p className="text-amber-600">
                  ⚠️ Perhatikan pemulihan. Beban latihan mendekati batas atas.
                </p>
              )}
              {acwrData.riskZone === 'danger' && (
                <p className="text-red-600">
                  🚨 Risiko cedera tinggi! Prioritaskan istirahat dan pemulihan.
                </p>
              )}
              {currentMetrics.form < -30 && (
                <p className="text-amber-600">
                  ⚡ Form Anda dalam zona risiko tinggi. Pertimbangkan untuk mengurangi volume latihan.
                </p>
              )}
              {currentMetrics.form >= 5 && currentMetrics.form < 20 && (
                <p className="text-blue-600">
                  🌟 Kondisi fresh! Waktu yang tepat untuk sesi latihan berkualitas tinggi.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {coachHasPremium && !loading && !premiumLoading && dailyMetrics.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">Belum ada data latihan</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Mulai catat sesi latihan Anda untuk melihat metrik performa
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
