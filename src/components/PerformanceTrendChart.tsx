import { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TrendingUp, Info, Download, Image, FileText, Activity, Trophy, BedDouble } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ComposedChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface PerformanceTrendChartProps {
  dailyMetrics: DailyMetric[];
}

type PeriodOption = '7' | '14' | '28' | '60';

// Detect important days based on metrics
function detectImportantDays(metrics: DailyMetric[]): Map<string, { type: 'competition' | 'recovery'; label: string }> {
  const importantDays = new Map<string, { type: 'competition' | 'recovery'; label: string }>();
  
  if (metrics.length < 2) return importantDays;
  
  // Calculate average load
  const avgLoad = metrics.reduce((sum, m) => sum + m.load, 0) / metrics.length;
  
  metrics.forEach((metric, i) => {
    // High load day (>150% of average) = likely competition or intense training
    if (metric.load > avgLoad * 1.5 && metric.load >= 100) {
      importantDays.set(metric.date, { type: 'competition', label: 'High Intensity' });
    }
    // Zero or very low load with previous high load = recovery day
    else if (metric.load <= 20 && i > 0 && metrics[i - 1].load >= avgLoad) {
      importantDays.set(metric.date, { type: 'recovery', label: 'Recovery' });
    }
    // Very negative form = overreaching (could be post-competition)
    else if (metric.form <= -35) {
      importantDays.set(metric.date, { type: 'competition', label: 'Peak Load' });
    }
  });
  
  return importantDays;
}

