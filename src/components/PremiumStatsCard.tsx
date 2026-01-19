import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Clock,
  DollarSign
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface PremiumAccessData {
  id: string;
  user_id: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
}

interface PremiumRequest {
  id: string;
  user_id: string;
  status: string;
  request_date: string;
  notes: string | null;
}

interface PackageStats {
  name: string;
  count: number;
  revenue: number;
}

const PACKAGE_PRICES: Record<string, { name: string; price: number }> = {
  '1 bulan': { name: '1 Bulan', price: 30000 },
  '3 bulan': { name: '3 Bulan', price: 85000 },
  '6 bulan': { name: '6 Bulan', price: 160000 },
  '12 bulan': { name: '1 Tahun', price: 300000 },
  '1 tahun': { name: '1 Tahun', price: 300000 },
};

export function PremiumStatsCard() {
  const [stats, setStats] = useState({
    totalActive: 0,
    pendingRequests: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    packageBreakdown: [] as PackageStats[],
    recentGrants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const parsePackageFromNotes = (notes: string | null): { duration: number; price: number } | null => {
    if (!notes) return null;
    
    const lowerNotes = notes.toLowerCase();
    
    // Try to extract duration from notes
    for (const [key, value] of Object.entries(PACKAGE_PRICES)) {
      if (lowerNotes.includes(key)) {
        return { duration: key.includes('tahun') ? 12 : parseInt(key), price: value.price };
      }
    }
    
    // Fallback: try to find price
    const priceMatch = notes.match(/rp\s*(\d+(?:[.,]\d+)?)/i);
    if (priceMatch) {
      const price = parseInt(priceMatch[1].replace(/[.,]/g, ''));
      if (price <= 30000) return { duration: 1, price: 30000 };
      if (price <= 85000) return { duration: 3, price: 85000 };
      if (price <= 160000) return { duration: 6, price: 160000 };
      return { duration: 12, price: 300000 };
    }
    
    return null;
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get all premium access records
      const { data: premiumData, error: premiumError } = await supabase
        .from('premium_access')
        .select('*')
        .order('granted_at', { ascending: false });

      if (premiumError) throw premiumError;

      // Get all requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('premium_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (requestsError) throw requestsError;

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Count active premium users (active and not expired)
      const totalActive = (premiumData || []).filter(
        (p: PremiumAccessData) => p.is_active && (!p.expires_at || new Date(p.expires_at) > now)
      ).length;

      // Count pending requests
      const pendingRequests = (requestsData || []).filter(
        (r: PremiumRequest) => r.status === 'pending'
      ).length;

      // Calculate revenue from this month's grants
      const thisMonthGrants = (premiumData || []).filter((p: PremiumAccessData) => {
        const grantDate = new Date(p.granted_at);
        return grantDate >= monthStart && grantDate <= monthEnd;
      });

      // Calculate total revenue based on package notes
      let monthlyRevenue = 0;
      let totalRevenue = 0;
      const packageCounts: Record<string, number> = {
        '1 Bulan': 0,
        '3 Bulan': 0,
        '6 Bulan': 0,
        '1 Tahun': 0,
      };

      (premiumData || []).forEach((p: PremiumAccessData) => {
        const parsed = parsePackageFromNotes(p.notes);
        if (parsed) {
          totalRevenue += parsed.price;
          
          const grantDate = new Date(p.granted_at);
          if (grantDate >= monthStart && grantDate <= monthEnd) {
            monthlyRevenue += parsed.price;
          }

          // Count packages
          const durationName = parsed.duration === 12 ? '1 Tahun' : `${parsed.duration} Bulan`;
          if (packageCounts[durationName] !== undefined) {
            packageCounts[durationName]++;
          }
        }
      });

      const packageBreakdown: PackageStats[] = Object.entries(packageCounts)
        .map(([name, count]) => ({
          name,
          count,
          revenue: count * (PACKAGE_PRICES[name.toLowerCase()]?.price || 0),
        }))
        .filter(p => p.count > 0)
        .sort((a, b) => b.count - a.count);

      setStats({
        totalActive,
        pendingRequests,
        monthlyRevenue,
        totalRevenue,
        packageBreakdown,
        recentGrants: thisMonthGrants.length,
      });
    } catch (error) {
      console.error('Error loading premium stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Statistik Premium
        </CardTitle>
        <CardDescription>
          Overview pendapatan dan langganan premium bulan {format(new Date(), 'MMMM yyyy', { locale: idLocale })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">User Aktif</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {stats.totalActive}
            </div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">
              Total premium aktif
            </p>
          </div>

          <div className="rounded-lg border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {stats.pendingRequests}
            </div>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
              Menunggu verifikasi
            </p>
          </div>

          <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">Revenue Bulan Ini</span>
            </div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              {stats.recentGrants} transaksi
            </p>
          </div>

          <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-purple-700 dark:text-purple-400 font-medium">Total Revenue</span>
            </div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
              Sejak awal
            </p>
          </div>
        </div>

        {/* Package Breakdown */}
        {stats.packageBreakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              Paket Populer
            </h4>
            <div className="grid gap-2">
              {stats.packageBreakdown.map((pkg, index) => (
                <div 
                  key={pkg.name}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={index === 0 ? 'default' : 'secondary'}
                      className={index === 0 ? 'bg-amber-500' : ''}
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{pkg.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{pkg.count} user</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(pkg.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.packageBreakdown.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Crown className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada data paket premium</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
