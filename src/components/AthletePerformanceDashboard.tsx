import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Activity, TrendingUp, TrendingDown, Zap, Battery, Heart, 
  AlertTriangle, CheckCircle2, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface ACWRData {
  acwr: number;
  acuteLoad: number;
  chronicLoad: number;
  riskZone: 'undertrained' | 'optimal' | 'warning' | 'danger';
}

interface CurrentMetrics {
  fitness: number;
  fatigue: number;
  form: number;
}

interface AthletePerformanceDashboardProps {
  dailyMetrics: DailyMetric[];
  acwrData: ACWRData;
  currentMetrics: CurrentMetrics;
  loading?: boolean;
}

export function AthletePerformanceDashboard({
  dailyMetrics,
  acwrData,
  currentMetrics,
  loading = false
}: AthletePerformanceDashboardProps) {
  
  // Last 14 days of data for mini charts
  const recentMetrics = useMemo(() => {
    return dailyMetrics.slice(-14);
  }, [dailyMetrics]);

  // Form status
  const getFormStatus = (form: number) => {
    if (form >= 20) return { label: 'Transisi', color: 'text-amber-600', bg: 'bg-amber-100' };
    if (form >= 5) return { label: 'Fresh', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (form >= -10) return { label: 'Grey Zone', color: 'text-gray-600', bg: 'bg-gray-100' };
    if (form >= -30) return { label: 'Optimal', color: 'text-green-600', bg: 'bg-green-100' };
    return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // ACWR status colors
  const getACWRStatus = (zone: string) => {
    switch (zone) {
      case 'optimal': return { label: 'Sweet Spot', color: 'text-green-600', bg: 'bg-green-500', icon: CheckCircle2 };
      case 'warning': return { label: 'Warning', color: 'text-yellow-600', bg: 'bg-yellow-500', icon: AlertCircle };
      case 'danger': return { label: 'Danger', color: 'text-red-600', bg: 'bg-red-500', icon: AlertTriangle };
      default: return { label: 'Undertrained', color: 'text-blue-600', bg: 'bg-blue-500', icon: Activity };
    }
  };

  const formStatus = getFormStatus(currentMetrics.form);
  const acwrStatus = getACWRStatus(acwrData.riskZone);
  const ACWRIcon = acwrStatus.icon;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="h-32 bg-muted/50" />
        ))}
      </div>
    );
  }

  // Calculate ACWR gauge position (0-100%)
  const acwrPercentage = Math.min(100, Math.max(0, (acwrData.acwr / 2) * 100));

  return (
    <div className="space-y-4">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* ACWR Card */}
        <Card className={cn(
          "relative overflow-hidden",
          acwrData.riskZone === 'danger' && "border-red-300 bg-red-50/50",
          acwrData.riskZone === 'warning' && "border-yellow-300 bg-yellow-50/50",
          acwrData.riskZone === 'optimal' && "border-green-300 bg-green-50/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">ACWR</span>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-[10px] px-1.5", acwrStatus.color)}
              >
                <ACWRIcon className="h-3 w-3 mr-0.5" />
                {acwrStatus.label}
              </Badge>
            </div>
            <div className="text-3xl font-bold">{acwrData.acwr.toFixed(2)}</div>
            <div className="mt-2">
              <Progress 
                value={acwrPercentage} 
                className="h-2"
              />
              <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                <span>0.8</span>
                <span>1.3</span>
                <span>1.5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fitness Card */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              <span className="text-xs font-medium text-muted-foreground">Fitness (CTL)</span>
            </div>
            <div className="text-3xl font-bold text-cyan-600">{currentMetrics.fitness}</div>
            <div className="mt-2 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentMetrics}>
                  <Area 
                    type="monotone" 
                    dataKey="fitness" 
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fatigue Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Battery className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-muted-foreground">Fatigue (ATL)</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{currentMetrics.fatigue}</div>
            <div className="mt-2 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentMetrics}>
                  <Area 
                    type="monotone" 
                    dataKey="fatigue" 
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className={cn(
          "bg-gradient-to-br",
          formStatus.bg.replace('bg-', 'from-').replace('100', '500/10'),
          "to-transparent"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-medium text-muted-foreground">Form (TSB)</span>
              </div>
              <Badge variant="outline" className={cn("text-[10px]", formStatus.color)}>
                {formStatus.label}
              </Badge>
            </div>
            <div className={cn("text-3xl font-bold", formStatus.color)}>
              {currentMetrics.form > 0 ? '+' : ''}{currentMetrics.form}
            </div>
            <div className="mt-2 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentMetrics}>
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Area 
                    type="monotone" 
                    dataKey="form" 
                    stroke="hsl(38, 92%, 50%)"
                    fill="hsl(38, 92%, 50%)"
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Ringkasan Beban Latihan</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Acute Load (7 hari)</p>
              <p className="text-xl font-bold text-primary">{acwrData.acuteLoad} AU</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Chronic Load (28 hari avg)</p>
              <p className="text-xl font-bold text-primary">{acwrData.chronicLoad} AU</p>
            </div>
          </div>
          
          {/* Risk indicator */}
          <div className={cn(
            "mt-3 p-3 rounded-lg flex items-center gap-3",
            acwrData.riskZone === 'optimal' && "bg-green-100 dark:bg-green-900/30",
            acwrData.riskZone === 'undertrained' && "bg-blue-100 dark:bg-blue-900/30",
            acwrData.riskZone === 'warning' && "bg-yellow-100 dark:bg-yellow-900/30",
            acwrData.riskZone === 'danger' && "bg-red-100 dark:bg-red-900/30"
          )}>
            <ACWRIcon className={cn("h-5 w-5", acwrStatus.color)} />
            <div>
              <p className={cn("font-semibold text-sm", acwrStatus.color)}>
                Status: {acwrStatus.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {acwrData.riskZone === 'optimal' && 'Beban latihan dalam zona optimal untuk performa dan pemulihan.'}
                {acwrData.riskZone === 'undertrained' && 'Tingkatkan volume latihan untuk adaptasi yang lebih baik.'}
                {acwrData.riskZone === 'warning' && 'Perhatikan pemulihan. Beban mendekati batas atas.'}
                {acwrData.riskZone === 'danger' && 'Risiko cedera tinggi! Kurangi intensitas dan prioritaskan pemulihan.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
