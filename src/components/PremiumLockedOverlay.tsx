import { Lock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumLockedOverlayProps {
  title?: string;
  description?: string;
  className?: string;
}

export function PremiumLockedOverlay({
  title = 'Fitur Premium',
  description = 'Pelatih Anda belum berlangganan Premium. Hubungi pelatih untuk mengaktifkan fitur ini.',
  className
}: PremiumLockedOverlayProps) {
  return (
    <div className={cn(
      "absolute inset-0 z-10 flex items-center justify-center",
      "bg-background/80 backdrop-blur-sm rounded-lg",
      className
    )}>
      <div className="text-center px-6 py-8">
        <div className="relative mx-auto mb-4 w-16 h-16">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-20 animate-pulse" />
          
          {/* Lock icon container */}
          <div className="relative w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-300 dark:border-amber-700">
            <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          
          {/* Crown badge */}
          <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-1.5 shadow-lg">
            <Crown className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        
        <h3 className="font-bold text-lg mb-1 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
}
