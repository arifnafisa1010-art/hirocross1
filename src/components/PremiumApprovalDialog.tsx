import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2, Check, Image, ExternalLink, X } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface PremiumPackage {
  id: string;
  name: string;
  duration: number;
  price: number;
  priceDisplay: string;
}

const PACKAGES: PremiumPackage[] = [
  { id: '1-month', name: '1 Bulan', duration: 1, price: 30000, priceDisplay: 'Rp 30.000' },
  { id: '3-months', name: '3 Bulan', duration: 3, price: 85000, priceDisplay: 'Rp 85.000' },
  { id: '6-months', name: '6 Bulan', duration: 6, price: 160000, priceDisplay: 'Rp 160.000' },
  { id: '1-year', name: '1 Tahun', duration: 12, price: 300000, priceDisplay: 'Rp 300.000' },
];

interface PremiumApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userId: string;
  requestNotes?: string | null;
  paymentProofUrl?: string | null;
  onApprove: (userId: string, expiresAt: string, notes: string) => Promise<void>;
  loading?: boolean;
}

export function PremiumApprovalDialog({
  open,
  onOpenChange,
  userEmail,
  userId,
  requestNotes,
  paymentProofUrl,
  onApprove,
  loading = false,
}: PremiumApprovalDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('3-months');
  const [showProofImage, setShowProofImage] = useState(false);
  const [resolvedProofUrl, setResolvedProofUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  
  const pkg = PACKAGES.find(p => p.id === selectedPackage) || PACKAGES[1];
  const expiresAt = addMonths(new Date(), pkg.duration);

  const handleApprove = async () => {
    const notes = `Paket: ${pkg.name} (${pkg.duration} bulan) - ${pkg.priceDisplay}`;
    await onApprove(userId, expiresAt.toISOString(), notes);
  };

  // Try to detect package from request notes
  const detectPackageFromNotes = () => {
    if (!requestNotes) return;
    const lowerNotes = requestNotes.toLowerCase();
    
    if (lowerNotes.includes('1 tahun') || lowerNotes.includes('12 bulan')) {
      setSelectedPackage('1-year');
    } else if (lowerNotes.includes('6 bulan')) {
      setSelectedPackage('6-months');
    } else if (lowerNotes.includes('3 bulan')) {
      setSelectedPackage('3-months');
    } else if (lowerNotes.includes('1 bulan')) {
      setSelectedPackage('1-month');
    }
  };

  // Detect on open & resolve proof URL
  useEffect(() => {
    if (open) {
      detectPackageFromNotes();
      if (paymentProofUrl) {
        setProofLoading(true);
        const path = paymentProofUrl.match(/\/storage\/v1\/object\/sign\/payment-proofs\/(.+?)(\?|$)/)?.[1]
          || paymentProofUrl.match(/\/storage\/v1\/object\/public\/payment-proofs\/(.+?)(\?|$)/)?.[1];
        if (path) {
          supabase.storage.from('payment-proofs').createSignedUrl(path, 3600).then(({ data, error }) => {
            setResolvedProofUrl(!error && data?.signedUrl ? data.signedUrl : paymentProofUrl);
            setProofLoading(false);
          });
        } else {
          setResolvedProofUrl(paymentProofUrl);
          setProofLoading(false);
        }
      }
    }
  }, [open, paymentProofUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Verifikasi Premium
          </DialogTitle>
          <DialogDescription>
            Berikan akses premium untuk <strong>{userEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Request Notes */}
          {requestNotes && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Catatan dari user:</p>
              <p className="text-sm">{requestNotes}</p>
            </div>
          )}

          {/* Payment Proof */}
          {paymentProofUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Image className="w-4 h-4" />
                Bukti Pembayaran
              </Label>
              <div className="relative rounded-lg border overflow-hidden bg-muted">
                {proofLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <img 
                    src={resolvedProofUrl || paymentProofUrl} 
                    alt="Bukti pembayaran" 
                    className="w-full max-h-48 object-contain cursor-pointer"
                    onClick={() => setShowProofImage(true)}
                  />
                )}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    onClick={() => window.open(resolvedProofUrl || paymentProofUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Buka
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!paymentProofUrl && (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Tidak ada bukti pembayaran diupload
              </p>
            </div>
          )}

          {/* Package Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pilih Paket:</Label>
            <RadioGroup 
              value={selectedPackage} 
              onValueChange={setSelectedPackage}
              className="grid grid-cols-2 gap-3"
            >
              {PACKAGES.map((p) => (
                <div key={p.id} className="relative">
                  <RadioGroupItem
                    value={p.id}
                    id={p.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={p.id}
                    className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-primary font-bold">{p.priceDisplay}</span>
                    {p.id === '3-months' && (
                      <Badge className="mt-1 text-[10px] bg-amber-500">Populer</Badge>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Summary */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-400">Detail Premium</span>
            </div>
            <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
              <li>• Paket: <strong>{pkg.name}</strong></li>
              <li>• Harga: <strong>{pkg.priceDisplay}</strong></li>
              <li>• Berlaku hingga: <strong>{format(expiresAt, 'dd MMMM yyyy', { locale: idLocale })}</strong></li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Setujui & Aktifkan
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Full Image View */}
      <Dialog open={showProofImage} onOpenChange={setShowProofImage}>
        <DialogContent className="sm:max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80"
              onClick={() => setShowProofImage(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            {(resolvedProofUrl || paymentProofUrl) && (
              <img 
                src={resolvedProofUrl || paymentProofUrl} 
                alt="Bukti pembayaran" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

interface GrantPremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userId: string;
  onGrant: (userId: string, expiresAt: string, notes: string) => Promise<void>;
  loading?: boolean;
}

export function GrantPremiumDialog({
  open,
  onOpenChange,
  userEmail,
  userId,
  onGrant,
  loading = false,
}: GrantPremiumDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('3-months');
  
  const pkg = PACKAGES.find(p => p.id === selectedPackage) || PACKAGES[1];
  const expiresAt = addMonths(new Date(), pkg.duration);

  const handleGrant = async () => {
    const notes = `Manual: ${pkg.name} (${pkg.duration} bulan) - ${pkg.priceDisplay}`;
    await onGrant(userId, expiresAt.toISOString(), notes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Berikan Akses Premium
          </DialogTitle>
          <DialogDescription>
            Berikan akses premium secara manual untuk <strong>{userEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Package Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pilih Paket:</Label>
            <RadioGroup 
              value={selectedPackage} 
              onValueChange={setSelectedPackage}
              className="grid grid-cols-2 gap-3"
            >
              {PACKAGES.map((p) => (
                <div key={p.id} className="relative">
                  <RadioGroupItem
                    value={p.id}
                    id={`grant-${p.id}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`grant-${p.id}`}
                    className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-primary font-bold">{p.priceDisplay}</span>
                    {p.id === '3-months' && (
                      <Badge className="mt-1 text-[10px] bg-amber-500">Populer</Badge>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Summary */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-700 dark:text-amber-400">Detail Premium</span>
            </div>
            <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
              <li>• Paket: <strong>{pkg.name}</strong></li>
              <li>• Harga: <strong>{pkg.priceDisplay}</strong></li>
              <li>• Berlaku hingga: <strong>{format(expiresAt, 'dd MMMM yyyy', { locale: idLocale })}</strong></li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button 
            onClick={handleGrant} 
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Crown className="w-4 h-4 mr-2" />
            )}
            Berikan Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { PACKAGES };
export type { PremiumPackage };
