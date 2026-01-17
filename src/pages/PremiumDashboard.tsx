import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Diamond, Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { PremiumBadge } from '@/components/PremiumBadge';
import { FormSpeedometer } from '@/components/FormSpeedometer';
import { ACWRGauge } from '@/components/ACWRGauge';
import { PercentageSpeedometer } from '@/components/PercentageSpeedometer';
import { toast } from 'sonner';

export default function PremiumDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPremium, loading: premiumLoading, pendingRequest, requestPremiumAccess } = usePremiumAccess();
  const [requesting, setRequesting] = useState(false);

  // Demo data - in real app, this would come from database
  const demoData = {
    fitness: 72,
    fatigue: 45,
    form: 27, // fitness - fatigue
    acwr: 1.15,
    weeklyLoad: [
      { week: 'W1', load: 450 },
      { week: 'W2', load: 520 },
      { week: 'W3', load: 480 },
      { week: 'W4', load: 580 },
    ],
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
          <div className="flex items-center justify-between">
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
          </div>

          {/* Main Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <PremiumBadge size="sm" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Fitness
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <PercentageSpeedometer percentage={demoData.fitness} size={180} label="Fitness Level" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <PremiumBadge size="sm" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Fatigue
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <PercentageSpeedometer percentage={demoData.fatigue} size={180} label="Fatigue Level" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <PremiumBadge size="sm" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Form
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <FormSpeedometer value={demoData.form} size={180} label="Form (Fitness - Fatigue)" />
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
                <ACWRGauge acwr={demoData.acwr} size={180} />
              </CardContent>
            </Card>
          </div>

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
                <p><strong>Form = Fitness - Fatigue</strong></p>
                <p>Model ini membantu memahami kesiapan atlet untuk berkompetisi:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Fitness:</strong> Adaptasi positif dari latihan</li>
                  <li><strong>Fatigue:</strong> Kelelahan akumulatif</li>
                  <li><strong>Form:</strong> Kesiapan performa saat ini</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
