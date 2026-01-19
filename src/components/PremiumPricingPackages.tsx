import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Crown, Loader2, Upload, Image, X, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

const PAYMENT_INFO = {
  bank: 'BCA',
  accountNumber: '1234567890',
  accountName: 'HiroCross Plan',
  ewallet: 'Dana/GoPay: 081234567890',
};

interface PremiumPricingPackagesProps {
  onPackageSelect?: (pkg: PremiumPackage) => void;
}

export function PremiumPricingPackages({ onPackageSelect }: PremiumPricingPackagesProps) {
  const { user } = useAuth();
  const { pendingRequest, requestPremiumAccess } = usePremiumAccess();
  const [selectedPackage, setSelectedPackage] = useState<PremiumPackage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPackage = (pkg: PremiumPackage) => {
    if (pendingRequest) {
      toast.error('Anda sudah memiliki request pending. Silakan tunggu verifikasi admin.');
      return;
    }
    setSelectedPackage(pkg);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setPaymentProof(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setPaymentProof(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPaymentProof = async (): Promise<string | null> => {
    if (!paymentProof || !user) return null;

    setUploading(true);
    try {
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Gagal upload bukti pembayaran: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedPackage) return;

    setRequesting(true);

    // Upload payment proof if exists
    let proofUrl: string | null = null;
    if (paymentProof) {
      proofUrl = await uploadPaymentProof();
    }

    const notes = `Paket: ${selectedPackage.name} (${selectedPackage.duration} bulan) - ${selectedPackage.priceDisplay}`;
    const result = await requestPremiumAccess(proofUrl || undefined, notes);

    if (result.success) {
      toast.success(`Request paket ${selectedPackage.name} berhasil dikirim!`);
      onPackageSelect?.(selectedPackage);
      setDialogOpen(false);
      clearFile();
      setSelectedPackage(null);
    } else {
      toast.error('Gagal mengirim request: ' + result.error);
    }

    setRequesting(false);
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
          {pendingRequest.payment_proof_url && (
            <div className="mt-4">
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                <Check className="w-3 h-3" />
                Bukti pembayaran sudah diupload
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
              onClick={() => handleSelectPackage(pkg)}
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
                >
                  Pilih Paket
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground mt-4">
          <p>Pembayaran dapat dilakukan via Transfer Bank / E-Wallet</p>
          <p>Setelah memilih paket, upload bukti pembayaran untuk verifikasi</p>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Pembayaran Premium
            </DialogTitle>
            <DialogDescription>
              {selectedPackage && (
                <span>
                  Paket: <strong>{selectedPackage.name}</strong> - <strong>{selectedPackage.priceDisplay}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Payment Info */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Transfer ke:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-medium">{PAYMENT_INFO.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Rekening:</span>
                  <span className="font-medium font-mono">{PAYMENT_INFO.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atas Nama:</span>
                  <span className="font-medium">{PAYMENT_INFO.accountName}</span>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground text-xs">{PAYMENT_INFO.ewallet}</span>
                </div>
              </div>
            </div>

            {/* Upload Payment Proof */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Upload Bukti Pembayaran</Label>
              
              {previewUrl ? (
                <div className="relative rounded-lg border overflow-hidden">
                  <img 
                    src={previewUrl} 
                    alt="Bukti pembayaran" 
                    className="w-full h-48 object-contain bg-muted"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={clearFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Klik untuk upload gambar bukti transfer
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: JPG, PNG, WEBP (Maks. 5MB)
                  </p>
                </div>
              )}
              
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Upload bukti pembayaran mempercepat proses verifikasi
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={requesting || uploading}
            >
              Batal
            </Button>
            <Button 
              onClick={handleSubmitRequest}
              disabled={requesting || uploading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {(requesting || uploading) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Image className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Kirim Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { PACKAGES };
export type { PremiumPackage };