export function PerformanceTrendChart({ dailyMetrics }: PerformanceTrendChartProps) {
  const [animatedData, setAnimatedData] = useState<DailyMetric[]>([]);
  const [period, setPeriod] = useState<PeriodOption>('28');
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const periodDays = parseInt(period);

  // Generate baseline data if no metrics
  const metricsToUse = useMemo(() => {
    if (dailyMetrics.length > 0) return dailyMetrics;
    
    const baseline: DailyMetric[] = [];
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      baseline.push({
        date: format(date, 'yyyy-MM-dd'),
        load: 0,
        fitness: 0,
        fatigue: 0,
        form: 0,
      });
    }
    return baseline;
  }, [dailyMetrics]);

  // Animation effect
  useEffect(() => {
    setAnimatedData([]);
    const timer = setTimeout(() => {
      setAnimatedData(metricsToUse);
    }, 100);

    return () => clearTimeout(timer);
  }, [metricsToUse]);

  // Get data based on selected period
  const displayData = animatedData.slice(-periodDays).map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), periodDays <= 14 ? 'dd/MM' : 'dd', { locale: idLocale }),
    fullDate: format(parseISO(d.date), 'dd MMMM yyyy', { locale: idLocale }),
  }));

  // Detect important days for annotations
  const importantDays = useMemo(() => detectImportantDays(displayData), [displayData]);

  // Add important day info to display data
  const displayDataWithAnnotations = displayData.map(d => ({
    ...d,
    importantDay: importantDays.get(d.date),
  }));

  const hasRealData = dailyMetrics.length > 0 && dailyMetrics.some(m => m.load > 0);

  // Calculate Y axis bounds for Form chart
  const formValues = displayData.map(d => d.form);
  const minForm = Math.min(...formValues, -40);
  const maxForm = Math.max(...formValues, 30);
  const yMinForm = Math.floor(minForm / 10) * 10 - 10;
  const yMaxForm = Math.ceil(maxForm / 10) * 10 + 10;

  // Get current form status
  const currentForm = displayData.length > 0 ? displayData[displayData.length - 1].form : 0;
  const getFormStatus = (form: number) => {
    if (form <= -30) return { label: 'High Risk', color: 'text-red-600' };
    if (form <= -10) return { label: 'Optimal', color: 'text-green-600' };
    if (form <= 5) return { label: 'Grey Zone', color: 'text-gray-600' };
    if (form <= 20) return { label: 'Fresh', color: 'text-blue-600' };
    return { label: 'Transition', color: 'text-amber-600' };
  };
  const formStatus = getFormStatus(currentForm);

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `trend-performa-${period}hari-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Chart berhasil diexport ke PNG');
    } catch (error) {
      toast.error('Gagal export chart');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(16);
      pdf.text(`Trend Performa (${period} Hari Terakhir)`, 14, 15);
      pdf.setFontSize(10);
      pdf.text(`Tanggal Export: ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}`, 14, 22);
      
      pdf.addImage(imgData, 'PNG', 10, 30, pdfWidth - 20, pdfHeight * 0.9);
      pdf.save(`trend-performa-${period}hari-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Chart berhasil diexport ke PDF');
    } catch (error) {
      toast.error('Gagal export chart');
    } finally {
      setIsExporting(false);
    }
  };

  const LoadChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.fullDate}</p>
          {data.importantDay && (
            <div className={`mb-2 pb-2 border-b border-border flex items-center gap-1.5 ${
              data.importantDay.type === 'competition' ? 'text-orange-600' : 'text-blue-600'
            }`}>
              {data.importantDay.type === 'competition' ? <Trophy className="w-3 h-3" /> : <BedDouble className="w-3 h-3" />}
              <span className="font-semibold">{data.importantDay.label}</span>
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                Daily Load:
              </span>
              <span className="font-medium">{data.load} AU</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Fitness (CTL):
              </span>
              <span className="font-medium">{data.fitness}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Fatigue (ATL):
              </span>
              <span className="font-medium">{data.fatigue}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const FormChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status = getFormStatus(data.form);
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.fullDate}</p>
          {data.importantDay && (
            <div className={`mb-2 pb-2 border-b border-border flex items-center gap-1.5 ${
              data.importantDay.type === 'competition' ? 'text-orange-600' : 'text-blue-600'
            }`}>
              {data.importantDay.type === 'competition' ? <Trophy className="w-3 h-3" /> : <BedDouble className="w-3 h-3" />}
              <span className="font-semibold">{data.importantDay.label}</span>
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Form (TSB):
              </span>
              <span className="font-medium">{data.form}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
              <span>Status:</span>
              <span className={`font-medium ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const xAxisInterval = periodDays <= 7 ? 0 : periodDays <= 14 ? 1 : periodDays <= 28 ? 2 : 4;

  // Custom dot for important days on load chart
  const renderImportantDayDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload.importantDay) return null;
    
    const isCompetition = payload.importantDay.type === 'competition';
    return (
      <g>
        <circle 
          cx={cx} 
          cy={8} 
          r={6} 
          fill={isCompetition ? 'hsl(25, 95%, 53%)' : 'hsl(210, 79%, 55%)'}
          stroke="white"
          strokeWidth={1.5}
        />
        {isCompetition ? (
          <text x={cx} y={11} textAnchor="middle" fontSize={7} fill="white">★</text>
        ) : (
          <text x={cx} y={11} textAnchor="middle" fontSize={7} fill="white">R</text>
        )}
      </g>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Trend ({period} Hari)
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Load, Fitness, Fatigue & Form
              {!hasRealData && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Info className="w-3 h-3" />
                  <span className="text-xs">Input data untuk melihat tren</span>
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Hari</SelectItem>
                <SelectItem value="14">14 Hari</SelectItem>
                <SelectItem value="28">28 Hari</SelectItem>
                <SelectItem value="60">60 Hari</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPNG}>
                  <Image className="w-4 h-4 mr-2" />
                  Export PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={chartRef} className="bg-background rounded-lg space-y-0">
          {/* Chart 1: Load + Fitness + Fatigue */}
          <div>
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs font-medium text-muted-foreground">Training Load & CTL/ATL</span>
              {/* Annotation Legend */}
              <div className="flex items-center gap-3 ml-auto text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center text-white text-[7px]">★</span>
                  <span className="text-muted-foreground">High Intensity</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-white text-[7px]">R</span>
                  <span className="text-muted-foreground">Recovery</span>
                </div>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={displayDataWithAnnotations} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="loadBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45, 93%, 58%)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 9 }} 
                    interval={xAxisInterval}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 9 }} 
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={35}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 9 }} 
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={35}
                  />
                  <Tooltip content={<LoadChartTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
                    iconSize={8}
                    iconType="circle"
                  />
                  
                  {/* Training Load as Bars */}
                  <Bar
                    yAxisId="left"
                    dataKey="load"
                    name="Daily Load"
                    fill="url(#loadBarGradient)"
                    radius={[2, 2, 0, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  
                  {/* Fitness Line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="fitness"
                    name="Fitness (CTL)"
                    stroke="hsl(187, 85%, 53%)"
                    strokeWidth={2}
                    dot={renderImportantDayDot}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  
                  {/* Fatigue Line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="fatigue"
                    name="Fatigue (ATL)"
                    stroke="hsl(270, 70%, 60%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Form (TSB) with gradient zones - directly below */}
          <div className="border-t border-border/50 pt-2">
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Form (TSB)</span>
              </div>
              <span className={`text-xs font-semibold ${formStatus.color}`}>
                Saat ini: {currentForm} ({formStatus.label})
              </span>
            </div>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={displayDataWithAnnotations} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  {/* Background Zones - Transition (≥20) */}
                  <ReferenceArea 
                    y1={20} 
                    y2={yMaxForm} 
                    fill="hsl(45, 93%, 77%)" 
                    fillOpacity={0.5}
                  />
                  
                  {/* Background Zones - Fresh (5 to 20) */}
                  <ReferenceArea 
                    y1={5} 
                    y2={20} 
                    fill="hsl(210, 79%, 85%)" 
                    fillOpacity={0.5}
                  />
                  
                  {/* Background Zones - Grey Zone (-10 to 5) */}
                  <ReferenceArea 
                    y1={-10} 
                    y2={5} 
                    fill="hsl(0, 0%, 85%)" 
                    fillOpacity={0.5}
                  />
                  
                  {/* Background Zones - Optimal (-30 to -10) */}
                  <ReferenceArea 
                    y1={-30} 
                    y2={-10} 
                    fill="hsl(142, 76%, 80%)" 
                    fillOpacity={0.5}
                  />
                  
                  {/* Background Zones - High Risk (≤-30) */}
                  <ReferenceArea 
                    y1={yMinForm} 
                    y2={-30} 
                    fill="hsl(0, 84%, 85%)" 
                    fillOpacity={0.5}
                  />
                  
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 9 }} 
                    interval={xAxisInterval}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    domain={[yMinForm, yMaxForm]}
                    tick={{ fontSize: 9 }} 
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={35}
                  />
                  <Tooltip content={<FormChartTooltip />} />
                  
                  {/* Reference lines for zone boundaries */}
                  <ReferenceLine y={20} stroke="hsl(45, 93%, 47%)" strokeDasharray="3 3" strokeOpacity={0.7} />
                  <ReferenceLine y={5} stroke="hsl(210, 79%, 55%)" strokeDasharray="3 3" strokeOpacity={0.7} />
                  <ReferenceLine y={-10} stroke="hsl(0, 0%, 60%)" strokeDasharray="3 3" strokeOpacity={0.7} />
                  <ReferenceLine y={-30} stroke="hsl(142, 76%, 36%)" strokeDasharray="3 3" strokeOpacity={0.7} />
                  
                  {/* Form Line */}
                  <Line
                    type="monotone"
                    dataKey="form"
                    name="Form (TSB)"
                    stroke="hsl(38, 92%, 50%)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: 'hsl(38, 92%, 50%)' }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Zone Legend */}
            <div className="flex flex-wrap justify-center gap-2 text-[10px] pt-2">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <span>High Risk</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
                <span>Optimal</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span>Grey</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-300" />
                <span>Fresh</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-200" />
                <span>Transition</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
