import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';

interface PremiumPackage {
  id: string;
  name: string;
  duration: number; // in months
  price: number;
  priceDisplay: string;
  popular?: boolean;
  savings?: string;
}

const PACKAGES: PremiumPackage[] = [
  { id: '1-month', name: '1 Bulan', duration: 1, price: 30000, priceDisplay: 'Rp 30.000' },
  { id: '3-months', name: '3 Bulan', duration: 3, price: 85000, priceDisplay: 'Rp 85.000', popular: true, savings: 'Hemat 5rb' },
  { id: '6-months', name: '6 Bulan', duration: 6, price: 160000, priceDisplay: 'Rp 160.000', savings: 'Hemat 20rb' },
  { id: '1-year', name: '1 Tahun', duration: 12, price: 300000, priceDisplay: 'Rp 300.000', savings: 'Hemat 60rb' },
];

interface PremiumPricingPackagesProps {
  onPackageSelect?: (pkg: PremiumPackage) => void;
}

export function PremiumPricingPackages({ onPackageSelect }: PremiumPricingPackagesProps) {
  const { pendingRequest, requestPremiumAccess } = usePremiumAccess();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const handleSelectPackage = async (pkg: PremiumPackage) => {
    if (pendingRequest) {
      toast.error('Anda sudah memiliki request pending. Silakan tunggu verifikasi admin.');
      return;
    }

    setSelectedPackage(pkg.id);
    setRequesting(true);

    const notes = `Paket: ${pkg.name} (${pkg.duration} bulan) - ${pkg.priceDisplay}`;
    const result = await requestPremiumAccess(undefined, notes);

    if (result.success) {
      toast.success(`Request paket ${pkg.name} berhasil dikirim! Silakan lakukan pembayaran.`);
      onPackageSelect?.(pkg);
    } else {
      toast.error('Gagal mengirim request: ' + result.error);
    }

    setRequesting(false);
    setSelectedPackage(null);
  };

  if (pendingRequest) {
    return (
      <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-6 text-center">
          <Crown className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Request Sedang Diproses</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Permintaan premium Anda sedang menunggu verifikasi admin.
          </p>
          <p className="text-xs text-muted-foreground">
            Catatan: {pendingRequest.notes || '-'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          Pilih Paket Premium
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Akses fitur Monitoring Plan untuk analisis performa lengkap
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PACKAGES.map((pkg) => (
          <Card 
            key={pkg.id}
            className={`relative transition-all hover:shadow-lg cursor-pointer ${
              pkg.popular 
                ? 'border-2 border-amber-500 shadow-amber-200/50 dark:shadow-amber-900/20' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => !requesting && handleSelectPackage(pkg)}
          >
            {pkg.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500">
                Populer
              </Badge>
            )}
            <CardHeader className="pb-2 pt-6">
              <CardTitle className="text-lg text-center">{pkg.name}</CardTitle>
              {pkg.savings && (
                <CardDescription className="text-center text-green-600 dark:text-green-400 text-xs">
                  {pkg.savings}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-primary mb-4">
                {pkg.priceDisplay}
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                <li className="flex items-center gap-1 justify-center">
                  <Check className="w-3 h-3 text-green-500" />
                  Multi-atlet monitoring
                </li>
                <li className="flex items-center gap-1 justify-center">
                  <Check className="w-3 h-3 text-green-500" />
                  ACWR & Form Analysis
                </li>
                <li className="flex items-center gap-1 justify-center">
                  <Check className="w-3 h-3 text-green-500" />
                  Export PDF Report
                </li>
              </ul>
              <Button 
                className={`w-full ${pkg.popular ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                disabled={requesting}
              >
                {requesting && selectedPackage === pkg.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Pilih Paket
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground mt-4">
        <p>Pembayaran dapat dilakukan via Transfer Bank / E-Wallet</p>
        <p>Setelah memilih paket, admin akan memverifikasi pembayaran Anda</p>
      </div>
    </div>
  );
}

export { PACKAGES };
export type { PremiumPackage };
