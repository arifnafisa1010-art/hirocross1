import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Crown, AlertCircle, Zap, Flame, Gauge } from 'lucide-react';
import { AthletePerformanceDashboard } from '@/components/AthletePerformanceDashboard';
import { AthleteWeeklyTrendChart } from '@/components/AthleteWeeklyTrendChart';
import { PremiumLockedOverlay } from '@/components/PremiumLockedOverlay';
import { motion } from 'framer-motion';

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

const riskZoneConfig = {
  optimal: { label: '✅ Zona Optimal', text: 'Beban latihan Anda dalam zona optimal! Pertahankan konsistensi ini.', color: 'text-green-600' },
  undertrained: { label: '💡 Undertrained', text: 'Anda bisa meningkatkan intensitas latihan untuk adaptasi yang lebih baik.', color: 'text-blue-600' },
  warning: { label: '⚠️ Warning', text: 'Perhatikan pemulihan. Beban latihan mendekati batas atas.', color: 'text-amber-600' },
  danger: { label: '🚨 Danger', text: 'Risiko cedera tinggi! Prioritaskan istirahat dan pemulihan.', color: 'text-red-600' },
};

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
      {/* Quick Metrics Cards */}
      {coachHasPremium && !loading && !premiumLoading && dailyMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 mx-auto mb-1.5 text-blue-500" />
              <p className="text-2xl font-bold tracking-tight">{currentMetrics.fitness.toFixed(0)}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Fitness</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-orange-500/10 to-orange-600/5">
            <CardContent className="p-4 text-center">
              <Flame className="h-5 w-5 mx-auto mb-1.5 text-orange-500" />
              <p className="text-2xl font-bold tracking-tight">{currentMetrics.fatigue.toFixed(0)}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Fatigue</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
            <CardContent className="p-4 text-center">
              <Gauge className="h-5 w-5 mx-auto mb-1.5 text-emerald-500" />
              <p className="text-2xl font-bold tracking-tight">{currentMetrics.form.toFixed(0)}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Form</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Dashboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            Dashboard Performa
          </h2>
          {coachHasPremium && (
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-2.5 py-0.5 shadow-sm">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        <div className="relative">
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0">
              <AthletePerformanceDashboard
                dailyMetrics={coachHasPremium ? dailyMetrics : []}
                acwrData={coachHasPremium ? acwrData : { acwr: 0, acuteLoad: 0, chronicLoad: 0, riskZone: 'undertrained' as const }}
                currentMetrics={coachHasPremium ? currentMetrics : { fitness: 0, fatigue: 0, form: 0 }}
                loading={loading || premiumLoading}
              />
            </CardContent>
          </Card>
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
          <h2 className="text-base font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Trend Perkembangan
          </h2>
        </div>
        <div className="relative">
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0">
              <AthleteWeeklyTrendChart
                dailyMetrics={coachHasPremium ? dailyMetrics : []}
                loading={loading || premiumLoading}
              />
            </CardContent>
          </Card>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-md bg-gradient-to-br from-accent/5 via-transparent to-transparent">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-accent" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">Tips Performa</p>
                  <p className={`text-sm ${riskZoneConfig[acwrData.riskZone].color}`}>
                    {riskZoneConfig[acwrData.riskZone].text}
                  </p>
                  {currentMetrics.form < -30 && (
                    <p className="text-sm text-amber-600">
                      ⚡ Form dalam zona risiko tinggi. Pertimbangkan mengurangi volume.
                    </p>
                  )}
                  {currentMetrics.form >= 5 && currentMetrics.form < 20 && (
                    <p className="text-sm text-blue-600">
                      🌟 Kondisi fresh! Waktu tepat untuk sesi berkualitas tinggi.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No Data State */}
      {coachHasPremium && !loading && !premiumLoading && dailyMetrics.length === 0 && (
        <Card className="border-none shadow-md">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="font-medium text-muted-foreground">Belum ada data latihan</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Mulai catat sesi latihan Anda untuk melihat metrik performa
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
