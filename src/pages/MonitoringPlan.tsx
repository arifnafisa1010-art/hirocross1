import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Diamond, Activity, TrendingUp, Zap, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { PremiumBadge } from '@/components/PremiumBadge';
import { PremiumPricingPackages } from '@/components/PremiumPricingPackages';
import { ProgramMonitoringSection } from '@/components/ProgramMonitoringSection';

export default function MonitoringPlan() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPremium, loading: premiumLoading } = usePremiumAccess();

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

  // Show pricing packages if no premium access
  if (!hasPremium) {
    return (
      <>
        <Helmet>
          <title>Monitoring Plan - HiroCross Plan</title>
        </Helmet>
        <div className="min-h-screen bg-muted/30 p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Monitoring Plan
                  <PremiumBadge size="sm" />
                </h1>
                <p className="text-sm text-muted-foreground">Akses premium diperlukan</p>
              </div>
            </div>

            {/* Feature Preview Card */}
            <Card className="relative overflow-hidden border-amber-300">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-yellow-400/10 pointer-events-none" />
              <CardHeader className="text-center">
                <Diamond className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                <CardTitle className="text-xl">Fitur Premium Monitoring Plan</CardTitle>
                <CardDescription className="text-base mt-2">
                  Analisis efektifitas program latihan dan performa atlet secara menyeluruh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <Activity className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="font-medium">Analisis Program</p>
                      <p className="text-xs text-muted-foreground">Evaluasi efektifitas latihan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Progress Tracking</p>
                      <p className="text-xs text-muted-foreground">Pantau perkembangan performa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <Zap className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="font-medium">Compliance Index</p>
                      <p className="text-xs text-muted-foreground">Tingkat kepatuhan program</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Packages */}
            <PremiumPricingPackages />

            <div className="text-center">
              <Button variant="ghost" onClick={() => navigate('/app')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Aplikasi
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Monitoring Plan - HiroCross Plan</title>
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
                  Monitoring Plan
                  <PremiumBadge size="sm" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  Analisis efektifitas program latihan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/monitoring-atlet')} className="gap-2">
                <Users className="w-4 h-4" />
                Monitoring Atlet
              </Button>
            </div>
          </div>

          {/* Program Monitoring Content */}
          <ProgramMonitoringSection />
        </div>
      </div>
    </>
  );
}
