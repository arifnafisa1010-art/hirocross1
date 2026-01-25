import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer } from '@/components/ui/chart';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Activity, Download, Image } from 'lucide-react';
import { PremiumBadge } from '@/components/PremiumBadge';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface ACWRTrendChartProps {
  dailyMetrics: DailyMetric[];
}

interface ACWRDataPoint {
  date: string;
  displayDate: string;
  acwr: number;
  acuteLoad: number;
  chronicLoad: number;
  riskZone: 'undertrained' | 'optimal' | 'warning' | 'danger';
}

export function ACWRTrendChart({ dailyMetrics }: ACWRTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [periodDays, setPeriodDays] = useState<number>(28);

  // Calculate ACWR for each day
  const acwrTrendData = useMemo((): ACWRDataPoint[] => {
    if (dailyMetrics.length < 7) return [];

    const results: ACWRDataPoint[] = [];
    
    // Start from day 28 to have enough data for chronic load
    for (let i = 27; i < dailyMetrics.length; i++) {
      const current = dailyMetrics[i];
      
      // Calculate acute load (last 7 days)
      const acuteStart = Math.max(0, i - 6);
      const acuteLoad = dailyMetrics
        .slice(acuteStart, i + 1)
        .reduce((sum, d) => sum + d.load, 0);
      
      // Calculate chronic load (last 28 days, weekly average)
      const chronicStart = Math.max(0, i - 27);
      const chronicTotal = dailyMetrics
        .slice(chronicStart, i + 1)
        .reduce((sum, d) => sum + d.load, 0);
      const chronicLoad = chronicTotal / 4; // 4-week average
      
      // Calculate ACWR
      const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
      
      // Determine risk zone
      let riskZone: 'undertrained' | 'optimal' | 'warning' | 'danger' = 'undertrained';
      if (acwr >= 0.8 && acwr <= 1.3) riskZone = 'optimal';
      else if (acwr > 1.3 && acwr <= 1.5) riskZone = 'warning';
      else if (acwr > 1.5) riskZone = 'danger';
      
      results.push({
        date: current.date,
        displayDate: format(new Date(current.date), 'dd/MM'),
        acwr: Math.round(acwr * 100) / 100,
        acuteLoad: Math.round(acuteLoad),
        chronicLoad: Math.round(chronicLoad),
        riskZone,
      });
    }
    
    return results;
  }, [dailyMetrics]);

  const displayData = useMemo(() => {
    return acwrTrendData.slice(-periodDays);
  }, [acwrTrendData, periodDays]);

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `acwr-trend-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export PNG failed:', error);
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`acwr-trend-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Export PDF failed:', error);
    }
  };

  const chartConfig = {
    acwr: { label: 'ACWR', color: 'hsl(var(--primary))' },
    acuteLoad: { label: 'Acute Load', color: 'hsl(217, 91%, 60%)' },
    chronicLoad: { label: 'Chronic Load', color: 'hsl(280, 65%, 60%)' },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload as ACWRDataPoint;
    if (!data) return null;

    const zoneColors = {
      undertrained: 'text-blue-500',
      optimal: 'text-green-500',
      warning: 'text-amber-500',
      danger: 'text-red-500',
    };

    const zoneLabels = {
      undertrained: 'Undertrained',
      optimal: 'Sweet Spot',
      warning: 'Warning',
      danger: 'Danger Zone',
    };

    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold mb-2">{data.displayDate}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">ACWR:</span>
            <span className={`font-bold ${zoneColors[data.riskZone]}`}>{data.acwr.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Status:</span>
            <span className={`font-medium ${zoneColors[data.riskZone]}`}>{zoneLabels[data.riskZone]}</span>
          </div>
          <div className="border-t pt-1 mt-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-500">Akut (7d):</span>
              <span className="font-medium">{data.acuteLoad} AU</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-purple-500">Kronis (28d):</span>
              <span className="font-medium">{data.chronicLoad} AU</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (displayData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Tren ACWR
            <PremiumBadge size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Butuh minimal 28 hari data untuk menampilkan tren ACWR
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Tren ACWR
            <PremiumBadge size="sm" />
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={periodDays.toString()} onValueChange={(v) => setPeriodDays(parseInt(v))}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14 Hari</SelectItem>
                <SelectItem value="28">28 Hari</SelectItem>
                <SelectItem value="60">60 Hari</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportPNG} className="h-8 gap-1 text-xs">
              <Image className="w-3 h-3" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-8 gap-1 text-xs">
              <Download className="w-3 h-3" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="bg-background p-2 rounded-lg">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="acwrLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(280, 65%, 60%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                
                {/* Risk Zone Background Areas */}
                <ReferenceArea y1={0} y2={0.8} fill="hsl(217, 91%, 60%)" fillOpacity={0.1} />
                <ReferenceArea y1={0.8} y2={1.3} fill="hsl(142, 76%, 36%)" fillOpacity={0.15} />
                <ReferenceArea y1={1.3} y2={1.5} fill="hsl(45, 93%, 47%)" fillOpacity={0.15} />
                <ReferenceArea y1={1.5} y2={2.5} fill="hsl(0, 84%, 60%)" fillOpacity={0.1} />
                
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left"
                  domain={[0, 2.5]}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'ACWR', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Load (AU)', angle: 90, position: 'insideRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                
                {/* Reference lines for ACWR zones */}
                <ReferenceLine yAxisId="left" y={0.8} stroke="hsl(217, 91%, 60%)" strokeDasharray="5 5" strokeOpacity={0.7} />
                <ReferenceLine yAxisId="left" y={1.3} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" strokeOpacity={0.7} />
                <ReferenceLine yAxisId="left" y={1.5} stroke="hsl(45, 93%, 47%)" strokeDasharray="5 5" strokeOpacity={0.7} />
                
                <Tooltip content={<CustomTooltip />} />
                
                {/* Load bars on right axis */}
                <Bar 
                  yAxisId="right"
                  dataKey="acuteLoad" 
                  fill="hsl(217, 91%, 60%)" 
                  opacity={0.3}
                  radius={[2, 2, 0, 0]}
                  name="Acute Load"
                />
                
                {/* ACWR Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="acwr"
                  stroke="url(#acwrLineGradient)"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const colors = {
                      undertrained: '#3b82f6',
                      optimal: '#22c55e',
                      warning: '#f59e0b',
                      danger: '#ef4444',
                    };
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={colors[payload.riskZone as keyof typeof colors]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="ACWR"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs">
            <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>&lt; 0.8 Undertrained</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>0.8-1.3 Sweet Spot</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>1.3-1.5 Warning</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>&gt; 1.5 Danger</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
