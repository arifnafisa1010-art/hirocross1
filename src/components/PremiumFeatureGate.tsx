import { Crown, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAdmin } from '@/hooks/useAdmin';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PremiumFeatureGateProps {
  featureName: string;
  description?: string;
  children: ReactNode;
}

export function PremiumFeatureGate({ featureName, description, children }: PremiumFeatureGateProps) {
  const { hasPremium, loading } = usePremiumAccess();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasPremium || isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full p-8 text-center border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-yellow-500/5">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-20 animate-pulse" />
          <div className="relative w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-300 dark:border-amber-700">
            <Lock className="h-9 w-9 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-2 shadow-lg">
            <Crown className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Fitur Premium</span>
        </div>

        <h2 className="text-2xl font-bold mb-2">{featureName}</h2>
        <p className="text-muted-foreground mb-6">
          {description ?? `Halaman ${featureName} hanya tersedia untuk pengguna Premium. Berlangganan sekarang untuk membuka semua fitur lengkap.`}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate('/premium')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Crown className="mr-2 h-4 w-4" />
            Berlangganan Premium
          </Button>
        </div>
      </Card>
    </div>
  );
}
