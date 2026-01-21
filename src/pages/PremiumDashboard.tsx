import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Diamond, Activity, TrendingUp, TrendingDown, Zap, RefreshCw, CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useTrainingLoads } from '@/hooks/useTrainingLoads';
import { PremiumBadge } from '@/components/PremiumBadge';
import { FormSpeedometer } from '@/components/FormSpeedometer';
import { ACWRGauge } from '@/components/ACWRGauge';
import { PercentageSpeedometer } from '@/components/PercentageSpeedometer';
import { PerformanceTrendChart } from '@/components/PerformanceTrendChart';
import { TrainingRecommendation } from '@/components/TrainingRecommendation';
import { TrainingLoadPDFExport } from '@/components/TrainingLoadPDFExport';
import { PeriodComparison } from '@/components/PeriodComparison';
import { WeeklyLoadTarget } from '@/components/WeeklyLoadTarget';
import { toast } from 'sonner';

export default function PremiumDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPremium, loading: premiumLoading, pendingRequest, requestPremiumAccess } = usePremiumAccess();
  const { 
    loads, 
    loading: loadsLoading, 
    dailyMetrics, 
    acwrData, 
    currentMetrics,
    refetch 
  } = useTrainingLoads();
  const [requesting, setRequesting] = useState(false);
  const [weeklyTarget, setWeeklyTarget] = useState<number | null>(() => {
    const saved = localStorage.getItem('weeklyLoadTarget');
    if (saved === 'null' || saved === '') return null;
    return saved ? parseInt(saved) : null;
  });

  const handleTargetChange = (target: number | null) => {
    setWeeklyTarget(target);
    localStorage.setItem('weeklyLoadTarget', target === null ? 'null' : target.toString());
  };

  const handleRequestAccess = async () => {
    setRequesting(true);
    const result = await requestPremiumAccess(undefined, 'Mengajukan akses premium');
    if (result.success) {
      toast.success('Permintaan akses premium berhasil dikirim! Menunggu verifikasi admin.');
    } else {
      toast.error('Gagal mengirim permintaan: ' + result.error);
    }
    setRequesting(false);
  };

  if (authLoading || premiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show paywall if no premium access
  if (!hasPremium) {
    return (
      <>
        <Helmet>
          <title>Premium Dashboard - HiroCross Plan</title>
        </Helmet>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <Card className="max-w-md w-full relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <PremiumBadge showText />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-yellow-400/10 pointer-events-none" />
            <CardHeader className="text-center pt-12">
              <Diamond className="w-16 h-16 mx-auto text-amber-500 mb-4" />
              <CardTitle className="text-2xl">Premium Dashboard</CardTitle>
              <CardDescription className="text-base mt-2">
                Akses fitur monitoring lanjutan: Fitness, Fatigue, Form, dan perhitungan ACWR untuk memaksimalkan performa atlet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span>Load Monitoring & ACWR Calculator</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>Fitness & Fatigue Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Form Analysis & Recommendations</span>
                </div>
              </div>

              {pendingRequest ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Permintaan Anda sedang diproses. Silakan tunggu verifikasi admin.
                  </p>
                </div>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                  onClick={handleRequestAccess}
                  disabled={requesting}
                >
                  {requesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Diamond className="w-4 h-4 mr-2" />}
                  Ajukan Akses Premium
                </Button>
              )}

              <Button variant="ghost" className="w-full" onClick={() => navigate('/app')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Aplikasi
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Premium Dashboard - HiroCross Plan</title>
      </Helmet>
      <div className="min-h-screen bg-muted/30 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Premium Dashboard
                  <PremiumBadge size="sm" />
                </h1>
                <p className="text-sm text-muted-foreground">Load Monitoring & Performance Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/app')} className="gap-2">
                <CalendarDays className="w-4 h-4" />
                Input di Bulanan
              </Button>
              <Button variant="outline" size="sm" onClick={refetch} disabled={loadsLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Notice about input location */}
          {loads.length === 0 && (
            <Card className="border-dashed border-amber-400 bg-gradient-to-br from-amber-50/30 to-yellow-50/30 dark:from-amber-950/10 dark:to-yellow-950/10">
              <CardContent className="p-4 flex items-center gap-4">
                <CalendarDays className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Belum ada data training load</p>
                  <p className="text-sm text-muted-foreground">
                    Input data training load di halaman <strong>Bulanan</strong> untuk melihat analisis performa di sini.
                  </p>
                </div>
                <Button onClick={() => navigate('/app')} variant="outline" size="sm">
                  Ke Halaman Bulanan
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <PremiumBadge size="sm" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Fitness (CTL)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <PercentageSpeedometer 
                  percentage={currentMetrics.fitness} 
                  size={180} 
                  label="Chronic Training Load" 
                />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <PremiumBadge size="sm" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Fatigue (ATL)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <PercentageSpeedometer 
                  percentage={currentMetrics.fatigue} 
                  size={180} 
                  label="Acute Training Load" 
                />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <PremiumBadge size="sm" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Form (TSB)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <FormSpeedometer 
                  value={currentMetrics.form} 
                  size={180} 
                  label="Training Stress Balance" 
                />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <PremiumBadge size="sm" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  ACWR
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ACWRGauge acwr={acwrData.acwr} size={180} />
              </CardContent>
            </Card>
          </div>

          {/* ACWR Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">Beban Akut (7 Hari)</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{acwrData.acuteLoad} AU</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase">Beban Kronis (28 Hari)</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{acwrData.chronicLoad} AU</p>
              </CardContent>
            </Card>
            <Card className={`border-2 ${
              acwrData.riskZone === 'optimal' ? 'bg-green-50 dark:bg-green-950/20 border-green-500' :
              acwrData.riskZone === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500' :
              acwrData.riskZone === 'danger' ? 'bg-red-50 dark:bg-red-950/20 border-red-500' :
              'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
            }`}>
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium uppercase">Zona Risiko</p>
                <p className={`text-lg font-bold ${
                  acwrData.riskZone === 'optimal' ? 'text-green-600 dark:text-green-400' :
                  acwrData.riskZone === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                  acwrData.riskZone === 'danger' ? 'text-red-600 dark:text-red-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {acwrData.riskZone === 'optimal' && '✓ Sweet Spot'}
                  {acwrData.riskZone === 'warning' && '⚠ Warning Zone'}
                  {acwrData.riskZone === 'danger' && '🚨 Danger Zone'}
                  {acwrData.riskZone === 'undertrained' && '📉 Undertrained'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <TrainingRecommendation acwrData={acwrData} currentMetrics={currentMetrics} />

          {/* Period Comparison */}
          <PeriodComparison dailyMetrics={dailyMetrics} />

          {/* Weekly Target */}
          <WeeklyLoadTarget 
            loads={loads} 
            weeklyTarget={weeklyTarget} 
            onTargetChange={handleTargetChange} 
          />

          {/* Performance Trend Chart */}
          <PerformanceTrendChart dailyMetrics={dailyMetrics} />

          {/* PDF Export */}
          <TrainingLoadPDFExport 
            loads={loads}
            dailyMetrics={dailyMetrics}
            acwrData={acwrData}
            currentMetrics={currentMetrics}
            userName={user.email || 'Atlet'}
          />

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Apa itu ACWR?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Acute:Chronic Workload Ratio (ACWR)</strong> adalah rasio antara beban latihan akut (1 minggu) dengan beban latihan kronis (rata-rata 4 minggu).</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><span className="text-blue-500 font-medium">&lt; 0.8:</span> Undertrained - beban terlalu rendah</li>
                  <li><span className="text-green-500 font-medium">0.8 - 1.3:</span> Sweet Spot - zona optimal</li>
                  <li><span className="text-amber-500 font-medium">1.3 - 1.5:</span> Warning - risiko meningkat</li>
                  <li><span className="text-red-500 font-medium">&gt; 1.5:</span> Danger Zone - risiko tinggi</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fitness-Fatigue Model</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Form (TSB) = Fitness (CTL) - Fatigue (ATL)</strong></p>
                <p>Model ini membantu memahami kesiapan atlet untuk berkompetisi:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Fitness (CTL):</strong> Chronic Training Load - adaptasi positif dari latihan (42 hari)</li>
                  <li><strong>Fatigue (ATL):</strong> Acute Training Load - kelelahan akumulatif (7 hari)</li>
                  <li><strong>Form (TSB):</strong> Training Stress Balance - kesiapan performa</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
