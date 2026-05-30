import { Diamond, ArrowLeft, Activity, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAdmin } from '@/hooks/useAdmin';
import { ReactNode } from 'react';
import { PremiumBadge } from '@/components/PremiumBadge';
import { PremiumPricingPackages } from '@/components/PremiumPricingPackages';

interface PremiumFeatureGateProps {
  featureName: string;
  description?: string;
  children: ReactNode;
}

const FEATURE_HIGHLIGHTS: Record<string, { icon: typeof Activity; title: string; desc: string; color: string }[]> = {
  'Annual Plan': [
    { icon: Activity, title: 'Periodisasi Tahunan', desc: 'Rencana makro & mesocycle lengkap', color: 'text-green-500' },
    { icon: TrendingUp, title: 'Editing Interaktif', desc: 'Atur fase preparation, comp, transition', color: 'text-blue-500' },
    { icon: Zap, title: 'Auto Backup', desc: 'Riwayat versi program tersimpan', color: 'text-amber-500' },
  ],
  'Bulanan': [
    { icon: Activity, title: 'Training Load Bulanan', desc: 'TSS, ACWR, dan compliance biomotor', color: 'text-green-500' },
    { icon: TrendingUp, title: 'Rekomendasi Otomatis', desc: 'Intensitas berbasis ACWR & TSB', color: 'text-blue-500' },
    { icon: Zap, title: 'Sync Kalender', desc: 'Auto sync dari sesi DONE', color: 'text-amber-500' },
  ],
  'Tes & Pengukuran': [
    { icon: Activity, title: 'Norma Lengkap', desc: 'Bandingkan hasil tes dengan standar', color: 'text-green-500' },
    { icon: TrendingUp, title: 'Kalkulator Otomatis', desc: '1RM, VCr, RAST, BMI & lainnya', color: 'text-blue-500' },
    { icon: Zap, title: 'Riwayat Tes', desc: 'Pantau progres atlet secara berkala', color: 'text-amber-500' },
  ],
};

export function PremiumFeatureGate({ featureName, description, children }: PremiumFeatureGateProps) {
  const { hasPremium, loading } = usePremiumAccess();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasPremium || isAdmin) {
    return <>{children}</>;
  }

  const highlights = FEATURE_HIGHLIGHTS[featureName] ?? FEATURE_HIGHLIGHTS['Annual Plan'];

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {featureName}
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
            <CardTitle className="text-xl">Fitur Premium {featureName}</CardTitle>
            <CardDescription className="text-base mt-2">
              {description ?? `Akses fitur ${featureName} lanjutan untuk analisis dan perencanaan program latihan yang lebih optimal`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {highlights.map((h) => (
                <div key={h.title} className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <h.icon className={`w-8 h-8 ${h.color}`} />
                  <div>
                    <p className="font-medium">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
              ))}
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
  );
}
