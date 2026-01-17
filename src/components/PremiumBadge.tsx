import { Diamond } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function PremiumBadge({ className, size = 'md', showText = false }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400",
        "text-amber-950 font-semibold text-xs shadow-lg",
        "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]",
        className
      )}
    >
      <Diamond className={cn(sizeClasses[size], "fill-current")} />
      {showText && <span>Premium</span>}
    </div>
  );
}

interface PremiumCardWrapperProps {
  children: React.ReactNode;
  isPremium?: boolean;
  className?: string;
}

export function PremiumCardWrapper({ children, isPremium = true, className }: PremiumCardWrapperProps) {
  if (!isPremium) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div className="absolute -top-2 -right-2 z-10">
        <PremiumBadge size="sm" />
      </div>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-400/10 via-transparent to-yellow-400/10 pointer-events-none" />
      {children}
    </div>
  );
}
